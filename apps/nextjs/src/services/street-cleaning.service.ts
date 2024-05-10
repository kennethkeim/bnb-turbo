import { type NextApiRequest, type NextApiResponse } from "next";
import { DateTime } from "luxon";

import { prisma } from "@acme/db";
import { type IgmsBookingResponse } from "@acme/igms";

import { getImminentCleaning, localTZ } from "~/utils/date";
import {
  ClientError,
  handleApiError,
  NoActionRequiredError,
} from "~/utils/exceptions";
import { IgmsUtil } from "~/utils/igms-client";
import { logger } from "~/utils/logger";
import { getStreetCleaningMessage } from "~/utils/messages";
import { allowMethods, auth } from "~/utils/request";
import { type ListingConfig } from "~/models/cleanings";

export async function streetCleaningHandler(
  request: NextApiRequest,
  response: NextApiResponse,
  listingCfg: ListingConfig,
) {
  try {
    allowMethods("POST", request.method);
    auth(request);

    const hostAcct = await prisma.account.findFirst({
      where: { providerAccountId: listingCfg.host },
    });
    if (!hostAcct?.access_token) {
      throw new ClientError(401, "Cannot get IGMS token.");
    }

    /** Start of the imminent cleaning. */
    const cleaning = getImminentCleaning(listingCfg);
    logger.debug(
      `Imminent cleaning: ${cleaning.start.toISO()} - ${cleaning.end.toISO()}.`,
    );

    // Get bookings in range - iGMS filters aren't accurate so I have to do start of day
    const qsFrom = cleaning.start.startOf("day").toISO();
    const qsTo = cleaning.end.toISO();
    const qsToken = IgmsUtil.getTokenQuerystring(hostAcct.access_token);
    const bookingsResponse = await IgmsUtil.request<IgmsBookingResponse>({
      method: "get",
      url: `/v1/bookings?${qsToken}&from_date=${qsFrom}&to_date=${qsTo}&booking_status=accepted`,
    });
    logger.debug(`Got ${bookingsResponse.data.length} bookings.`);

    // Filter bookings to specific listing
    const bookings = bookingsResponse.data.filter((booking) => {
      return booking.listing_uid === listingCfg.listing;
    });

    // Get active booking
    const activeBooking = bookings.find((booking) => {
      const { local_checkin_dttm, local_checkout_dttm } = booking;
      const checkin = DateTime.fromSQL(local_checkin_dttm, { zone: localTZ });
      const checkout = DateTime.fromSQL(local_checkout_dttm, { zone: localTZ });

      const checkinMinutesBeforeCleaning = cleaning.start
        .diff(checkin)
        .as("minutes");
      const checkoutMinutesAfterCleaning = checkout
        .diff(cleaning.start)
        .as("minutes");

      const isCheckinBeforeCleaning = checkinMinutesBeforeCleaning > 0;
      const isCheckoutAfterCleaning = checkoutMinutesAfterCleaning > 0;
      const isActiveDuringCleaning =
        isCheckinBeforeCleaning && isCheckoutAfterCleaning;
      logger.debug(
        `Booking is active during cleaning: ${isActiveDuringCleaning}.`,
        { checkin: checkin.toISO(), checkout: checkout.toISO() },
      );
      return isActiveDuringCleaning;
    });

    const imminentCleaningIso = cleaning.start.toISO();
    if (!activeBooking) {
      throw new NoActionRequiredError(
        `No active booking for cleaning: ${imminentCleaningIso}.`,
      );
    }

    const guestMessage = getStreetCleaningMessage(cleaning, listingCfg);
    console.log(guestMessage);

    await IgmsUtil.request({
      method: "post",
      url: `v1/message-booking-guest?${qsToken}`,
      data: {
        booking_uid: activeBooking.booking_uid,
        message: guestMessage,
      },
    });

    const guest = activeBooking.guest_uid;
    response.status(200).json({
      message: `Sent alert to ${guest} for street cleaning: ${imminentCleaningIso}! 🚀`,
    });
  } catch (error) {
    handleApiError(error, request, response);
  }
}
