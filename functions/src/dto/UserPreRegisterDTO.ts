import { UserStatus } from "../enums/UserStatus";

export interface UserPreRegisterDTO {
  name: string;
  email: string;
  status: UserStatus;
  createdAt: Date;
}
