import { DayNight } from '@/types/trip';

interface SummaryCardProps {
  dayNight: DayNight;
  vehicleId: string;
}

export default function SummaryCard({ dayNight, vehicleId }: SummaryCardProps) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm mb-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Period:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            dayNight === 'Day' 
              ? 'bg-amber-100 text-amber-800' 
              : 'bg-indigo-100 text-indigo-800'
          }`}>
            {dayNight}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Vehicle ID:</span>
          <span className="text-sm font-semibold text-gray-900">
            {vehicleId || 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}
