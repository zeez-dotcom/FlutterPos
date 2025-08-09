import { useEffect, useState } from "react";
import { Button } from "../ui/button";

interface DeliveryOrder {
  orderId: string;
  driverId: string | null;
  status: string;
  order?: { orderNumber: string };
}

export default function DispatcherDashboard() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);

  const load = async () => {
    const res = await fetch("/api/delivery/orders");
    if (res.ok) {
      setOrders(await res.json());
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const assign = async (orderId: string, driverId: string) => {
    await fetch("/api/delivery/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, driverId }),
    });
    await load();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Dispatcher Dashboard</h2>
      <ul className="space-y-2">
        {orders.map((o) => (
          <li key={o.orderId} className="flex items-center gap-2">
            <span className="flex-1">
              {o.order?.orderNumber || o.orderId} - {o.status} - {o.driverId || "Unassigned"}
            </span>
            <Button
              onClick={() => {
                const id = window.prompt("Driver ID");
                if (id) assign(o.orderId, id);
              }}
            >
              Assign
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
