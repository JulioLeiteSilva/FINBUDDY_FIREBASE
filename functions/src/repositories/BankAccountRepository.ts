import { db } from "../config/firebase";
import { BankAccount } from "../models/BankAccount";

export class BankAccountRepository {
  private static async validateOwnership(uid: string, accountId: string) {
    const doc = await db
      .collection("users")
      .doc(uid)
      .collection("bankAccounts")
      .doc(accountId)
      .get();

    if (!doc.exists) {
      throw new Error("não encontrado");
    }

    return doc;
  }

  static async create(
    uid: string,
    data: BankAccount
  ): Promise<BankAccount> {
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("bankAccounts")
      .doc(data.id);
    await ref.set(data);
    return data;
  }

  static async update(
    uid: string,
    accountId: string,
    data: Partial<BankAccount>
  ): Promise<BankAccount> {
    const doc = await this.validateOwnership(uid, accountId);
    await doc.ref.update(data as { [key: string]: any });
    const updatedDoc = await doc.ref.get();
    const updatedData = updatedDoc.data();
    if (!updatedData) {
      throw new Error("Erro ao recuperar dados atualizados da conta");
    }
    return updatedData as BankAccount;
  }

  static async delete(uid: string, accountId: string) {
    await this.validateOwnership(uid, accountId);
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("bankAccounts")
      .doc(accountId);
    await ref.delete();
    return { id: accountId };
  }

  static async get(uid: string, accountId: string): Promise<BankAccount | null> {
    const doc = await this.validateOwnership(uid, accountId);
    const data = doc.data();
    return data ? (data as BankAccount) : null;
  }

  static async getAll(uid: string): Promise<BankAccount[]> {
    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("bankAccounts")
      .get();
    return snapshot.docs.map((doc) => doc.data() as BankAccount);
  }
}

