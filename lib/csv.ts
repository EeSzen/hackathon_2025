import Papa from "papaparse";
import { Trip, DayNight } from "@/types/trip";

const MALAYSIA_TZ = "Asia/Kuala_Lumpur";

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
      return "Day";
    }
    return "Night";
  } catch (error) {
    console.error("Error parsing date:", dateTimeString, error);
    return "Day"; // Default fallback
  }
}

/**
 * Load and parse the trip_summary.csv file
 */
export async function loadTripsFromCSV(): Promise<Trip[]> {
  try {
    const response = await fetch("/data/trip_summary.csv");
    if (!response.ok) {
      throw new Error("Failed to load CSV file");
    }

    const csvText = await response.text();
    console.log(`CSV file loaded. Size: ${csvText.length} characters`);
    console.log(`First 500 chars:`, csvText.substring(0, 500));

    return new Promise((resolve, reject) => {
      Papa.parse<any>(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<any>) => {
          try {
            console.log(`Papa Parse complete. Rows: ${results.data.length}`);
            console.log(
              `Errors: ${results.errors.length}`,
              results.errors.slice(0, 5)
            );

            const trips: Trip[] = results.data.map((row: any) => {
              // Compute derived fields
              const time_taken_minutes = (row.duration_hr || 0) * 60;
              const dayNight = computeDayNight(row.start_time);

              // Calculate fuel efficiency if missing
              let fuel_efficiency_kmpl = row.fuel_efficiency_kmpl;
              if (
                !fuel_efficiency_kmpl &&
                row.distance_km &&
                row.fuel_used_litre &&
                row.fuel_used_litre > 0
              ) {
                fuel_efficiency_kmpl = row.distance_km / row.fuel_used_litre;
              }

              return {
                vehicle_id: row.vehicle_id || "",
                start_time: row.start_time || "",
                end_time: row.end_time || "",
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
                start_key: row.start_key || "",
                end_key: row.end_key || "",
                route_id: row.route_id,
                time_taken_minutes,
                dayNight,
              };
            });

            // Calculate reliability scores for each vehicle
            const vehicleScores = new Map<string, number>();
            const uniqueVehicles = [...new Set(trips.map((t) => t.vehicle_id))];

            uniqueVehicles.forEach((vehicleId) => {
              const score = calculateVehicleScore(vehicleId, trips);
              vehicleScores.set(vehicleId, score);
            });

            // Attach scores to trips
            const tripsWithScores = trips.map((trip) => ({
              ...trip,
              reliability_score: vehicleScores.get(trip.vehicle_id) || 0,
            }));

            resolve(tripsWithScores);
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
    console.error("Error loading CSV:", error);
    throw error;
  }
}

/**
 * Calculate sustainability score for a specific vehicle based on all its trips
 *
 * REVISED SCORING to prevent "Excellent" ratings for questionable data:
 * 1. Fuel Efficiency (40%) - km per liter (realistic 1.5-6 km/L range)
 * 2. Time Efficiency (30%) - penalize excessively long trips heavily
 * 3. Consistency (20%) - reliable performance across trips
 * 4. Experience (10%) - number of similar trips completed
 *
 * Returns a score from 0-10 for easy interpretation
 */
export function calculateVehicleScore(
  vehicleId: string,
  allTrips: Trip[]
): number {
  // Get all valid trips for this vehicle
  const vehicleTrips = allTrips.filter(
    (t) => t.vehicle_id === vehicleId && isValidTrip(t)
  );

  // Need at least 1 trip, but score increases with more trips
  if (vehicleTrips.length === 0) {
    return 0;
  }

  const trip_count = vehicleTrips.length;

  // Calculate averages
  const avg_fuel_efficiency =
    vehicleTrips.reduce((sum, t) => sum + (t.fuel_efficiency_kmpl || 0), 0) /
    trip_count;
  const avg_time_taken =
    vehicleTrips.reduce((sum, t) => sum + (t.duration_hr || 0), 0) / trip_count;

  // Calculate average speed across all trips
  const avg_speed =
    vehicleTrips.reduce((sum, t) => sum + (t.avg_speed_kmh || 0), 0) /
    trip_count;

  // Calculate standard deviation of fuel efficiency (consistency measure)
  const variance =
    vehicleTrips.reduce((sum, t) => {
      return (
        sum + Math.pow((t.fuel_efficiency_kmpl || 0) - avg_fuel_efficiency, 2)
      );
    }, 0) / trip_count;
  const std_fuel_efficiency = Math.sqrt(variance);

  // Consistency factor: lower std deviation = higher consistency
  // For single trips, assume perfect consistency
  const consistency_factor =
    trip_count === 1
      ? 1
      : 1 / (std_fuel_efficiency / Math.max(avg_fuel_efficiency, 0.1) + 0.5);

  // Experience weight: gradually increase confidence with more trips
  // Single trip gets some credit, but multiple trips get full weight
  // 1 trip = 0.3, 2 trips = 0.5, 3 trips = 0.7, 5+ trips = 1.0
  const experience_weight = Math.min(1, 0.2 + trip_count * 0.16);

  // Fuel efficiency score: normalize based on REALISTIC truck values
  // The scale is designed so most trucks score in the 40-70 range
  // Only exceptional performance gets 80+
  //
  // Score distribution:
  // 6.0 km/L = 100 (Exceptional - top 5%)
  // 5.0 km/L = 70  (Good - top 25%)
  // 4.0 km/L = 50  (Average - middle 50%)
  // 3.0 km/L = 30  (Below average - bottom 25%)
  // 2.0 km/L = 10  (Poor)
  //
  // Formula: exponential curve that's harder to score high
  let fuel_score;

  // SAFETY CHECK: If avg efficiency is unrealistic (>8 km/L), heavily penalize
  if (avg_fuel_efficiency > 8) {
    // This shouldn't happen with filters, but just in case
    // Treat as data corruption - score near zero
    fuel_score = 5;
  } else if (avg_fuel_efficiency >= 6) {
    fuel_score = 100;
  } else if (avg_fuel_efficiency >= 5) {
    // 5-6 km/L: 70-100 (linear)
    fuel_score = 70 + (avg_fuel_efficiency - 5) * 30;
  } else if (avg_fuel_efficiency >= 4) {
    // 4-5 km/L: 50-70 (linear)
    fuel_score = 50 + (avg_fuel_efficiency - 4) * 20;
  } else if (avg_fuel_efficiency >= 3) {
    // 3-4 km/L: 30-50 (linear)
    fuel_score = 30 + (avg_fuel_efficiency - 3) * 20;
  } else if (avg_fuel_efficiency >= 2) {
    // 2-3 km/L: 10-30 (linear)
    fuel_score = 10 + (avg_fuel_efficiency - 2) * 20;
  } else {
    // < 2 km/L: 0-10
    fuel_score = Math.max(0, avg_fuel_efficiency * 5);
  }

  // Time efficiency score: HEAVILY penalize long durations
  // Good trips: < 3 hours = 90+
  // Acceptable: 3-5 hours = 70-90
  // Questionable: 5-8 hours = 40-70
  // Poor: > 8 hours = 0-40
  let time_score;
  if (avg_time_taken < 3) {
    time_score = 90 + (3 - avg_time_taken) * 3.3; // Max 100
  } else if (avg_time_taken < 5) {
    time_score = 70 + (5 - avg_time_taken) * 10; // 70-90
  } else if (avg_time_taken < 8) {
    time_score = 40 + (8 - avg_time_taken) * 10; // 40-70
  } else {
    time_score = Math.max(0, 40 - (avg_time_taken - 8) * 5); // 0-40
  }

  // Speed penalty: Very low average speeds (<15 km/h) indicate issues
  let speed_penalty = 1.0;
  if (avg_speed < 15) {
    speed_penalty = avg_speed / 15; // Reduce score proportionally
  }

  // Combined score with weights:
  // - 40% fuel efficiency
  // - 30% time efficiency
  // - 20% consistency
  // - 10% experience (trip count)
  const weighted_score =
    (fuel_score * 0.4 +
      time_score * 0.3 +
      consistency_factor * 100 * 0.2 +
      experience_weight * 100 * 0.1) *
    speed_penalty;

  // Ensure score is between 0-100, then scale to 0-10
  const normalized_score = Math.max(0, Math.min(100, weighted_score));
  const final_score = normalized_score / 10;

  return Math.round(final_score * 10) / 10; // Round to 1 decimal place
}

/**
 * Check if a trip has valid data for display and analysis
 *
 * This function permanently filters out weird and unusual data to clean the table.
 *
 * STRICT FILTERS FOR REALISTIC TRUCK DATA:
 * 1. Remove: Zero distance (parked vehicles)
 * 2. Remove: Distance < 1 km (not meaningful trips)
 * 3. Remove: Duration = 0 (impossible)
 * 4. Remove: Invalid GPS coordinates (0,0) or outside Malaysia
 * 5. Remove: Negative fuel consumption
 * 6. Remove: Long durations with very low speed (>5hrs AND <10km/h = parking)
 * 7. Remove: Unreasonably large distances (> 500 km in one trip)
 * 8. Remove: Stationary "trips" (same location for >30 min)
 * 9. Remove: Very low average speeds (< 5 km/h = traffic/parking)
 * 10. Remove: Unrealistic fuel efficiency (< 1 km/L or > 8 km/L for heavy trucks)
 * 11. Remove: Extreme durations (> 12 hours for single trip)
 * 12. Remove: Unrealistic high speeds (> 100 km/h for trucks)
 * 13. Remove: Efficiency/Distance mismatch (distance/duration ratio checks)
 */
export function isValidTrip(trip: Trip): boolean {
  // Filter 1: Remove zero distance (parked vehicles)
  if (trip.distance_km === 0) {
    return false;
  }

  // Filter 2: Remove distance < 1 km (increased from 0.5 to be stricter)
  if (trip.distance_km < 1) {
    return false;
  }

  // Filter 3: Remove duration = 0 (impossible)
  if (trip.duration_hr === 0) {
    return false;
  }

  // Filter 4: Remove invalid GPS coordinates
  // Malaysia is roughly between lat 0.5-7.5, lon 99-120
  // (0,0) indicates GPS error
  if (
    (trip.start_lat === 0 && trip.start_lon === 0) ||
    (trip.end_lat === 0 && trip.end_lon === 0) ||
    trip.start_lat < 0.5 ||
    trip.start_lat > 7.5 ||
    trip.end_lat < 0.5 ||
    trip.end_lat > 7.5 ||
    trip.start_lon < 99 ||
    trip.start_lon > 120 ||
    trip.end_lon < 99 ||
    trip.end_lon > 120
  ) {
    return false;
  }

  // Filter 5: Remove negative fuel consumption
  if (trip.fuel_used_litre < 0) {
    return false;
  }

  // Filter 6: Remove long durations with very low speeds
  // Example: 17 hours for 191km = 11 km/h (likely includes long stops/parking)
  // If duration > 5 hours AND average speed < 10 km/h, it's not a clean trip
  if (trip.duration_hr > 5 && trip.avg_speed_kmh < 10) {
    return false;
  }

  // Filter 7: Remove unreasonably large distances
  // Most truck trips in Malaysia are < 500km, longer trips often have issues
  if (trip.distance_km > 500) {
    return false;
  }

  // Filter 8: Remove stationary "trips" (same GPS coordinates)
  // If start and end are within ~0.01 degrees (~1km) AND duration > 30 min
  const latDiff = Math.abs(trip.start_lat - trip.end_lat);
  const lonDiff = Math.abs(trip.start_lon - trip.end_lon);
  if (latDiff < 0.01 && lonDiff < 0.01 && trip.duration_hr > 0.5) {
    return false;
  }

  // Filter 9: Remove very low average speeds
  // < 5 km/h average = heavy traffic or parking, not normal driving
  if (trip.avg_speed_kmh < 5) {
    return false;
  }

  // Filter 10: Remove unrealistic fuel efficiency
  // Heavy trucks in Malaysia: typically 1.5 - 5 km/L
  // Light trucks: 3 - 7 km/L
  // Maximum 8 km/L for light trucks, minimum 1 km/L
  // Anything above 8 km/L is data error (like 62 km/L!)
  if (trip.fuel_efficiency_kmpl < 1 || trip.fuel_efficiency_kmpl > 8) {
    return false;
  }

  // Filter 11: Remove extreme durations
  // Single trips shouldn't exceed 12 hours (drivers need rest)
  // Anything longer likely includes overnight parking
  if (trip.duration_hr > 12) {
    return false;
  }

  // Filter 12: Remove unrealistic high speeds
  // Trucks typically don't exceed 90-100 km/h, use 100 as upper bound
  if (trip.avg_speed_kmh > 100) {
    return false;
  }

  // Filter 13: Check distance/duration ratio for reasonableness
  // Calculate effective speed (should match avg_speed_kmh roughly)
  const calculated_speed = trip.distance_km / trip.duration_hr;
  // If there's a large discrepancy, data is suspicious
  // Allow 20% tolerance for calculation differences
  if (
    Math.abs(calculated_speed - trip.avg_speed_kmh) / trip.avg_speed_kmh >
    0.3
  ) {
    return false;
  }

  return true;
}

/**
 * Filter trips by day/night and optional start/end text search
 * Also filters out invalid data using isValidTrip()
 */
export function filterTrips(
  trips: Trip[],
  dayNight: DayNight,
  startText?: string,
  endText?: string
): Trip[] {
  return trips.filter((trip) => {
    // Filter out invalid data
    if (!isValidTrip(trip)) {
      return false;
    }

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
 * Compute top 3 suggested vehicles using a sustainability-weighted scoring system.
 *
 * This approach solves the "experience vs efficiency" dilemma:
 * - Driver A: Did route 10 times with slightly above average efficiency
 * - Driver B: Did route 1 time with excellent efficiency
 *
 * Solution: Score considers both efficiency AND experience
 * - 40% Fuel Efficiency
 * - 30% Time Efficiency
 * - 20% Consistency (rewarding reliable performance)
 * - 10% Experience (rewarding multiple successful trips)
 *
 * This ensures:
 * - Single amazing trips get partial credit
 * - Consistent performers with experience rank higher
 * - Only valid trips (passing isValidTrip) are considered
 */
export function computeSuggestedVehicles(trips: Trip[]): string[] {
  // Group trips by vehicle and calculate statistics
  const vehicleTripsMap = new Map<string, Trip[]>();

  // Filter out invalid trips (using isValidTrip which now has comprehensive cleaning)
  trips.forEach((trip) => {
    if (isValidTrip(trip)) {
      const vehicleTrips = vehicleTripsMap.get(trip.vehicle_id) || [];
      vehicleTrips.push(trip);
      vehicleTripsMap.set(trip.vehicle_id, vehicleTrips);
    }
  });

  // Calculate statistics for each vehicle (no minimum trip requirement)
  const vehicleStats = Array.from(vehicleTripsMap.entries()).map(
    ([vehicle_id, vehicleTrips]) => {
      const trip_count = vehicleTrips.length;

      // Calculate averages
      const avg_fuel_efficiency =
        vehicleTrips.reduce(
          (sum, t) => sum + (t.fuel_efficiency_kmpl || 0),
          0
        ) / trip_count;
      const avg_time_taken =
        vehicleTrips.reduce((sum, t) => sum + (t.duration_hr || 0), 0) /
        trip_count;

      // Calculate standard deviation of fuel efficiency
      const variance =
        vehicleTrips.reduce((sum, t) => {
          return (
            sum +
            Math.pow((t.fuel_efficiency_kmpl || 0) - avg_fuel_efficiency, 2)
          );
        }, 0) / trip_count;
      const std_fuel_efficiency = Math.sqrt(variance);

      // Consistency factor: single trips get perfect consistency
      const consistency_factor =
        trip_count === 1
          ? 1
          : 1 /
            (std_fuel_efficiency / Math.max(avg_fuel_efficiency, 0.1) + 0.5);

      // Experience weight: increases with trip count
      // 1 trip = 0.3, 2 trips = 0.5, 5+ trips = 1.0
      const experience_weight = Math.min(1, 0.2 + trip_count * 0.16);

      // Combined efficiency metric
      const efficiency_per_time =
        avg_fuel_efficiency / Math.max(avg_time_taken, 0.1);

      // Sustainability score
      const sustainability_score =
        efficiency_per_time * consistency_factor * experience_weight;

      return {
        vehicle_id,
        trip_count,
        avg_fuel_efficiency,
        avg_time_taken,
        std_fuel_efficiency,
        sustainability_score,
      };
    }
  );

  // Sort by sustainability score (descending)
  const sortedVehicles = vehicleStats.sort(
    (a, b) => b.sustainability_score - a.sustainability_score
  );

  // Return top 3 vehicle IDs
  return sortedVehicles.slice(0, 3).map((stats) => stats.vehicle_id);
}
