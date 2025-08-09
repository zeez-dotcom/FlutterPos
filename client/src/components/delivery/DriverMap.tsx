import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface Props {
  lat: number;
  lng: number;
}

export default function DriverMap({ lat, lng }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const map = new maplibregl.Map({
      container: ref.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [lng, lat],
      zoom: 14,
    });
    const marker = new maplibregl.Marker().setLngLat([lng, lat]).addTo(map);
    return () => {
      marker.remove();
      map.remove();
    };
  }, [lat, lng]);

  return <div className="w-full h-64" ref={ref} />;
}
