import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { generateCatalogTemplate } from './utils/excel';

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
