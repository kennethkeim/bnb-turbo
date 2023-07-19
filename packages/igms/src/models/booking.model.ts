import { type IgmsPlatformType, type IgmsResponse } from "./api.model";

export type IgmsBookingStatus =
  | "new"
  | "at_checkpoint"
  | "accepted"
  | "cancelled"
  | "declined"
  | "pending"
  | "pending_cancelled"
  | "expired"
  | "awaiting_payment"
  | "unconfirmed"
  | "failed_verification";

export interface IgmsBooking {
  company_uid: string;
  booking_uid: string;
  reservation_code: string;
  readable_reservation_code: string;
  booking_status: IgmsBookingStatus;
  platform_type: IgmsPlatformType;
  listing_uid: string;
  property_uid: string;
  guest_uid: string;
  host_uid: string;
  local_checkin_dttm: string;
  local_checkout_dttm: string;
  created_dttm: string;
  updated_dttm: string;
  booked_dttm: string;
  number_of_guests: number;
  price: {
    currency: string;
    price_base: string;
    price_extras: string | null;
    price_fee: string | null;
    price_tax: string;
    price_total: string;
  };
  door_access_code?: string;
}

export interface IgmsBookingResponse extends IgmsResponse {
  data: IgmsBooking[];
}
