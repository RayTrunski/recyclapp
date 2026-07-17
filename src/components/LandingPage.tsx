import { ArrowRight, Leaf, Recycle, ShieldCheck, Truck } from "lucide-react";

interface LandingPageProps {
  onStartClick: () => void;
  onExploreClick: () => void;
}

const HIGHLIGHTS = [
  {
    icon: Recycle,
    title: "Economia circular vecinal",
    description:
      "Publica muebles, electrodomesticos y objetos que todavia pueden donarse, reciclarse o repararse.",
  },
  {
    icon: Truck,
    title: "Logistica con trazabilidad",
    description:
      "Coordina recolecciones y sigue cada retiro con estados claros para ciudadanos y recolectores.",
  },
  {
    icon: ShieldCheck,
    title: "Operacion municipal segura",
    description:
      "Paneles diferenciados para usuarios, cuadrillas y administradores con seguimiento operativo.",
  },
];

export default function LandingPage({
  onStartClick,
  onExploreClick,
}: LandingPageProps) {
  return (
    <section className="flex flex-col gap-8">
      <div className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-linear-to-br from-emerald-950 via-emerald-800 to-teal-700 p-8 text-white shadow-xl shadow-emerald-900/10 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
          <div className="flex flex-col gap-5">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
              <Leaf className="h-3.5 w-3.5" />
              Plataforma piloto municipal
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl font-display text-3xl font-black tracking-tight text-white sm:text-5xl">
                ReCyClapp conecta hogares, cuadrillas y talleres en una sola
                operacion sostenible.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-emerald-50/90 sm:text-base">
                Convierte objetos grandes en oportunidades de donacion,
                reparacion y reciclaje con un flujo simple, visible y pensado
                para comunas que quieren reducir residuos reales.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onStartClick}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-emerald-900 transition-colors hover:bg-emerald-50"
              >
                Comenzar ahora
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={onExploreClick}
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
              >
                Explorar catalogo
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-emerald-100/80">
                Impacto proyectado
              </p>
              <div className="mt-3 text-3xl font-black">+32%</div>
              <p className="mt-2 text-xs leading-6 text-emerald-50/80">
                recuperacion de objetos voluminosos frente a retiro sin
                clasificacion.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/10 p-5 backdrop-blur-sm">
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-emerald-100/80">
                Modulos activos
              </p>
              <div className="mt-3 text-3xl font-black">6</div>
              <p className="mt-2 text-xs leading-6 text-emerald-50/80">
                catalogo, publicaciones, recolecciones, talleres, mapas y
                reportes.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {HIGHLIGHTS.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.title}
              className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-display text-lg font-semibold text-slate-900">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {item.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
