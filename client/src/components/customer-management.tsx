import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Customer, InsertCustomer, Payment, InsertPayment, LoyaltyHistory, insertCustomerSchema } from "@shared/schema";
import { Search, Plus, Phone, DollarSign, CreditCard, User, Calendar, UserX } from "lucide-react";
import { format } from "date-fns";
import { useCurrency } from "@/lib/currency";
import { useAuthContext } from "@/context/AuthContext";
import { useTranslation } from "@/lib/i18n";
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
  const { t: translations } = useTranslation();
  const t = (key: keyof typeof translations) => translations[key];
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="phone">{t("phoneNumber")} *</Label>
        <Input
          id="phone"
          value={customer.phoneNumber}
          onChange={(e) => onChange({ ...customer, phoneNumber: e.target.value })}
          placeholder={t("phoneNumber")}
        />
      </div>
      <div>
        <Label htmlFor="name">{t("name")} *</Label>
        <Input
          id="name"
          value={customer.name}
          onChange={(e) => onChange({ ...customer, name: e.target.value })}
          placeholder={t("name")}
        />
      </div>
      <div>
        <Label htmlFor="nickname">{t("nickname")}</Label>
        <Input
          id="nickname"
          value={customer.nickname || ""}
          onChange={(e) => onChange({ ...customer, nickname: e.target.value })}
          placeholder={t("nickname")}
        />
      </div>
      <div>
        <Label htmlFor="email">{t("emailAddress")}</Label>
        <Input
          id="email"
          type="email"
          value={customer.email || ""}
          onChange={(e) => onChange({ ...customer, email: e.target.value })}
          placeholder={t("emailAddress")}
        />
      </div>
      <div>
        <Label htmlFor="address">{t("address")}</Label>
        <Input
          id="address"
          value={customer.address || ""}
          onChange={(e) => onChange({ ...customer, address: e.target.value })}
          placeholder={t("address")}
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
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const pageSize = 10;
  const [paymentPage, setPaymentPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [loyaltyPage, setLoyaltyPage] = useState(1);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatCurrency } = useCurrency();
  const { user, branch } = useAuthContext();
  const { t: translations } = useTranslation();
  const t = (key: keyof typeof translations) => translations[key];

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers", searchTerm, branch?.id],
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

  interface Paginated<T> {
    data: T[];
    total: number;
  }

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

  const { data: paymentHistory = { data: [], total: 0 } } = useQuery<Paginated<Payment>>({
    queryKey: ["/api/customers", historyCustomer?.id, "payments", paymentPage],
    enabled: !!historyCustomer?.id && isHistoryDialogOpen,
    queryFn: async () => {
      if (!historyCustomer) return { data: [], total: 0 };
      const res = await fetch(
        `/api/customers/${historyCustomer.id}/payments?page=${paymentPage}&pageSize=${pageSize}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch payment history");
      const json = await res.json();
      if (Array.isArray(json)) {
        const start = (paymentPage - 1) * pageSize;
        return { data: json.slice(start, start + pageSize), total: json.length };
      }
      return json;
    },
  });

  const { data: orderHistory = { data: [], total: 0 } } = useQuery<Paginated<CustomerOrder>>({
    queryKey: ["/api/customers", historyCustomer?.id, "orders-history", orderPage],
    enabled: !!historyCustomer?.id && isHistoryDialogOpen,
    queryFn: async () => {
      if (!historyCustomer) return { data: [], total: 0 };
      const res = await fetch(
        `/api/customers/${historyCustomer.id}/orders?page=${orderPage}&pageSize=${pageSize}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch order history");
      const json = await res.json();
      if (Array.isArray(json)) {
        const start = (orderPage - 1) * pageSize;
        return { data: json.slice(start, start + pageSize), total: json.length };
      }
      return json;
    },
  });

  const { data: loyaltyHistory = { data: [], total: 0 } } = useQuery<Paginated<LoyaltyHistory>>({
    queryKey: ["/api/customers", historyCustomer?.id, "loyalty", loyaltyPage],
    enabled: !!historyCustomer?.id && isHistoryDialogOpen,
    queryFn: async () => {
      if (!historyCustomer) return { data: [], total: 0 };
      const res = await fetch(
        `/api/customers/${historyCustomer.id}/loyalty-history?page=${loyaltyPage}&pageSize=${pageSize}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch loyalty history");
      const json = await res.json();
      if (Array.isArray(json)) {
        const start = (loyaltyPage - 1) * pageSize;
        return { data: json.slice(start, start + pageSize), total: json.length };
      }
      return json;
    },
  });

  const addCustomerMutation = useMutation({
    mutationFn: async (customer: InsertCustomer) => {
      const response = await apiRequest("POST", "/api/customers", customer);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("success"),
        description: t("customerAdded"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsAddDialogOpen(false);
      setNewCustomer({ phoneNumber: "", name: "", email: "", address: "", nickname: "" });
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("failedToAddCustomer"),
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
        title: t("success"),
        description: t("paymentRecorded"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers", selectedCustomer?.id, "payments"] });
      setIsPaymentDialogOpen(false);
      setPaymentAmount("");
      setPaymentNotes("");
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("failedToRecordPayment"),
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
        title: t("success"),
        description: t("customerUpdated"),
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
        title: t("error"),
        description: t("failedToUpdateCustomer"),
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
        title: t("success"),
        description: t("customerDeactivated"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("failedToDeactivateCustomer"),
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
        title: t("error"),
        description: t("phoneAndNameRequired"),
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
        title: t("error"),
        description: t("invalidPaymentAmount"),
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
        title: t("error"),
        description: t("invalidCustomerData"),
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
        formatCurrency(Number(order.subtotal)),
        formatCurrency(Number(order.paid)),
        formatCurrency(Number(order.remaining)),
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

  const handlePaymentsExportPDF = async () => {
    if (!historyCustomer) return;
    const res = await fetch(`/api/customers/${historyCustomer.id}/payments`, {
      credentials: "include",
    });
    const payments: Payment[] = await res.json();
    const doc = new jsPDF();
    doc.text(`Payment History - ${historyCustomer.name}`, 14, 16);
    let y = 30;
    payments.forEach((p) => {
      const row = [
        format(new Date(p.createdAt), "MMM dd, yyyy"),
        formatCurrency(Number(p.amount ?? 0)),
        p.paymentMethod,
        p.notes || "",
      ].join(" | ");
      doc.text(row, 14, y);
      y += 10;
    });
    doc.save("payment_history.pdf");
  };

  const handlePaymentsExportCSV = async () => {
    if (!historyCustomer) return;
    const res = await fetch(`/api/customers/${historyCustomer.id}/payments`, {
      credentials: "include",
    });
    const payments: Payment[] = await res.json();
    const rows = payments.map((p) => ({
      date: format(new Date(p.createdAt), "yyyy-MM-dd"),
      amount: Number(p.amount),
      method: p.paymentMethod,
      notes: p.notes || "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "payment_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOrdersExportPDF = async () => {
    if (!historyCustomer) return;
    const res = await fetch(`/api/customers/${historyCustomer.id}/orders`, {
      credentials: "include",
    });
    const orders: CustomerOrder[] = await res.json();
    const doc = new jsPDF();
    doc.text(`Order History - ${historyCustomer.name}`, 14, 16);
    let y = 30;
    orders.forEach((o) => {
      const row = [
        o.orderNumber,
        format(new Date(o.createdAt), "MMM dd, yyyy"),
        formatCurrency(Number(o.subtotal)),
        formatCurrency(Number(o.paid)),
        formatCurrency(Number(o.remaining)),
      ].join(" | ");
      doc.text(row, 14, y);
      y += 10;
    });
    doc.save("order_history.pdf");
  };

  const handleOrdersExportCSV = async () => {
    if (!historyCustomer) return;
    const res = await fetch(`/api/customers/${historyCustomer.id}/orders`, {
      credentials: "include",
    });
    const orders: CustomerOrder[] = await res.json();
    const rows = orders.map((o) => ({
      orderNumber: o.orderNumber,
      date: format(new Date(o.createdAt), "yyyy-MM-dd"),
      subtotal: Number(o.subtotal),
      paid: Number(o.paid),
      remaining: Number(o.remaining),
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "order_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoyaltyExportPDF = async () => {
    if (!historyCustomer) return;
    const res = await fetch(
      `/api/customers/${historyCustomer.id}/loyalty-history`,
      { credentials: "include" }
    );
    const history: LoyaltyHistory[] = await res.json();
    const doc = new jsPDF();
    doc.text(`Loyalty History - ${historyCustomer.name}`, 14, 16);
    let y = 30;
    history.forEach((h) => {
      const row = [
        format(new Date(h.createdAt), "MMM dd, yyyy"),
        h.change.toString(),
        h.description || "",
      ].join(" | ");
      doc.text(row, 14, y);
      y += 10;
    });
    doc.save("loyalty_history.pdf");
  };

  const handleLoyaltyExportCSV = async () => {
    if (!historyCustomer) return;
    const res = await fetch(
      `/api/customers/${historyCustomer.id}/loyalty-history`,
      { credentials: "include" }
    );
    const history: LoyaltyHistory[] = await res.json();
    const rows = history.map((h) => ({
      date: format(new Date(h.createdAt), "yyyy-MM-dd"),
      change: h.change,
      description: h.description || "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "loyalty_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div className="p-4">{t("loading")}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("customerManagement")}</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t("addCustomer")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("addNewCustomer")}</DialogTitle>
              <DialogDescription>
                Enter customer details to create a new account
              </DialogDescription>
            </DialogHeader>
            <CustomerFormFields customer={newCustomer} onChange={setNewCustomer} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={handleAddCustomer} disabled={addCustomerMutation.isPending}>
                {t("addCustomer")}
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
                    {t("balanceDue")}: {formatCurrency(Number(customer.balanceDue ?? 0))}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {customer.email && (
                <p className="text-sm text-gray-600">{customer.email}</p>
              )}
              <div className="flex justify-between text-sm">
                <span>{t("totalSpent")}:</span>
                <span className="font-medium">{formatCurrency(Number(customer.totalSpent ?? 0))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("loyaltyPoints")}:</span>
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
                  {t("select")}
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
                    {t("pay")}
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
                  {t("edit")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setHistoryCustomer(customer);
                    setPaymentPage(1);
                    setOrderPage(1);
                    setLoyaltyPage(1);
                    setIsHistoryDialogOpen(true);
                  }}
                >
                  {t("history")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDeactivateCustomer(customer.id)}
                  disabled={deactivateCustomerMutation.isPending}
                >
                  <UserX className="w-3 h-3 mr-1" />
                  {t("deactivate")}
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
            <DialogTitle>{t("customerDueAmountReport")}</DialogTitle>
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
                        <td className="p-2">{formatCurrency(Number(order.subtotal))}</td>
                        <td className="p-2">{formatCurrency(Number(order.paid))}</td>
                        <td className="p-2">{formatCurrency(Number(order.remaining))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <DialogFooter className="justify-end gap-2">
                <Button variant="outline" onClick={handleExportPDF}>{t("exportPDF")}</Button>
                <Button variant="outline" onClick={handleExportExcel}>{t("exportExcel")}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t("history")} - {historyCustomer?.name}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="payments">
            <TabsList>
              <TabsTrigger value="payments">{t("payments")}</TabsTrigger>
              <TabsTrigger value="orders">{t("orders")}</TabsTrigger>
              <TabsTrigger value="loyalty">{t("loyalty")}</TabsTrigger>
            </TabsList>
            <TabsContent value="payments">
              {paymentHistory.data.length === 0 ? (
                <p className="text-sm text-gray-500">No payments found.</p>
              ) : (
                <>
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left">
                          <th className="p-2">Date</th>
                          <th className="p-2">Amount</th>
                          <th className="p-2">Method</th>
                          <th className="p-2">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistory.data.map((p) => (
                          <tr key={p.id} className="border-t">
                            <td className="p-2">{format(new Date(p.createdAt), "MMM dd, yyyy")}</td>
                            <td className="p-2">{formatCurrency(Number(p.amount ?? 0))}</td>
                            <td className="p-2">{p.paymentMethod}</td>
                            <td className="p-2">{p.notes || ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={paymentPage === 1}
                      onClick={() => setPaymentPage((p) => p - 1)}
                    >
                      {t("previous")}
                    </Button>
                    <span className="text-sm">
                      Page {paymentPage} of {Math.max(1, Math.ceil(paymentHistory.total / pageSize))}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={paymentPage * pageSize >= paymentHistory.total}
                      onClick={() => setPaymentPage((p) => p + 1)}
                    >
                      {t("next")}
                    </Button>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={handlePaymentsExportPDF}>
                      {t("exportPDF")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePaymentsExportCSV}>
                      {t("exportCSV")}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
            <TabsContent value="orders">
              {orderHistory.data.length === 0 ? (
                <p className="text-sm text-gray-500">No orders found.</p>
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
                        {orderHistory.data.map((o) => (
                          <tr key={o.id} className="border-t">
                            <td className="p-2">{o.orderNumber}</td>
                            <td className="p-2">{format(new Date(o.createdAt), "MMM dd, yyyy")}</td>
                            <td className="p-2">{formatCurrency(Number(o.subtotal))}</td>
                            <td className="p-2">{formatCurrency(Number(o.paid))}</td>
                            <td className="p-2">{formatCurrency(Number(o.remaining))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={orderPage === 1}
                      onClick={() => setOrderPage((p) => p - 1)}
                    >
                      {t("previous")}
                    </Button>
                    <span className="text-sm">
                      Page {orderPage} of {Math.max(1, Math.ceil(orderHistory.total / pageSize))}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={orderPage * pageSize >= orderHistory.total}
                      onClick={() => setOrderPage((p) => p + 1)}
                    >
                      {t("next")}
                    </Button>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={handleOrdersExportPDF}>
                      {t("exportPDF")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleOrdersExportCSV}>
                      {t("exportCSV")}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
            <TabsContent value="loyalty">
              {loyaltyHistory.data.length === 0 ? (
                <p className="text-sm text-gray-500">No loyalty changes found.</p>
              ) : (
                <>
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left">
                          <th className="p-2">Date</th>
                          <th className="p-2">Change</th>
                          <th className="p-2">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loyaltyHistory.data.map((l) => (
                          <tr key={l.id} className="border-t">
                            <td className="p-2">{format(new Date(l.createdAt), "MMM dd, yyyy")}</td>
                            <td className="p-2">{l.change}</td>
                            <td className="p-2">{l.description || ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loyaltyPage === 1}
                      onClick={() => setLoyaltyPage((p) => p - 1)}
                    >
                      {t("previous")}
                    </Button>
                    <span className="text-sm">
                      Page {loyaltyPage} of {Math.max(1, Math.ceil(loyaltyHistory.total / pageSize))}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loyaltyPage * pageSize >= loyaltyHistory.total}
                      onClick={() => setLoyaltyPage((p) => p + 1)}
                    >
                      {t("next")}
                    </Button>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={handleLoyaltyExportPDF}>
                      {t("exportPDF")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleLoyaltyExportCSV}>
                      {t("exportCSV")}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editCustomer")}</DialogTitle>
            <DialogDescription>Update customer details</DialogDescription>
          </DialogHeader>
          <CustomerFormFields customer={editCustomerData} onChange={setEditCustomerData} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleEditCustomer} disabled={editCustomerMutation.isPending}>
              {t("saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("recordPayment")} - {selectedCustomer?.name}</DialogTitle>
            <DialogDescription>
              Current balance due: {formatCurrency(Number(selectedCustomer?.balanceDue ?? 0))}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">{t("paymentAmount")} *</Label>
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
                <Label htmlFor="method">{t("paymentMethod")}</Label>
                <select
                  id="method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="cash">{t("cash")}</option>
                  <option value="card">{t("card")}</option>
                  <option value="bank_transfer">{t("bankTransfer")}</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">{t("notesOptional")}</Label>
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
                <h4 className="font-medium mb-2">{t("recentPayments")}</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedCustomerPayments.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3 h-3" />
                        <span>{formatCurrency(Number(payment.amount ?? 0))}</span>
                        <Badge variant="outline" className="text-xs">
                          {payment.paymentMethod === "bank_transfer"
                            ? t("bankTransfer")
                            : t(payment.paymentMethod as "cash" | "card")}
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
              {t("cancel")}
            </Button>
            <Button onClick={handleRecordPayment} disabled={recordPaymentMutation.isPending}>
              {t("recordPayment")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}