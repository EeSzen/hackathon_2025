interface DayNightCardsProps {
  daySuggestions: string[];
  nightSuggestions: string[];
}

export default function DayNightCards({
  daySuggestions,
  nightSuggestions,
}: DayNightCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="border rounded-lg p-4 bg-amber-50">
        <h3 className="font-semibold mb-2 text-amber-900">Day:</h3>
        <div className="text-sm text-gray-700">
          {daySuggestions.length > 0 ? (
            <ul className="list-disc list-inside">
              {daySuggestions.map((vehicle, idx) => (
                <li key={idx}>{vehicle}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No suggestions available</p>
          )}
        </div>
      </div>
      <div className="border rounded-lg p-4 bg-indigo-50">
        <h3 className="font-semibold mb-2 text-indigo-900">Night:</h3>
        <div className="text-sm text-gray-700">
          {nightSuggestions.length > 0 ? (
            <ul className="list-disc list-inside">
              {nightSuggestions.map((vehicle, idx) => (
                <li key={idx}>{vehicle}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No suggestions available</p>
          )}
        </div>
      </div>
    </div>
  );
}
