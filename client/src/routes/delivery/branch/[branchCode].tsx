import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoiYXppejk5eCIsImEiOiJjbWVhaGI0aWMwcXE2MmxyMzJoZW9nNmtqIn0.3foR7U7xVLa5V03-nI3new";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductGrid } from "@/components/product-grid";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus } from "lucide-react";

interface LocationPickerProps {
  lat: number;
  lng: number;
  onChange: (coords: { lat: number; lng: number }) => void;
}

function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const map = new mapboxgl.Map({
      container: ref.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [lng, lat],
      zoom: 14,
    });
    const marker = new mapboxgl.Marker({ draggable: true })
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

    if ("geolocation" in navigator) {
      const control = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      });
      map.addControl(control);
    }

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
  const [mode, setMode] = useState<"choose" | "cart" | "schedule">("choose");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [dropoffTime, setDropoffTime] = useState("");
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const { toast } = useToast();

  const { cartItems, addToCart, updateQuantity, getCartSummary } = useCart();

  const handleUseCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser does not support geolocation.",
        variant: "destructive",
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => {
        toast({
          title: "Unable to retrieve location",
          description: "Please enable location access or enter it manually.",
          variant: "destructive",
        });
      },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode !== "cart") return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch("/delivery/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchCode,
          customerName,
          customerPhone,
          address,
          pickupTime,
          dropoffTime,
          dropoffLat: lat,
          dropoffLng: lng,
          items: cartItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to submit order");
      }
      setSubmitted(true);
    } catch (error: any) {
      const message = error?.message || "Failed to submit order";
      setSubmitError(message);
      toast({
        title: "Order submission failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode !== "schedule") return;
    setIsScheduling(true);
    setScheduleError(null);
    try {
      const response = await fetch("/delivery/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchCode,
          customerName,
          customerPhone,
          address,
          pickupTime,
          dropoffTime,
          dropoffLat: lat,
          dropoffLng: lng,
          scheduled: true,
          items: [],
        }),
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to schedule pickup");
      }
      setSubmitted(true);
    } catch (error: any) {
      const message = error?.message || "Failed to schedule pickup";
      setScheduleError(message);
      toast({
        title: "Scheduling failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsScheduling(false);
    }
  };

  if (submitted) {
    return <div className="p-4 text-center">Thank you! Your order has been submitted.</div>;
  }

  const cartSummary = getCartSummary();

  if (mode === "choose") {
    return (
      <div className="max-w-xl mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold text-center">Delivery Order</h1>
        <Button className="w-full" onClick={() => setMode("cart")}>Fill the cart myself</Button>
        <Button className="w-full" variant="outline" onClick={() => setMode("schedule")}>
          Schedule a visit
        </Button>
      </div>
    );
  }

  if (mode === "schedule") {
    return (
      <form onSubmit={handleSchedule} className="max-w-xl mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold text-center">Schedule Visit</h1>
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
        <Button type="submit" className="w-full" disabled={isScheduling}>
          {isScheduling ? "Scheduling..." : "Schedule Visit"}
        </Button>
        {scheduleError && <p className="text-sm text-red-500">{scheduleError}</p>}
      </form>
    );
  }

  // cart mode
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
        <Button
          type="button"
          variant="outline"
          onClick={handleUseCurrentLocation}
        >
          Use Current Location
        </Button>
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
      <div className="space-y-4">
        <Label>Products</Label>
        <ProductGrid
          onAddToCart={addToCart}
          cartItemCount={cartSummary.itemCount}
          onToggleCart={() => {}}
          branchCode={branchCode}
        />
        <div className="space-y-2">
          {cartItems.length === 0 && <div className="text-sm text-gray-500">No items selected</div>}
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <span>{item.name}</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span>{item.quantity}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          {cartItems.length > 0 && (
            <div className="text-right font-bold">Total: ${cartSummary.total.toFixed(2)}</div>
          )}
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Order"}
      </Button>
      {submitError && <p className="text-sm text-red-500">{submitError}</p>}
    </form>
  );
}
