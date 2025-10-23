import Papa from 'papaparse';
import { Trip, DayNight } from '@/types/trip';

const MALAYSIA_TZ = 'Asia/Kuala_Lumpur';

/**
 * Determine if a time is Day (06:00-17:59) or Night (18:00-05:59)
 * based on Malaysia timezone
 */
function computeDayNight(dateTimeString: string): DayNight {
  try {
    // Parse the datetime string as if it's in Malaysia timezone
    const date = new Date(dateTimeString);
    const hour = date.getHours();
    
    // Day: 06:00-17:59, Night: 18:00-05:59
    if (hour >= 6 && hour < 18) {
      return 'Day';
    }
    return 'Night';
  } catch (error) {
    console.error('Error parsing date:', dateTimeString, error);
    return 'Day'; // Default fallback
  }
}

/**
 * Load and parse the trip_summary.csv file
 */
export async function loadTripsFromCSV(): Promise<Trip[]> {
  try {
    const response = await fetch('/data/trip_summary.csv');
    if (!response.ok) {
      throw new Error('Failed to load CSV file');
    }
    
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse<any>(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<any>) => {
          try {
            const trips: Trip[] = results.data.map((row: any) => {
              // Compute derived fields
              const time_taken_minutes = (row.duration_hr || 0) * 60;
              const dayNight = computeDayNight(row.start_time);
              
              // Calculate fuel efficiency if missing
              let fuel_efficiency_kmpl = row.fuel_efficiency_kmpl;
              if (!fuel_efficiency_kmpl && row.distance_km && row.fuel_used_litre && row.fuel_used_litre > 0) {
                fuel_efficiency_kmpl = row.distance_km / row.fuel_used_litre;
              }
              
              return {
                vehicle_id: row.vehicle_id || '',
                start_time: row.start_time || '',
                end_time: row.end_time || '',
                start_lat: row.start_lat || 0,
                start_lon: row.start_lon || 0,
                end_lat: row.end_lat || 0,
                end_lon: row.end_lon || 0,
                distance_km: row.distance_km || 0,
                fuel_used_litre: row.fuel_used_litre || 0,
                duration_hr: row.duration_hr || 0,
                avg_speed_kmh: row.avg_speed_kmh || 0,
                fuel_efficiency_kmpl: fuel_efficiency_kmpl || 0,
                time_of_day: row.time_of_day,
                start_key: row.start_key || '',
                end_key: row.end_key || '',
                route_id: row.route_id,
                time_taken_minutes,
                dayNight,
              };
            });
            
            resolve(trips);
          } catch (error) {
            reject(error);
          }
        },
        error: (error: Error) => {
          reject(error);
        },
      });
    });
  } catch (error) {
    console.error('Error loading CSV:', error);
    throw error;
  }
}

/**
 * Filter trips by day/night and optional start/end text search
 */
export function filterTrips(
  trips: Trip[],
  dayNight: DayNight,
  startText?: string,
  endText?: string
): Trip[] {
  return trips.filter((trip) => {
    // Filter by day/night
    if (trip.dayNight !== dayNight) {
      return false;
    }
    
    // Filter by start location if provided
    if (startText && startText.trim()) {
      const normalizedStart = startText.trim().toLowerCase();
      if (!trip.start_key.toLowerCase().includes(normalizedStart)) {
        return false;
      }
    }
    
    // Filter by end location if provided
    if (endText && endText.trim()) {
      const normalizedEnd = endText.trim().toLowerCase();
      if (!trip.end_key.toLowerCase().includes(normalizedEnd)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Compute top 3 suggested vehicles by fuel efficiency
 */
export function computeSuggestedVehicles(trips: Trip[]): string[] {
  // Group by vehicle_id and find best efficiency for each
  const vehicleMap = new Map<string, Trip>();
  
  trips.forEach((trip) => {
    const existing = vehicleMap.get(trip.vehicle_id);
    if (!existing || trip.fuel_efficiency_kmpl > existing.fuel_efficiency_kmpl) {
      vehicleMap.set(trip.vehicle_id, trip);
    }
  });
  
  // Sort by efficiency (desc), then speed (desc), then duration (asc)
  const sortedVehicles = Array.from(vehicleMap.values()).sort((a, b) => {
    if (b.fuel_efficiency_kmpl !== a.fuel_efficiency_kmpl) {
      return b.fuel_efficiency_kmpl - a.fuel_efficiency_kmpl;
    }
    if (b.avg_speed_kmh !== a.avg_speed_kmh) {
      return b.avg_speed_kmh - a.avg_speed_kmh;
    }
    return a.duration_hr - b.duration_hr;
  });
  
  // Return top 3 vehicle IDs
  return sortedVehicles.slice(0, 3).map((trip) => trip.vehicle_id);
}
