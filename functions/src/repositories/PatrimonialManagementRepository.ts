import { db } from "../config/firebase";
import { HistoryEntry, PatrimonialItem } from "../models/PatrimonialManagement"; // Adjust the path if needed

export class PatrimonialManagementRepository {
  static async create(uid: string, data: PatrimonialItem): Promise<void> {
    await db
      .collection("users")
      .doc(uid)
      .collection("patrimonialItems")
      .doc(data.id!)
      .set(data);
  }

  static async get(uid: string, id: string): Promise<PatrimonialItem | null> {
    const doc = await db
      .collection("users")
      .doc(uid)
      .collection("patrimonialItems")
      .doc(id)
      .get();

    if (!doc.exists) return null;
    return doc.data() as PatrimonialItem;
  }

  static async update(
    uid: string,
    data: Partial<PatrimonialItem>
  ): Promise<void> {
    await db
      .collection("users")
      .doc(uid)
      .collection("patrimonialItems")
      .doc(data.id!)
      .update(data);
  }

  static async delete(uid: string, id: string): Promise<void> {
    await db
      .collection("users")
      .doc(uid)
      .collection("patrimonialItems")
      .doc(id)
      .delete();
  }

  static async getAll(uid: string): Promise<PatrimonialItem[]> {
    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("patrimonialItems")
      .get();

    return snapshot.docs.map((doc) => doc.data() as PatrimonialItem);
  }

  static async addHistoryEntry(uid: string, itemId: string, entry: HistoryEntry): Promise<void> {
    await db
      .collection("users")
      .doc(uid)
      .collection("patrimonialItems")
      .doc(itemId)
      .collection("history")
      .doc(entry.id)
      .set({
        id: entry.id,
        timestamp: entry.timestamp,
        changes: entry.changes,
      });
  }

  static async getHistory(uid: string, itemId: string): Promise<HistoryEntry[]> {
    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("patrimonialItems")
      .doc(itemId)
      .collection("history")
      .orderBy("timestamp", "desc")
      .get();

    if (snapshot.empty) return [];

     return snapshot.docs.map((d) => ({
      id: d.id,
      timestamp: d.data().timestamp,
      changes: d.data().changes,
    } as HistoryEntry));
  }
}
