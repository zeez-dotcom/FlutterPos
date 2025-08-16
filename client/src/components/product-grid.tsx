import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "@/lib/i18n";

interface Product {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  price: string;
  stock: number;
  imageUrl?: string;
}

interface Category {
  id: string;
  name: string;
}

interface ProductGridProps {
  onAddToCart: (product: Product) => void;
  cartItemCount: number;
  onToggleCart: () => void;
  branchCode?: string;
}

export function ProductGrid({ onAddToCart, cartItemCount, onToggleCart, branchCode }: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const {
    data: fetchedCategories,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useQuery<Category[]>({
    queryKey: ["/api/product-categories", branchCode],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (branchCode) params.append("branchCode", branchCode);
      const query = params.toString();
      const response = await fetch(
        `/api/product-categories${query ? `?${query}` : ""}`,
        {
          credentials: "include",
        },
      );
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const categories: Category[] = categoriesError
    ? []
    : [{ id: "all", name: t.allItems }, ...(fetchedCategories ?? [])];

  const {
    data: products = [],
    isLoading: productsLoading,
  } = useQuery<Product[]>({
    queryKey: ["/api/products", branchCode, selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (branchCode) params.append("branchCode", branchCode);
      if (selectedCategory !== "all") params.append("categoryId", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);

      const query = params.toString();
      const response = await fetch(`/api/products${query ? `?${query}` : ""}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      return data as Product[];
    }
  });

  if (categoriesLoading) {
    return <div className="flex-1 flex items-center justify-center">{t.loadingCategories}</div>;
  }

  if (productsLoading) {
    return <div className="flex-1 flex items-center justify-center">{t.loadingProducts}</div>;
  }

  return (
    <div className="flex-1 flex flex-col bg-pos-background">
      {/* Search and Categories */}
      <div className="bg-pos-surface shadow-sm border-b border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder={t.searchProducts}
              className="pl-10 py-3 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {isMobile && (
            <Button 
              onClick={onToggleCart}
              className="bg-pos-primary hover:bg-blue-700 text-white px-4 py-3 flex items-center space-x-2"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>{t.cart} ({cartItemCount})</span>
            </Button>
          )}
        </div>
        
        {/* Category Tabs */}
        {!categoriesError && (
          <div className="flex space-x-1 mt-4 overflow-x-auto">
            {categories.map((category) => (
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
                {category.name}
              </Button>
            ))}
          </div>
        )}
        {categoriesError && (
          <div className="text-center text-sm text-red-500 mt-4">
            {t.categoriesUnavailable}
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {products.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            {t.noProductsFound}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <Card
                key={product.id}
                className="hover:shadow-material-lg transition-shadow cursor-pointer"
                onClick={() => onAddToCart(product)}
              >
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-t-lg"
                  />
                )}
                <CardContent className="p-3">
                  <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
                  {product.description && (
                    <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-pos-primary">
                      ${parseFloat(product.price).toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {t.stock}: {product.stock}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
