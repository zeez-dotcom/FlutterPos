import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import {
  generateCatalogTemplate,
  parsePrice,
  SERVICE_HEADERS,
} from './utils/excel';
import type { ParsedRow } from './storage';

test('generateCatalogTemplate returns template with headers and example row', () => {
  const buf = generateCatalogTemplate();
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[];
  const headers = [
    'Item (English)',
    'Item (Arabic)',
    'Normal Iron Price',
    'Normal Wash Price',
    'Normal Wash & Iron Price',
    'Urgent Iron Price',
    'Urgent Wash Price',
    'Urgent Wash & Iron Price',
    'Picture Link',
  ];
  const exampleRow = ['T-Shirt', 'تي شيرت', 5, 10, 15, 8, 12, 18, 'https://example.com/image.jpg'];
  assert.deepEqual(rows[0], headers);
  assert.deepEqual(rows[1], exampleRow);
});

test('parsePrice handles comma decimals', () => {
  assert.equal(parsePrice('3,50'), 3.5);
});

test('parsePrice strips currency symbols', () => {
  assert.equal(parsePrice('$3.50'), 3.5);
  assert.equal(parsePrice('€3,50'), 3.5);
});

test('bulk upload parser accepts legacy header names without "Price"', () => {
  const exampleRow = ['T-Shirt', 'تي شيرت', 5, 10, 15, 8, 12, 18, 'https://example.com/image.jpg'];
  const headersWithPrice = [
    'Item (English)',
    'Item (Arabic)',
    SERVICE_HEADERS.normalIron[0],
    SERVICE_HEADERS.normalWash[0],
    SERVICE_HEADERS.normalWashIron[0],
    SERVICE_HEADERS.urgentIron[0],
    SERVICE_HEADERS.urgentWash[0],
    SERVICE_HEADERS.urgentWashIron[0],
    'Picture Link',
  ];
  const headersWithoutPrice = [
    'Item (English)',
    'Item (Arabic)',
    SERVICE_HEADERS.normalIron[1],
    SERVICE_HEADERS.normalWash[1],
    SERVICE_HEADERS.normalWashIron[1],
    SERVICE_HEADERS.urgentIron[1],
    SERVICE_HEADERS.urgentWash[1],
    SERVICE_HEADERS.urgentWashIron[1],
    'Picture Link',
  ];

  const parseSheet = (headers: string[]): { rows: ParsedRow[]; errors: string[] } => {
    const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
    const data = XLSX.utils.sheet_to_json<any>(ws);
    const errors: string[] = [];
    const rows: ParsedRow[] = data
      .map((r: any, index: number) => {
        const getFieldValue = (fields: string[]) => {
          for (const f of fields) {
            if (r[f] !== undefined) return r[f];
          }
          return undefined;
        };

        const parseField = (fields: string[]) => {
          const raw = getFieldValue(fields);
          const parsed = parsePrice(raw);
          if (raw !== undefined && raw !== null && raw !== '' && parsed === undefined) {
            errors.push(`Row ${index + 2}: Invalid ${fields[0]}`);
          }
          return parsed;
        };

        return {
          itemEn: String(r['Item (English)'] ?? '').trim(),
          itemAr: r['Item (Arabic)'] ? String(r['Item (Arabic)']).trim() : undefined,
          normalIron: parseField(SERVICE_HEADERS.normalIron),
          normalWash: parseField(SERVICE_HEADERS.normalWash),
          normalWashIron: parseField(SERVICE_HEADERS.normalWashIron),
          urgentIron: parseField(SERVICE_HEADERS.urgentIron),
          urgentWash: parseField(SERVICE_HEADERS.urgentWash),
          urgentWashIron: parseField(SERVICE_HEADERS.urgentWashIron),
          imageUrl: r['Picture Link'] ? String(r['Picture Link']).trim() : undefined,
        };
      })
      .filter((r: ParsedRow) => r.itemEn);
    return { rows, errors };
  };

  const expected: ParsedRow = {
    itemEn: 'T-Shirt',
    itemAr: 'تي شيرت',
    normalIron: 5,
    normalWash: 10,
    normalWashIron: 15,
    urgentIron: 8,
    urgentWash: 12,
    urgentWashIron: 18,
    imageUrl: 'https://example.com/image.jpg',
  };

  const withPrice = parseSheet(headersWithPrice);
  const withoutPrice = parseSheet(headersWithoutPrice);

  assert.deepEqual(withPrice.rows, [expected]);
  assert.deepEqual(withPrice.errors, []);
  assert.deepEqual(withoutPrice.rows, [expected]);
  assert.deepEqual(withoutPrice.errors, []);
});
