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
import { CustomerManagement } from "@/components/customer-management";
import { OrderTracking } from "@/components/order-tracking";
import { BusinessReports } from "@/components/business-reports";
import { useLaundryCart } from "@/hooks/use-laundry-cart";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LanguageSelector } from "@/components/language-selector";
import { useCurrency } from "@/lib/currency";
import { SystemSettings } from "@/components/system-settings";
import { ClothingItem, LaundryService, Customer } from "@shared/schema";
import { ShoppingCart, Package, BarChart3, Settings, Users, Truck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/AuthContext";

export default function POS() {
  const [activeView, setActiveView] = useState("sales");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCartVisible, setIsCartVisible] = useState(true); // Always visible on desktop, togglable on mobile
  const [currentTransaction, setCurrentTransaction] = useState<any | null>(null);
  const [currentOrder, setCurrentOrder] = useState<any | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedClothingItem, setSelectedClothingItem] = useState<ClothingItem | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatCurrency } = useCurrency();
  const { user, branch } = useAuthContext();
  const username = user?.username ?? "";
  
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
    mutationFn: async ({ order, transaction }: { order: any; transaction?: any }) => {
      const orderRes = await apiRequest("POST", "/api/orders", order);
      const createdOrder = await orderRes.json();
      let recordedTransaction = null;
      if (transaction) {
        const txRes = await apiRequest("POST", "/api/transactions", {
          ...transaction,
          orderId: createdOrder.id,
        });
        recordedTransaction = await txRes.json();
      }
      return { order: createdOrder, transaction: recordedTransaction };
    },
    onSuccess: ({ order, transaction }) => {
      setCurrentOrder({
        ...order,
        branchName: branch?.name,
        branchAddress: branch?.address,
        branchPhone: branch?.phone,
        sellerName: username,
      });
      if (transaction) {
        setCurrentTransaction({
          ...transaction,
          sellerName: username,
          branchName: branch?.name,
          branchAddress: branch?.address,
          branchPhone: branch?.phone,
        });
        toast({
          title: "Order completed successfully",
          description: `Total: ${formatCurrency(order.total)}`,
        });
      } else {
        setCurrentTransaction(null);
        toast({
          title: "Order created successfully",
          description: `Pay-later order for ${order.customerName} has been created`,
        });
      }
      setIsReceiptModalOpen(true);
      clearCart();
      setSelectedCustomer(null);
      queryClient.invalidateQueries({ queryKey: ["/api/clothing-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/laundry-services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process order",
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

  const handleCheckout = async (redeemedPoints: number = 0) => {
    if (cartSummary.items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to cart before checkout",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "pay_later" && !selectedCustomer) {
      toast({
        title: "Customer required",
        description: "Please select a customer for pay later orders",
        variant: "destructive",
      });
      return;
    }

    const finalTotal = Math.max(cartSummary.total - redeemedPoints, 0);
    const pointsEarned = selectedCustomer ? Math.floor(finalTotal) : 0;

    // Convert laundry cart items to order format
    const orderItems = cartSummary.items.map(item => ({
      id: item.id,
      name: item.clothingItem.name,
      clothingItem: item.clothingItem.name,
      service: item.service.name,
      quantity: item.quantity,
      price: parseFloat(item.service.price),
      total: item.total
    }));

    const orderData = {
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name || "Walk-in",
      customerPhone: selectedCustomer?.phoneNumber || "",
      items: orderItems,
      subtotal: cartSummary.subtotal.toString(),
      tax: cartSummary.tax.toString(),
      total: finalTotal.toString(),
      paymentMethod,
      status: "received",
      estimatedPickup: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      sellerName: username,
      loyaltyPointsEarned: pointsEarned,
      loyaltyPointsRedeemed: redeemedPoints,
    };

    const transaction = paymentMethod === "pay_later" ? undefined : {
      items: orderItems,
      subtotal: cartSummary.subtotal.toString(),
      tax: cartSummary.tax.toString(),
      total: finalTotal.toString(),
      paymentMethod,
      sellerName: username,
      customerId: selectedCustomer?.id,
    };

    checkoutMutation.mutate({ order: orderData, transaction });
  };

  const toggleCart = () => {
    setIsCartVisible(!isCartVisible);
  };

  // Mobile Bottom Navigation
  const MobileBottomNav = () => {
    if (!isMobile) return null;

    const navItems = [
      { id: "sales", label: "Sales", icon: ShoppingCart },
      { id: "customers", label: "Customers", icon: Users },
      { id: "orders", label: "Orders", icon: Truck },
      { id: "reports", label: "Reports", icon: TrendingUp },
      { id: "settings", label: "Settings", icon: Settings }
    ];

    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-pos-surface border-t border-gray-200 shadow-material-lg z-40">
        <div className="grid grid-cols-5 h-16">
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
              selectedCustomer={selectedCustomer}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
              onClearCart={clearCart}
              onSelectPayment={setPaymentMethod}
              onSelectCustomer={setSelectedCustomer}
              onCheckout={handleCheckout}
              isVisible={isCartVisible}
              onClose={() => setIsCartVisible(false)}
            />
          </>
        );
      case "customers":
        return (
          <CustomerManagement 
            onCustomerSelect={(customer) => {
              setSelectedCustomer(customer);
              setActiveView("sales");
            }}
          />
        );
      case "orders":
        return <OrderTracking />;
      case "reports":
        return <BusinessReports />;
      case "inventory":
        return <InventoryManagement />;
      case "settings":
        return <SystemSettings />;
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
        order={currentOrder}
        customer={selectedCustomer}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />
    </div>
  );
}
