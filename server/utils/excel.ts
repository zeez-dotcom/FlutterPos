import * as XLSX from "xlsx";

export function generateCatalogTemplate(): Buffer {
  const headers = [
    "Item (English)",
    "Item (Arabic)",
    "Normal Iron",
    "Normal Wash",
    "Normal Wash & Iron",
    "Urgent Iron",
    "Urgent Wash",
    "Urgent Wash & Iron",
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
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
