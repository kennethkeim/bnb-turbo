import { type NextApiRequest, type NextApiResponse } from "next";
import { DateTime } from "luxon";

import { type IgmsBookingResponse } from "@acme/igms";

import {
  DTFormats,
  getImminentCleaning,
  localTZ,
  type StreetCleaningSchedule,
} from "~/utils/date";
import { ClientError, getApiError } from "~/utils/exceptions";
import { igmsClient, IgmsUtil } from "~/utils/igms-client";
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
    const cleaningStart = getImminentCleaning(schedule);

    /** End of the imminent cleaning. */
    const cleaningEnd = cleaningStart.set({
      hour: schedule.end.hour,
      minute: schedule.end.minute,
    });

    // Get bookings in range - iGMS filters aren't accurate so I have to do start of day
    const qsFrom = cleaningStart.startOf("day").toISO();
    const qsTo = cleaningEnd.toISO();
    const axiosResponse = await igmsClient.get(
      `/v1/bookings?${IgmsUtil.getTokenQuerystring()}&from_date=${qsFrom}&to_date=${qsTo}&booking_status=accepted`,
    );
    const bookingsResponse = JSON.parse(
      axiosResponse.data as string,
    ) as IgmsBookingResponse;

    // Filter bookings to specific listing
    const bookings = bookingsResponse.data.filter((booking) => {
      return booking.listing_uid === schedule.listing;
    });

    // Get active booking
    const activeBooking = bookings.find((booking) => {
      const { local_checkin_dttm, local_checkout_dttm } = booking;
      const checkin = DateTime.fromSQL(local_checkin_dttm).setZone(localTZ);
      const checkout = DateTime.fromSQL(local_checkout_dttm).setZone(localTZ);

      const checkinMinutesBeforeCleaning = cleaningStart
        .diff(checkin)
        .as("minutes");
      const checkoutMinutesAfterCleaning = checkout
        .diff(cleaningStart)
        .as("minutes");

      const isCheckinBeforeCleaning = checkinMinutesBeforeCleaning > 0;
      const isCheckoutAfterCleaning = checkoutMinutesAfterCleaning > 0;
      return isCheckinBeforeCleaning && isCheckoutAfterCleaning;
    });

    const imminentCleaningIso = cleaningStart.toISO();
    if (!activeBooking) {
      throw new ClientError(
        400,
        `No active booking for cleaning: ${imminentCleaningIso}.`,
      );
    }

    const readableDay = cleaningStart.toLocaleString(DTFormats.dateA);
    const readableStart = cleaningStart.toLocaleString(DTFormats.timeA);
    const readableEnd = cleaningEnd.toLocaleString(DTFormats.timeA);
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
    const { status, message } = getApiError(error);
    response.status(status).json({ message });
  }
}
