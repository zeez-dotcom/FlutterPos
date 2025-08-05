import { type InsertCategory, type InsertClothingItem } from "@shared/schema";

export const CATEGORY_SEEDS: Omit<InsertCategory, "userId">[] = [
  { name: "Normal Iron", nameAr: "كي عادي", type: "service", isActive: true },
  { name: "Normal Wash", nameAr: "غسيل عادي", type: "service", isActive: true },
  { name: "Normal Wash & Iron", nameAr: "غسيل وكي عادي", type: "service", isActive: true },
  { name: "Urgent Iron", nameAr: "كي مستعجل", type: "service", isActive: true },
  { name: "Urgent Wash", nameAr: "غسيل مستعجل", type: "service", isActive: true },
  { name: "Urgent Wash & Iron", nameAr: "غسيل وكي مستعجل", type: "service", isActive: true },
  { name: "Clothing Items", nameAr: "ملابس", type: "clothing", isActive: true },
];

export const CLOTHING_ITEM_SEEDS: Omit<InsertClothingItem, "categoryId" | "userId">[] = [
  { name: "Thobe", nameAr: "ثوب" },
  { name: "Shirt", nameAr: "قميص" },
  { name: "T-Shirt", nameAr: "تيشيرت" },
  { name: "Trouser", nameAr: "بنطال" },
];
