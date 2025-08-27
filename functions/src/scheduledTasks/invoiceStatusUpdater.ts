import { onSchedule } from "firebase-functions/v2/scheduler";
import { CreditCardRepository } from "../repositories/CreditCardRepository";
import { CreditCardInvoiceRepository } from "../repositories/CreditCardInvoiceRepository";
import { InvoiceStatus } from "../enums/InvoiceStatus";
import { db } from "../config/firebase";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

export const updateInvoiceStatuses = onSchedule({
  schedule: "0 6 * * *",
  timeZone: "America/Sao_Paulo",
  region: "southamerica-east1"
}, async (event) => {
  try {
    const users = await getAllUsers();
    console.log(`Found ${users.length} users to process`);
    
    let totalUpdated = 0;
    
    for (const user of users) {
      const updated = await updateUserInvoiceStatuses(user.uid);
      totalUpdated += updated;
    }
    
    console.log(`Invoice status update job completed. Updated ${totalUpdated} invoices.`);
  } catch (error) {
    console.error("Error in invoice status update job:", error);
    throw error;
  }
});

async function getAllUsers(): Promise<{ uid: string }[]> {
  try {
    const usersSnapshot = await db.collection("users").get();
    
    return usersSnapshot.docs.map(doc => ({
      uid: doc.id
    }));
  } catch (error) {
    console.error("Error getting users:", error);
    return [];
  }
}

async function updateUserInvoiceStatuses(uid: string): Promise<number> {
  try {
    console.log(`Processing user: ${uid}`);
    
    const cards = await CreditCardRepository.getAll(uid);
    const now = dayjs().tz("America/Sao_Paulo");
    let updatedCount = 0;
    
    console.log(`Found ${cards.length} credit cards for user ${uid}`);
    
    for (const card of cards) {
      const invoices = await CreditCardInvoiceRepository.getAll(uid, card.id);
      console.log(`Processing ${invoices.length} invoices for card ${card.name}`);
      
      for (const invoice of invoices) {
        const updated = await processInvoiceStatus(uid, card, invoice, now);
        if (updated) updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} invoices for user ${uid}`);
    return updatedCount;
    
  } catch (error) {
    console.error(`❌ Error processing user ${uid}:`, error);
    return 0;
  }
}

async function processInvoiceStatus(
  uid: string, 
  card: any, 
  invoice: any, 
  now: dayjs.Dayjs
): Promise<boolean> {
  try {
    if (invoice.status === InvoiceStatus.OPEN) {
      const closingDate = dayjs()
        .year(invoice.year)
        .month(invoice.month - 1)
        .date(card.closingDay)
        .tz("America/Sao_Paulo")
        .endOf('day');
        
      if (now.isAfter(closingDate)) {
        await CreditCardInvoiceRepository.update(uid, card.id, invoice.id, {
          status: InvoiceStatus.CLOSED
        });
        
        console.log(`Closed invoice ${invoice.month}/${invoice.year} for card ${card.name} (${card.id})`);
        return true;
      }
    }
    
    if (invoice.status === InvoiceStatus.CLOSED) {
      const dueDate = dayjs()
        .year(invoice.year)
        .month(invoice.month - 1)
        .date(card.dueDate)
        .tz("America/Sao_Paulo")
        .endOf('day');
        
      if (now.isAfter(dueDate)) {
        await CreditCardInvoiceRepository.update(uid, card.id, invoice.id, {
          status: InvoiceStatus.OVERDUE
        });
        
        console.log(`Marked invoice ${invoice.month}/${invoice.year} as OVERDUE for card ${card.name} (${card.id})`);
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    console.error(`Error processing invoice ${invoice.id} for card ${card.id}:`, error);
    return false;
  }
}
