/**
 * TrackShield — Firestore data model types
 *
 * Mirrors Section 11 of the MVP plan. Import this file from both the Cloud
 * Functions backend and the web frontend so the shape of every document is
 * defined once and can't drift between the two.
 *
 * Firestore Timestamp import differs by environment:
 *   - Cloud Functions:  import { Timestamp } from 'firebase-admin/firestore';
 *   - Web frontend:     import { Timestamp } from 'firebase/firestore';
 * Swap the import at the top of your copy of this file, or generate two
 * builds from one source if you go the mono-repo route.
 */
import type { Timestamp } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// users/{userId}
// ---------------------------------------------------------------------------
export interface UserDoc {
  name: string;
  phone: string;
  email: string;
  createdAt: Timestamp;
  /** Empty in the MVP; schema-ready for the deferred family guardian mode. */
  guardianContacts: string[];
}

// ---------------------------------------------------------------------------
// users/{userId}/transactions/{transactionId}
// ---------------------------------------------------------------------------
export type TransactionCategory =
  | 'Salary'
  | 'Food'
  | 'Data'
  | 'Transport'
  | 'School Fees'
  | 'Bills'
  | 'Shopping'
  | 'Other';

export type CategoryConfidence = 'automatic' | 'ai_suggested' | 'unknown';

export interface TransactionDoc {
  amount: number;
  direction: 'debit' | 'credit';
  counterparty: {
    name: string;
    accountNumber?: string;
  };
  /** Raw bank narration, exactly as it appeared on the statement. */
  description: string;
  category: TransactionCategory;
  categoryConfidence: CategoryConfidence;
  balanceBefore: number;
  balanceAfter: number;
  remark: string | null;
  timestamp: Timestamp;
  flaggedFraud: boolean;
  fraudReason: string | null;
}

// ---------------------------------------------------------------------------
// users/{userId}/categoryMappings/{mappingId}
// ---------------------------------------------------------------------------
export interface CategoryMappingDoc {
  /** The description substring that triggers this mapping, e.g. "John Stores". */
  matchPattern: string;
  category: TransactionCategory;
  /** The transaction the user corrected, that this mapping was learned from. */
  learnedFromTransactionId: string;
}

// ---------------------------------------------------------------------------
// blacklist/{entryId}  (server-only — never sent to clients, see firestore.rules)
// ---------------------------------------------------------------------------
export interface BlacklistEntryDoc {
  accountNumber?: string;
  phoneNumber?: string;
  bankName?: string;
  reportCount: number;
  /** "community" is schema-ready but disabled in the MVP — admin-only for now. */
  source: 'admin' | 'community';
}

// ---------------------------------------------------------------------------
// alerts/{alertId}
// ---------------------------------------------------------------------------
export type AlertType = 'suspicious_transfer' | 'fake_alert_text';
export type AlertVerdict = 'blocked' | 'allowed' | 'flagged_for_review';

export interface AlertDoc {
  userId: string;
  type: AlertType;
  rawInput: string;
  verdict: AlertVerdict;
  createdAt: Timestamp;
}