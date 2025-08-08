import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Customer, InsertCustomer, Payment, InsertPayment, insertCustomerSchema } from "@shared/schema";
import { Search, Plus, Phone, DollarSign, CreditCard, User, Calendar, UserX } from "lucide-react";
import { format } from "date-fns";
import { useCurrency } from "@/lib/currency";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

interface CustomerManagementProps {
  onCustomerSelect?: (customer: Customer) => void;
}

interface CustomerFormFieldsProps {
  customer: InsertCustomer;
  onChange: (value: InsertCustomer) => void;
}

function CustomerFormFields({ customer, onChange }: CustomerFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          value={customer.phoneNumber}
          onChange={(e) => onChange({ ...customer, phoneNumber: e.target.value })}
          placeholder="Enter phone number"
        />
      </div>
      <div>
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={customer.name}
          onChange={(e) => onChange({ ...customer, name: e.target.value })}
          placeholder="Enter customer name"
        />
      </div>
      <div>
        <Label htmlFor="nickname">Nickname</Label>
        <Input
          id="nickname"
          value={customer.nickname || ""}
          onChange={(e) => onChange({ ...customer, nickname: e.target.value })}
          placeholder="Enter nickname"
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={customer.email || ""}
          onChange={(e) => onChange({ ...customer, email: e.target.value })}
          placeholder="Enter email address"
        />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={customer.address || ""}
          onChange={(e) => onChange({ ...customer, address: e.target.value })}
          placeholder="Enter address"
        />
      </div>
    </div>
  );
}

