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

interface LeafletMapProps {
  route: RouteGeometry | null;
  startCoords: Coordinates | null;
  endCoords: Coordinates | null;
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

function FitBoundsHandler({ route }: { route: RouteGeometry | null }) {
  const map = useMap();

  useEffect(() => {
    if (route && map) {
      try {
        // Create proper GeoJSON Feature object
        const geoJsonFeature: GeoJSON.Feature<GeoJSON.LineString> = {
          type: "Feature",
          properties: {},
          geometry: route,
        };

        const bounds = L.geoJSON(geoJsonFeature).getBounds();

        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch (error) {
        console.error("Error fitting bounds:", error);
      }
    }
  }, [route, map]);

  return null;
}

export default function LeafletMap({
  route,
  startCoords,
  endCoords,
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

  // Choose tile layer based on theme
  const tileUrl = isDarkTheme
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const tileAttribution = isDarkTheme
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const routeColor = isDarkTheme ? "#4A90E2" : "#003366";

  return (
    <div
      key={mapId.current}
      className="h-full w-full overflow-hidden rounded-lg"
      style={{ filter: isDarkTheme ? "brightness(1.3)" : "none" }}
    >
      <MapContainer
        center={[3.139, 101.6869]} // Kuala Lumpur
        zoom={10}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer attribution={tileAttribution} url={tileUrl} />

        <MapClickHandler onMapClick={onMapClick} />
        <FitBoundsHandler route={route} />

        {/* Route polyline */}
        {routePositions.length > 0 && (
          <Polyline
            positions={routePositions}
            color={routeColor}
            weight={4}
            opacity={0.7}
          />
        )}

        {/* Start marker */}
        {startCoords && (
          <Marker position={[startCoords.lat, startCoords.lon]} />
        )}

        {/* End marker */}
        {endCoords && <Marker position={[endCoords.lat, endCoords.lon]} />}
      </MapContainer>
    </div>
  );
}
