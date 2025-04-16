import { db } from "../config/firebase";
import { UserPreRegister } from "../models/UserPreRegister";

export class UserRepository {
  static async createPreUser(uid: string, data: UserPreRegister) {
    await db.collection("users").doc(uid).set(data);
    return { id: uid, ...data };
  }

  static async exists(uid: string): Promise<boolean> {
    const doc = await db.collection("users").doc(uid).get();
    return doc.exists;
  }
}
