import { useMemo, useState } from "react";
import { CheckCircle2, Shield, Truck, UserX, XCircle } from "lucide-react";
import { Listing, PickupRequest, UserProfile } from "../types";

interface AdminPanelProps {
  currentUser: UserProfile | null;
  listings: Listing[];
  pickupRequests: PickupRequest[];
  onApproveListing: (id: string) => void;
  onRejectListing: (id: string) => void;
  onAssignCollector: (pickupId: string, collectorName: string) => void;
}

const COLLECTOR_OPTIONS = [
  "Ruta Norte 01",
  "Ruta Centro 03",
  "Ruta Sur 07",
  "Unidad Circular 12",
];

export default function AdminPanel({
  currentUser,
  listings,
  pickupRequests,
  onApproveListing,
  onRejectListing,
  onAssignCollector,
}: AdminPanelProps) {
  const [collectorByPickup, setCollectorByPickup] = useState<
    Record<string, string>
  >({});

  const pendingListings = useMemo(
    () => listings.filter((listing) => listing.status === "pendiente"),
    [listings],
  );
  const pendingPickups = useMemo(
    () => pickupRequests.filter((request) => request.status === "programado"),
    [pickupRequests],
  );

  if (!currentUser) {
    return (
      <div className="mx-auto my-12 max-w-lg rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-700">
          <Shield className="h-8 w-8" />
        </div>
        <h2 className="mt-5 font-display text-xl font-semibold text-slate-900">
          Debes iniciar sesion
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          El panel de administracion solo esta disponible para cuentas con
          permisos operativos.
        </p>
      </div>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <div className="mx-auto my-12 max-w-lg rounded-3xl border border-amber-100 bg-amber-50 p-8 text-center shadow-xs">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <UserX className="h-8 w-8" />
        </div>
        <h2 className="mt-5 font-display text-xl font-semibold text-slate-900">
          Acceso restringido
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Tu usuario actual no tiene permisos para aprobar publicaciones ni
          asignar rutas de recoleccion.
        </p>
      </div>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">
              Moderacion de publicaciones
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Revisa objetos pendientes antes de liberarlos al catalogo global.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
            {pendingListings.length} pendientes
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {pendingListings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No hay publicaciones pendientes por aprobar.
            </div>
          ) : (
            pendingListings.map((listing) => (
              <article
                key={listing.id}
                className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4">
                    <img
                      src={listing.image}
                      alt={listing.title}
                      className="h-24 w-28 rounded-2xl border border-slate-200 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-1.5 text-sm">
                      <h3 className="font-semibold text-slate-900">
                        {listing.title}
                      </h3>
                      <p className="text-slate-500">{listing.description}</p>
                      <p className="text-xs text-slate-500">
                        Categoria:{" "}
                        <span className="font-semibold text-slate-700">
                          {listing.category}
                        </span>{" "}
                        · Accion:{" "}
                        <span className="font-semibold capitalize text-emerald-700">
                          {listing.action}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Publicado por {listing.ownerName} en {listing.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 sm:flex-col">
                    <button
                      onClick={() => onApproveListing(listing.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => onRejectListing(listing.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Rechazar
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">
              Asignacion de recolectores
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Convierte solicitudes programadas en rutas activas para la
              operacion del dia.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
            {pendingPickups.length} por asignar
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {pendingPickups.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No hay retiros pendientes de asignacion.
            </div>
          ) : (
            pendingPickups.map((pickup) => {
              const selectedCollector =
                collectorByPickup[pickup.id] ?? COLLECTOR_OPTIONS[0];

              return (
                <article
                  key={pickup.id}
                  className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 text-sm">
                      <h3 className="font-semibold text-slate-900">
                        {pickup.itemTitle}
                      </h3>
                      <p className="text-slate-500">{pickup.address}</p>
                      <p className="text-xs text-slate-500">
                        Fecha:{" "}
                        <span className="font-semibold text-slate-700">
                          {pickup.date}
                        </span>{" "}
                        · Franja:{" "}
                        <span className="font-semibold text-slate-700">
                          {pickup.timeSlot}
                        </span>
                      </p>
                    </div>
                    <Truck className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <select
                      value={selectedCollector}
                      onChange={(event) =>
                        setCollectorByPickup((prev) => ({
                          ...prev,
                          [pickup.id]: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500"
                    >
                      {COLLECTOR_OPTIONS.map((collector) => (
                        <option key={collector} value={collector}>
                          {collector}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() =>
                        onAssignCollector(pickup.id, selectedCollector)
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800"
                    >
                      <Truck className="h-4 w-4" />
                      Asignar ruta
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
