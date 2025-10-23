"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L, { LeafletMouseEvent } from "leaflet";
import { Coordinates } from "@/types/trip";
import { RouteGeometry } from "@/lib/route";

// Fix for default marker icons in Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

// Custom marker icons with different colors
const createColoredIcon = (color: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.4 12.5 28.5 12.5 28.5S25 20.9 25 12.5C25 5.6 19.4 0 12.5 0z" 
              fill="${color}" stroke="#fff" stroke-width="2"/>
        <circle cx="12.5" cy="12.5" r="4" fill="#fff"/>
      </svg>
    `,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

// Define marker colors
const primaryMarkerIcon = createColoredIcon("#003366"); // Primary color (dark blue)
const secondaryMarkerIcon = createColoredIcon("#4A90E2"); // Secondary color (light blue)
const redMarkerIcon = createColoredIcon("#DC2626"); // Red for search end
const grayMarkerIcon = createColoredIcon("#6B7280"); // Gray for trip start
const darkGrayMarkerIcon = createColoredIcon("#374151"); // Dark gray for trip end

interface LeafletMapProps {
  route: RouteGeometry | null;
  startCoords: Coordinates | null;
  endCoords: Coordinates | null;
  tripRoute?: RouteGeometry | null;
  tripStartCoords?: Coordinates | null;
  tripEndCoords?: Coordinates | null;
  onMapClick: (coords: Coordinates) => void;
  isDarkTheme?: boolean;
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (coords: Coordinates) => void;
}) {
  useMapEvents({
    click: (e: LeafletMouseEvent) => {
      onMapClick({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}

function FitBoundsHandler({
  route,
  tripRoute,
}: {
  route: RouteGeometry | null;
  tripRoute?: RouteGeometry | null;
}) {
  const map = useMap();

  useEffect(() => {
    // Prioritize tripRoute if it exists, otherwise use search route
    const activeRoute = tripRoute || route;

    if (activeRoute && map) {
      try {
        // Create proper GeoJSON Feature object
        const geoJsonFeature: GeoJSON.Feature<GeoJSON.LineString> = {
          type: "Feature",
          properties: {},
          geometry: activeRoute,
        };

        const bounds = L.geoJSON(geoJsonFeature).getBounds();

        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch (error) {
        console.error("Error fitting bounds:", error);
      }
    }
  }, [route, tripRoute, map]);

  return null;
}

export default function LeafletMap({
  route,
  startCoords,
  endCoords,
  tripRoute,
  tripStartCoords,
  tripEndCoords,
  onMapClick,
  isDarkTheme = false,
}: LeafletMapProps) {
  // Generate a unique key to force remount and avoid "already initialized" error
  // This is necessary because React 19 Strict Mode double-mounts components
  const mapId = useRef(`map-${Date.now()}-${Math.random()}`);

  // Convert route coordinates from [lon, lat] to [lat, lon] for Leaflet
  const routePositions: [number, number][] = route
    ? route.coordinates.map(([lon, lat]) => [lat, lon])
    : [];

  // Convert trip route coordinates from [lon, lat] to [lat, lon] for Leaflet
  const tripRoutePositions: [number, number][] = tripRoute
    ? tripRoute.coordinates.map(([lon, lat]) => [lat, lon])
    : [];

  // Choose tile layer based on theme
  const tileUrl = isDarkTheme
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const tileAttribution = isDarkTheme
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  // Colors for routes
  const searchRouteColor = isDarkTheme ? "#4A90E2" : "#4A90E2"; // Secondary color (light blue)
  const tripRouteColor = "#4B5563"; // Darker gray for table-clicked routes

  return (
    <div
      key={mapId.current}
      className="h-full w-full overflow-hidden rounded-lg"
      style={{ filter: isDarkTheme ? "brightness(1.3)" : "none" }}
    >
      <MapContainer
        center={[3.139, 101.6869]} // Kuala Lumpur
        zoom={7}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer attribution={tileAttribution} url={tileUrl} />

        <MapClickHandler onMapClick={onMapClick} />
        <FitBoundsHandler route={route} tripRoute={tripRoute} />

        {/* Search route polyline (solid line with secondary color) */}
        {routePositions.length > 0 && (
          <Polyline
            positions={routePositions}
            color={searchRouteColor}
            weight={4}
            opacity={0.7}
          />
        )}

        {/* Table-clicked trip route polyline (solid dark gray line, read-only) */}
        {tripRoutePositions.length > 0 && (
          <Polyline
            positions={tripRoutePositions}
            color={tripRouteColor}
            weight={4}
            opacity={0.7}
            interactive={false}
          />
        )}

        {/* Search start marker (secondary color) */}
        {startCoords && (
          <Marker
            position={[startCoords.lat, startCoords.lon]}
            icon={secondaryMarkerIcon}
          />
        )}

        {/* Search end marker (red) */}
        {endCoords && (
          <Marker
            position={[endCoords.lat, endCoords.lon]}
            icon={redMarkerIcon}
          />
        )}

        {/* Trip start marker (gray) */}
        {tripStartCoords && (
          <Marker
            position={[tripStartCoords.lat, tripStartCoords.lon]}
            icon={grayMarkerIcon}
          />
        )}

        {/* Trip end marker (dark gray) */}
        {tripEndCoords && (
          <Marker
            position={[tripEndCoords.lat, tripEndCoords.lon]}
            icon={darkGrayMarkerIcon}
          />
        )}
      </MapContainer>
    </div>
  );
}
