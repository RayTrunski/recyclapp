import { Clock3, MapPin, Phone, Recycle, Wrench } from "lucide-react";
import { WasteCenter } from "../types";

const MAP_CENTERS: WasteCenter[] = [
  {
    id: "center-1",
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
    id: "center-2",
    name: "Taller Circular Norte",
    type: "reparacion",
    address: "Calle Nogal 45, Industrial",
    accepts: ["Electrodomesticos", "Muebles", "Ajustes electricos"],
    contact: "+52 55 1000 4422",
    hours: "Lun - Vie / 09:00 - 19:00",
    xRatio: 72,
    yRatio: 28,
  },
  {
    id: "center-3",
    name: "Centro de Donacion La Alameda",
    type: "donaciones",
    address: "Paseo de la Alameda 300, Sur",
    accepts: ["Muebles", "Decoracion", "Articulos de oficina"],
    contact: "+52 55 1000 7733",
    hours: "Mar - Dom / 10:00 - 17:00",
    xRatio: 56,
    yRatio: 68,
  },
];

const TYPE_STYLES: Record<WasteCenter["type"], string> = {
  municipal: "bg-slate-900 text-white",
  donaciones: "bg-blue-600 text-white",
  reparacion: "bg-amber-500 text-slate-950",
  punto_verde: "bg-emerald-600 text-white",
};

const TYPE_LABELS: Record<WasteCenter["type"], string> = {
  municipal: "Municipal",
  donaciones: "Donaciones",
  reparacion: "Reparacion",
  punto_verde: "Punto verde",
};

export default function GeoModule() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xs">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="font-display text-xl font-semibold text-slate-900">
            Mapa de centros operativos
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Vista rapida de puntos verdes, talleres y lugares de donacion
            conectados a la demo.
          </p>
        </div>

        <div className="p-6">
          <div className="relative min-h-[420px] overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-linear-to-br from-emerald-50 via-white to-teal-50">
            <div className="absolute inset-0 opacity-60">
              <div className="absolute inset-x-0 top-[22%] h-px bg-emerald-200/80" />
              <div className="absolute inset-x-0 top-[48%] h-px bg-emerald-200/80" />
              <div className="absolute inset-x-0 top-[74%] h-px bg-emerald-200/80" />
              <div className="absolute left-[26%] top-0 h-full w-px bg-emerald-200/80" />
              <div className="absolute left-[55%] top-0 h-full w-px bg-emerald-200/80" />
              <div className="absolute left-[79%] top-0 h-full w-px bg-emerald-200/80" />
            </div>

            <div className="absolute left-8 top-8 max-w-xs rounded-2xl border border-white/60 bg-white/80 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-700">
                Capa territorial
              </p>
              <h3 className="mt-2 font-display text-lg font-semibold text-slate-900">
                Cobertura piloto
              </h3>
              <p className="mt-1 text-xs leading-6 text-slate-500">
                Los puntos muestran centros disponibles para entrega directa,
                diagnostico y recoleccion ciudadana.
              </p>
            </div>

            {MAP_CENTERS.map((center) => (
              <div
                key={center.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${center.xRatio}%`,
                  top: `${center.yRatio}%`,
                }}
              >
                <div className="relative">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-4 border-white shadow-lg ${TYPE_STYLES[center.type]}`}
                  >
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="absolute left-1/2 top-14 w-44 -translate-x-1/2 rounded-2xl border border-slate-100 bg-white/95 p-3 text-xs shadow-lg">
                    <p className="font-semibold text-slate-900">
                      {center.name}
                    </p>
                    <p className="mt-1 text-slate-500">{center.address}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {MAP_CENTERS.map((center) => (
          <article
            key={center.id}
            className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${TYPE_STYLES[center.type]}`}
                >
                  {TYPE_LABELS[center.type]}
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold text-slate-900">
                  {center.name}
                </h3>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                {center.type === "reparacion" ? (
                  <Wrench className="h-5 w-5" />
                ) : (
                  <Recycle className="h-5 w-5" />
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                {center.address}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                {center.contact}
              </p>
              <p className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 shrink-0 text-slate-400" />
                {center.hours}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {center.accepts.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
                >
                  {item}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
