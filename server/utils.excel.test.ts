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
    'Normal Iron',
    'Normal Wash',
    'Normal Wash & Iron',
    'Urgent Iron',
    'Urgent Wash',
    'Urgent Wash & Iron',
  ];
  const exampleRow = ['T-Shirt', 'تي شيرت', 5, 10, 15, 8, 12, 18];
  assert.deepEqual(rows[0], headers);
  assert.deepEqual(rows[1], exampleRow);
});
