import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Button } from "../ui/button";
import { useAuthContext } from "../../context/AuthContext";

interface DeliveryOrder {
  orderId: string;
  driverId: string | null;
  status: string;
  order?: { orderNumber: string };
}

interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
  timestamp: string;
}

export default function DispatcherDashboard() {
  const { branch } = useAuthContext();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const orderWsRef = useRef<WebSocket | null>(null);
  const orderIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadOrders = async () => {
    const res = await fetch("/api/delivery/orders");
    if (res.ok) {
      setOrders(await res.json());
    }
  };

  const loadDrivers = async () => {
    const res = await fetch("/api/delivery/driver-locations");
    if (res.ok) {
      setDrivers(await res.json());
    }
  };

  // Poll driver locations continuously
  useEffect(() => {
    loadDrivers();
    const driverId = setInterval(loadDrivers, 5000);
    return () => clearInterval(driverId);
  }, []);

  // Real-time orders via WebSocket with polling fallback
  useEffect(() => {
    loadOrders();
    orderIntervalRef.current = setInterval(loadOrders, 5000);

    const connect = () => {
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
        loadOrders();
      };

      ws.onclose = () => {
        if (!orderIntervalRef.current) {
          orderIntervalRef.current = setInterval(loadOrders, 5000);
        }
      };

      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      if (orderIntervalRef.current) clearInterval(orderIntervalRef.current);
      orderWsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;
    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [0, 0],
      zoom: 2,
    });
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    drivers.forEach((d) => {
      const marker = new maplibregl.Marker({
        color: d.driverId === selectedDriver ? "#ef4444" : "#3b82f6",
      })
        .setLngLat([d.lng, d.lat])
        .addTo(mapRef.current!);
      marker.getElement().addEventListener("click", () => setSelectedDriver(d.driverId));
      markersRef.current.push(marker);
    });
  }, [drivers, selectedDriver]);

  const assign = async (orderId: string, driverId: string) => {
    await fetch("/api/delivery/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, driverId }),
    });
    await loadOrders();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Dispatcher Dashboard</h2>
      <div ref={mapContainerRef} className="h-64 w-full" />
      <div>Selected Driver: {selectedDriver || "None"}</div>
      <Button
        disabled={!branch?.code}
        onClick={() => branch?.code && window.open(`/delivery/branch/${branch.code}`, "_blank")}
      >
        Open Customer Form
      </Button>
      <ul className="space-y-2">
        {orders.map((o) => (
          <li key={o.orderId} className="flex items-center gap-2">
            <span className="flex-1">
              {o.order?.orderNumber || o.orderId} - {o.status} - {o.driverId || "Unassigned"}
            </span>
            <Button
              disabled={!selectedDriver}
              onClick={() => selectedDriver && assign(o.orderId, selectedDriver)}
            >
              Assign Selected Driver
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
