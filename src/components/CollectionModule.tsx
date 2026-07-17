import { useEffect, useMemo, useState, FormEvent } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Check,
  Plus,
  AlertCircle,
  RefreshCw,
  Truck,
} from "lucide-react";
import {
  CreatePickupInput,
  PickupListingOption,
  PickupRequest,
  UserProfile,
  ItemCategory,
} from "../types";

interface CollectionModuleProps {
  currentUser: UserProfile | null;
  pickupRequests: PickupRequest[];
  availableListings: PickupListingOption[];
  onAddPickup: (request: CreatePickupInput) => Promise<void>;
  onLoginRequest: () => void;
}

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  muebles: "Muebles de Hogar",
  electrodomesticos: "Electrodomésticos",
  electronicos: "Electrónicos y TV",
  decoracion: "Decoración",
  oficina: "Oficina",
  otros: "Otros residuales",
};

const TIME_SLOTS = [
  "Mañana (09:00 - 12:00)",
  "Mediodía (12:00 - 15:00)",
  "Tarde (15:00 - 18:00)",
];

export default function CollectionModule({
  currentUser,
  pickupRequests,
  availableListings,
  onAddPickup,
  onLoginRequest,
}: CollectionModuleProps) {
  const isCollectorView = currentUser?.role === "collector";
  const [selectedListingId, setSelectedListingId] = useState("");
  const [address, setAddress] = useState(currentUser?.address || "");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [notes, setNotes] = useState("");
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

    const selectedStillExists = availableListings.some(
      (listing) => listing.id === selectedListingId,
    );

    if (!selectedStillExists) {
      setSelectedListingId(availableListings[0].id);
    }
  }, [availableListings, selectedListingId]);

  useEffect(() => {
    if (selectedListing) {
      setAddress(selectedListing.location);
      return;
    }

    setAddress(currentUser?.address || "");
  }, [currentUser?.address, selectedListing]);

  if (!currentUser) {
    return (
      <div
        className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xs text-center max-w-lg mx-auto my-12 flex flex-col gap-6"
        id="collection-module-unauth"
      >
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
          <Truck className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-slate-800 text-lg">
            Inicia sesión para programar recolecciones
          </h3>
          <p className="text-slate-500 text-xs mt-2 leading-relaxed">
            Nuestros recolectores necesitan estar en constante coordinación con
            un número telefónico registrado y dirección física autorizada para
            asignar los camiones óptimamente.
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

    if (!selectedListing) {
      setSubmitError(
        "Primero publica al menos un artículo para poder programar su recolección.",
      );
      return;
    }

    if (!date) {
      setSubmitError("Selecciona una fecha para el retiro.");
      return;
    }

    if (!address.trim()) {
      setSubmitError("Confirma la dirección física de retiro.");
      return;
    }

    try {
      setIsSubmitting(true);

      await onAddPickup({
        requesterId: currentUser.id,
        listingId: selectedListing.id,
        address,
        date,
        timeSlot,
        notes,
      });

      setSuccess(true);
      setDate("");
      setTimeSlot(TIME_SLOTS[0]);
      setNotes("");

      window.setTimeout(() => {
        setSuccess(false);
      }, 4000);
    } catch (error) {
      console.error("Error agendando recolección:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "No fue posible agendar la recolección.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: PickupRequest["status"]) => {
    switch (status) {
      case "programado":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
            📅 PROGRAMADO
          </span>
        );
      case "en_ruta":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-250 animate-pulse font-mono">
            🚚 EN RUTA
          </span>
        );
      case "completado":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-250 font-mono">
            ✅ COMPLETADO
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 font-mono">
            ❌ CANCELADO
          </span>
        );
    }
  };

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left"
      id="collection-module-component"
    >
      {!isCollectorView && (
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-4">
            <div className="border-b border-slate-50 pb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <h3 className="font-display font-semibold text-slate-800">
                Agendar Nueva Recolección
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Selecciona uno de tus artículos publicados y registra un retiro
              real en la agenda de ReCyClapp.
            </p>

            {success && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold leading-relaxed flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-emerald-950 font-bold text-xs">
                    ¡Solicitud recibida!
                  </strong>
                  Tu recolección quedó registrada y ya aparece en tu monitoreo
                  activo.
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
                Aún no tienes artículos publicados asociados a tu perfil.
                Publica uno primero y aquí se autocompletará para agenda de
                retiro.
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Artículo a recolectar *
                </label>
                <select
                  value={selectedListingId}
                  onChange={(e) => setSelectedListingId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-emerald-500 text-xs bg-white text-slate-700"
                  disabled={!availableListings.length || isSubmitting}
                >
                  {availableListings.length === 0 ? (
                    <option value="">No hay artículos publicados</option>
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
                    Categoría principal
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
                    Fecha de Retiro *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-emerald-500 text-xs text-slate-700"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Bloque Horario Preferente
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <label
                      key={slot}
                      className={`px-3 py-2 border rounded-xl flex items-center gap-2 cursor-pointer transition-colors text-xs font-semibold ${
                        timeSlot === slot
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="timeSlot"
                        checked={timeSlot === slot}
                        onChange={() => setTimeSlot(slot)}
                        className="text-emerald-600 focus:ring-emerald-500"
                        disabled={isSubmitting}
                      />
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{slot}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Dirección Física de Retiro *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Dirección, colonia y ciudad"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-emerald-500 text-xs"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Notas para el recolector
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. está en planta baja, requiere ayuda para cargar, tocar al llegar..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-emerald-500 text-xs"
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                disabled={!availableListings.length || isSubmitting}
                className="w-full py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 mt-2 cursor-pointer shadow-md shadow-emerald-200 disabled:bg-emerald-300 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {isSubmitting ? "Agendando..." : "Agendar Recolección"}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      <div className={`${isCollectorView ? "lg:col-span-12" : "lg:col-span-7"} flex flex-col gap-6`}>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex-1 flex flex-col gap-4">
          <div className="border-b border-slate-50 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Truck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-display font-semibold text-slate-800">
                {isCollectorView
                  ? "Mis Rutas y Monitoreo Asignado"
                  : "Mi Agenda y Monitoreo Activo"}
              </h3>
            </div>
            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-mono font-bold text-slate-600">
              {pickupRequests.length} Solicitudes
            </span>
          </div>

          {isCollectorView && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
              Las solicitudes registradas por ciudadanos se asignan automáticamente
              a recolectores disponibles para esta demo. Aquí ves las rutas donde
              fuiste asignado.
            </div>
          )}

          {pickupRequests.length === 0 ? (
            <div className="p-8 text-center flex flex-col gap-3 items-center justify-center flex-1">
              <AlertCircle className="w-8 h-8 text-slate-350" />
              <div>
                <h4 className="font-medium text-slate-800 text-sm">
                  No tienes solicitudes asociadas
                </h4>
                <p className="text-slate-400 text-xs mt-1">
                  Agenda un retiro propio o solicita una donación para verla
                  reflejada aquí.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-thin">
              {pickupRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center"
                >
                  <div className="flex flex-col gap-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="font-bold text-slate-800 text-sm">
                        {req.itemTitle}
                      </strong>
                      <span className="text-[10px] bg-slate-200/60 text-slate-700 px-1.5 py-0.5 rounded font-mono font-semibold">
                        {CATEGORY_LABELS[req.category]}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          req.source === "donacion"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {req.source === "donacion"
                          ? "Solicitud de donación"
                          : "Retiro publicado"}
                      </span>
                    </div>
                    <div className="text-slate-500 font-medium flex flex-col gap-0.5 mt-1">
                      <span>
                        📅 Fecha programada:{" "}
                        <strong className="text-slate-700 font-semibold">
                          {req.date || "Por coordinar"}
                        </strong>
                      </span>
                      <span>
                        ⏰ Bloque de retiro:{" "}
                        <strong className="text-slate-700 font-semibold">
                          {req.timeSlot}
                        </strong>
                      </span>
                      <span>
                        📍 Dirección:{" "}
                        <strong className="text-slate-700 font-semibold">
                          {req.address}
                        </strong>
                      </span>
                    </div>
                    {req.notes && (
                      <div className="text-[11px] text-slate-500 mt-1">
                        Nota registrada:{" "}
                        <strong className="text-slate-700">{req.notes}</strong>
                      </div>
                    )}
                    {req.collectorName && (
                      <div className="text-[10px] text-emerald-700 font-bold font-mono mt-1 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                        Camión Asignado: {req.collectorName}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 items-end self-stretch sm:self-center">
                    {getStatusBadge(req.status)}
                    {req.status === "programado" && (
                      <span className="text-[10px] text-slate-400 font-semibold italic">
                        Pendiente de arribar
                      </span>
                    )}
                    {req.status === "en_ruta" && (
                      <span className="text-[10px] text-amber-600 font-bold animate-pulse font-mono flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" /> GPS
                        Camión activo
                      </span>
                    )}
                    {req.status === "completado" && (
                      <span className="text-[10px] text-emerald-600 font-bold font-mono">
                        ¡Material rescatado!
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-emerald-50 rounded-lg p-3 text-xs text-emerald-800 leading-normal border border-emerald-100 flex items-start gap-1.5">
            <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              <strong>Información de Seguridad:</strong> Exige siempre la
              credencial digital de ReCyClapp a la cuadrilla de transporte
              antes de permitir la entrada a tu hogar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
