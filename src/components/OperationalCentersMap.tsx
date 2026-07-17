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

type CenterType = "municipal" | "donaciones" | "reparacion" | "punto_verde";

export interface OperationalCenterPoint {
  id: string;
  name: string;
  type: CenterType;
  address: string;
  latitude: number;
  longitude: number;
  color: string;
}

interface OperationalCentersMapProps {
  centers: OperationalCenterPoint[];
  selectedCenterId: string;
}

function createCenterIcon(color: string, isSelected: boolean) {
  const ringColor = isSelected ? "#0f172a" : "#ffffff";
  const size = isSelected ? 30 : 24;
  const anchor = size / 2;

  return divIcon({
    className: "operational-center-map-marker",
    iconSize: [size, size],
    iconAnchor: [anchor, anchor],
    popupAnchor: [0, -anchor],
    html: `
      <span
        style="
          display:flex;
          height:${size}px;
          width:${size}px;
          align-items:center;
          justify-content:center;
          border-radius:9999px;
          border:4px solid ${ringColor};
          background:${color};
          box-shadow:0 14px 28px rgba(15, 23, 42, 0.18);
          transition:transform 120ms ease;
        "
      >
        <span
          style="
            display:block;
            height:7px;
            width:7px;
            border-radius:9999px;
            background:#ffffff;
          "
        ></span>
      </span>
    `,
  });
}

function FitOperationalMap({
  centers,
  selectedCenterId,
}: {
  centers: OperationalCenterPoint[];
  selectedCenterId: string;
}) {
  const map = useMap();

  useEffect(() => {
    if (centers.length === 0) {
      return;
    }

    const selectedCenter = centers.find((center) => center.id === selectedCenterId);

    if (selectedCenter) {
      map.setView([selectedCenter.latitude, selectedCenter.longitude], 14, {
        animate: true,
      });
      return;
    }

    const bounds = latLngBounds(
      centers.map((center) => [center.latitude, center.longitude] as [number, number]),
    );

    map.fitBounds(bounds, {
      padding: [40, 40],
      animate: false,
    });
  }, [centers, map, selectedCenterId]);

  return null;
}

export default function OperationalCentersMap({
  centers,
  selectedCenterId,
}: OperationalCentersMapProps) {
  const selectedCenter = centers.find((center) => center.id === selectedCenterId);
  const initialCenter = selectedCenter ?? centers[0];

  const markers = useMemo(
    () =>
      centers.map((center) => ({
        ...center,
        icon: createCenterIcon(center.color, center.id === selectedCenterId),
      })),
    [centers, selectedCenterId],
  );

  if (!initialCenter) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        No hay centros disponibles para mostrar.
      </div>
    );
  }

  return (
    <MapContainer
      center={[initialCenter.latitude, initialCenter.longitude]}
      zoom={12}
      scrollWheelZoom={false}
      zoomControl={false}
      className="h-full w-full"
    >
      <FitOperationalMap
        centers={centers}
        selectedCenterId={selectedCenterId}
      />
      <ZoomControl position="topright" />
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {markers.map((center) => (
        <Marker
          key={center.id}
          position={[center.latitude, center.longitude]}
          icon={center.icon}
        >
          <Popup>
            <strong>{center.name}</strong>
            <br />
            {center.address}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
