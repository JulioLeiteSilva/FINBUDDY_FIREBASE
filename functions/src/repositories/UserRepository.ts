/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "../config/firebase";
import { CompleteUserProfileDTO } from "../dto/CompleteUserProfileDTO";
import { UserStatus } from "../enums/UserStatus";
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

  static async updateUserProfile(
    uid: string,
    updateData: CompleteUserProfileDTO & { status: string }
  ) {
    const userRef = db.collection("users").doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) return null;

    await userRef.update(updateData as { [key: string]: any });

    return (await userRef.get()).data();
  }

  static async getById(uid: string) {
    const doc = await db.collection("users").doc(uid).get();
    return doc.exists ? doc.data() : null;
  }

  static async deactivateById(
    uid: string,
    data: { status: UserStatus.DISABLED; deactivatedAt: Date }
  ) {
    const userRef = db.collection("users").doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) return null;

    await userRef.update(data as { [key: string]: any });
    return (await userRef.get()).data();
  }
}
