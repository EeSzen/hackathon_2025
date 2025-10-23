import { DayNight } from '@/types/trip';

interface SuggestedHeaderProps {
  dayNight: DayNight;
  onDayNightChange: (value: DayNight) => void;
}

export default function SuggestedHeader({
  dayNight,
  onDayNightChange,
}: SuggestedHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-semibold">Suggested Vehicles:</h2>
      <select
        value={dayNight}
        onChange={(e) => onDayNightChange(e.target.value as DayNight)}
        className="px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Select day or night"
      >
        <option value="Day">Day</option>
        <option value="Night">Night</option>
      </select>
    </div>
  );
}
