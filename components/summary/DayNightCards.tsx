interface DayNightCardsProps {
  daySuggestions: string[];
  nightSuggestions: string[];
}

export default function DayNightCards({
  daySuggestions,
  nightSuggestions,
}: DayNightCardsProps) {
  // Function to remove .csv from vehicle names (UI only)
  const cleanVehicleName = (name: string): string => {
    return name.replace(/\.csv$/i, "");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 w-full md:w-[65%]">
      <div className="border border-[#4A90E2] rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span className="font-semibold text-[#003366] flex items-center gap-1">
            <span>☀️</span>
            <span>Day:</span>
          </span>
          <span className="text-[#003366]">
            {daySuggestions.length > 0
              ? cleanVehicleName(daySuggestions[0])
              : "No suggestions available"}
          </span>
        </div>
      </div>
      <div className="border border-[#003366] rounded-lg p-4 bg-gradient-to-br from-slate-700 to-slate-800 shadow-sm">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-white flex items-center gap-1">
            <span>🌙</span>
            <span>Night:</span>
          </span>
          <span className="text-blue-100">
            {nightSuggestions.length > 0
              ? cleanVehicleName(nightSuggestions[0])
              : "No suggestions available"}
          </span>
        </div>
      </div>
    </div>
  );
}
