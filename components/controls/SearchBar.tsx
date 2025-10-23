interface SearchBarProps {
  startInput: string;
  endInput: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onSearch: () => void;
}

export default function SearchBar({
  startInput,
  endInput,
  onStartChange,
  onEndChange,
  onSearch,
}: SearchBarProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <input
        type="text"
        value={startInput}
        onChange={(e) => onStartChange(e.target.value)}
        placeholder="Starting point"
        className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Starting point"
      />
      <span className="text-gray-600">to</span>
      <input
        type="text"
        value={endInput}
        onChange={(e) => onEndChange(e.target.value)}
        placeholder="Ending point"
        className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Ending point"
      />
      <button
        onClick={onSearch}
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        aria-label="Search"
      >
        Search
      </button>
    </div>
  );
}
