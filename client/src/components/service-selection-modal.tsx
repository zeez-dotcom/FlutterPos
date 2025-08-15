import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Minus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ClothingItem, LaundryService } from "@shared/schema";
import { useCurrency } from "@/lib/currency";

interface ServiceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  clothingItem: ClothingItem | null;
  onAddToCart: (
    clothingItem: ClothingItem,
    service: LaundryService,
    quantity: number,
  ) => void;
}

interface ServiceCategory {
  id: string;
  name: string;
}

export function ServiceSelectionModal({
  isOpen,
  onClose,
  clothingItem,
  onAddToCart,
}: ServiceSelectionModalProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const { formatCurrency } = useCurrency();

  const { data: fetchedCategories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ["/api/categories", "service"],
    queryFn: async () => {
      const response = await fetch("/api/categories?type=service", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch service categories");
      return response.json();
    },
    enabled: isOpen,
  });

  const serviceCategories: ServiceCategory[] = [
    { id: "all", name: "All Services" },
    ...fetchedCategories,
  ];

  const { data: services = [] } = useQuery({
    queryKey: [
      "/api/clothing-items",
      clothingItem?.id,
      "services",
      selectedCategory,
    ],
    queryFn: async () => {
      if (!clothingItem) return [];
      const params = new URLSearchParams();
      if (selectedCategory !== "all")
        params.append("categoryId", selectedCategory);
      const response = await fetch(
        `/api/clothing-items/${clothingItem.id}/services?${params}`,
        {
          credentials: "include",
        },
      );
      if (!response.ok) throw new Error("Failed to fetch laundry services");
      return response.json();
    },
    enabled: isOpen && !!clothingItem,
  }) as { data: (LaundryService & { itemPrice: string })[] };

  const getQuantity = (serviceId: string) => quantities[serviceId] || 1;

  const updateQuantity = (serviceId: string, quantity: number) => {
    setQuantities((prev) => ({
      ...prev,
      [serviceId]: Math.max(1, quantity),
    }));
  };

  const handleAddToCart = (service: LaundryService & { itemPrice: string }) => {
    if (!clothingItem) return;

    const quantity = getQuantity(service.id);
    onAddToCart(clothingItem, service as unknown as LaundryService, quantity);

    setQuantities(prev => ({ ...prev, [service.id]: 1 }));
    setSelectedServiceId(null);
  };

  const handleClose = () => {
    setQuantities({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Select Service for</span>
            <span className="text-pos-primary">
              {clothingItem?.name}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Service Categories */}
        <div className="flex space-x-1 mb-4 overflow-x-auto">
          {serviceCategories.map((category) => (
            <Button
              key={category.id}
              variant={
                selectedCategory === category.id ? "default" : "secondary"
              }
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

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service) => {
            const isSelected = selectedServiceId === service.id;
            const category = serviceCategories.find(
              (c) => c.id === service.categoryId,
            );
            return (
              <Card
                key={service.id}
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  isSelected ? "ring-2 ring-pos-primary" : ""
                }`}
                onClick={() => setSelectedServiceId(service.id)}
              >
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {service.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-pos-primary">
                      {formatCurrency(service.itemPrice)}
                    </span>
                    <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded">
                      {category?.name || service.categoryId}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center space-x-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(
                              service.id,
                              getQuantity(service.id) - 1,
                            );
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={getQuantity(service.id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            updateQuantity(
                              service.id,
                              parseInt(e.target.value) || 1,
                            )
                          }
                          className="w-16 text-center"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(
                              service.id,
                              getQuantity(service.id) + 1,
                            );
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <Button
                        className="bg-pos-secondary hover:bg-green-600 text-white w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(service);
                        }}
                      >
                        Add to Cart
                      </Button>

                      <div className="text-right">
                        <span className="text-sm text-gray-600">
                          Total:{" "}
                          {formatCurrency(
                            parseFloat(service.itemPrice) *
                              getQuantity(service.id),
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
