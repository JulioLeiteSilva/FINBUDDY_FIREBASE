import { UserStatus } from "./UserStatus";

export interface UserPreRegister {
  id?: string;
  name: string;
  email: string;
  status: UserStatus;
  createdAt: Date;
}
