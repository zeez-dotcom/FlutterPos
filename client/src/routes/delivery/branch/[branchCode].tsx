import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Item {
  name: string;
  quantity: number;
  price: number;
}

interface LocationPickerProps {
  lat: number;
  lng: number;
  onChange: (coords: { lat: number; lng: number }) => void;
}

function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const map = new maplibregl.Map({
      container: ref.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [lng, lat],
      zoom: 14,
    });
    const marker = new maplibregl.Marker({ draggable: true })
      .setLngLat([lng, lat])
      .addTo(map);

    marker.on("dragend", () => {
      const { lat, lng } = marker.getLngLat();
      onChange({ lat, lng });
    });

    map.on("click", (e) => {
      marker.setLngLat(e.lngLat);
      onChange({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    markerRef.current = marker;
    mapRef.current = map;

    return () => {
      marker.remove();
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLngLat([lng, lat]);
      mapRef.current.setCenter([lng, lat]);
    }
  }, [lat, lng]);

  return <div className="w-full h-64" ref={ref} />;
}

export default function DeliveryOrderForm({ params }: { params: { branchCode: string } }) {
  const { branchCode } = params;
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [dropoffTime, setDropoffTime] = useState("");
  const [items, setItems] = useState<Item[]>([{ name: "", quantity: 1, price: 0 }]);
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const addItem = () => setItems([...items, { name: "", quantity: 1, price: 0 }]);

  const updateItem = (index: number, field: keyof Item, value: string) => {
    const updated = [...items];
    if (field === "quantity" || field === "price") {
      updated[index][field] = Number(value);
    } else {
      updated[index][field] = value;
    }
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/delivery/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        branchCode,
        customerName,
        customerPhone,
        address,
        pickupTime,
        dropoffTime,
        lat,
        lng,
        items,
      }),
    });
    setSubmitted(true);
  };

  if (submitted) {
    return <div className="p-4 text-center">Thank you! Your order has been submitted.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold text-center">Delivery Order</h1>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Location</Label>
        <LocationPicker
          lat={lat}
          lng={lng}
          onChange={({ lat, lng }) => {
            setLat(lat);
            setLng(lng);
          }}
        />
      </div>
      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          <Label htmlFor="pickup">Pickup Time</Label>
          <Input id="pickup" type="datetime-local" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="dropoff">Delivery Time</Label>
          <Input id="dropoff" type="datetime-local" value={dropoffTime} onChange={(e) => setDropoffTime(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Items</Label>
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2">
            <Input
              placeholder="Item name"
              value={item.name}
              onChange={(e) => updateItem(idx, "name", e.target.value)}
              required
            />
            <Input
              type="number"
              min={1}
              placeholder="Qty"
              className="w-20"
              value={item.quantity}
              onChange={(e) => updateItem(idx, "quantity", e.target.value)}
            />
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="Price"
              className="w-24"
              value={item.price}
              onChange={(e) => updateItem(idx, "price", e.target.value)}
            />
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addItem}>
          Add Item
        </Button>
      </div>
      <Button type="submit" className="w-full">
        Submit Order
      </Button>
    </form>
  );
}
