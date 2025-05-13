import { db } from "../config/firebase";
import { CreateBankAccountDTO } from "../dto/CreateBankAccountDTO";
import { UpdateBankAccountBalanceDTO } from "../dto/UpdateBankAccountBalanceDTO";
import { UpdateBankAccountDTO } from "../dto/UpdateBankAccountDTO";

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
    data: CreateBankAccountDTO & { id: string }
  ) {
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
    data: UpdateBankAccountDTO | UpdateBankAccountBalanceDTO
  ) {
    const doc = await this.validateOwnership(uid, accountId);
    await doc.ref.update(data as { [key: string]: any });
    return (await doc.ref.get()).data();
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

  static async get(uid: string, accountId: string) {
    const doc = await this.validateOwnership(uid, accountId);
    return doc.data();
  }

  static async getAll(uid: string) {
    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("bankAccounts")
      .get();
    return snapshot.docs.map((doc) => doc.data());
  }
}
