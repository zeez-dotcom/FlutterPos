export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Geocode a human readable address using OpenStreetMap's Nominatim service.
 * Returns latitude/longitude or null if no result found.
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'FlutterPos/1.0 (+https://github.com/)' },
  });
  if (!res.ok) return null;
  const data: any[] = await res.json();
  if (!data || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

/**
 * Calculate Haversine distance in meters between two coordinates.
 */
export function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371000; // meters
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const aa = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
}

/**
 * Estimate route distance and duration between two coordinates. Uses the
 * OpenRouteService API when the OPENROUTESERVICE_API_KEY environment variable
 * is present, otherwise falls back to simple Haversine distance and assumes
 * an average speed of 50km/h.
 */
export async function routeDistance(
  start: Coordinates,
  end: Coordinates,
): Promise<{ distance: number; duration: number }> {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (apiKey) {
    const body = {
      coordinates: [
        [start.lng, start.lat],
        [end.lng, end.lat],
      ],
    };
    const res = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const json: any = await res.json();
      const summary = json.features?.[0]?.properties?.summary;
      if (summary) {
        return { distance: summary.distance, duration: summary.duration };
      }
    }
  }

  const distance = haversineDistance(start, end);
  const duration = distance / 13.89; // assume 50 km/h => 13.89 m/s
  return { distance, duration };
}
