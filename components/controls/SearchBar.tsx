interface SearchBarProps {
  startInput: string;
  endInput: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onSearch: () => void;
  onClear?: () => void;
}

export default function SearchBar({
  startInput,
  endInput,
  onStartChange,
  onEndChange,
  onSearch,
  onClear,
}: SearchBarProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3" style={{ width: "66.67%" }}>
        <input
          type="text"
          value={startInput}
          onChange={(e) => onStartChange(e.target.value)}
          placeholder="Start Destination"
          className="flex-1 px-3 py-[9px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-[#4A90E2] text-black"
          aria-label="Start Destination"
        />
        <span className="text-gray-600 font-medium italic text-[19px] mx-[5px]">
          to
        </span>
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={endInput}
            onChange={(e) => onEndChange(e.target.value)}
            placeholder="End Destination"
            className="flex-1 px-3 py-[9px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-[#4A90E2] text-black"
            aria-label="End Destination"
          />
          {onClear && (
            <button
              onClick={onClear}
              className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="Clear inputs"
              title="Clear inputs"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
      <button
        onClick={onSearch}
        className="px-6 py-[9px] bg-[#69CCE9] text-white rounded-md hover:bg-[#5AB8D5] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition-colors font-medium w-[150px]"
        aria-label="Search"
      >
        Search
      </button>
    </div>
  );
}
