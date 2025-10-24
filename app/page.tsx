"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Trip, DayNight, Coordinates } from "@/types/trip";
import {
  loadTripsFromCSV,
  filterTrips,
  computeSuggestedVehicles,
} from "@/lib/csv";
import { geocodeLocation } from "@/lib/geocode";
import { fetchRoute, RouteGeometry } from "@/lib/route";
import SearchBar from "@/components/controls/SearchBar";
import SuggestedHeader from "@/components/filters/SuggestedHeader";
import DayNightCards from "@/components/summary/DayNightCards";
import TripsTable from "@/components/table/TripsTable";
import SummaryCard from "@/components/summary/SummaryCard";

// Dynamic import for LeafletMap (client-only)
const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center border rounded-lg bg-gray-50">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

export default function Dashboard() {
  // State management
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [dayNight, setDayNight] = useState<DayNight>("Day");

  // Track confirmed search values (only updated after search button click)
  const [confirmedStartInput, setConfirmedStartInput] = useState("");
  const [confirmedEndInput, setConfirmedEndInput] = useState("");

  const [startCoords, setStartCoords] = useState<Coordinates | null>(null);
  const [endCoords, setEndCoords] = useState<Coordinates | null>(null);
  const [route, setRoute] = useState<RouteGeometry | null>(null);

  // Table-clicked trip route (separate from search route)
  const [tripRoute, setTripRoute] = useState<RouteGeometry | null>(null);
  const [tripStartCoords, setTripStartCoords] = useState<Coordinates | null>(
    null
  );
  const [tripEndCoords, setTripEndCoords] = useState<Coordinates | null>(null);

  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [clickCount, setClickCount] = useState(0);

  // Load CSV data on mount
  useEffect(() => {
    loadTripsFromCSV()
      .then((data) => {
        console.log(`Loaded ${data.length} trips from CSV`);
        console.log(`Sample trip:`, data[0]);
        setTrips(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load trips:", err);
        setError(
          "Failed to load trip data. Please ensure trip_summary.csv is in public/data/"
        );
        setLoading(false);
      });
  }, []);

  // Compute filtered trips and sort by reliability score (highest first)
  const filteredTrips = useMemo(() => {
    // Show filtered/cleaned data by default (with day/night filter, but no location filter)
    // Only apply location filtering when search has been executed
    let filtered;
    if (!confirmedStartInput.trim() || !confirmedEndInput.trim()) {
      // Default: show cleaned data filtered by day/night only
      filtered = filterTrips(trips, dayNight);
    } else {
      // After search: apply location filters too
      filtered = filterTrips(
        trips,
        dayNight,
        confirmedStartInput,
        confirmedEndInput
      );
      console.log(`Filtered trips: ${filtered.length} for ${dayNight} period`);
    }

    // Sort by reliability score (descending), then by date (most recent first)
    return filtered.sort((a, b) => {
      const scoreA = a.reliability_score || 0;
      const scoreB = b.reliability_score || 0;

      // Primary sort: reliability score (higher is better)
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      // Secondary sort: date (more recent first)
      return (
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      );
    });
  }, [trips, dayNight, confirmedStartInput, confirmedEndInput]);

  // Compute suggestions for Day and Night
  const daySuggestions = useMemo(() => {
    // Only compute suggestions when both confirmed inputs are filled
    if (!confirmedStartInput.trim() || !confirmedEndInput.trim()) {
      return [];
    }

    const dayTrips = filterTrips(
      trips,
      "Day",
      confirmedStartInput,
      confirmedEndInput
    );
    return computeSuggestedVehicles(dayTrips);
  }, [trips, confirmedStartInput, confirmedEndInput]);

  const nightSuggestions = useMemo(() => {
    // Only compute suggestions when both confirmed inputs are filled
    if (!confirmedStartInput.trim() || !confirmedEndInput.trim()) {
      return [];
    }

    const nightTrips = filterTrips(
      trips,
      "Night",
      confirmedStartInput,
      confirmedEndInput
    );
    return computeSuggestedVehicles(nightTrips);
  }, [trips, confirmedStartInput, confirmedEndInput]);

  // Update selected trip when filtered trips change
  useEffect(() => {
    if (filteredTrips.length > 0 && !selectedTrip) {
      setSelectedTrip(filteredTrips[0]);
    } else if (filteredTrips.length === 0) {
      setSelectedTrip(null);
    }
  }, [filteredTrips, selectedTrip]);

  // Auto-load the first trip's route when filtered trips change or on initial load
  useEffect(() => {
    const loadFirstTripRoute = async () => {
      if (filteredTrips.length > 0) {
        const firstTrip = filteredTrips[0];

        // Create coordinates from trip data
        const tripStart: Coordinates = {
          lat: firstTrip.start_lat,
          lon: firstTrip.start_lon,
        };
        const tripEnd: Coordinates = {
          lat: firstTrip.end_lat,
          lon: firstTrip.end_lon,
        };

        setTripStartCoords(tripStart);
        setTripEndCoords(tripEnd);

        // Fetch route for the first trip
        try {
          const routeData = await fetchRoute(tripStart, tripEnd);
          if (routeData) {
            setTripRoute(routeData);
          }
        } catch (err) {
          console.error("Error fetching first trip route:", err);
        }
      }
    };

    loadFirstTripRoute();
  }, [filteredTrips]);

  // Handle search
  const handleSearch = async () => {
    if (!startInput.trim() || !endInput.trim()) {
      alert("Please enter both starting and ending points");
      return;
    }

    try {
      // Geocode both inputs
      const [start, end] = await Promise.all([
        geocodeLocation(startInput),
        geocodeLocation(endInput),
      ]);

      if (!start) {
        alert(`Could not find location: ${startInput}`);
        return;
      }

      if (!end) {
        alert(`Could not find location: ${endInput}`);
        return;
      }

      setStartCoords(start);
      setEndCoords(end);

      // Update confirmed inputs to trigger table and suggestions refresh
      setConfirmedStartInput(startInput);
      setConfirmedEndInput(endInput);

      // Fetch route
      const routeData = await fetchRoute(start, end);
      if (routeData) {
        setRoute(routeData);
      } else {
        alert("Could not compute route between the two points");
      }
    } catch (err) {
      console.error("Search error:", err);
      alert("An error occurred during search");
    }
  };

  // Handle map clicks (first click = start, second = end)
  const handleMapClick = async (coords: Coordinates) => {
    if (clickCount === 0) {
      // First click - set start
      setStartCoords(coords);
      setStartInput(`${coords.lat.toFixed(3)}, ${coords.lon.toFixed(3)}`);
      setClickCount(1);
    } else {
      // Second click - set end and fetch route
      setEndCoords(coords);
      setEndInput(`${coords.lat.toFixed(3)}, ${coords.lon.toFixed(3)}`);
      setClickCount(0);

      if (startCoords) {
        const routeData = await fetchRoute(startCoords, coords);
        if (routeData) {
          setRoute(routeData);
        }
      }
    }
  };

  // Handle day/night change
  const handleDayNightChange = (value: DayNight) => {
    setDayNight(value);
  };

  // Handle trip selection from table - fetch route for the trip
  const handleTripSelect = async (trip: Trip) => {
    setSelectedTrip(trip);

    // Create coordinates from trip data
    const tripStart: Coordinates = { lat: trip.start_lat, lon: trip.start_lon };
    const tripEnd: Coordinates = { lat: trip.end_lat, lon: trip.end_lon };

    setTripStartCoords(tripStart);
    setTripEndCoords(tripEnd);

    // Fetch route for the trip
    try {
      const routeData = await fetchRoute(tripStart, tripEnd);
      if (routeData) {
        setTripRoute(routeData);
      } else {
        console.warn("Could not fetch route for trip");
        setTripRoute(null);
      }
    } catch (err) {
      console.error("Error fetching trip route:", err);
      setTripRoute(null);
    }
  };

  // Handle clear inputs
  const handleClear = () => {
    setStartInput("");
    setEndInput("");
    setConfirmedStartInput("");
    setConfirmedEndInput("");
    setStartCoords(null);
    setEndCoords(null);
    setRoute(null);
    setClickCount(0);
  };

  // Get vehicle ID for summary card
  const vehicleId =
    selectedTrip?.vehicle_id || filteredTrips[0]?.vehicle_id || "N/A";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-600">Loading trip data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">{error}</p>
          <p className="text-gray-600">
            Please check the console for more details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="bg-white py-4 px-6 border-b border-gray-300/50">
        <img
          src="/safetruck-logo.png"
          alt="SafeTruck"
          className="h-[50px] mx-4"
        />
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex flex-col lg:flex-row w-full h-full">
          {/* Left Panel - 2/3 */}
          <div className="lg:w-2/3 p-6 overflow-y-auto bg-white">
            <SearchBar
              startInput={startInput}
              endInput={endInput}
              onStartChange={setStartInput}
              onEndChange={setEndInput}
              onSearch={handleSearch}
              onClear={handleClear}
            />

            <SuggestedHeader
              dayNight={dayNight}
              onDayNightChange={handleDayNightChange}
            />

            <DayNightCards
              daySuggestions={daySuggestions}
              nightSuggestions={nightSuggestions}
            />

            <TripsTable
              trips={filteredTrips}
              selectedTrip={selectedTrip}
              onTripSelect={handleTripSelect}
            />
          </div>

          {/* Right Panel - 1/3 */}
          <div className="lg:w-1/3 bg-white flex flex-col border-t lg:border-t-0 lg:border-l border-gray-300/50">
            <SummaryCard dayNight={dayNight} vehicleId={vehicleId} />

            <div className="m-5 h-[70vh]">
              <LeafletMap
                route={route}
                startCoords={startCoords}
                endCoords={endCoords}
                tripRoute={tripRoute}
                tripStartCoords={tripStartCoords}
                tripEndCoords={tripEndCoords}
                onMapClick={handleMapClick}
                isDarkTheme={dayNight === "Night"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
