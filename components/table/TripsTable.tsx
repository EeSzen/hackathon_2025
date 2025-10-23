import { Trip } from "@/types/trip";

interface TripsTableProps {
  trips: Trip[];
  selectedTrip: Trip | null;
  onTripSelect: (trip: Trip) => void;
}

export default function TripsTable({
  trips,
  selectedTrip,
  onTripSelect,
}: TripsTableProps) {
  // Function to format minutes to hrs mins (UI only)
  const formatTime = (minutes: number): string => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    if (hrs === 0) {
      return `${mins} min`;
    } else if (mins === 0) {
      return `${hrs} hr`;
    } else {
      return `${hrs} hr ${mins} min`;
    }
  };

  // Function to remove .csv from vehicle_id (UI only)
  const cleanVehicleId = (vehicleId: string): string => {
    return vehicleId.replace(/\.csv$/i, "");
  };

  // Function to get color based on reliability score (0-10 scale)
  const getScoreColor = (score: number): string => {
    if (score >= 8.0) return "text-emerald-600 font-bold";
    if (score >= 7.0) return "text-green-600 font-semibold";
    if (score >= 4.0) return "text-yellow-600 font-semibold";
    if (score > 0) return "text-orange-600 font-semibold";
    return "text-gray-400";
  };

  // Function to get score label (0-10 scale)
  const getScoreLabel = (score: number): string => {
    if (score === 0) return "N/A";
    if (score >= 8.0) return `${score.toFixed(1)} - Excellent`;
    if (score >= 7.0) return `${score.toFixed(1)} - Great`;
    if (score >= 4.0) return `${score.toFixed(1)} - Good`;
    return `${score.toFixed(1)} - Fair`;
  };

  if (trips.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-gray-500">
        No trips found. Try adjusting your filters.
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-[#003366] sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                Vehicle
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                <div className="flex items-center gap-1">
                  <span>Reliability</span>
                  <span
                    className="cursor-help text-xs"
                    title="Score from 0-10 based on fuel efficiency, consistency, and trip count. 8.0+ = Excellent, 7.0-7.9 = Great, 4.0-6.9 = Good, 0.1-3.9 = Fair. Requires 3+ trips."
                  >
                    ⓘ
                  </span>
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                Date
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                Time Taken
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                Distance
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                Fuel Used
              </th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip, idx) => (
              <tr
                key={idx}
                onClick={() => onTripSelect(trip)}
                className={`cursor-pointer border-t border-gray-200 ${
                  selectedTrip === trip
                    ? "bg-[#4A90E2] bg-opacity-10 border-l-4 border-l-[#4A90E2] hover:bg-opacity-15"
                    : "hover:bg-blue-50"
                }`}
              >
                <td
                  className={`px-4 py-3 text-sm font-medium ${
                    selectedTrip === trip ? "text-white" : "text-[#003366]"
                  }`}
                >
                  {cleanVehicleId(trip.vehicle_id)}
                </td>
                <td
                  className={`px-4 py-3 text-sm ${
                    selectedTrip === trip
                      ? "text-white font-semibold"
                      : getScoreColor(trip.reliability_score || 0)
                  }`}
                >
                  {getScoreLabel(trip.reliability_score || 0)}
                </td>
                <td
                  className={`px-4 py-3 text-sm ${
                    selectedTrip === trip ? "text-white" : "text-gray-700"
                  }`}
                >
                  {trip.start_time.split(" ")[0]}
                </td>
                <td
                  className={`px-4 py-3 text-sm ${
                    selectedTrip === trip ? "text-white" : "text-gray-700"
                  }`}
                >
                  {formatTime(trip.time_taken_minutes)}
                </td>
                <td
                  className={`px-4 py-3 text-sm ${
                    selectedTrip === trip ? "text-white" : "text-gray-700"
                  }`}
                >
                  {trip.distance_km.toFixed(2)} km
                </td>
                <td
                  className={`px-4 py-3 text-sm ${
                    selectedTrip === trip ? "text-white" : "text-gray-700"
                  }`}
                >
                  {trip.fuel_used_litre.toFixed(2)} L
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
