import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { db } from "../config/firebase";
import { FinancialPlanning } from "../models/FinancialPlanning";

dayjs.extend(utc);
dayjs.extend(timezone);

export class FinancialPlanningRepository {

    static readonly TIMEZONE = "America/Sao_Paulo";

    static async create(uid: string, data: FinancialPlanning): Promise<void> {
        await db
            .collection("users")
            .doc(uid)
            .collection("financialPlannings")
            .doc(data.id)
            .set(data);
    }

    static async getByMonth(uid: string, year: number, month: number): Promise<FinancialPlanning | null> {
        const startDate = dayjs()
            .tz(this.TIMEZONE)
            .year(year)
            .month(month - 1)
            .date(1)
            .hour(0)
            .minute(0)
            .second(0)
            .millisecond(0)
            .toDate();

        const endDate = dayjs()
            .tz(this.TIMEZONE)
            .year(year)
            .month(month)
            .date(0) // Last day of month
            .hour(23)
            .minute(59)
            .second(59)
            .millisecond(999)
            .toDate();

        const snapshot = await db
            .collection("users")
            .doc(uid)
            .collection("financialPlannings")
            .where("month", ">=", startDate)
            .where("month", "<=", endDate)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return null;
        }

        return snapshot.docs[0].data() as FinancialPlanning;
    }

    static async getById(uid: string, id: string): Promise<FinancialPlanning | null> {
        const doc = await db
            .collection("users")
            .doc(uid)
            .collection("financialPlannings")
            .doc(id)
            .get();

        if (!doc.exists) {
            return null;
        }

        return doc.data() as FinancialPlanning;
    }

    static async update(uid: string, id: string, data: Partial<FinancialPlanning>): Promise<void> {
        await db
            .collection("users")
            .doc(uid)
            .collection("financialPlannings")
            .doc(id)
            .update({
                ...data,
                updatedAt: new Date()
            });
    }

    static async delete(uid: string, id: string): Promise<void> {
        await db
            .collection("users")
            .doc(uid)
            .collection("financialPlannings")
            .doc(id)
            .delete();
    }
}
