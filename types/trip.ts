export type DayNight = "Day" | "Night";

export interface Trip {
  vehicle_id: string;
  start_time: string;
  end_time: string;
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  distance_km: number;
  fuel_used_litre: number;
  duration_hr: number;
  avg_speed_kmh: number;
  fuel_efficiency_kmpl: number;
  time_of_day?: string;
  start_key: string;
  end_key: string;
  route_id?: string;
  // Derived fields
  time_taken_minutes: number;
  dayNight: DayNight;
  reliability_score?: number; // 0-100 score for vehicle reliability
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface SuggestedVehicle {
  vehicle_id: string;
  fuel_efficiency_kmpl: number;
  avg_speed_kmh: number;
  duration_hr: number;
}

export interface VehicleStats {
  vehicle_id: string;
  trip_count: number;
  avg_fuel_efficiency: number;
  avg_time_taken: number;
  avg_distance: number;
  std_fuel_efficiency: number;
  total_distance: number;
  total_fuel: number;
  reliability_score: number;
}
