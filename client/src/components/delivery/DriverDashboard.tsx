import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useAuthContext } from "../../context/AuthContext";
import DriverMap from "./DriverMap";

interface DeliveryOrder {
  orderId: string;
  status: string;
  order?: { orderNumber: string; status?: string };
}

export default function DriverDashboard() {
  const { user } = useAuthContext();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [items, setItems] = useState<Record<string, { name: string; quantity: number; price: number }[]>>({});
  const orderWsRef = useRef<WebSocket | null>(null);
  const orderIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    const res = await fetch("/api/delivery/orders");
    if (res.ok) {
      setOrders(await res.json());
    }
  };

  // Real-time orders via WebSocket with polling fallback
  useEffect(() => {
    load();
    orderIntervalRef.current = setInterval(load, 5000);

    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${window.location.host}/ws/delivery-orders`);
    orderWsRef.current = ws;

    ws.onopen = () => {
      if (orderIntervalRef.current) {
        clearInterval(orderIntervalRef.current);
        orderIntervalRef.current = null;
      }
    };

    ws.onmessage = () => {
      load();
    };

    ws.onclose = () => {
      if (!orderIntervalRef.current) {
        orderIntervalRef.current = setInterval(load, 5000);
      }
    };

    ws.onerror = () => ws.close();

    return () => {
      if (orderIntervalRef.current) clearInterval(orderIntervalRef.current);
      orderWsRef.current?.close();
    };
  }, []);

  // Stream GPS to server
  useEffect(() => {
    if (!user) return;
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${window.location.host}/ws/driver-location`);
    let watchId: number | null = null;
    ws.onopen = () => {
      if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition((pos) => {
          const coords = {
            driverId: user.id,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setPosition({ lat: coords.lat, lng: coords.lng });
          ws.send(JSON.stringify(coords));
        });
      }
    };
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      ws.close();
    };
  }, [user]);

  const update = async (orderId: string, status: string) => {
    await fetch("/api/delivery/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    await load();
  };

  const addItem = (orderId: string) => {
    setItems((prev) => ({
      ...prev,
      [orderId]: [...(prev[orderId] || []), { name: "", quantity: 1, price: 0 }],
    }));
  };

  const updateItem = (
    orderId: string,
    index: number,
    field: "name" | "quantity" | "price",
    value: string,
  ) => {
    setItems((prev) => {
      const list = [...(prev[orderId] || [])];
      const item = { ...list[index], [field]: field === "name" ? value : Number(value) };
      list[index] = item;
      return { ...prev, [orderId]: list };
    });
  };

  const finalize = async (orderId: string) => {
    await fetch("/api/delivery/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, items: items[orderId] || [] }),
    });
    await load();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Driver Dashboard</h2>
      {position && <DriverMap lat={position.lat} lng={position.lng} />}
      <ul className="space-y-2">
        {orders.map((o) => (
          <li key={o.orderId} className="border p-2 space-y-2">
            <span className="font-semibold">
              {o.order?.orderNumber || o.orderId} - {o.status}
            </span>
            {o.order?.status === "scheduled" ? (
              <div className="space-y-2">
                {(items[o.orderId] || []).map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      placeholder="Item"
                      value={item.name}
                      onChange={(e) => updateItem(o.orderId, idx, "name", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      className="w-16"
                      value={item.quantity}
                      onChange={(e) => updateItem(o.orderId, idx, "quantity", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      className="w-24"
                      value={item.price}
                      onChange={(e) => updateItem(o.orderId, idx, "price", e.target.value)}
                    />
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button type="button" onClick={() => addItem(o.orderId)}>
                    Add Item
                  </Button>
                  <Button type="button" onClick={() => finalize(o.orderId)}>
                    Finalize
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button onClick={() => update(o.orderId, "in_transit")}>In Transit</Button>
                <Button onClick={() => update(o.orderId, "delivered")}>Delivered</Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
