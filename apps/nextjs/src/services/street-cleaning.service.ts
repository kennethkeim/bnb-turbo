import { type NextApiRequest, type NextApiResponse } from "next";
import { DateTime } from "luxon";

import { type IgmsBookingResponse } from "@acme/igms";

import {
  DTFormats,
  getImminentCleaning,
  localTZ,
  type StreetCleaningSchedule,
} from "~/utils/date";
import { handleApiError, NoActionRequiredError } from "~/utils/exceptions";
import { igmsClient, IgmsUtil } from "~/utils/igms-client";
import { logger } from "~/utils/logger";
import { allowMethods, auth } from "~/utils/request";

export async function streetCleaningHandler(
  request: NextApiRequest,
  response: NextApiResponse,
  schedule: StreetCleaningSchedule,
) {
  try {
    allowMethods("POST", request.method);
    auth(request);

    /** Start of the imminent cleaning. */
    const cleaning = getImminentCleaning(schedule);
    logger.debug(
      `Imminent cleaning: ${cleaning.start.toISO()} - ${cleaning.end.toISO()}.`,
    );

    // Get bookings in range - iGMS filters aren't accurate so I have to do start of day
    const qsFrom = cleaning.start.startOf("day").toISO();
    const qsTo = cleaning.end.toISO();
    const axiosResponse = await igmsClient.get(
      `/v1/bookings?${IgmsUtil.getTokenQuerystring()}&from_date=${qsFrom}&to_date=${qsTo}&booking_status=accepted`,
    );
    const bookingsResponse = axiosResponse.data as IgmsBookingResponse;
    logger.debug(`Got ${bookingsResponse.data.length} bookings.`);

    // Filter bookings to specific listing
    const bookings = bookingsResponse.data.filter((booking) => {
      return booking.listing_uid === schedule.listing;
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

    const readableDay = cleaning.start.toLocaleString(DTFormats.dateA);
    const readableStart = cleaning.start.toLocaleString(DTFormats.timeA);
    const readableEnd = cleaning.end.toLocaleString(DTFormats.timeA);
    const guestMessage = `Hi! This is an automated message to alert you of a scheduled street cleaning on ${readableDay} from ${readableStart} to ${readableEnd}. If you are parked on the street in front of the property, you will need to move your vehicle during this time. Thank you!`;

    await igmsClient.post(
      `v1/message-booking-guest?${IgmsUtil.getTokenQuerystring()}`,
      {
        booking_uid: activeBooking.booking_uid,
        message: guestMessage,
      },
    );

    const guest = activeBooking.guest_uid;
    response.status(200).json({
      message: `Sent alert to ${guest} for street cleaning: ${imminentCleaningIso}! 🚀`,
    });
  } catch (error) {
    handleApiError(error, request, response);
  }
}
