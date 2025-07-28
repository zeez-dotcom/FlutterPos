import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Transaction, Order, Customer, Payment } from "@shared/schema";
import { DollarSign, TrendingUp, Users, Package, Calendar, CreditCard } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

type ReportPeriod = "today" | "week" | "month" | "all";

export function BusinessReports() {
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("today");

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

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

  const filteredTransactions = filterByPeriod(transactions);
  const filteredOrders = filterByPeriod(orders);
  const filteredPayments = filterByPeriod(payments);

  // Calculate metrics
  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
  const totalOrderRevenue = filteredOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
  const totalPaymentsReceived = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  
  const totalOrders = filteredOrders.length;
  const completedOrders = filteredOrders.filter(o => o.status === 'completed').length;
  const pendingOrders = filteredOrders.filter(o => ['received', 'processing', 'washing', 'drying'].includes(o.status)).length;
  const readyOrders = filteredOrders.filter(o => o.status === 'ready').length;

  const totalOutstanding = customers.reduce((sum, c) => sum + parseFloat(c.balanceDue), 0);
  const activeCustomers = customers.filter(c => c.isActive).length;

  // Payment method breakdown
  const paymentMethodBreakdown = filteredOrders.reduce((acc, order) => {
    acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + parseFloat(order.total);
    return acc;
  }, {} as Record<string, number>);

  // Service popularity (from orders)
  const servicePopularity = filteredOrders.reduce((acc, order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach((item: any) => {
      const serviceName = item.service?.name || 'Unknown Service';
      acc[serviceName] = (acc[serviceName] || 0) + (item.quantity || 1);
    });
    return acc;
  }, {} as Record<string, number>);

  const topServices = Object.entries(servicePopularity)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5);

  // Average order value
  const avgOrderValue = totalOrders > 0 ? totalOrderRevenue / totalOrders : 0;

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Business Reports</h2>
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
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalOrderRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From {totalOrders} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</div>
            <p className="text-xs text-muted-foreground">
              Pay later balances
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders + readyOrders}</div>
            <p className="text-xs text-muted-foreground">
              {pendingOrders} in progress, {readyOrders} ready
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Avg order: {formatCurrency(avgOrderValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Current order pipeline status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Completed</span>
              <Badge variant="outline" className="bg-green-50">
                {completedOrders}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Ready for Pickup</span>
              <Badge variant="outline" className="bg-blue-50">
                {readyOrders}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>In Progress</span>
              <Badge variant="outline" className="bg-yellow-50">
                {pendingOrders}
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center font-medium">
              <span>Total Orders</span>
              <Badge>{totalOrders}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Revenue breakdown by payment type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(paymentMethodBreakdown).map(([method, amount]) => (
              <div key={method} className="flex justify-between items-center">
                <span className="capitalize">{method.replace('_', ' ')}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatCurrency(amount as number)}</span>
                  {method === 'pay_later' && (
                    <Badge variant="outline" className="text-red-600">
                      Outstanding
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Services</CardTitle>
            <CardDescription>Most requested laundry services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topServices.map(([service, count], index) => (
              <div key={service} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-6 h-6 rounded-full text-xs">
                    {index + 1}
                  </Badge>
                  <span>{service}</span>
                </div>
                <Badge variant="secondary">{count as number} items</Badge>
              </div>
            ))}
            {topServices.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No service data available for this period
              </p>
            )}
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
            <CardDescription>Period financial overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Orders Revenue</span>
              <span className="font-medium text-green-600">
                +{formatCurrency(totalOrderRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Payments Received</span>
              <span className="font-medium text-green-600">
                +{formatCurrency(totalPaymentsReceived)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Outstanding Balance</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(totalOutstanding)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center font-medium">
              <span>Net Cash Flow</span>
              <span className={`font-bold ${totalPaymentsReceived >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalPaymentsReceived)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}