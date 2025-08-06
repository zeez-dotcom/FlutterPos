import * as XLSX from "xlsx";

export function generateCatalogTemplate(): Buffer {
  const headers = [
    "Item (English)",
    "Item (Arabic)",
    "Normal Iron Price",
    "Normal Wash Price",
    "Normal Wash & Iron Price",
    "Urgent Iron Price",
    "Urgent Wash Price",
    "Urgent Wash & Iron Price",
    "Picture Link",
  ];

  const exampleRow = [
    "T-Shirt",
    "تي شيرت",
    5,
    10,
    15,
    8,
    12,
    18,
    "https://example.com/image.jpg",
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

export function parsePrice(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") {
    return isNaN(value) ? undefined : value;
  }
  const normalized = String(value)
    .replace(/[^0-9,.-]/g, "")
    .replace(/,/g, ".");
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? undefined : parsed;
}
