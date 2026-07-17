import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  ChevronDown,
  Clock3,
  ListFilter,
  LoaderCircle,
  MapPin,
  Phone,
  Recycle,
  Search,
  Wrench,
} from "lucide-react";

import type { RepairWorkshopProfile, WasteCenter } from "../types";

const OperationalCentersMap = dynamic(() => import("./OperationalCentersMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] items-center justify-center text-sm text-slate-500">
      Cargando mapa de demo...
    </div>
  ),
});

type DemoCenter = WasteCenter & {
  latitude: number;
  longitude: number;
  color: string;
};

type RepairsApiResponse = {
  workshops?: RepairWorkshopProfile[];
  message?: string;
};

const BASE_STATIC_CENTERS: WasteCenter[] = [
  {
    id: "green-point-central",
    name: "Punto Verde Central",
    type: "punto_verde",
    address: "Av. Reforma 120, Centro",
    accepts: ["Plasticos", "Carton", "Vidrio", "Electronicos pequenos"],
    contact: "+52 55 1000 2200",
    hours: "Lun - Sab / 08:00 - 18:00",
    xRatio: 30,
    yRatio: 38,
  },
  {
    id: "donation-alameda",
    name: "Centro de Donacion La Alameda",
    type: "donaciones",
    address: "Paseo de la Alameda 300, Sur",
    accepts: ["Muebles", "Decoracion", "Articulos de oficina"],
    contact: "+52 55 1000 7733",
    hours: "Mar - Dom / 10:00 - 17:00",
    xRatio: 56,
    yRatio: 68,
  },
  {
    id: "green-point-bosque",
    name: "Punto Verde Bosque Urbano",
    type: "punto_verde",
    address: "Circuito del Bosque 15, Poniente",
    accepts: ["Plasticos", "Vidrio", "Aluminio", "Papel"],
    contact: "+52 55 1000 8840",
    hours: "Lun - Dom / 08:30 - 17:30",
    xRatio: 22,
    yRatio: 61,
  },
  {
    id: "municipal-san-pedro",
    name: "Modulo Municipal San Pedro",
    type: "municipal",
    address: "Plaza Civica 9, San Pedro",
    accepts: ["Carton", "PET", "Latas", "Pilas"],
    contact: "+52 55 1000 1901",
    hours: "Lun - Vie / 09:00 - 16:00",
    xRatio: 42,
    yRatio: 24,
  },
];

const TYPE_STYLES: Record<WasteCenter["type"], string> = {
  municipal: "bg-slate-900 text-white",
  donaciones: "bg-blue-600 text-white",
  reparacion: "bg-amber-500 text-slate-950",
  punto_verde: "bg-emerald-600 text-white",
};

const TYPE_COLORS: Record<WasteCenter["type"], string> = {
  municipal: "#0f172a",
  donaciones: "#2563eb",
  reparacion: "#f59e0b",
  punto_verde: "#059669",
};

const TYPE_LABELS: Record<WasteCenter["type"], string> = {
  municipal: "Municipal",
  donaciones: "Donaciones",
  reparacion: "Reparacion",
  punto_verde: "Punto verde",
};

const DEMO_WORKSHOP_HOURS = [
  "Lun - Vie / 09:00 - 19:00",
  "Lun - Sab / 10:00 - 18:30",
  "Mar - Sab / 09:30 - 18:00",
  "Lun - Vie / 08:30 - 17:30",
  "Mar - Dom / 11:00 - 19:00",
];

function buildStableHash(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 100000;
  }

  return hash;
}

function buildDemoCoordinate(seed: string) {
  const baseLatitude = 19.4326;
  const baseLongitude = -99.1332;
  const latHash = buildStableHash(`${seed}-lat`);
  const lngHash = buildStableHash(`${seed}-lng`);
  const latitudeOffset = ((latHash % 140) - 70) / 1000;
  const longitudeOffset = ((lngHash % 180) - 90) / 1000;

  return {
    latitude: Number((baseLatitude + latitudeOffset).toFixed(6)),
    longitude: Number((baseLongitude + longitudeOffset).toFixed(6)),
  };
}

