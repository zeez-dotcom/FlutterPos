import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoiYXppejk5eCIsImEiOiJjbWVhaGI0aWMwcXE2MmxyMzJoZW9nNmtqIn0.3foR7U7xVLa5V03-nI3new";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ProductGrid } from "@/components/product-grid";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { List, Minus, Plus, ShoppingCart, Calendar, MapPin } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

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
  const { t, language } = useTranslation();
  const isMobile = useIsMobile();

  const { cartItems, addToCart, updateQuantity, getCartSummary } = useCart();

  const handleUseCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      toast({
        title: t.geolocationNotSupported,
        description: t.geolocationNotSupportedDescription,
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
          title: t.unableToRetrieveLocation,
          description: t.enableLocationAccess,
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
        throw new Error(message || t.failedToSubmitOrder);
      }
      setSubmitted(true);
    } catch (error: any) {
      const message = error?.message || t.failedToSubmitOrder;
      setSubmitError(message);
      toast({
        title: t.orderSubmissionFailed,
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
        throw new Error(message || t.failedToSchedulePickup);
      }
      setSubmitted(true);
    } catch (error: any) {
      const message = error?.message || t.failedToSchedulePickup;
      setScheduleError(message);
      toast({
        title: t.schedulingFailed,
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsScheduling(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-4 text-center" dir={language === "ar" ? "rtl" : "ltr"}>
        {t.orderSubmitted}
      </div>
    );
  }

  const cartSummary = getCartSummary();

  return (
    <Tabs
      value={mode}
      onValueChange={(val) => setMode(val as typeof mode)}
      className="max-w-xl mx-auto p-4"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="choose" className="flex items-center gap-2">
          <List className="h-4 w-4" />
          {!isMobile && t.deliveryOrder}
        </TabsTrigger>
        <TabsTrigger value="cart" className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          {!isMobile && t.cart}
        </TabsTrigger>
        <TabsTrigger value="schedule" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {!isMobile && t.scheduleVisit}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="choose" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">{t.deliveryOrder}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full flex items-center justify-center gap-2"
              onClick={() => setMode("cart")}
            >
              <ShoppingCart className="h-4 w-4" />
              {t.fillCartMyself}
            </Button>
            <Button
              className="w-full flex items-center justify-center gap-2"
              variant="outline"
              onClick={() => setMode("schedule")}
            >
              <Calendar className="h-4 w-4" />
              {t.scheduleAVisit}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="cart" className="mt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">{t.deliveryOrder}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t.name}</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t.phoneNumber}</Label>
                <Input
                  id="phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t.address}</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t.locationLabel}</Label>
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
                  className="flex items-center gap-2"
                  onClick={handleUseCurrentLocation}
                >
                  <MapPin className="h-4 w-4" />
                  {t.useCurrentLocation}
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pickup">{t.pickupTime}</Label>
                  <Input
                    id="pickup"
                    type="datetime-local"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dropoff">{t.deliveryTime}</Label>
                  <Input
                    id="dropoff"
                    type="datetime-local"
                    value={dropoffTime}
                    onChange={(e) => setDropoffTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <Label>{t.products}</Label>
                <ProductGrid
                  onAddToCart={addToCart}
                  cartItemCount={cartSummary.itemCount}
                  onToggleCart={() => {}}
                  branchCode={branchCode}
                />
                <div className="space-y-2">
                  {cartItems.length === 0 && (
                    <div className="text-sm text-gray-500">
                      {t.noItemsSelected}
                    </div>
                  )}
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-3 items-center gap-2"
                    >
                      <span className="col-span-1">{item.name}</span>
                      <div className="col-span-1 flex items-center justify-center gap-2">
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
                      <span className="col-span-1 text-right">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {cartItems.length > 0 && (
                    <div className="text-right font-bold">
                      {t.total}: ${cartSummary.total.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t.submitting : t.submitOrder}
              </Button>
              {submitError && (
                <p className="text-sm text-red-500">{submitError}</p>
              )}
            </CardFooter>
          </Card>
        </form>
      </TabsContent>

      <TabsContent value="schedule" className="mt-4">
        <form onSubmit={handleSchedule} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">{t.scheduleVisit}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t.name}</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t.phoneNumber}</Label>
                <Input
                  id="phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t.address}</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pickup">{t.pickupTime}</Label>
                  <Input
                    id="pickup"
                    type="datetime-local"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dropoff">{t.deliveryTime}</Label>
                  <Input
                    id="dropoff"
                    type="datetime-local"
                    value={dropoffTime}
                    onChange={(e) => setDropoffTime(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button type="submit" className="w-full" disabled={isScheduling}>
                {isScheduling ? t.scheduling : t.scheduleVisit}
              </Button>
              {scheduleError && (
                <p className="text-sm text-red-500">{scheduleError}</p>
              )}
            </CardFooter>
          </Card>
        </form>
      </TabsContent>
    </Tabs>
  );
}
