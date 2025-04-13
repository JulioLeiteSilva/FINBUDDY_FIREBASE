import { UserStatus } from "./UserStatus";

export interface User {
  name: string;
  email: string;
  status: UserStatus;
  createdAt: Date;
}
