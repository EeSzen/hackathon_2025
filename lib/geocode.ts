import { Coordinates } from '@/types/trip';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'SafeTruck-Hackathon/1.0';

/**
 * Geocode a location string using Nominatim
 * Respects OSM usage policy with proper User-Agent
 */
export async function geocodeLocation(query: string): Promise<Coordinates | null> {
  if (!query || !query.trim()) {
    return null;
  }

  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('q', query.trim());

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const results = await response.json();

    if (results && results.length > 0) {
      const { lat, lon } = results[0];
      return {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Debounced geocoding function
 * Returns a promise that resolves after a delay
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        resolve(func(...args));
      }, wait);
    });
  };
}
