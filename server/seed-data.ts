import {
  type InsertCategory,
  type InsertClothingItem,
  type InsertLaundryService,
} from "@shared/schema";

export const CATEGORY_SEEDS: Omit<InsertCategory, "userId">[] = [
  { name: "Normal Iron", nameAr: "كي عادي", type: "service", isActive: true },
  { name: "Normal Wash", nameAr: "غسيل عادي", type: "service", isActive: true },
  { name: "Normal Wash & Iron", nameAr: "غسيل وكي عادي", type: "service", isActive: true },
  { name: "Urgent Iron", nameAr: "كي مستعجل", type: "service", isActive: true },
  { name: "Urgent Wash", nameAr: "غسيل مستعجل", type: "service", isActive: true },
  { name: "Urgent Wash & Iron", nameAr: "غسيل وكي مستعجل", type: "service", isActive: true },
  { name: "Clothing Items", nameAr: "ملابس", type: "clothing", isActive: true },
];

export const CLOTHING_ITEM_SEEDS: Omit<
  InsertClothingItem,
  "categoryId" | "userId"
>[] = [
  { name: "Thobe" },
  { name: "Shirt" },
  { name: "T-Shirt" },
  { name: "Trouser" },
];

export function mapClothingItemSeeds(
  categoryIds: Record<string, string>,
): Omit<InsertClothingItem, "userId">[] {
  const clothingCategory = CATEGORY_SEEDS.find((c) => c.type === "clothing")!;
  return CLOTHING_ITEM_SEEDS.map((item) => ({
    ...item,
    categoryId: categoryIds[clothingCategory.name],
  }));
}

export function mapLaundryServiceSeeds(
  categoryIds: Record<string, string>,
): Omit<InsertLaundryService, "userId">[] {
  return CATEGORY_SEEDS.filter((c) => c.type === "service").map((c) => ({
    name: c.name,
    price: "0.00",
    categoryId: categoryIds[c.name],
  }));
}
