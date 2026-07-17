import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BarChart3,
  HeartHandshake,
  Leaf,
  LoaderCircle,
  MapPinned,
  Recycle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import type { UserProfile, UserStatsResponse } from "../types";

interface StatsModuleProps {
  currentUser: UserProfile | null;
}

function formatMetricValue(value: number) {
  return new Intl.NumberFormat("es-MX").format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export default function StatsModule({ currentUser }: StatsModuleProps) {
  const [stats, setStats] = useState<UserStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadStats() {
      if (!currentUser?.id) {
        setStats(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/stats?userId=${encodeURIComponent(currentUser.id)}`,
          {
            cache: "no-store",
          },
        );

        const payload = (await response.json()) as
          | UserStatsResponse
          | { message?: string };

        if (!response.ok) {
          throw new Error(
            "message" in payload
              ? payload.message
              : "No fue posible cargar tus estadísticas.",
          );
        }

        if (!isCancelled) {
          setStats(payload as UserStatsResponse);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No fue posible cargar tus estadísticas.",
          );
          setStats(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadStats();

    return () => {
      isCancelled = true;
    };
  }, [currentUser?.id]);

  const firstName = useMemo(() => {
    if (!currentUser?.name) {
      return "tu cuenta";
    }

    return currentUser.name.split(" ")[0] || currentUser.name;
  }, [currentUser?.name]);

  const highlightCards = useMemo(() => {
    if (!stats) {
      return [];
    }

    return [
      {
        label: "Objetos recuperados",
        value: formatMetricValue(stats.metrics.recoveredItems),
        detail: "artículos que ya evitaron un descarte prematuro",
        accent: "bg-emerald-50 text-emerald-700",
        icon: Recycle,
      },
      {
        label: "Entregas completadas",
        value: formatMetricValue(stats.metrics.completedDeliveries),
        detail: "intercambios cerrados dentro de la plataforma",
        accent: "bg-blue-50 text-blue-700",
        icon: HeartHandshake,
      },
      {
        label: "Ubicaciones compartidas",
        value: formatMetricValue(stats.metrics.sharedLocations),
        detail: "mensajes de ubicación enviados para coordinar mejor",
        accent: "bg-amber-50 text-amber-700",
        icon: MapPinned,
      },
    ];
  }, [stats]);

  const impactStats = useMemo(() => {
    if (!stats) {
      return [];
    }

    return [
      {
        label: "CO2 evitado",
        value: `${stats.metrics.co2SavedKg.toFixed(1)} kg`,
        detail: "impacto acumulado con artículos ya rescatados",
      },
      {
        label: "Publicaciones creadas",
        value: formatMetricValue(stats.metrics.itemsPublished),
        detail: "artículos que pusiste en circulación",
      },
      {
        label: "Solicitudes recibidas",
        value: formatMetricValue(stats.metrics.requestsReceived),
        detail: "interacciones reales generadas por tus publicaciones",
      },
      {
        label: "Reparaciones iniciadas",
        value: formatMetricValue(stats.metrics.repairsStarted),
        detail: "equipos que enviaste a diagnóstico o taller",
      },
      {
        label: "Días con actividad",
        value: formatMetricValue(stats.metrics.activityDays),
        detail: "días distintos con acciones registradas en ReCyClapp",
      },
      {
        label: "Perfil completado",
        value: formatPercent(stats.metrics.profileCompletion),
        detail: "avance de tu perfil para coordinar mejor cada entrega",
      },
    ];
  }, [stats]);

  if (!currentUser) {
    return (
      <section className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-xs">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            <BarChart3 className="h-3.5 w-3.5" />
            Progreso ecológico
          </div>
          <h2 className="mt-4 font-display text-3xl font-black tracking-tight text-slate-900">
            Inicia sesión para convertir tus acciones en métricas reales,
            insignias y retos desbloqueables.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
            Aquí mostraremos tu impacto real, tus logros dentro de la
            plataforma y el siguiente objetivo que te falta para seguir
            avanzando.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-[2rem] border border-slate-100 bg-linear-to-r from-slate-950 via-slate-900 to-emerald-900 p-8 text-white shadow-xl shadow-slate-900/10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
              <BarChart3 className="h-3.5 w-3.5" />
              Tu impacto
            </div>
            <h2 className="mt-4 font-display text-3xl font-black tracking-tight">
              {firstName}, este panel ya refleja tu actividad real dentro de
              ReCyClapp.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              Tus publicaciones, solicitudes, entregas, reparaciones y
              ubicaciones compartidas ahora alimentan un progreso ecológico con
              insignias y metas claras.
            </p>
          </div>

          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-100/80">
              Próxima insignia
            </p>
            {isLoading ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-200">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Cargando progreso...
              </div>
            ) : stats?.nextBadge ? (
              <>
                <div className="mt-2 text-2xl font-black">
                  {stats.nextBadge.title}
                </div>
                <p className="mt-2 text-xs leading-6 text-slate-200">
                  {stats.nextBadge.currentValue} de {stats.nextBadge.targetValue}{" "}
                  acciones completadas.
                </p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all"
                    style={{
                      width: `${Math.max(
                        8,
                        Math.round(stats.nextBadge.progressRatio * 100),
                      )}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-emerald-100">
                  Te faltan {stats.nextBadge.remainingValue}{" "}
                  {stats.nextBadge.remainingValue === 1
                    ? "acción"
                    : "acciones"}{" "}
                  para desbloquearla.
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-200">
                Ya desbloqueaste todas las insignias configuradas en esta demo.
              </p>
            )}
          </div>
        </div>
      </div>

      {isLoading && !stats ? (
        <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-xs">
          <div className="flex items-center gap-3 text-slate-600">
            <LoaderCircle className="h-5 w-5 animate-spin text-emerald-600" />
            Cargando métricas personales y mensajes de progreso...
          </div>
        </div>
      ) : error ? (
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-xs">
          {error}
        </div>
      ) : stats ? (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            {highlightCards.map((metric) => {
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
                  Tu impacto real
                </h3>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {impactStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4"
                  >
                    <p className="text-sm text-slate-500">{stat.label}</p>
                    <div className="mt-1 text-2xl font-black text-slate-900">
                      {stat.value}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {stat.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                <h3 className="font-display text-xl font-semibold text-slate-900">
                  Progreso ecológico
                </h3>
              </div>

              <div className="mt-5 grid gap-4">
                <div className="rounded-3xl bg-emerald-50 p-5">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-700">
                    Impacto
                  </p>
                  <h4 className="mt-2 text-lg font-bold text-emerald-950">
                    {stats.impact.title}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-emerald-900">
                    {stats.impact.message}
                  </p>
                </div>

                <div className="rounded-3xl bg-blue-50 p-5">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-blue-700">
                    Logro
                  </p>
                  <h4 className="mt-2 text-lg font-bold text-blue-950">
                    {stats.achievement.title}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-blue-950">
                    {stats.achievement.message}
                  </p>
                </div>

                <div className="rounded-3xl bg-amber-50 p-5">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-700">
                    Siguiente reto
                  </p>
                  <h4 className="mt-2 text-lg font-bold text-amber-950">
                    {stats.nextStep.title}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-amber-950">
                    {stats.nextStep.message}
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5">
                  <div className="flex items-center gap-2">
                    <Award className="h-4.5 w-4.5 text-slate-700" />
                    <p className="text-sm font-semibold text-slate-900">
                      Insignias desbloqueadas
                    </p>
                  </div>
                  {stats.unlockedBadges.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {stats.unlockedBadges.map((badge) => (
                        <span
                          key={badge.code}
                          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                          {badge.title}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      Aún no desbloqueas insignias. Tu siguiente acción dentro
                      de la plataforma activará la primera.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
