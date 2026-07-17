import { useEffect, useMemo, useState, FormEvent } from "react";
import {
  Wrench,
  Shield,
  Check,
  Info,
  ArrowRight,
  Star,
  RefreshCw,
  Layers,
} from "lucide-react";
import {
  CreateRepairInput,
  RepairListingOption,
  RepairRequest,
  RepairWorkshopProfile,
  UserProfile,
  ItemCategory,
} from "../types";

interface RepairModuleProps {
  currentUser: UserProfile | null;
  repairRequests: RepairRequest[];
  availableListings: RepairListingOption[];
  workshops: RepairWorkshopProfile[];
  featuredWorkshops: RepairWorkshopProfile[];
  onAddRepair: (request: CreateRepairInput) => Promise<void>;
  onLoginRequest: () => void;
}

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  muebles: "Muebles",
  electrodomesticos: "Electrodomésticos",
  electronicos: "Electrónicos",
  decoracion: "Decoración",
  oficina: "Oficina",
  otros: "Otros",
};

export default function RepairModule({
  currentUser,
  repairRequests,
  availableListings,
  workshops,
  featuredWorkshops,
  onAddRepair,
  onLoginRequest,
}: RepairModuleProps) {
  const [selectedListingId, setSelectedListingId] = useState("");
  const [selectedWorkshopId, setSelectedWorkshopId] = useState("");
  const [description, setDescription] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const selectedListing = useMemo(
    () =>
      availableListings.find((listing) => listing.id === selectedListingId) ??
      null,
    [availableListings, selectedListingId],
  );

  useEffect(() => {
    if (!availableListings.length) {
      setSelectedListingId("");
      return;
    }

    const exists = availableListings.some(
      (listing) => listing.id === selectedListingId,
    );

    if (!exists) {
      setSelectedListingId(availableListings[0].id);
    }
  }, [availableListings, selectedListingId]);

  useEffect(() => {
    if (!workshops.length) {
      setSelectedWorkshopId("");
      return;
    }

    const exists = workshops.some((workshop) => workshop.id === selectedWorkshopId);

    if (!exists) {
      setSelectedWorkshopId(workshops[0].id);
    }
  }, [selectedWorkshopId, workshops]);

  if (!currentUser) {
    return (
      <div
        className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xs text-center max-w-lg mx-auto my-12 flex flex-col gap-6"
        id="repair-module-unauth"
      >
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-650 mx-auto">
          <Wrench className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-slate-800 text-lg">
            Inicia sesión para solicitar reparaciones
          </h3>
          <p className="text-slate-500 text-xs mt-2 leading-relaxed">
            Te conectamos con talleres reales guardados en la base de datos para
            que dejes trazabilidad de diagnóstico, costo y seguimiento.
          </p>
        </div>
        <button
          onClick={onLoginRequest}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-md shadow-emerald-200 cursor-pointer"
        >
          Iniciar sesión ahora
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!selectedListingId) {
      setSubmitError("Selecciona un artículo ligado a tu perfil.");
      return;
    }

    if (!selectedWorkshopId) {
      setSubmitError("Selecciona un taller sugerido.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddRepair({
        requesterId: currentUser.id,
        listingId: selectedListingId,
        workshopId: selectedWorkshopId,
        description,
      });

      setSuccess(true);
      setDescription("");

      window.setTimeout(() => {
        setSuccess(false);
      }, 4500);
    } catch (error) {
      console.error("Error solicitando reparación:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "No fue posible registrar la reparación.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: RepairRequest["status"]) => {
    switch (status) {
      case "revisión":
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            🔍 REVISIÓN
          </span>
        );
      case "en_taller":
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            🛠️ EN TALLER
          </span>
        );
      case "reparado":
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-semibold">
            ✅ REPARADO
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 font-mono">
            ❌ SIN ARREGLO
          </span>
        );
    }
  };

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left"
      id="repair-module-component"
    >
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-4">
          <div className="border-b border-slate-50 pb-3 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-600" />
            <h3 className="font-display font-semibold text-slate-800">
              Solicitar Presupuesto de Reparación
            </h3>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Usa uno de tus artículos publicados y asígnalo a un taller de la
            red registrada en la base de datos.
          </p>

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs leading-relaxed flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-emerald-950 font-bold">
                  ¡Solicitud de reparación exitosa!
                </strong>
                El taller ya fue enlazado y verás el seguimiento en el panel de
                estado.
              </div>
            </div>
          )}

          {submitError && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-700">
              {submitError}
            </div>
          )}

          {!availableListings.length && (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 leading-relaxed">
              No hay artículos ligados a tu perfil todavía. Publica uno primero
              para poder enviarlo a diagnóstico.
            </div>
          )}

          {!workshops.length && (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 leading-relaxed">
              Aún no hay talleres disponibles en la base. Después de correr el
              seed aparecerán aquí.
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                ¿Qué artículo deseas reparar? *
              </label>
              <select
                value={selectedListingId}
                onChange={(e) => setSelectedListingId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-emerald-500 text-xs bg-white text-slate-700"
                disabled={!availableListings.length || isSubmitting}
              >
                {availableListings.length === 0 ? (
                  <option value="">No hay artículos disponibles</option>
                ) : (
                  availableListings.map((listing) => (
                    <option key={listing.id} value={listing.id}>
                      {listing.title}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Categoría del artículo
                </label>
                <input
                  type="text"
                  value={
                    selectedListing
                      ? CATEGORY_LABELS[selectedListing.category]
                      : "Pendiente de selección"
                  }
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Ubicación actual
                </label>
                <input
                  type="text"
                  value={selectedListing?.location ?? "Pendiente de selección"}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Taller sugerido
              </label>
              <select
                value={selectedWorkshopId}
                onChange={(e) => setSelectedWorkshopId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-emerald-500 text-xs bg-white text-slate-700"
                disabled={!workshops.length || isSubmitting}
              >
                {workshops.length === 0 ? (
                  <option value="">Sin talleres registrados</option>
                ) : (
                  workshops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name} ({shop.rating.toFixed(1)} ★)
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Detalla qué problema presenta
              </label>
              <textarea
                placeholder="Ej. enciende pero no calienta, la puerta se descuadró, requiere retapizado..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-emerald-500 text-xs"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={!availableListings.length || !workshops.length || isSubmitting}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 mt-2 cursor-pointer shadow-md shadow-emerald-200 disabled:bg-emerald-300 disabled:cursor-not-allowed"
            >
              <span>
                {isSubmitting ? "Enviando..." : "Enviar a taller asignado"}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-7 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-4">
          <div className="border-b border-slate-50 pb-3 flex items-center justify-between">
            <h3 className="font-display font-semibold text-slate-800 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-600 shrink-0" />
              Estado de mis Reparaciones
            </h3>
            <span className="text-[10px] bg-slate-150 py-0.5 px-2 rounded-md font-mono font-bold text-slate-600">
              {repairRequests.length} Activaciones
            </span>
          </div>

          {repairRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs flex flex-col gap-3.5 items-center">
              <Layers className="w-8 h-8 text-slate-300" />
              <span>Sin reparaciones ligadas a tu usuario por ahora.</span>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-56 overflow-y-auto scrollbar-thin">
              {repairRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between gap-4"
                >
                  <div className="flex flex-col gap-0.5 text-xs text-left">
                    <div className="flex items-center gap-2">
                      <strong className="font-bold text-slate-800">
                        {req.itemName}
                      </strong>
                      <span className="text-[9px] bg-slate-200 font-mono text-slate-600 px-1 py-0.5 rounded">
                        {req.category}
                      </span>
                    </div>
                    <div className="text-slate-500 font-medium mt-1 leading-tight">
                      <span>
                        Taller asignado:{" "}
                        <strong className="text-slate-800 font-bold">
                          {req.shopName}
                        </strong>
                      </span>
                      <span className="block text-[10px]">
                        Costo estimado:{" "}
                        <strong className="text-emerald-700 font-bold">
                          {req.estimatedCost}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 items-end self-stretch shrink-0 justify-center">
                    {getStatusBadge(req.status)}
                    <span className="text-[9px] text-slate-400 font-mono">
                      {req.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex-1 flex flex-col gap-4">
          <div className="border-b border-slate-50 pb-3 flex items-center gap-1.5">
            <Shield className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
            <h3 className="font-display font-semibold text-slate-800">
              Directorio de Talleres Destacados
            </h3>
          </div>

          <div className="space-y-4">
            {featuredWorkshops.map((shop) => (
              <div
                key={shop.id}
                className="flex items-start gap-3 p-3 hover:bg-slate-50/70 rounded-xl border border-transparent hover:border-slate-150 transition-all text-xs"
              >
                <div
                  className={`w-10 h-10 rounded-lg ${shop.logoColor} shrink-0 flex items-center justify-center font-bold text-sm`}
                >
                  {shop.name.charAt(0)}
                </div>
                <div className="flex-1 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="font-semibold text-slate-800">
                      {shop.name}
                    </strong>
                    <span className="flex items-center gap-0.5 text-slate-700 font-bold">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      {shop.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-slate-400 font-medium leading-none">
                    {shop.specialty}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-1 flex justify-between gap-4">
                    <span>📍 {shop.address}</span>
                    <span>📞 {shop.phone}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-emerald-50 rounded-lg text-[11px] text-emerald-800 border border-emerald-100 flex items-start gap-1.5 leading-normal">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              <strong>Impulso de Empleo Local:</strong> Este top 3 se arma con
              los talleres de mejor calificación registrados en la base de datos
              de ReCyClapp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
