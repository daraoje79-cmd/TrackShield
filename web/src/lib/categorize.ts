import type { TransactionCategory, CategoryConfidence } from '../types/schema';

interface CategorizationResult {
  category: TransactionCategory;
  categoryConfidence: CategoryConfidence;
}

const RULES: { pattern: RegExp; category: TransactionCategory }[] = [
  { pattern: /salary|payroll/i, category: 'Salary' },
  { pattern: /airtime|data bundle|\bmtn\b|\bglo\b|\bairtel\b|9mobile/i, category: 'Data' },
  { pattern: /uber|bolt|transport|fuel|fare/i, category: 'Transport' },
  { pattern: /school fees|tuition/i, category: 'School Fees' },
  { pattern: /dstv|gotv|netflix|subscription|electricity|phcn|nepa|bill/i, category: 'Bills' },
  { pattern: /pos purchase|store|shoprite|shopping|mall/i, category: 'Shopping' },
];

export function categorizeTransaction(description: string): CategorizationResult {
  for (const rule of RULES) {
    if (rule.pattern.test(description)) {
      return { category: rule.category, categoryConfidence: 'automatic' };
    }
  }
  return { category: 'Other', categoryConfidence: 'unknown' };
}