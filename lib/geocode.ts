import { BOOKING } from "./booking-config";
import { haversineMiles } from "./pricing";

/**
 * Estimates driving miles from Oakwood, OH to an address using the free U.S.
 * Census geocoder (no API key). Returns null if the address can't be matched —
 * the delivery fee is then confirmed by hand in the admin.
 */
export async function estimateDeliveryMiles(address: string, city: string, state: string, zip: string): Promise<number | null> {
  const oneLine = [address, city, state, zip].filter((s) => s && s.trim()).join(", ");
  if (!address.trim() || oneLine.length < 8) return null;
  const url =
    "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?benchmark=Public_AR_Current&format=json&address=" +
    encodeURIComponent(oneLine);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      result?: { addressMatches?: { coordinates?: { x: number; y: number } }[] };
    };
    const coords = data.result?.addressMatches?.[0]?.coordinates;
    if (!coords || typeof coords.x !== "number" || typeof coords.y !== "number") return null;
    const d = BOOKING.delivery;
    const straight = haversineMiles(d.originLat, d.originLng, coords.y, coords.x);
    return Math.round(straight * d.roadFactor * 10) / 10;
  } catch {
    return null;
  }
}
