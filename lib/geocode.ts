import { Coordinates } from "@/types/trip";

// Well-known Malaysian locations mapping
const LOCATION_MAP: Record<string, Coordinates> = {
  // Major cities
  "kuala lumpur": { lat: 3.139, lon: 101.6869 },
  kl: { lat: 3.139, lon: 101.6869 },
  penang: { lat: 5.4164, lon: 100.3327 },
  "george town": { lat: 5.4164, lon: 100.3327 },
  georgetown: { lat: 5.4164, lon: 100.3327 },
  ipoh: { lat: 4.5975, lon: 101.0901 },
  "johor bahru": { lat: 1.4927, lon: 103.7414 },
  jb: { lat: 1.4927, lon: 103.7414 },
  melaka: { lat: 2.1896, lon: 102.2501 },
  malacca: { lat: 2.1896, lon: 102.2501 },
  seremban: { lat: 2.7258, lon: 101.9424 },
  "shah alam": { lat: 3.0733, lon: 101.5185 },
  "petaling jaya": { lat: 3.1073, lon: 101.6067 },
  pj: { lat: 3.1073, lon: 101.6067 },
  "subang jaya": { lat: 3.0436, lon: 101.5872 },
  klang: { lat: 3.0333, lon: 101.45 },
  putrajaya: { lat: 2.9264, lon: 101.6964 },
  cyberjaya: { lat: 2.9213, lon: 101.6559 },
  "kota kinabalu": { lat: 5.9804, lon: 116.0735 },
  kuching: { lat: 1.5535, lon: 110.3593 },
  "alor setar": { lat: 6.1248, lon: 100.3678 },
  "kota bharu": { lat: 6.1256, lon: 102.2381 },
  kuantan: { lat: 3.8077, lon: 103.326 },
  butterworth: { lat: 5.4141, lon: 100.3639 },
  taiping: { lat: 4.85, lon: 100.7333 },

  // Highways & Routes
  "plus highway": { lat: 3.5, lon: 101.5 },
  nkve: { lat: 3.2, lon: 101.55 },
  "elite highway": { lat: 2.8, lon: 101.6 },
  kesas: { lat: 3.0, lon: 101.5 },

  // Ports
  "port klang": { lat: 3.0044, lon: 101.3925 },
  "port dickson": { lat: 2.5208, lon: 101.7971 },
  "penang port": { lat: 5.4241, lon: 100.3478 },
  "johor port": { lat: 1.4341, lon: 103.6683 },
};

/**
 * Geocode a location string to coordinates
 * First tries local mapping, then falls back to Nominatim API
 */
export async function geocodeLocation(
  location: string
): Promise<Coordinates | null> {
  const normalized = location.trim().toLowerCase();

  // Try local mapping first
  for (const [key, coords] of Object.entries(LOCATION_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }

  // Check if it's already in coordinate format (e.g., "3.139, 101.687")
  const coordMatch = location.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
  if (coordMatch) {
    return {
      lat: parseFloat(coordMatch[1]),
      lon: parseFloat(coordMatch[2]),
    };
  }

  // Fallback to Nominatim geocoding API (OpenStreetMap)
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      location + ", Malaysia"
    )}&limit=1`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error("Geocoding API error:", response.status);
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

/**
 * Get a human-readable location name from coordinates
 * Uses reverse geocoding API
 */
export async function reverseGeocode(
  coords: Coordinates
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}`;

    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data && data.display_name) {
      return data.display_name;
    }

    return null;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}
