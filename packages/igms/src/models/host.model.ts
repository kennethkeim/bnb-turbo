import { type IgmsPlatformType, type IgmsResponse } from "./api.model";

export interface IgmsHost {
  host_uid: string;
  platform_type: IgmsPlatformType;
  name: string | null;
  thumbnail_url: string | null;
  email: string[];
  phone_number: string[];
}

export interface IgmsHostResponse extends IgmsResponse {
  data: IgmsHost[];
}
