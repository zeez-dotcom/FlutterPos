import { useEffect, useState } from "react";
import { Button } from "../ui/button";

interface DeliveryOrder {
  orderId: string;
  status: string;
  order?: { orderNumber: string };
}

export default function DriverDashboard() {
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

  const update = async (orderId: string, status: string) => {
    await fetch("/api/delivery/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    await load();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Driver Dashboard</h2>
      <ul className="space-y-2">
        {orders.map((o) => (
          <li key={o.orderId} className="flex items-center gap-2">
            <span className="flex-1">{o.order?.orderNumber || o.orderId} - {o.status}</span>
            <Button onClick={() => update(o.orderId, "in_transit")}>In Transit</Button>
            <Button onClick={() => update(o.orderId, "delivered")}>Delivered</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