function formatCoordinate(value: number) {
  return value.toFixed(5);
}

function parseWorkshopAccentColor(value: string) {
  if (value.includes("blue")) {
    return "#2563eb";
  }

  if (value.includes("emerald")) {
    return "#059669";
  }

  if (value.includes("rose")) {
    return "#e11d48";
  }

  if (value.includes("violet")) {
    return "#7c3aed";
  }

  if (value.includes("cyan")) {
    return "#0891b2";
  }

  return TYPE_COLORS.reparacion;
}

function buildWorkshopCenter(workshop: RepairWorkshopProfile, index: number): DemoCenter {
  const coordinates = buildDemoCoordinate(workshop.id);

  return {
    id: workshop.id,
    name: workshop.name,
    type: "reparacion",
    address: workshop.address || "Sin direccion registrada",
    accepts: workshop.specialty
      .split(/[,/]/)
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 4),
    contact: workshop.phone || "Sin telefono registrado",
    hours: DEMO_WORKSHOP_HOURS[index % DEMO_WORKSHOP_HOURS.length],
    xRatio: 0,
    yRatio: 0,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    color: parseWorkshopAccentColor(workshop.logoColor),
  };
}

export default function GeoModule() {
  const [dbWorkshops, setDbWorkshops] = useState<RepairWorkshopProfile[]>([]);
  const [isLoadingWorkshops, setIsLoadingWorkshops] = useState(true);
  const [workshopsError, setWorkshopsError] = useState("");
  const [selectedCenterId, setSelectedCenterId] = useState("");
  const [workshopSearch, setWorkshopSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadWorkshops = async () => {
      setIsLoadingWorkshops(true);
      setWorkshopsError("");

      try {
        const response = await fetch("/api/repairs");
        const payload = (await response.json()) as RepairsApiResponse;

        if (!response.ok) {
          throw new Error(
            payload.message || "No fue posible cargar los talleres desde la base de datos.",
          );
        }

        if (!cancelled) {
          setDbWorkshops(payload.workshops ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setDbWorkshops([]);
          setWorkshopsError(
            error instanceof Error
              ? error.message
              : "No fue posible cargar los talleres desde la base.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingWorkshops(false);
        }
      }
    };

    void loadWorkshops();

    return () => {
      cancelled = true;
    };
  }, []);

  const workshopCenters = useMemo(
    () => dbWorkshops.map(buildWorkshopCenter),
    [dbWorkshops],
  );

  const staticCenters = useMemo<DemoCenter[]>(
    () =>
      BASE_STATIC_CENTERS.map((center) => {
        const coordinates = buildDemoCoordinate(center.id);

        return {
          ...center,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          color: TYPE_COLORS[center.type],
        };
      }),
    [],
  );

  const centers = useMemo(
    () => [...staticCenters, ...workshopCenters],
    [staticCenters, workshopCenters],
  );

  useEffect(() => {
    if (!centers.length) {
      setSelectedCenterId("");
      return;
    }

    const selectionExists = centers.some((center) => center.id === selectedCenterId);

    if (!selectionExists) {
      setSelectedCenterId(workshopCenters[0]?.id ?? centers[0].id);
    }
  }, [centers, selectedCenterId, workshopCenters]);

  const selectedCenter =
    centers.find((center) => center.id === selectedCenterId) ??
    workshopCenters[0] ??
    centers[0];

  const filteredWorkshops = useMemo(() => {
    const normalizedSearch = workshopSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return workshopCenters;
    }

    return workshopCenters.filter((workshop) => {
      return (
        workshop.name.toLowerCase().includes(normalizedSearch) ||
        workshop.address.toLowerCase().includes(normalizedSearch) ||
        workshop.accepts.some((item) =>
          item.toLowerCase().includes(normalizedSearch),
        )
      );
    });
  }, [workshopCenters, workshopSearch]);

  const quickSelectionWorkshops = useMemo(
    () => filteredWorkshops.slice(0, 3),
    [filteredWorkshops],
  );

  return (
    <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
      <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xs">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900">
                Mapa de centros operativos
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Vista de demo con ubicaciones simuladas para talleres, puntos
                verdes y centros de donacion.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-900">
              Las coordenadas son aleatorias y estables solo para la demo.
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="rounded-[1.75rem] border border-emerald-100 bg-linear-to-br from-emerald-50 via-white to-teal-50 p-4">
            <div className="rounded-3xl border border-white/70 bg-white/85 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-700">
                Capa territorial demo
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-slate-900">
                Busca talleres y salta a su ubicacion
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                El mapa usa OpenStreetMap para la base visual, el dropdown toma
                todos los talleres disponibles en la base y cada marcador cambia
                de color segun el tipo de centro.
              </p>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Buscar talleres
                  </span>
                  <span className="relative block">
                    <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      value={workshopSearch}
                      onChange={(event) => setWorkshopSearch(event.target.value)}
                      placeholder="Ej. electronico, norte, madera..."
                      className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-emerald-400"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Dropdown de talleres
                  </span>
                  <span className="relative block">
                    <ListFilter className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
                    <select
                      value={selectedCenterId}
                      onChange={(event) => setSelectedCenterId(event.target.value)}
                      className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-emerald-400"
                    >
                      {workshopCenters.map((workshop) => (
                        <option key={workshop.id} value={workshop.id}>
                          {workshop.name}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>

                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Tipologias
                  </span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(TYPE_LABELS).map(([type, label]) => (
                      <div
                        key={type}
                        className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-3 py-2 text-xs text-slate-600"
                      >
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor:
                              TYPE_COLORS[type as WasteCenter["type"]],
                          }}
                        />
                        {label}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Centro enfocado
                  </span>
                  <div className="rounded-3xl border border-emerald-100 bg-white p-4">
                    {selectedCenter ? (
                      <>
                        <h4 className="font-display text-base font-semibold text-slate-900">
                          {selectedCenter.name}
                        </h4>
                        <p className="mt-1 text-sm text-slate-500">
                          {selectedCenter.address}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          Lat {formatCoordinate(selectedCenter.latitude)} · Lng{" "}
                          {formatCoordinate(selectedCenter.longitude)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Aún no hay centros disponibles.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {workshopsError && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {workshopsError}
                </div>
              )}

              <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white">
                <div className="h-[520px]">
                  {isLoadingWorkshops ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Cargando talleres desde la base...
                    </div>
                  ) : (
                    <OperationalCentersMap
                      centers={centers}
                      selectedCenterId={selectedCenterId}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
            Talleres de demo
          </p>
          <h3 className="mt-2 font-display text-lg font-semibold text-slate-900">
            Seleccion rapida
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Solo mostramos 3 talleres aqui. El dropdown de arriba mantiene el
            listado completo de la base.
          </p>

          <div className="mt-4 space-y-3">
            {quickSelectionWorkshops.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                {isLoadingWorkshops
                  ? "Cargando talleres..."
                  : "No se encontraron talleres con ese criterio de búsqueda."}
              </div>
            ) : (
              quickSelectionWorkshops.map((workshop) => (
                <button
                  key={workshop.id}
                  onClick={() => setSelectedCenterId(workshop.id)}
                  className={`w-full rounded-3xl border p-4 text-left transition-all ${
                    selectedCenterId === workshop.id
                      ? "border-emerald-200 bg-emerald-50/70 shadow-sm"
                      : "border-slate-100 bg-slate-50/70 hover:border-slate-200 hover:bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${TYPE_STYLES[workshop.type]}`}
                      >
                        {TYPE_LABELS[workshop.type]}
                      </span>
                      <h4 className="mt-3 font-display text-base font-semibold text-slate-900">
                        {workshop.name}
                      </h4>
                      <p className="mt-1 text-sm text-slate-500">
                        {workshop.address}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                      <Wrench className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                      {workshop.contact}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 shrink-0 text-slate-400" />
                      {workshop.hours}
                    </p>
                    <p className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      Lat {formatCoordinate(workshop.latitude)} · Lng{" "}
                      {formatCoordinate(workshop.longitude)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
