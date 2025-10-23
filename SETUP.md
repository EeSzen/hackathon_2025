# SafeTruck Dashboard - Setup Instructions

## Prerequisites

Before running the project, you need to install the npm packages. Since script execution is disabled on your system, you'll need to run the installation manually.

## Installation Steps

### Option 1: Using PowerShell with Execution Policy Bypass

Open PowerShell in the project directory and run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
cd safetruck-hackathon
npm install
```

### Option 2: Using Command Prompt

Open Command Prompt (cmd.exe) instead of PowerShell and run:

```cmd
cd safetruck-hackathon
npm install
```

### Option 3: Manual Installation via Node.js Command Prompt

1. Open "Node.js command prompt" from your Start menu
2. Navigate to the project:
   ```
   cd s:\Hackathon2025\SafeTruck2025\safetruck-hackathon
   ```
3. Run:
   ```
   npm install
   ```

## Running the Development Server

After installation, start the development server:

### Using Command Prompt:

```cmd
cd safetruck-hackathon
npm run dev
```

### Using PowerShell with Bypass:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
cd safetruck-hackathon
npm run dev
```

The application will be available at: **http://localhost:3000**

## Project Structure

```
safetruck-hackathon/
├── app/
│   ├── layout.tsx          # Root layout with Leaflet CSS
│   ├── page.tsx            # Main dashboard page
│   └── globals.css         # Global styles
├── components/
│   ├── controls/
│   │   └── SearchBar.tsx   # Search inputs and button
│   ├── filters/
│   │   └── SuggestedHeader.tsx  # Day/Night selector
│   ├── map/
│   │   └── LeafletMap.tsx  # Interactive map component
│   ├── summary/
│   │   ├── DayNightCards.tsx    # Suggestion cards
│   │   └── SummaryCard.tsx      # Vehicle info card
│   └── table/
│       └── TripsTable.tsx  # Trip data table
├── lib/
│   ├── csv.ts              # CSV parsing and filtering
│   ├── geocode.ts          # Nominatim geocoding
│   └── route.ts            # OSRM routing
├── types/
│   └── trip.ts             # TypeScript type definitions
└── public/
    └── data/
        └── trip_summary.csv  # Trip data (ALREADY COPIED)
```

## Features Implemented

### ✅ Data Loading & Parsing

- CSV file loaded from `public/data/trip_summary.csv`
- Automatic computation of Day/Night based on Malaysia timezone (Asia/Kuala_Lumpur)
- Day: 06:00-17:59, Night: 18:00-05:59

### ✅ Search Functionality

- Free-text location search using Nominatim geocoding
- Automatic route calculation via OSRM
- Table filtering by start/end location (case-insensitive contains match)

### ✅ Map Interactions

- Click-based route planning (first click = start, second click = end)
- Auto-route calculation after second click
- Route polyline display with start/end markers

### ✅ Filtering & Suggestions

- Day/Night filter toggle
- Top 3 vehicle suggestions by fuel efficiency
- Real-time table filtering based on Day/Night and search criteria

### ✅ UI Components

- 2/3 - 1/3 responsive layout
- Search bar with "to" separator and right-aligned button
- Suggested vehicles cards (Day and Night)
- Scrollable trips table with selection
- Summary card showing current period and selected vehicle
- Interactive Leaflet map with OSM tiles

## Usage Guide

### 1. Basic Search

1. Enter a starting location (e.g., "Kuala Lumpur")
2. Enter an ending location (e.g., "Penang")
3. Click "Search" button
4. View the route on the map and filtered trips in the table

### 2. Map-Based Route Planning

1. Click anywhere on the map to set starting point
2. Click again to set ending point
3. Route automatically calculates and displays

### 3. Filter by Day/Night

- Use the dropdown in the "Suggested Vehicles" section
- Toggle between Day and Night to see different trip sets
- Suggestions update automatically

### 4. View Trip Details

- Click any row in the trips table to select it
- Selected trip's vehicle ID appears in the summary card
- Table shows: Vehicle ID, Date, Time Taken, Distance, Fuel Used

## Troubleshooting

### If packages didn't install:

The package.json has been updated with all dependencies. You need to run `npm install` using one of the methods above.

### If the CSV file is missing:

The file has already been copied to `safetruck-hackathon/public/data/trip_summary.csv`. Verify it exists at this location.

### If the map doesn't load:

- Check browser console for errors
- Ensure Leaflet CSS is loading (check Network tab)
- The map uses client-side rendering only (SSR disabled)

### If geocoding fails:

- Nominatim has usage limits
- Try more specific location names
- Check your internet connection

## Next Steps

To start using the dashboard:

1. Install dependencies (see Installation Steps above)
2. Run `npm run dev`
3. Open http://localhost:3000 in your browser
4. Start exploring routes and vehicle suggestions!
