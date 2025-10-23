import { Coordinates } from '@/types/trip';

const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][]; // [lon, lat] format
}

/**
 * Fetch a route from OSRM between two coordinates
 * Returns GeoJSON LineString geometry
 */
export async function fetchRoute(
  start: Coordinates,
  end: Coordinates
): Promise<RouteGeometry | null> {
  try {
    // OSRM expects lon,lat format
    const url = `${OSRM_URL}/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Route fetch failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry;
    }

    return null;
  } catch (error) {
    console.error('Route fetch error:', error);
    return null;
  }
}
