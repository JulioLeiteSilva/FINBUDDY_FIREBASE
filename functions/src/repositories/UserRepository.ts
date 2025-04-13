import { db } from "../config/firebase";
import { User } from "../models/User";

export class UserRepository {
  static async create(uid: string, data: User) {
    await db.collection("users").doc(uid).set(data);
    return { id: uid, ...data };
  }

  static async exists(uid: string): Promise<boolean> {
    const doc = await db.collection("users").doc(uid).get();
    return doc.exists;
  }
}