export function CustomerManagement({ onCustomerSelect }: CustomerManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState<InsertCustomer>({
    phoneNumber: "",
    name: "",
    email: "",
    address: "",
    nickname: "",
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editCustomerData, setEditCustomerData] = useState<InsertCustomer>({
    phoneNumber: "",
    name: "",
    email: "",
    address: "",
    nickname: "",
  });
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportCustomer, setReportCustomer] = useState<Customer | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers", searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set("q", searchTerm);
      const response = await fetch(`/api/customers${params.toString() ? `?${params}` : ""}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch customers");
      return response.json();
    },
  });

  const { data: selectedCustomerPayments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/customers", selectedCustomer?.id, "payments"],
    enabled: !!selectedCustomer?.id,
  });

  interface CustomerOrder {
    id: string;
    orderNumber: string;
    createdAt: string;
    subtotal: string;
    paid: string;
    remaining: string;
  }

  const { data: customerOrders = [] } = useQuery<CustomerOrder[]>({
    queryKey: ["/api/customers", reportCustomer?.id, "orders"],
    enabled: !!reportCustomer && isReportDialogOpen,
  });

  const addCustomerMutation = useMutation({
    mutationFn: async (customer: InsertCustomer) => {
      const response = await apiRequest("POST", "/api/customers", customer);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsAddDialogOpen(false);
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

  const recordPaymentMutation = useMutation({
    mutationFn: async (payment: InsertPayment) => {
      const { customerId, ...data } = payment;
      const response = await apiRequest(
        "POST",
        `/api/customers/${customerId}/payments`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers", selectedCustomer?.id, "payments"] });
      setIsPaymentDialogOpen(false);
      setPaymentAmount("");
      setPaymentNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const editCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertCustomer }) => {
      const response = await apiRequest("PATCH", `/api/customers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      if (editingCustomer) {
        queryClient.invalidateQueries({ queryKey: ["/api/customers", editingCustomer.id, "payments"] });
        queryClient.invalidateQueries({ queryKey: ["/api/customers", editingCustomer.id, "orders"] });
      }
      setIsEditDialogOpen(false);
      setEditingCustomer(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive",
      });
    },
  });

  const deactivateCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/customers/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer deactivated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to deactivate customer",
        variant: "destructive",
      });
    },
  });

  const handleDeactivateCustomer = (id: string) => {
    if (confirm("Are you sure you want to deactivate this customer?")) {
      deactivateCustomerMutation.mutate(id);
    }
  };


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

  const handleRecordPayment = () => {
    if (!selectedCustomer || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

      recordPaymentMutation.mutate({
        customerId: selectedCustomer.id,
        amount: paymentAmount,
        paymentMethod,
        notes: paymentNotes,
        receivedBy: user?.username || "Unknown",
      });
    };

  const handleEditCustomer = () => {
    if (!editingCustomer) return;
    try {
      const data = insertCustomerSchema.parse(editCustomerData);
      editCustomerMutation.mutate({ id: editingCustomer.id, data });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid customer data",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Customer Due Amount Report", 14, 16);
    let y = 30;
    customerOrders.forEach((order) => {
      const row = [
        order.orderNumber,
        format(new Date(order.createdAt), "MMM dd, yyyy"),
        formatCurrency(order.subtotal),
        formatCurrency(order.paid),
        formatCurrency(order.remaining),
      ].join(" | ");
      doc.text(row, 14, y);
      y += 10;
    });
    doc.save("customer_due_report.pdf");
  };

  const handleExportExcel = () => {
    const data = customerOrders.map((order) => ({
      orderNumber: order.orderNumber,
      date: format(new Date(order.createdAt), "yyyy-MM-dd"),
      subtotal: Number(order.subtotal),
      paid: Number(order.paid),
      remaining: Number(order.remaining),
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, "customer_due_report.xlsx");
  };

  if (isLoading) {
    return <div className="p-4">Loading customers...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Customer Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Enter customer details to create a new account
              </DialogDescription>
            </DialogHeader>
            <CustomerFormFields customer={newCustomer} onChange={setNewCustomer} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCustomer} disabled={addCustomerMutation.isPending}>
                Add Customer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search customers by name, nickname, phone, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer) => (
          <Card key={customer.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {customer.name}
                    {customer.nickname && (
                      <span className="text-sm text-gray-500 ml-2">
                        ({customer.nickname})
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <Phone className="w-3 h-3 mr-1" />
                    {customer.phoneNumber}
                  </CardDescription>
                </div>
                {parseFloat(customer.balanceDue) > 0 && (
                  <Badge
                    variant="destructive"
                    className="cursor-pointer"
                    onClick={() => {
                      setReportCustomer(customer);
                      setIsReportDialogOpen(true);
                    }}
                  >
                    Due: {formatCurrency(customer.balanceDue)}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {customer.email && (
                <p className="text-sm text-gray-600">{customer.email}</p>
              )}
              <div className="flex justify-between text-sm">
                <span>Total Spent:</span>
                <span className="font-medium">{formatCurrency(customer.totalSpent)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Loyalty Points:</span>
                <span className="font-medium">{customer.loyaltyPoints}</span>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onCustomerSelect?.(customer)}
                >
                  <User className="w-3 h-3 mr-1" />
                  Select
                </Button>
                {parseFloat(customer.balanceDue) > 0 && (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setIsPaymentDialogOpen(true);
                    }}
                  >
                    <DollarSign className="w-3 h-3 mr-1" />
                    Pay
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setEditingCustomer(customer);
                    setEditCustomerData({
                      phoneNumber: customer.phoneNumber,
                      name: customer.name,
                      email: customer.email || "",
                      address: customer.address || "",
                      nickname: customer.nickname || "",
                    });
                    setIsEditDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDeactivateCustomer(customer.id)}
                  disabled={deactivateCustomerMutation.isPending}
                >
                  <UserX className="w-3 h-3 mr-1" />
                  Deactivate
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Customer Due Amount Report</DialogTitle>
            <DialogDescription>
              {reportCustomer ? `Outstanding orders for ${reportCustomer.name}` : ""}
            </DialogDescription>
          </DialogHeader>
          {customerOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No outstanding orders.</p>
          ) : (
            <>
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="p-2">Order #</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Subtotal</th>
                      <th className="p-2">Paid</th>
                      <th className="p-2">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerOrders.map((order) => (
                      <tr key={order.id} className="border-t">
                        <td className="p-2">{order.orderNumber}</td>
                        <td className="p-2">{format(new Date(order.createdAt), "MMM dd, yyyy")}</td>
                        <td className="p-2">{formatCurrency(order.subtotal)}</td>
                        <td className="p-2">{formatCurrency(order.paid)}</td>
                        <td className="p-2">{formatCurrency(order.remaining)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <DialogFooter className="justify-end gap-2">
                <Button variant="outline" onClick={handleExportPDF}>Export PDF</Button>
                <Button variant="outline" onClick={handleExportExcel}>Export Excel</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer details</DialogDescription>
          </DialogHeader>
          <CustomerFormFields customer={editCustomerData} onChange={setEditCustomerData} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCustomer} disabled={editCustomerMutation.isPending}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Payment - {selectedCustomer?.name}</DialogTitle>
            <DialogDescription>
              Current balance due: {formatCurrency(selectedCustomer?.balanceDue || "0")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Payment Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="method">Payment Method</Label>
                <select
                  id="method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Payment notes..."
              />
            </div>

            {selectedCustomerPayments.length > 0 && (
              <div>
                <Separator className="my-4" />
                <h4 className="font-medium mb-2">Recent Payments</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedCustomerPayments.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3 h-3" />
                        <span>{formatCurrency(payment.amount)}</span>
                        <Badge variant="outline" className="text-xs">
                          {payment.paymentMethod}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(payment.createdAt), "MMM dd")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={recordPaymentMutation.isPending}>
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}