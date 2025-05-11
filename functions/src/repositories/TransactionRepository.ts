import { db } from "../config/firebase";
import { TransactionRequestDTO } from "../dto/TransactionRequestDTO";
import { Transaction } from "../models/Transaction";

export class TransactionRepository {
  static async createMany(
    uid: string,
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    const batch = db.batch();

    transactions.forEach((transaction) => {
      const ref = db
        .collection("users")
        .doc(uid)
        .collection("transactions")
        .doc(transaction.id);

      batch.set(ref, transaction);
    });

    await batch.commit();
    return transactions;
  }

  static async update(
    uid: string,
    transactionId: string,
    data: Partial<TransactionRequestDTO>
  ): Promise<Transaction> {
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("transactions")
      .doc(transactionId);

    const doc = await ref.get();
    if (!doc.exists) {
      throw new Error("não encontrado");
    }

    await ref.update(data as { [key: string]: any });
    const updatedDoc = await ref.get();
    return updatedDoc.data() as Transaction;
  }

  static async delete(uid: string, transactionId: string): Promise<void> {
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("transactions")
      .doc(transactionId);
    await ref.delete();
  }
  static async getAll(uid: string): Promise<Transaction[]> {
    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("transactions")
      .get();
    return snapshot.docs.map((doc) => doc.data() as Transaction);
  }

  static async get(
    uid: string,
    transactionId: string
  ): Promise<Transaction | null> {
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("transactions")
      .doc(transactionId);
    const doc = await ref.get();
    return doc.exists ? (doc.data() as Transaction) : null;
  }

  static async findByDateAndName(
    uid: string,
    name: string,
    date: Date
  ): Promise<Transaction | null> {
    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("transactions")
      .where("name", "==", name)
      .where("date", "==", date)
      .limit(1)
      .get();

    return snapshot.empty ? null : (snapshot.docs[0].data() as Transaction);
  }

  static async deleteRecurring(
    uid: string,
    transaction: Transaction
  ): Promise<void> {
    const transactionsSnapshot = await db
      .collection("users")
      .doc(uid)
      .collection("transactions")
      .where("isRecurring", "==", true)
      .where("name", "==", transaction.name)
      .where("category", "==", transaction.category)
      .where("frequency", "==", transaction.frequency)
      .where("endDate", "==", transaction.endDate)
      .where("date", ">=", transaction.date)
      .get();

    if (transactionsSnapshot.empty) {
      return;
    }

    const batch = db.batch();

    transactionsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }
}
