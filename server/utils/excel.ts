import * as XLSX from "xlsx";

// Map of laundry service fields to their supported column headers.
// The first entry in each array is used when generating templates, but
// the parser will accept any of the listed headers.
export const SERVICE_HEADERS = {
  normalIron: ["Normal Iron Price", "Normal Iron"],
  normalWash: ["Normal Wash Price", "Normal Wash"],
  normalWashIron: [
    "Normal Wash & Iron Price",
    "Normal Wash & Iron",
  ],
  urgentIron: ["Urgent Iron Price", "Urgent Iron"],
  urgentWash: ["Urgent Wash Price", "Urgent Wash"],
  urgentWashIron: [
    "Urgent Wash & Iron Price",
    "Urgent Wash & Iron",
  ],
} as const;

export function generateCatalogTemplate(): Buffer {
  const headers = [
    "Item (English)",
    "Item (Arabic)",
    SERVICE_HEADERS.normalIron[0],
    SERVICE_HEADERS.normalWash[0],
    SERVICE_HEADERS.normalWashIron[0],
    SERVICE_HEADERS.urgentIron[0],
    SERVICE_HEADERS.urgentWash[0],
    SERVICE_HEADERS.urgentWashIron[0],
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
