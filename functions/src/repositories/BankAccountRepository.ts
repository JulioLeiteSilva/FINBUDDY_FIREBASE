import { db } from "../config/firebase";
import { CreateBankAccountDTO } from "../dto/CreateBankAccountDTO";
import { UpdateBankAccountBalanceDTO } from "../dto/UpdateBankAccountBalanceDTO";
import { UpdateBankAccountDTO } from "../dto/UpdateBankAccountDTO";

export class BankAccountRepository {
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
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("bankAccounts")
      .doc(accountId);
    const doc = await ref.get();
    if (!doc.exists) return null;

    await ref.update(data as { [key: string]: any });
    return (await ref.get()).data();
  }

  static async delete(uid: string, accountId: string) {
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("bankAccounts")
      .doc(accountId);
    await ref.delete();
    return { id: accountId };
  }

  static async get(uid: string, accountId: string) {
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("bankAccounts")
      .doc(accountId);
    const doc = await ref.get();
    return doc.exists ? doc.data() : null;
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
