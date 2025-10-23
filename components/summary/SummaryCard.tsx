import { DayNight } from "@/types/trip";

interface SummaryCardProps {
  dayNight: DayNight;
  vehicleId: string;
}

export default function SummaryCard({ dayNight, vehicleId }: SummaryCardProps) {
  // Function to remove .csv from vehicle ID (UI only)
  const cleanVehicleId = (id: string): string => {
    return id.replace(/\.csv$/i, "");
  };

  return (
    <div className="border-b border-gray-300 p-4 bg-white">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-base font-medium text-gray-600">Period:</span>
          <span
            className={`px-3 py-1 rounded-lg text-base font-semibold ${
              dayNight === "Day"
                ? "bg-gradient-to-r from-blue-100 to-blue-200 text-[#003366]"
                : "bg-gradient-to-r from-slate-700 to-slate-800 text-white"
            }`}
          >
            {dayNight === "Day" ? "☀️ Day" : "🌙 Night"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-base font-medium text-gray-600">
            Vehicle ID:
          </span>
          <span className="text-base font-semibold text-[#003366]">
            {vehicleId ? cleanVehicleId(vehicleId) : "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
}
