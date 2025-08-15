import { db } from "../config/firebase";
import { CreditCard } from "../models/CreditCard";

export class CreditCardRepository {
  static async create(uid: string, card: CreditCard): Promise<void> {
    await db
      .collection("users")
      .doc(uid)
      .collection("creditCards")
      .doc(card.id)
      .set(card);
  }

  static async update(uid: string, cardId: string, data: Partial<CreditCard>): Promise<void> {
    await db
      .collection("users")
      .doc(uid)
      .collection("creditCards")
      .doc(cardId)
      .update(data);
  }

  static async delete(uid: string, cardId: string): Promise<void> {
    await db
      .collection("users")
      .doc(uid)
      .collection("creditCards")
      .doc(cardId)
      .delete();
  }

  static async getAll(uid: string): Promise<CreditCard[]> {
    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("creditCards")
      .get();
    return snapshot.docs.map((doc) => doc.data() as CreditCard);
  }

  static async get(uid: string, cardId: string): Promise<CreditCard | null> {
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("creditCards")
      .doc(cardId);

    const doc = await ref.get();
    return doc.exists ? (doc.data() as CreditCard) : null;
  }
}
