import { Minus, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LaundryCartSummary } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";

interface LaundryCartSidebarProps {
  cartSummary: LaundryCartSummary;
  paymentMethod: "cash" | "card";
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onSelectPayment: (method: "cash" | "card") => void;
  onCheckout: () => void;
  isVisible: boolean;
  onClose: () => void;
}

export function LaundryCartSidebar({
  cartSummary,
  paymentMethod,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSelectPayment,
  onCheckout,
  isVisible,
  onClose
}: LaundryCartSidebarProps) {
  const isMobile = useIsMobile();

  return (
    <div className={`
      ${isMobile ? 'fixed inset-0 z-50' : 'w-96'} 
      ${isMobile && !isVisible ? 'hidden' : ''}
      bg-pos-surface shadow-material-lg border-l border-gray-200 flex flex-col
    `}>
      {/* Cart Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Laundry Cart</h2>
          {isMobile && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5 text-gray-500" />
            </Button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {cartSummary.items.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            Your cart is empty
          </div>
        ) : (
          <div className="space-y-3">
            {cartSummary.items.map((item) => (
              <Card key={item.id} className="bg-gray-50">
                <CardContent className="p-3">
                  <div className="flex items-start space-x-3">
                    {item.clothingItem.imageUrl && (
                      <img
                        src={item.clothingItem.imageUrl}
                        alt={item.clothingItem.name}
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {item.clothingItem.name}
                      </h4>
                      <p className="text-sm text-blue-600 font-medium">
                        {item.service.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        ${parseFloat(item.service.price).toFixed(2)} each
                      </p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2 mt-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-7 h-7 p-0 rounded-full"
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-7 h-7 p-0 rounded-full"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        ${item.total.toFixed(2)}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-pos-error hover:text-red-700 p-0 mt-1"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cart Summary and Checkout */}
      {cartSummary.items.length > 0 && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Summary */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${cartSummary.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax (8.5%):</span>
              <span className="font-medium">${cartSummary.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-3">
              <span>Total:</span>
              <span>${cartSummary.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Payment Method:</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={paymentMethod === "cash" ? "default" : "outline"}
                className={`justify-center space-x-2 ${
                  paymentMethod === "cash" 
                    ? "bg-pos-primary hover:bg-blue-700 text-white" 
                    : ""
                }`}
                onClick={() => onSelectPayment("cash")}
              >
                <span>💵</span>
                <span>Cash</span>
              </Button>
              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                className={`justify-center space-x-2 ${
                  paymentMethod === "card" 
                    ? "bg-pos-primary hover:bg-blue-700 text-white" 
                    : ""
                }`}
                onClick={() => onSelectPayment("card")}
              >
                <span>💳</span>
                <span>Card</span>
              </Button>
            </div>
          </div>

          {/* Checkout Button */}
          <Button 
            className="w-full bg-pos-secondary hover:bg-green-600 text-white font-medium py-4"
            onClick={onCheckout}
          >
            <span className="mr-2">✓</span>
            Complete Order
          </Button>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
              ⏸️ Hold
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-pos-error hover:text-red-700"
              onClick={onClearCart}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}