import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { POSHeader } from "@/components/pos-header";
import { POSSidebar } from "@/components/pos-sidebar";
import { ClothingGrid } from "@/components/clothing-grid";
import { LaundryCartSidebar } from "@/components/laundry-cart-sidebar";
import { ServiceSelectionModal } from "@/components/service-selection-modal";
import { ReceiptModal } from "@/components/receipt-modal";
import { InventoryManagement } from "@/components/inventory-management";
import { ReportsDashboard } from "@/components/reports-dashboard";
import { SettingsPanel } from "@/components/settings-panel";
import { useLaundryCart } from "@/hooks/use-laundry-cart";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ClothingItem, LaundryService, Transaction, InsertTransaction } from "@shared/schema";
import { ShoppingCart, Package, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function POS() {
  const [activeView, setActiveView] = useState("sales");
  const [isCartVisible, setIsCartVisible] = useState(true); // Always visible on desktop, togglable on mobile
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedClothingItem, setSelectedClothingItem] = useState<ClothingItem | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    cartItems,
    paymentMethod,
    setPaymentMethod,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartSummary
  } = useLaundryCart();

  const cartSummary = getCartSummary();

  const checkoutMutation = useMutation({
    mutationFn: async (transaction: InsertTransaction) => {
      const response = await apiRequest("POST", "/api/transactions", transaction);
      return response.json();
    },
    onSuccess: (transaction: Transaction) => {
      setCurrentTransaction(transaction);
      setIsReceiptModalOpen(true);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["/api/clothing-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/laundry-services"] });
      toast({
        title: "Order completed successfully",
        description: `Total: $${parseFloat(transaction.total).toFixed(2)}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process transaction",
        variant: "destructive",
      });
    }
  });

  const handleSelectClothing = (clothingItem: ClothingItem) => {
    setSelectedClothingItem(clothingItem);
    setIsServiceModalOpen(true);
  };

  const handleAddToCart = (clothingItem: ClothingItem, service: LaundryService, quantity: number) => {
    addToCart(clothingItem, service, quantity);
    toast({
      title: "Added to cart",
      description: `${quantity}x ${clothingItem.name} with ${service.name} service`,
    });
  };

  const handleCheckout = async () => {
    if (cartSummary.items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to cart before checkout",
        variant: "destructive",
      });
      return;
    }

    // Convert laundry cart items to transaction format
    const transactionItems = cartSummary.items.map(item => ({
      id: item.id,
      clothingItem: item.clothingItem.name,
      service: item.service.name,
      quantity: item.quantity,
      price: parseFloat(item.service.price),
      total: item.total
    }));

    const transaction: InsertTransaction = {
      items: transactionItems,
      subtotal: cartSummary.subtotal.toString(),
      tax: cartSummary.tax.toString(),
      total: cartSummary.total.toString(),
      paymentMethod,
      cashierName: "Sarah Johnson"
    };

    checkoutMutation.mutate(transaction);
  };

  const toggleCart = () => {
    setIsCartVisible(!isCartVisible);
  };

  // Mobile Bottom Navigation
  const MobileBottomNav = () => {
    if (!isMobile) return null;

    const navItems = [
      { id: "sales", label: "Sales", icon: ShoppingCart },
      { id: "inventory", label: "Inventory", icon: Package },
      { id: "reports", label: "Reports", icon: BarChart3 },
      { id: "settings", label: "Settings", icon: Settings }
    ];

    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-pos-surface border-t border-gray-200 shadow-material-lg z-40">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`flex flex-col items-center justify-center space-y-1 h-full rounded-none ${
                  isActive ? "text-pos-primary" : "text-gray-600"
                }`}
                onClick={() => setActiveView(item.id)}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>
    );
  };

  // Non-sales views placeholder
  const renderActiveView = () => {
    switch (activeView) {
      case "sales":
        return (
          <>
            <ClothingGrid
              onSelectClothing={handleSelectClothing}
            />
            
            <LaundryCartSidebar
              cartSummary={cartSummary}
              paymentMethod={paymentMethod}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
              onClearCart={clearCart}
              onSelectPayment={setPaymentMethod}
              onCheckout={handleCheckout}
              isVisible={isCartVisible}
              onClose={() => setIsCartVisible(false)}
            />
          </>
        );
      case "inventory":
        return <InventoryManagement />;
      case "reports":
        return <ReportsDashboard />;
      case "settings":
        return <SettingsPanel />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center bg-pos-background">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 capitalize">{activeView}</h2>
              <p className="text-gray-600">This section is under development</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-pos-background">
      <POSHeader 
        cartItemCount={cartSummary.itemCount}
        onToggleCart={toggleCart}
      />
      
      <div className="flex h-screen bg-pos-background">
        <POSSidebar activeView={activeView} onViewChange={setActiveView} />
        
        <main className={`flex-1 ${activeView === "sales" ? "flex flex-col lg:flex-row" : "flex"} overflow-hidden`}>
          {renderActiveView()}
        </main>
      </div>

      <MobileBottomNav />

      <ServiceSelectionModal
        isOpen={isServiceModalOpen}
        onClose={() => {
          setIsServiceModalOpen(false);
          setSelectedClothingItem(null);
        }}
        clothingItem={selectedClothingItem}
        onAddToCart={handleAddToCart}
      />

      <ReceiptModal
        transaction={currentTransaction}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />
    </div>
  );
}
