import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ClothingItem } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "@/lib/i18n";

interface ClothingGridProps {
  onSelectClothing: (item: ClothingItem) => void;
}

const clothingCategories = [
  { id: "all", label: "All Items" },
  { id: "pants", label: "Pants" },
  { id: "shirts", label: "Shirts" },
  { id: "traditional", label: "Traditional" },
  { id: "dresses", label: "Dresses" },
  { id: "formal", label: "Formal" },
  { id: "linens", label: "Linens" }
];

export function ClothingGrid({ onSelectClothing }: ClothingGridProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();
  const { language } = useTranslation();

  const { data: clothingItems = [], isLoading } = useQuery({
    queryKey: ["/api/clothing-items", selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("categoryId", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/clothing-items?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch clothing items");
      return response.json();
    }
  }) as { data: ClothingItem[], isLoading: boolean };

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading clothing items...</div>;
  }

  return (
    <div className="flex-1 flex flex-col bg-pos-background">
      {/* Search and Categories */}
      <div className="bg-pos-surface shadow-sm border-b border-gray-200 p-4">
        <div className="flex justify-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search clothing items..."
              className="pl-10 py-3 text-base w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Category Tabs */}
        <div className="flex space-x-1 mt-4 overflow-x-auto">
          {clothingCategories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "secondary"}
              size="sm"
              className={`whitespace-nowrap ${
                selectedCategory === category.id
                  ? "bg-pos-primary hover:bg-blue-700 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Clothing Items Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {clothingItems.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No clothing items found
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {clothingItems.map((item) => (
              <Card
                key={item.id}
                className="hover:shadow-material-lg transition-shadow"
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={language === 'ar' && item.nameAr ? item.nameAr : item.name}
                    className="w-full h-32 object-cover rounded-t-lg"
                  />
                )}
                <CardContent className="p-3">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  )}
                  <div className="text-center">
                    <span className="text-sm text-gray-500 capitalize">
                      {item.categoryId}
                    </span>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="mt-3 w-full bg-pos-secondary hover:bg-green-600 text-white"
                          onClick={() => onSelectClothing(item)}
                        >
                          Select Service
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Service prices will be shown in the next step
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
