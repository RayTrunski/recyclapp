"use client";

import { useEffect, useMemo } from "react";
import { divIcon, latLngBounds } from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  ZoomControl,
  useMap,
} from "react-leaflet";

type MapPoint = {
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  tone: "snapshot" | "latest";
};

interface SharedLocationMapProps {
  snapshotPoint: MapPoint;
  latestPoint?: MapPoint | null;
}

function createMarkerIcon(tone: MapPoint["tone"]) {
  const palette =
    tone === "snapshot"
      ? {
          ring: "#a7f3d0",
          fill: "#059669",
          dot: "#ecfdf5",
        }
      : {
          ring: "#cbd5e1",
          fill: "#0f172a",
          dot: "#f8fafc",
        };

  return divIcon({
    className: "shared-location-map-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -10],
    html: `
      <span
        style="
          display:flex;
          height:24px;
          width:24px;
          align-items:center;
          justify-content:center;
          border-radius:9999px;
          border:4px solid ${palette.ring};
          background:${palette.fill};
          box-shadow:0 10px 24px rgba(15, 23, 42, 0.18);
        "
      >
        <span
          style="
            display:block;
            height:6px;
            width:6px;
            border-radius:9999px;
            background:${palette.dot};
          "
        ></span>
      </span>
    `,
  });
}

const snapshotIcon = createMarkerIcon("snapshot");
const latestIcon = createMarkerIcon("latest");

function FitMapToPoints({ points }: { points: MapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    const positions = points.map(
      (point) => [point.latitude, point.longitude] as [number, number],
    );

    if (positions.length === 1) {
      map.setView(positions[0], 15, { animate: false });
      return;
    }

    map.fitBounds(latLngBounds(positions), {
      padding: [36, 36],
      animate: false,
    });
  }, [map, points]);

  return null;
}

export default function SharedLocationMap({
  snapshotPoint,
  latestPoint,
}: SharedLocationMapProps) {
  const points = useMemo(() => {
    return latestPoint ? [snapshotPoint, latestPoint] : [snapshotPoint];
  }, [latestPoint, snapshotPoint]);

  return (
    <MapContainer
      center={[snapshotPoint.latitude, snapshotPoint.longitude]}
      zoom={15}
      scrollWheelZoom={false}
      zoomControl={false}
      className="h-full w-full"
    >
      <FitMapToPoints points={points} />
      <ZoomControl position="topright" />
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker
        position={[snapshotPoint.latitude, snapshotPoint.longitude]}
        icon={snapshotIcon}
      >
        <Popup>
          <strong>{snapshotPoint.title}</strong>
          <br />
          {snapshotPoint.description}
        </Popup>
      </Marker>

      {latestPoint && (
        <Marker
          position={[latestPoint.latitude, latestPoint.longitude]}
          icon={latestIcon}
        >
          <Popup>
            <strong>{latestPoint.title}</strong>
            <br />
            {latestPoint.description}
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
