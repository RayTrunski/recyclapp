import { BarChart3, Heart, Leaf, Recycle, Wrench } from "lucide-react";
import { UserProfile } from "../types";

interface StatsModuleProps {
  currentUser: UserProfile | null;
}

const CITY_METRICS = [
  {
    label: "Objetos recuperados",
    value: "1,284",
    detail: "inventario gestionado en el piloto",
    accent: "bg-emerald-50 text-emerald-700",
    icon: Recycle,
  },
  {
    label: "Donaciones activas",
    value: "312",
    detail: "entregas listas para coordinacion",
    accent: "bg-blue-50 text-blue-700",
    icon: Heart,
  },
  {
    label: "Reparaciones iniciadas",
    value: "97",
    detail: "equipos derivados a talleres locales",
    accent: "bg-amber-50 text-amber-700",
    icon: Wrench,
  },
];

export default function StatsModule({ currentUser }: StatsModuleProps) {
  const personalStats = currentUser
    ? [
        {
          label: "CO2 evitado",
          value: `${currentUser.co2Saved} kg`,
          detail: "impacto acumulado de tu cuenta",
        },
        {
          label: "Donaciones logradas",
          value: `${currentUser.donatedCount}`,
          detail: "articulos que cambian de hogar",
        },
        {
          label: "Material reciclado",
          value: `${currentUser.recycledCount}`,
          detail: "unidades derivadas a tratamiento",
        },
      ]
    : [];

  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-[2rem] border border-slate-100 bg-linear-to-r from-slate-950 via-slate-900 to-emerald-900 p-8 text-white shadow-xl shadow-slate-900/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
              <BarChart3 className="h-3.5 w-3.5" />
              Panel de indicadores
            </div>
            <h2 className="mt-4 font-display text-3xl font-black tracking-tight">
              Medimos recuperacion, trazabilidad e impacto ambiental en una sola
              vista.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
              Estas cifras resumen la operacion demo y ayudan a mostrar el
              valor de un flujo circular para hogares y municipios.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-100/80">
              Meta trimestral
            </p>
            <div className="mt-2 text-4xl font-black">74%</div>
            <p className="mt-1 text-xs text-slate-200">
              de cumplimiento en rescate de volumenes prioritarios.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {CITY_METRICS.map((metric) => {
          const Icon = metric.icon;

          return (
            <article
              key={metric.label}
              className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${metric.accent}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-500">
                {metric.label}
              </p>
              <div className="mt-1 font-display text-3xl font-black text-slate-900">
                {metric.value}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {metric.detail}
              </p>
            </article>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-emerald-600" />
            <h3 className="font-display text-xl font-semibold text-slate-900">
              Impacto ciudadano
            </h3>
          </div>

          {currentUser ? (
            <div className="mt-5 space-y-4">
              {personalStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4"
                >
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <div className="mt-1 text-2xl font-black text-slate-900">
                    {stat.value}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{stat.detail}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
              Inicia sesion para ver tus metricas personales de reciclaje,
              donacion y reparacion.
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xs">
          <h3 className="font-display text-xl font-semibold text-slate-900">
            Lectura ejecutiva
          </h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-emerald-50 p-5">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-700">
                Eficiencia
              </p>
              <p className="mt-2 text-sm leading-6 text-emerald-900">
                La mayor parte del volumen recuperado proviene de muebles y
                electrodomesticos con retiro coordinado.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-100 p-5">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-600">
                Oportunidad
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-800">
                Los talleres locales concentran la mejor opcion para alargar la
                vida util de equipos medianos.
              </p>
            </div>
            <div className="rounded-3xl bg-blue-50 p-5 sm:col-span-2">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-blue-700">
                Siguiente paso
              </p>
              <p className="mt-2 text-sm leading-6 text-blue-950">
                Integrar reportes por colonia y capacidad de cuadrillas para
                priorizar zonas con mayor tasa de residuos voluminosos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
