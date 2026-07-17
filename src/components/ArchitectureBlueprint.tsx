import {
  Database,
  FolderTree,
  LayoutPanelTop,
  Route,
  ShieldCheck,
  Wrench,
} from "lucide-react";

const STACK_LAYERS = [
  {
    title: "Capa de experiencia",
    detail:
      "Next.js App Router entrega la interfaz principal y concentra las vistas de catalogo, perfil, mapas y panel operativo.",
    icon: LayoutPanelTop,
  },
  {
    title: "Capa de negocio",
    detail:
      "Los modulos del cliente disparan flujos de publicaciones, solicitudes de retiro y derivacion a talleres con estado persistido.",
    icon: Route,
  },
  {
    title: "Capa de datos",
    detail:
      "Prisma y Supabase permiten consultar publicaciones, recolecciones y talleres desde una base unificada.",
    icon: Database,
  },
];

const FOLDER_ITEMS = [
  "app/ -> rutas de Next.js y endpoints API",
  "src/ -> experiencia cliente, modulos y tipos",
  "lib/ -> utilidades compartidas y helpers de imagenes",
  "prisma/ -> schema, seed y configuracion de datos",
  "docs/ -> notas de arquitectura y soporte funcional",
];

export default function ArchitectureBlueprint() {
  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-[2rem] border border-slate-100 bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-xl shadow-slate-950/10">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
          <FolderTree className="h-3.5 w-3.5" />
          Blueprint tecnico
        </div>
        <h2 className="mt-4 max-w-3xl font-display text-3xl font-black tracking-tight sm:text-4xl">
          La demo se organiza como una plataforma de economia circular lista
          para crecer por modulos.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
          Esta vista resume como se reparte la responsabilidad entre UI,
          reglas de negocio y almacenamiento para sostener la operacion sin
          perder claridad.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {STACK_LAYERS.map((layer) => {
          const Icon = layer.icon;

          return (
            <article
              key={layer.title}
              className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">
                {layer.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {layer.detail}
              </p>
            </article>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-emerald-600" />
            <h3 className="font-display text-xl font-semibold text-slate-900">
              Estructura sugerida
            </h3>
          </div>
          <div className="mt-5 space-y-3">
            {FOLDER_ITEMS.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xs">
          <h3 className="font-display text-xl font-semibold text-slate-900">
            Principios de implementacion
          </h3>
          <div className="mt-5 space-y-4">
            <div className="rounded-3xl bg-emerald-50 p-5">
              <div className="flex items-center gap-2 text-emerald-800">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  Separacion por responsabilidades
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-emerald-950">
                Las acciones del usuario viven en modulos concretos y los datos
                se cargan desde endpoints claros para evitar acoplamientos.
              </p>
            </div>
            <div className="rounded-3xl bg-blue-50 p-5">
              <div className="flex items-center gap-2 text-blue-800">
                <Database className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  Persistencia lista para crecer
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-blue-950">
                Prisma deja preparada la evolucion del schema y Supabase da una
                base rapida para lectura y escritura de la demo.
              </p>
            </div>
            <div className="rounded-3xl bg-amber-50 p-5">
              <div className="flex items-center gap-2 text-amber-800">
                <Wrench className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  Operacion trazable
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-amber-950">
                Publicaciones, rutas y reparaciones exponen estados legibles
                para que cada actor entienda que sigue en el proceso.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
