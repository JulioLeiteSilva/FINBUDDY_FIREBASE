import { db } from "../config/firebase";
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
    data: Transaction
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

    await ref.set(data, { merge: false });
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

  static async getAllInvoices(uid: string): Promise<Transaction[]> {
    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("transactions")
      .where("type", "==", "INVOICE")
      .get();
    return snapshot.docs.map((doc) => doc.data() as Transaction);
  }

  static async batchUpdate(
    uid: string,
    updates: { id: string; data: Partial<Transaction> }[]
  ): Promise<void> {
    const batch = db.batch();
    const transactionsRef = db
      .collection("users")
      .doc(uid)
      .collection("transactions");

    updates.forEach(({ id, data }) => {
      const docRef = transactionsRef.doc(id);
      batch.update(docRef, data);
    });

    await batch.commit();
  }

  static async getAllByPrimaryTransactionId(
    uid: string,
    primaryTransactionId: string
  ): Promise<Transaction[]> {
    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("transactions")
      .where("primaryTransactionId", "==", primaryTransactionId)
      .get();

    return snapshot.docs.map((doc) => doc.data() as Transaction);
  }

  static async batchDelete(
    uid: string,
    transactionIds: string[]
  ): Promise<void> {
    const batch = db.batch();
    const collectionRef = db
      .collection("users")
      .doc(uid)
      .collection("transactions");

    for (const id of transactionIds) {
      const docRef = collectionRef.doc(id);
      batch.delete(docRef);
    }

    await batch.commit();
  }

  static async getRelatedRecurringTransactions(
    uid: string,
    transaction: Transaction
  ): Promise<Transaction[]> {
    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("transactions")
      .where("isRecurring", "==", true)
      .where("name", "==", transaction.name)
      .where("category", "==", transaction.category)
      .where("frequency", "==", transaction.frequency)
      .where("bankAccountId", "==", transaction.bankAccountId)
      .where("type", "==", transaction.type)
      .where("startDate", "==", transaction.startDate)
      .where("endDate", "==", transaction.endDate)
      .get();

    return snapshot.docs.map((doc) => doc.data() as Transaction);
  }

  static async getByDateRange(uid: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("transactions")
      .where("date", ">=", startDate)
      .where("date", "<=", endDate)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Transaction));
  }
}
