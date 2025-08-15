import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Trash2, X, User, Phone, CreditCard, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LaundryCartSummary, Customer, InsertCustomer } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useCurrency } from "@/lib/currency";
import { getTaxRate } from "@/lib/tax";

interface LaundryCartSidebarProps {
  cartSummary: LaundryCartSummary;
  paymentMethod: "cash" | "card" | "pay_later";
  selectedCustomer: Customer | null;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onSelectPayment: (method: "cash" | "card" | "pay_later") => void;
  onSelectCustomer: (customer: Customer | null) => void;
  onCheckout: (redeemedPoints: number) => void;
  isVisible: boolean;
  onClose: () => void;
}

export function LaundryCartSidebar({
  cartSummary,
  paymentMethod,
  selectedCustomer,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSelectPayment,
  onSelectCustomer,
  onCheckout,
  isVisible,
  onClose
}: LaundryCartSidebarProps) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatCurrency } = useCurrency();
  const taxRate = getTaxRate();

  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [newCustomer, setNewCustomer] = useState<InsertCustomer>({
    phoneNumber: "",
    name: "",
    email: "",
    address: "",
    nickname: "",
  });
  const [redeemPoints, setRedeemPoints] = useState(0);

  useEffect(() => {
    setRedeemPoints(0);
  }, [selectedCustomer, cartSummary.total]);

  const maxRedeemable = selectedCustomer
    ? Math.min(selectedCustomer.loyaltyPoints, Math.floor(cartSummary.total))
    : 0;
  const finalTotal = Math.max(cartSummary.total - redeemPoints, 0);

  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const addCustomerMutation = useMutation({
    mutationFn: async (customer: InsertCustomer) => {
      const response = await apiRequest("POST", "/api/customers", customer);
      return response.json();
    },
    onSuccess: (customer: Customer) => {
      toast({
        title: "Customer added",
        description: `${customer.name} has been added to customers`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      onSelectCustomer(customer);
      setIsCustomerDialogOpen(false);
      setNewCustomer({ phoneNumber: "", name: "", email: "", address: "", nickname: "" });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to add customer",
        variant: "destructive",
      });
    },
  });

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.nickname?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phoneNumber.includes(customerSearch)
  );

  const handleAddCustomer = () => {
    if (!newCustomer.phoneNumber || !newCustomer.name) {
      toast({
        title: "Error",
        description: "Phone number and name are required",
        variant: "destructive",
      });
      return;
    }
    const data = { ...newCustomer, nickname: newCustomer.nickname || undefined };
    addCustomerMutation.mutate(data);
  };

  return (
    <div className={`
      ${isMobile ? 'fixed inset-0 z-50' : 'w-96'} 
      ${isMobile && !isVisible ? 'hidden' : 'flex'}
      bg-pos-surface shadow-material-lg border-l border-gray-200 flex-col
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

      {/* Customer Selection */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Customer (Optional)</Label>
          
          {selectedCustomer ? (
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="font-medium">
                    {selectedCustomer.name}
                    {selectedCustomer.nickname && (
                      <span className="text-sm text-gray-500 ml-1">
                        ({selectedCustomer.nickname})
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">{selectedCustomer.phoneNumber}</p>
                  {parseFloat(selectedCustomer.balanceDue) > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      Balance: {formatCurrency(selectedCustomer.balanceDue)}
                    </Badge>
                  )}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onSelectCustomer(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Select Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Select or Add Customer</DialogTitle>
                  <DialogDescription>
                    Choose an existing customer or create a new one
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <Input
                    placeholder="Search customers by name, nickname, or phone..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                  
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          onSelectCustomer(customer);
                          setIsCustomerDialogOpen(false);
                        }}
                      >
                        <div>
                          <p className="font-medium">
                            {customer.name}
                            {customer.nickname && (
                              <span className="text-sm text-gray-500 ml-1">
                                ({customer.nickname})
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">{customer.phoneNumber}</p>
                        </div>
                        {parseFloat(customer.balanceDue) > 0 && (
                          <Badge variant="destructive">
                            {formatCurrency(customer.balanceDue)}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  <Separator />
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Add New Customer</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          value={newCustomer.phoneNumber}
                          onChange={(e) => setNewCustomer({ ...newCustomer, phoneNumber: e.target.value })}
                          placeholder="Phone number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={newCustomer.name}
                          onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                          placeholder="Customer name"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="nickname">Nickname</Label>
                        <Input
                          id="nickname"
                          value={newCustomer.nickname || ""}
                          onChange={(e) => setNewCustomer({ ...newCustomer, nickname: e.target.value })}
                          placeholder="Nickname"
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={handleAddCustomer} 
                      disabled={addCustomerMutation.isPending}
                      className="w-full"
                    >
                      Add Customer
                    </Button>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCustomerDialogOpen(false)}>
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                        {formatCurrency(item.service.price)} each
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
                        {formatCurrency(item.total)}
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
              <span className="font-medium">{formatCurrency(cartSummary.subtotal)}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax ({(taxRate * 100).toString()}%):</span>
                <span className="font-medium">{formatCurrency(cartSummary.tax)}</span>
              </div>
            )}
            {selectedCustomer && maxRedeemable > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">
                  Redeem Points (Avail: {selectedCustomer.loyaltyPoints})
                </span>
                <Input
                  type="number"
                  min={0}
                  max={maxRedeemable}
                  value={redeemPoints}
                  onChange={(e) =>
                    setRedeemPoints(
                      Math.min(
                        Math.max(0, parseInt(e.target.value) || 0),
                        maxRedeemable
                      )
                    )
                  }
                  className="w-20 h-7"
                />
              </div>
            )}
            {redeemPoints > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-{formatCurrency(redeemPoints)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-3">
              <span>Total:</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Payment Method:</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={paymentMethod === "cash" ? "default" : "outline"}
                className={`justify-center space-x-1 ${
                  paymentMethod === "cash" 
                    ? "bg-pos-primary hover:bg-blue-700 text-white" 
                    : ""
                }`}
                onClick={() => onSelectPayment("cash")}
              >
                <DollarSign className="h-4 w-4" />
                <span>Cash</span>
              </Button>
              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                className={`justify-center space-x-1 ${
                  paymentMethod === "card" 
                    ? "bg-pos-primary hover:bg-blue-700 text-white" 
                    : ""
                }`}
                onClick={() => onSelectPayment("card")}
              >
                <CreditCard className="h-4 w-4" />
                <span>Card</span>
              </Button>
              <Button
                variant={paymentMethod === "pay_later" ? "default" : "outline"}
                className={`justify-center space-x-1 ${
                  paymentMethod === "pay_later" 
                    ? "bg-pos-primary hover:bg-blue-700 text-white" 
                    : ""
                }`}
                onClick={() => onSelectPayment("pay_later")}
                disabled={!selectedCustomer}
              >
                <User className="h-4 w-4" />
                <span>Pay Later</span>
              </Button>
            </div>
            {paymentMethod === "pay_later" && !selectedCustomer && (
              <p className="text-xs text-amber-600">
                Please select a customer for pay later option
              </p>
            )}
          </div>

          {/* Checkout Button */}
          <Button
            className="w-full bg-pos-secondary hover:bg-green-600 text-white font-medium py-4"
            onClick={() => onCheckout(redeemPoints)}
            disabled={cartSummary.items.length === 0 || (paymentMethod === "pay_later" && !selectedCustomer)}
          >
            <span className="mr-2">✓</span>
            {paymentMethod === "pay_later" ? "Create Order (Pay Later)" : "Complete Order"}
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