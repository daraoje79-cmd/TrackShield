import Papa from 'papaparse';
import { collection, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { categorizeTransaction } from './categorize';
import type { TransactionDoc } from '../types/schema';

export interface RawRow {
  date: string;
  description: string;
  amount: string;
  type: string;
  balance: string;
}

export function parseStatementCsv(file: File): Promise<RawRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: reject,
    });
  });
}

export async function writeTransactionRows(userId: string, rows: RawRow[]) {
  const batch = writeBatch(db);
  const transactionsRef = collection(db, 'users', userId, 'transactions');
  let imported = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const amount = Math.abs(Number(row.amount));
      const direction = row.type.trim().toLowerCase() as 'debit' | 'credit';
      const balanceAfter = Number(row.balance);
      if (!row.date || !amount || Number.isNaN(balanceAfter) || (direction !== 'debit' && direction !== 'credit')) {
        failed++;
        continue;
      }
      const balanceBefore = direction === 'debit' ? balanceAfter + amount : balanceAfter - amount;
      const { category, categoryConfidence } = categorizeTransaction(row.description);

      const txnDoc: TransactionDoc = {
        amount,
        direction,
        counterparty: { name: row.description },
        description: row.description,
        category,
        categoryConfidence,
        balanceBefore,
        balanceAfter,
        remark: null,
        timestamp: Timestamp.fromDate(new Date(row.date)),
        flaggedFraud: false,
        fraudReason: null,
      };

      batch.set(doc(transactionsRef), txnDoc);
      imported++;
    } catch {
      failed++;
    }
  }

  await batch.commit();
  return { imported, failed, total: rows.length };
}