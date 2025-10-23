import { DayNight } from "@/types/trip";

interface SuggestedHeaderProps {
  dayNight: DayNight;
  onDayNightChange: (value: DayNight) => void;
}

export default function SuggestedHeader({
  dayNight,
  onDayNightChange,
}: SuggestedHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-1.5 mt-[40px]">
      <h2 className="text-lg font-semibold text-[#003366]">
        Suggested Vehicles:
      </h2>
      <select
        value={dayNight}
        onChange={(e) => onDayNightChange(e.target.value as DayNight)}
        className="px-3 py-[14px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-[#4A90E2] text-[#003366] font-medium min-w-[145px]"
        aria-label="Select day or night"
      >
        <option value="Day">☀️ Day</option>
        <option value="Night">🌙 Night</option>
      </select>
    </div>
  );
}
