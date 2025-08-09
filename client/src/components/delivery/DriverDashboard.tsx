import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useAuthContext } from "../../context/AuthContext";
import DriverMap from "./DriverMap";

interface DeliveryOrder {
  orderId: string;
  status: string;
  order?: { orderNumber: string };
}

export default function DriverDashboard() {
  const { user } = useAuthContext();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);

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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Driver Dashboard</h2>
      {position && <DriverMap lat={position.lat} lng={position.lng} />}
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
