import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price: string;
  stock: number;
  imageUrl?: string;
}

interface ProductGridProps {
  onAddToCart: (product: Product) => void;
  cartItemCount: number;
  onToggleCart: () => void;
}

const categories = [
  { id: "all", label: "All Items" },
  { id: "beverages", label: "Beverages" },
  { id: "snacks", label: "Snacks" },
  { id: "electronics", label: "Electronics" },
  { id: "food", label: "Food" },
  { id: "household", label: "Household" }
];

export function ProductGrid({ onAddToCart, cartItemCount, onToggleCart }: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      return data as Product[];
    }
  });

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading products...</div>;
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
              placeholder="Search products..."
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
              <span>Cart ({cartItemCount})</span>
            </Button>
          )}
        </div>
        
        {/* Category Tabs */}
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
              {category.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {products.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No products found
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
                      Stock: {product.stock}
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
