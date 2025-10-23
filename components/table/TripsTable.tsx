import { Trip } from '@/types/trip';

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
  if (trips.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-gray-500">
        No trips found. Try adjusting your filters.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Vehicle
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Date
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Time Taken
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Distance
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Fuel Used
              </th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip, idx) => (
              <tr
                key={idx}
                onClick={() => onTripSelect(trip)}
                className={`cursor-pointer hover:bg-gray-50 border-t ${
                  selectedTrip === trip ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-4 py-2 text-sm">{trip.vehicle_id}</td>
                <td className="px-4 py-2 text-sm">
                  {trip.start_time.split(' ')[0]}
                </td>
                <td className="px-4 py-2 text-sm">
                  {Math.round(trip.time_taken_minutes)} min
                </td>
                <td className="px-4 py-2 text-sm">
                  {trip.distance_km.toFixed(2)} km
                </td>
                <td className="px-4 py-2 text-sm">
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
