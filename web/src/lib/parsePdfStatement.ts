import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface ParsedRow {
  date: string;
  description: string;
  amount: string;
  type: string;
  balance: string;
}

export interface PdfParseResult {
  rows: ParsedRow[];
  totalLinesSeen: number;
  failedLines: number;
}

// A row of text as reconstructed from position data: same y-position,
// ordered left to right.
interface TextRow {
  y: number;
  items: { x: number; text: string }[];
}

async function extractRows(file: File): Promise<TextRow[]> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const rows: TextRow[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const byY = new Map<number, TextRow>();

    for (const item of content.items as { str: string; transform: number[] }[]) {
      if (!item.str.trim()) continue;
      const y = Math.round(item.transform[5]); // vertical position
      const x = item.transform[4]; // horizontal position
      const key = y; // items on (roughly) the same line share a y value
      if (!byY.has(key)) byY.set(key, { y, items: [] });
      byY.get(key)!.items.push({ x, text: item.str });
    }

    rows.push(...byY.values());
  }

  // PDF y-coordinates increase upward — sort top-to-bottom, then left-to-right.
  rows.sort((a, b) => b.y - a.y);
  for (const row of rows) row.items.sort((a, b) => a.x - b.x);
  return rows;
}

// Matches a line like: 05-Jan-2026  MTN Airtime Purchase  500.00     45,230.00
// (date) (description, greedy) (one or two money-looking numbers at the end)
const ROW_PATTERN =
  /^(\d{1,2}[-/][A-Za-z]{3}[-/]\d{2,4}|\d{4}-\d{2}-\d{2})\s+(.+?)\s+([\d,]+\.\d{2})(?:\s+([\d,]+\.\d{2}))?\s+([\d,]+\.\d{2})$/;

export async function parseStatementPdf(file: File): Promise<PdfParseResult> {
  const textRows = await extractRows(file);
  const rows: ParsedRow[] = [];
  let failedLines = 0;
  let totalLinesSeen = 0;

  for (const row of textRows) {
    const line = row.items.map((i) => i.text).join(' ').replace(/\s+/g, ' ').trim();
    if (!line || /^date\b/i.test(line)) continue; // skip blanks and the header row
    totalLinesSeen++;

    const match = line.match(ROW_PATTERN);
    if (!match) {
      failedLines++;
      continue;
    }

    const [, date, description, first, second, balance] = match;
    // Debit-column-first layout: first number present, second absent → debit.
    // Credit-column layout: first number absent (blank), second present → credit.
    const debit = second ? first : null;
    const credit = second ? second : first;
    const amount = debit ?? credit;
    const type = debit ? 'debit' : 'credit';

    rows.push({
      date,
      description: description.trim(),
      amount: amount.replace(/,/g, ''),
      type,
      balance: balance.replace(/,/g, ''),
    });
  }

  return { rows, totalLinesSeen, failedLines };
}