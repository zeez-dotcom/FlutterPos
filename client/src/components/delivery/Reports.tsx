import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface DeliveryReport {
  driverId: string;
  driverName: string;
  deliveries: number;
  totalKilometers: number;
  totalHours: number;
}

export default function DeliveryReports() {
  const { data: report = [] } = useQuery<DeliveryReport[]>({
    queryKey: ["/api/delivery/report"],
    queryFn: async () => {
      const res = await fetch("/api/delivery/report");
      return res.json();
    },
  });

  const chartData = report.map((r) => ({
    driver: r.driverName || r.driverId,
    deliveries: r.deliveries,
  }));

  return (
    <div className="flex-1 p-6 bg-pos-background">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Delivery Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                deliveries: {
                  label: "Deliveries",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-72"
            >
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="driver" />
                <YAxis allowDecimals={false} />
                <Bar dataKey="deliveries" fill="var(--color-deliveries)" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Driver Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead className="text-right">Deliveries</TableHead>
                  <TableHead className="text-right">Kilometers</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.map((r) => (
                  <TableRow key={r.driverId}>
                    <TableCell>{r.driverName || r.driverId}</TableCell>
                    <TableCell className="text-right">{r.deliveries}</TableCell>
                    <TableCell className="text-right">
                      {r.totalKilometers.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.totalHours.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

