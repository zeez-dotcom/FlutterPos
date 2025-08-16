import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { Order, OrderPrint } from "@shared/schema";
import { Search, Package, Clock, CheckCircle, AlertCircle, Printer } from "lucide-react";
import { format } from "date-fns";
import { useCurrency } from "@/lib/currency";
import { ReceiptModal } from "./receipt-modal";

export interface OrderItem {
  clothingItem: string | { name: string };
  service: string | { name: string };
  quantity: number;
}

const statusColors = {
  delivery_pending: "bg-gray-100 text-gray-800",
  received: "bg-blue-100 text-blue-800",
  processing: "bg-yellow-100 text-yellow-800",
  washing: "bg-purple-100 text-purple-800",
  drying: "bg-orange-100 text-orange-800",
  ready: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
};

const statusIcons = {
  delivery_pending: Clock,
  received: Package,
  processing: AlertCircle,
  washing: Clock,
  drying: Clock,
  ready: CheckCircle,
  completed: CheckCircle,
};

export const getItemsSummary = (items: OrderItem[]): string => {
  return items
    .map((item) => {
      const clothingName =
        typeof item.clothingItem === "string"
          ? item.clothingItem
          : item.clothingItem?.name || "Item";
      const serviceName =
        typeof item.service === "string"
          ? item.service
          : item.service?.name || "Service";
      return `${item.quantity}x ${clothingName} (${serviceName})`;
    })
    .join(", ");
};

export function OrderTracking() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notifyCustomer, setNotifyCustomer] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [printInfo, setPrintInfo] = useState<OrderPrint | null>(null);
  const [isReceiptOpen, setReceiptOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatCurrency } = useCurrency();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders", statusFilter],
    queryFn: async () => {
      const url =
        statusFilter === "delivery_pending"
          ? "/api/orders?status=delivery_pending"
          : "/api/orders";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch orders");
      }
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, notify }: { orderId: string; status: string; notify: boolean }) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status, notify });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm);

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    if (order.status === "delivery_pending" && statusFilter !== "delivery_pending") {
      return false;
    }

    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus, notify: notifyCustomer });
  };

  const handlePrintReceipt = async (order: Order) => {
    try {
      await apiRequest("GET", `/api/orders/${order.id}/prints`);
      const res = await apiRequest("POST", `/api/orders/${order.id}/print`);
      const record: OrderPrint = await res.json();
      setSelectedOrder(order);
      setPrintInfo(record);
      setReceiptOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record print",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading orders...</div>;
  }

  return (
    <>
    <div className="h-full flex flex-col">
      <div className="p-6 flex-shrink-0 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Order Tracking</h2>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-blue-50">
            {orders.filter(o => o.status === 'received').length} Received
          </Badge>
          <Badge variant="outline" className="bg-yellow-50">
            {orders.filter(o => ['processing', 'washing', 'drying'].includes(o.status)).length} In Progress
          </Badge>
          <Badge variant="outline" className="bg-green-50">
            {orders.filter(o => o.status === 'ready').length} Ready
          </Badge>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by order number, customer name, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="delivery_pending">Delivery Pending</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="washing">Washing</SelectItem>
            <SelectItem value="drying">Drying</SelectItem>
            <SelectItem value="ready">Ready for Pickup</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch id="notify" checked={notifyCustomer} onCheckedChange={setNotifyCustomer} />
          <label htmlFor="notify" className="text-sm">Notify customer</label>
        </div>
      </div>

      </div>
      
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-4">
        {filteredOrders.map((order) => {
          const StatusIcon = statusIcons[order.status as keyof typeof statusIcons];
          const items: OrderItem[] = Array.isArray(order.items)
            ? (order.items as OrderItem[])
            : [];
          
          return (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <StatusIcon className="w-5 h-5" />
                      Order #{order.orderNumber}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {order.customerName} • {order.customerPhone}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                    {order.paymentMethod === 'pay_later' && (
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        Pay Later
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Items ({items.length})</h4>
                    <div className="space-y-1">
                      {items.slice(0, 3).map((item, index) => (
                        <div key={index} className="text-sm flex justify-between">
                          <span>{item.quantity}x {typeof item.clothingItem === 'string' ? item.clothingItem : item.clothingItem?.name || 'Item'}</span>
                          <span className="text-gray-500">({typeof item.service === 'string' ? item.service : item.service?.name || 'Service'})</span>
                        </div>
                      ))}
                      {items.length > 3 && (
                        <div className="text-xs text-gray-500">+{items.length - 3} more items</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-bold text-lg">{formatCurrency(order.total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment:</span>
                        <span className="capitalize">{order.paymentMethod.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Created:</span>
                        <span>{format(new Date(order.createdAt), "MMM dd, HH:mm")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {order.notes && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Notes</h4>
                    <p className="text-sm text-gray-600">{order.notes}</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t">
                  <div className="flex items-center gap-2">
                    {order.estimatedPickup && (
                      <Badge variant="outline" className="text-xs">
                        Pickup: {format(new Date(order.estimatedPickup), "MMM dd")}
                      </Badge>
                    )}
                    {order.notes && (
                      <Badge variant="outline" className="text-xs">
                        Has Notes
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePrintReceipt(order)}
                    >
                      <Printer className="w-4 h-4 mr-1" /> Print Receipt
                    </Button>
                    {order.status === 'received' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(order.id, 'processing')}
                        disabled={updateStatusMutation.isPending}
                      >
                        Start Processing
                      </Button>
                    )}
                    {order.status === 'processing' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleStatusUpdate(order.id, 'washing')}
                        disabled={updateStatusMutation.isPending}
                      >
                        Start Washing
                      </Button>
                    )}
                    {order.status === 'washing' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleStatusUpdate(order.id, 'drying')}
                        disabled={updateStatusMutation.isPending}
                      >
                        Start Drying
                      </Button>
                    )}
                    {order.status === 'drying' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleStatusUpdate(order.id, 'ready')}
                        disabled={updateStatusMutation.isPending}
                      >
                        Mark Ready
                      </Button>
                    )}
                    {order.status === 'ready' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusUpdate(order.id, 'completed')}
                        disabled={updateStatusMutation.isPending}
                      >
                        Mark Completed
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "Orders will appear here once customers place them"
              }
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
      {selectedOrder && printInfo && (
        <ReceiptModal
          order={selectedOrder}
          isOpen={isReceiptOpen}
          onClose={() => {
            setReceiptOpen(false);
            setSelectedOrder(null);
            setPrintInfo(null);
          }}
          printNumber={printInfo.printNumber}
          printedAt={printInfo.printedAt}
        />
      )}
    </>
  );
}
