import { type NextApiRequest, type NextApiResponse } from "next";
import {
  allowMethods,
  authRequest,
  ClientError,
  handleApiError,
} from "@kennethkeim/api-utils-core";
import { DateTime } from "luxon";

import { prisma } from "@acme/db";
import { type IgmsBookingResponse } from "@acme/igms";

import { getImminentCleaning, localTZ } from "~/utils/date";
import { IgmsUtil } from "~/utils/igms-client";
import { logger } from "~/utils/logger";
import { mailer } from "~/utils/mailer";
import { getStreetCleaningMessage } from "~/utils/messages";
import { env } from "~/env.mjs";
import { type ListingConfig } from "~/models/cleanings";

export async function streetCleaningHandler(
  request: NextApiRequest,
  response: NextApiResponse,
  listingCfg: ListingConfig,
) {
  try {
    allowMethods(["POST"], request.method);
    authRequest(request.headers, env.TEMP_API_TOKEN);

    let hostAcct;
    try {
      hostAcct = await prisma.account.findFirst({
        where: { providerAccountId: listingCfg.host },
      });
    } catch (err) {
      await handleApiError(err, logger);
    }
    const accessToken = hostAcct?.access_token ?? env.TEMP_IGMS_TOKEN;
    if (!accessToken) {
      throw new ClientError(401, "Cannot get IGMS token.");
    }

    /** Start of the imminent cleaning. */
    const cleaningResult = getImminentCleaning(listingCfg);
    const cleaning = cleaningResult.data;
    if (!cleaning) {
      response.status(200).json({ message: cleaningResult.message });
      return;
    }
    logger.debug(
      `Imminent cleaning: ${cleaning.start.toISO()} - ${cleaning.end.toISO()}.`,
    );

    // Get bookings in range - iGMS filters aren't accurate so I have to do start of day
    const qsFrom = cleaning.start.startOf("day").toISO();
    const qsTo = cleaning.end.toISO();
    const qsToken = IgmsUtil.getTokenQuerystring(accessToken);
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
      const message = `No active booking for street cleaning: ${imminentCleaningIso}.`;
      response.status(200).json({ message });
      return;
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
    response.status(201).json({
      message: `Sent alert to ${guest} for street cleaning: ${imminentCleaningIso}! 🚀`,
    });
  } catch (error) {
    await handleApiError(error, logger, mailer, response);
  }
}
