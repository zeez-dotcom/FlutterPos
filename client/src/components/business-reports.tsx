import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Transaction, Order, Customer, Payment } from "@shared/schema";
import { DollarSign, TrendingUp, Users, Package, Calendar, CreditCard } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { useCurrency } from "@/lib/currency";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

type ReportPeriod = "today" | "week" | "month" | "all";

export function BusinessReports() {
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("today");
  const { formatCurrency } = useCurrency();
  const { branch } = useAuth();

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 30000,
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
    refetchInterval: 30000,
  });

  const { data: laundryServices = [] } = useQuery<any[]>({
    queryKey: ["/api/laundry-services"],
    refetchInterval: 60000, // Refresh every minute
  });

  const isLoading = transactionsLoading || ordersLoading || customersLoading || paymentsLoading;

  const getDateRange = (period: ReportPeriod) => {
    const now = new Date();
    switch (period) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "week":
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "all":
        return { start: new Date(0), end: now };
    }
  };

  const filterByPeriod = (items: any[], dateField: string = "createdAt") => {
    if (reportPeriod === "all") return items;

    const { start, end } = getDateRange(reportPeriod);
    return items.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= start && itemDate <= end;
    });
  };
  const filterByBranch = (items: any[]) => {
    if (!branch?.id) return items;
    return items.filter(item => item.branchId === branch.id);
  };

  const filteredTransactions = filterByBranch(filterByPeriod(transactions));
  const filteredOrders = filterByBranch(filterByPeriod(orders));
  const filteredPayments = filterByBranch(filterByPeriod(payments));

  // Calculate metrics
  const totalTransactionRevenue = filteredTransactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
  const immediateOrderRevenue = filteredOrders
    .filter(o => o.paymentMethod !== 'pay_later')
    .reduce((sum, o) => sum + parseFloat(o.total), 0);
  const totalPaymentsReceived = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const totalRevenue = totalTransactionRevenue + totalPaymentsReceived + immediateOrderRevenue;
  
  const totalOrders = filteredOrders.length;
  const completedOrders = filteredOrders.filter(o => o.status === 'completed').length;
  const pendingOrders = filteredOrders.filter(o => ['received', 'processing', 'washing', 'drying'].includes(o.status)).length;
  const readyOrders = filteredOrders.filter(o => o.status === 'ready').length;

  const filteredCustomers = filterByBranch(customers);
  const totalOutstanding = filteredCustomers.reduce((sum, c) => sum + parseFloat(c.balanceDue), 0);
  const activeCustomers = filteredCustomers.filter(c => c.isActive).length;

  const handleExportPDF = () => {
    const { start, end } = getDateRange(reportPeriod);
    const doc = new jsPDF();
    doc.text("Business Report", 14, 16);
    doc.text(`Branch: ${branch?.name || "All"}`, 14, 24);
    doc.text(`Period: ${format(start, "MMM dd, yyyy")} - ${format(end, "MMM dd, yyyy")}`, 14, 32);
    const metrics = [
      ["Revenue", formatCurrency(totalRevenue)],
      ["Outstanding", formatCurrency(totalOutstanding)],
      ["Active Orders", String(pendingOrders + readyOrders)],
      ["Completed Orders", String(completedOrders)],
      ["Total Orders", String(totalOrders)],
    ];
    let y = 40;
    metrics.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 14, y);
      y += 8;
    });
    doc.save("business_report.pdf");
  };

  const handleExportExcel = () => {
    const { start, end } = getDateRange(reportPeriod);
    const data = [
      { metric: "Branch", value: branch?.name || "All" },
      {
        metric: "Period",
        value: `${format(start, "yyyy-MM-dd")} - ${format(end, "yyyy-MM-dd")}`,
      },
      { metric: "Revenue", value: totalRevenue },
      { metric: "Outstanding", value: totalOutstanding },
      { metric: "Active Orders", value: pendingOrders + readyOrders },
      { metric: "Completed Orders", value: completedOrders },
      { metric: "Total Orders", value: totalOrders },
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Summary");
    XLSX.writeFile(workbook, "business_report.xlsx");
  };

  // Payment method breakdown
  const paymentMethodBreakdown = filteredOrders.reduce((acc, order) => {
    acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + parseFloat(order.total);
    return acc;
  }, {} as Record<string, number>);

  // Service popularity (from orders) - improved data extraction
  const servicePopularity = filteredOrders.reduce((acc, order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach((item: any) => {
      // Try multiple ways to get service name
      let serviceName = 'Unknown Service';

      if (typeof item.service === 'string') {
        serviceName = item.service;
      } else if (item.service?.name) {
        serviceName = item.service.name;
      } else if (item.serviceName) {
        serviceName = item.serviceName;
      } else if (item.serviceId && laundryServices.length > 0) {
        // Look up service by ID
        const service = laundryServices.find(s => s.id === item.serviceId);
        if (service) serviceName = service.name;
      } else if (item.name && item.name.includes('(') && item.name.includes(')')) {
        // Extract service from item name like "Shirt (Wash & Fold)"
        const match = item.name.match(/\(([^)]+)\)/);
        if (match) serviceName = match[1];
      }
      
      // Filter out "Unknown Service" entries for cleaner display
      if (serviceName !== 'Unknown Service') {
        acc[serviceName] = (acc[serviceName] || 0) + (item.quantity || 1);
      }
    });
    return acc;
  }, {} as Record<string, number>);

  const topServices = Object.entries(servicePopularity)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5);

  // Average order value
  const avgOrderValue = totalOrders > 0 ? immediateOrderRevenue / totalOrders : 0;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 flex-shrink-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Business Reports</h2>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Live Data
            </Badge>
            <Select value={reportPeriod} onValueChange={(value: ReportPeriod) => setReportPeriod(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              Export Excel
            </Button>
          </div>
        </div>

        {/* Key Metrics - Streamlined */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-xl font-bold">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-gray-500">{totalOrders} orders</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Outstanding</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
              <p className="text-xs text-gray-500">Pay later</p>
            </div>
            <CreditCard className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Orders</p>
              <p className="text-xl font-bold">{pendingOrders + readyOrders}</p>
              <p className="text-xs text-gray-500">{readyOrders} ready</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Customers</p>
              <p className="text-xl font-bold">{activeCustomers}</p>
              <p className="text-xs text-gray-500">Avg: {formatCurrency(avgOrderValue)}</p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Streamlined Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Order Status */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Order Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Completed</span>
              <Badge className="bg-green-100 text-green-800">{completedOrders}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Ready</span>
              <Badge className="bg-blue-100 text-blue-800">{readyOrders}</Badge>
            </div>
            <div className="flex justify-between">
              <span>In Progress</span>
              <Badge className="bg-yellow-100 text-yellow-800">{pendingOrders}</Badge>
            </div>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Payment Methods</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(paymentMethodBreakdown).slice(0, 3).map(([method, amount]) => (
              <div key={method} className="flex justify-between">
                <span className="capitalize">{method.replace('_', ' ')}</span>
                <span className="font-medium">{formatCurrency(amount as number)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Services */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Popular Services</h3>
          <div className="space-y-2 text-sm">
            {topServices.length > 0 ? (
              topServices.slice(0, 3).map(([service, count]) => (
                <div key={service} className="flex justify-between items-center">
                  <span className="truncate flex-1 pr-2">{service}</span>
                  <Badge variant="secondary" className="text-xs">{count as number} orders</Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No service data available</p>
                <p className="text-xs text-gray-400">Complete some orders to see popular services</p>
              </div>
            )}
          </div>
        </Card>
      </div>
      </div>
    </div>
  );
}
