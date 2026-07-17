import { SyntheticEvent, useState } from "react";
import { Search, Heart, Info, Eye, Check, ShoppingBag, Sprout, Wrench, ChevronRight } from "lucide-react";
import { Listing, ItemCategory, ActionType, UserProfile } from "../types";
import { CATEGORY_FALLBACK_IMAGES } from "../../lib/listing-images";

interface CatalogModuleProps {
  listings: Listing[];
  currentUser: UserProfile | null;
  onClaimItem: (listing: Listing, message: string) => Promise<void>;
  onLoginRequest: () => void;
}

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  muebles: "Muebles",
  electrodomesticos: "Electrodomésticos",
  electronicos: "Electrónicos",
  decoracion: "Decoración",
  oficina: "Oficina",
  otros: "Otros"
};

export default function CatalogModule({ listings, currentUser, onClaimItem, onLoginRequest }: CatalogModuleProps) {
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | "all">("all");
  const [selectedAction, setSelectedAction] = useState<ActionType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeItemDetails, setActiveItemDetails] = useState<Listing | null>(null);
  const [claimingItem, setClaimingItem] = useState<Listing | null>(null);
  const [claimMessage, setClaimMessage] = useState("");
  const [claimError, setClaimError] = useState("");
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [isInspectingImage, setIsInspectingImage] = useState(false);
  const [detailImageFit, setDetailImageFit] = useState<"contain" | "cover">("contain");

  const handleImageError = (
    event: SyntheticEvent<HTMLImageElement>,
    category: ItemCategory,
  ) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = CATEGORY_FALLBACK_IMAGES[category];
  };

  // Filter listings
  const filteredListings = listings.filter((listing) => {
    // Category match
    if (selectedCategory !== "all" && listing.category !== selectedCategory) return false;
    // Action match
    if (selectedAction !== "all" && listing.action !== selectedAction) return false;
    // Status approved only/pending unless is owner
    if (listing.status !== "aprobado" && listing.ownerId !== currentUser?.id) return false;
    // Search match
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        listing.title.toLowerCase().includes(q) ||
        listing.description.toLowerCase().includes(q) ||
        listing.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getActionBadge = (action: ActionType) => {
    switch (action) {
      case "donar":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 flex items-center gap-1"><Heart className="w-2.5 h-2.5" /> Donación</span>;
      case "reciclar":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 flex items-center gap-1"><Sprout className="w-2.5 h-2.5" /> Reciclaje</span>;
      case "reparar":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 flex items-center gap-1"><Wrench className="w-2.5 h-2.5" /> Reparar</span>;
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case "nuevo": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "bueno": return "bg-teal-100 text-teal-800 border-teal-200";
      case "desgastado": return "bg-slate-100 text-slate-700 border-slate-200";
      case "dañado": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-red-100 text-red-800 border-red-200";
    }
  };

  const handleClaimRequest = (listing: Listing) => {
    if (!currentUser) {
      onLoginRequest();
      return;
    }

    setClaimError("");
    setClaimMessage("");
    setClaimingItem(listing);
  };

  const handleCloseClaimModal = () => {
    if (isSubmittingClaim) {
      return;
    }

    setClaimingItem(null);
    setClaimMessage("");
    setClaimError("");
  };

  const handleConfirmClaim = async () => {
    if (!claimingItem) {
      return;
    }

    try {
      setIsSubmittingClaim(true);
      setClaimError("");
      await onClaimItem(claimingItem, claimMessage);
      setClaimingItem(null);
      setClaimMessage("");
      setActiveItemDetails(null);
    } catch (error) {
      console.error("Error solicitando donación:", error);
      setClaimError(
        error instanceof Error
          ? error.message
          : "No fue posible registrar la solicitud de donación.",
      );
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const handleOpenDetails = (listing: Listing) => {
    setIsInspectingImage(false);
    setDetailImageFit("contain");
    setActiveItemDetails(listing);
  };

  const handleCloseDetails = () => {
    setIsInspectingImage(false);
    setActiveItemDetails(null);
  };

  const handleDetailImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;

    if (!naturalWidth || !naturalHeight) {
      setDetailImageFit("contain");
      return;
    }

    const aspectRatio = naturalWidth / naturalHeight;

    setDetailImageFit(aspectRatio >= 0.55 ? "cover" : "contain");
  };

  return (
    <div className="flex flex-col gap-8 text-left" id="catalog-module-component">
      
      {/* 1. Filtering HUD */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-4">
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-800">Catálogo de Bienes Activos</h2>
            <p className="text-xs text-slate-500">Explora muebles o equipos listos para ser donados o reciclados en tu zona.</p>
          </div>
          
          {/* Search */}
          <div className="relative w-full max-w-sm">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar sofá, comedor, refrigerador, comunas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-emerald-500 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Categories Pills */}
        <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center gap-1.5 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === "all"
                ? "bg-slate-800 text-white"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Todos
          </button>
          {(Object.keys(CATEGORY_LABELS) as ItemCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Action filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-450 mr-2">Filtrar flujo:</span>
          <button
            onClick={() => setSelectedAction("all")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedAction === "all" ? "bg-emerald-100 text-emerald-800" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setSelectedAction("donar")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedAction === "donar" ? "bg-blue-100 text-blue-800" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
            }`}
          >
            Apto Donar
          </button>
          <button
            onClick={() => setSelectedAction("reciclar")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedAction === "reciclar" ? "bg-emerald-100 text-emerald-800" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
            }`}
          >
            Apto Reciclar
          </button>
          <button
            onClick={() => setSelectedAction("reparar")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedAction === "reparar" ? "bg-amber-100 text-amber-800" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
            }`}
          >
            En Reparación
          </button>
        </div>

      </div>

      {/* 2. Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 text-center flex flex-col gap-4 items-center">
          <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-display font-semibold text-slate-800">No se encontraron artículos activos</h4>
            <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
              Prueba cambiando los filtros de categoría o buscando un término alternativo. Las publicaciones del autor siempre son accesibles para supervisión.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredListings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-emerald-200 shadow-xs transition-all flex flex-col justify-between"
            >
              
              {/* Card Image */}
              <div className="relative aspect-video bg-slate-50 overflow-hidden">
                <img
                  src={listing.image}
                  alt={listing.title}
                  onError={(event) => handleImageError(event, listing.category)}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                />
                
                {/* Custom absolute indicators */}
                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
                  {getActionBadge(listing.action)}
                </div>

                <div className="absolute bottom-2 left-2 flex gap-1">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold text-left shrink-0 font-mono ${getStateColor(listing.state)}`}>
                    Estado: {listing.state.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-display font-bold text-slate-800 text-sm line-clamp-1">{listing.title}</h3>
                    {listing.ownerId === currentUser?.id && (
                      <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold uppercase shrink-0 font-mono">
                        Propio
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs line-clamp-2 mt-1 px-0.5">{listing.description || "Sin descripción proporcionada."}</p>
                </div>

                <div>
                  {/* Location and Info block */}
                  <div className="text-[10px] text-slate-400 font-medium flex flex-col gap-1">
                    <span>📍 Ubicación: <strong className="text-slate-600 font-semibold">{listing.location}</strong></span>
                    <span>👤 Donador: <strong className="text-slate-600 font-semibold">{listing.ownerName}</strong></span>
                  </div>

                  <div className="h-px bg-slate-50 my-2.5" />

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenDetails(listing)}
                      className="flex-1 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ficha</span>
                    </button>

                    <button
                      onClick={() => handleClaimRequest(listing)}
                      disabled={listing.isClaimed}
                      className={`flex-2 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        listing.isClaimed
                          ? "bg-slate-150 text-slate-400 cursor-not-allowed"
                          : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                      }`}
                    >
                      {listing.isClaimed ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-slate-400" />
                          <span>Reclamado</span>
                        </>
                      ) : (
                        <span>Solicitar donación</span>
                      )}
                    </button>

                  </div>

                </div>

              </div>

            </div>
          ))}
        </div>
      )}

      {/* 3. Detail Dialog simulation */}
      {activeItemDetails && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 text-left"
          onClick={handleCloseDetails}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-120"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative flex items-center justify-center bg-slate-950 min-h-[280px] max-h-[52vh] overflow-hidden">
              <img
                src={activeItemDetails.image}
                alt=""
                aria-hidden="true"
                onError={(event) => handleImageError(event, activeItemDetails.category)}
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-2xl"
              />
              <div className="absolute inset-0 bg-linear-to-b from-slate-900/10 via-slate-900/20 to-slate-950/35" />
                <img
                  src={activeItemDetails.image}
                  alt={activeItemDetails.title}
                  onLoad={handleDetailImageLoad}
                  onError={(event) => handleImageError(event, activeItemDetails.category)}
                  onClick={() => setIsInspectingImage(true)}
                  className={`relative z-10 h-full w-full ${
                    detailImageFit === "cover"
                      ? "max-h-[52vh] object-cover object-center"
                      : "max-h-[52vh] object-contain object-center"
                  } cursor-zoom-in`}
                />
              <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-slate-950/65 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur-xs">
                Clic en la imagen para ampliarla
              </div>
              <button
                onClick={handleCloseDetails}
                className="absolute top-4 right-4 z-20 bg-slate-900/60 hover:bg-slate-900/80 text-white p-1.5 rounded-full text-xs font-bold leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] text-emerald-600 font-mono font-bold uppercase block tracking-wider">
                    {CATEGORY_LABELS[activeItemDetails.category]}
                  </span>
                  <h3 className="font-display font-bold text-slate-800 text-lg leading-tight mt-0.5">{activeItemDetails.title}</h3>
                </div>
                {getActionBadge(activeItemDetails.action)}
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 block">Descripción del Artículo:</span>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  {activeItemDetails.description || "Este mueble u electrodoméstico ha sido catalogado por su propietario para que pueda ser reinsertado voluntariamente de manera óptima."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block">Detalles de Estado:</span>
                  <span className={`inline-block px-2 py-0.5 rounded border mt-1 font-mono font-bold text-[10px] ${getStateColor(activeItemDetails.state)}`}>
                    {activeItemDetails.state.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block">Logística de Entrega:</span>
                  <span className="text-slate-500 text-[11px] block mt-1">
                    {activeItemDetails.pickupAvailable ? "🚚 Recolección programada ReCyClapp" : "🏡 Retiro directo por cuenta propia"}
                  </span>
                </div>
              </div>

              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-xs text-emerald-800 leading-normal flex flex-col gap-1.5">
                <span className="font-bold block">👤 Información de Contacto / Registro:</span>
                <div>Nombre: <strong className="font-semibold text-emerald-950">{activeItemDetails.ownerName}</strong></div>
                <div>Teléfono de contacto directo: <strong className="font-mono text-emerald-950">{activeItemDetails.ownerContact}</strong></div>
                <div>Comuna / Retiro: <strong className="font-semibold text-emerald-950">{activeItemDetails.location}</strong></div>
              </div>

              <div className="flex gap-2 justify-end mt-2">
                <button
                  type="button"
                  onClick={handleCloseDetails}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleClaimRequest(activeItemDetails);
                    if (currentUser && !activeItemDetails.isClaimed) {
                      setActiveItemDetails(null);
                    }
                  }}
                  disabled={activeItemDetails.isClaimed}
                  className={`px-4 py-2 rounded-lg text-xs font-bold shadow-xs ${
                    activeItemDetails.isClaimed
                      ? "bg-slate-150 text-slate-400 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {activeItemDetails.isClaimed
                    ? "Artículo ya solicitado"
                    : "Solicitar este artículo"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {activeItemDetails && isInspectingImage && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/92 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsInspectingImage(false)}
        >
          <button
            type="button"
            onClick={() => setIsInspectingImage(false)}
            className="absolute top-5 right-5 z-10 rounded-full bg-slate-900/70 px-3 py-2 text-sm font-bold text-white hover:bg-slate-900"
          >
            ✕
          </button>
          <img
            src={activeItemDetails.image}
            alt={activeItemDetails.title}
            onClick={(event) => event.stopPropagation()}
            onError={(event) => handleImageError(event, activeItemDetails.category)}
            className="max-h-[92vh] max-w-[92vw] object-contain object-center rounded-xl shadow-2xl"
          />
        </div>
      )}

      {claimingItem && (
        <div
          className="fixed inset-0 z-[70] bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={handleCloseClaimModal}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-emerald-600">
                  Solicitar artículo
                </span>
                <h3 className="mt-1 font-display text-lg font-bold text-slate-800">
                  {claimingItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseClaimModal}
                className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600 leading-relaxed">
              <div>
                Donador: <strong className="text-slate-800">{claimingItem.ownerName}</strong>
              </div>
              <div>
                Punto de entrega o retiro: <strong className="text-slate-800">{claimingItem.location}</strong>
              </div>
              <div>
                Logística actual:{" "}
                <strong className="text-slate-800">
                  {claimingItem.pickupAvailable
                    ? "Recolección coordinada por ReCyClapp"
                    : "Entrega directa con el propietario"}
                </strong>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Mensaje para coordinar la recepción
              </label>
              <textarea
                rows={4}
                value={claimMessage}
                onChange={(event) => setClaimMessage(event.target.value)}
                placeholder="Ej. puedo recibirlo el sábado por la tarde, tengo ayuda para cargarlo..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-emerald-500"
                disabled={isSubmittingClaim}
              />
            </div>

            {claimError && (
              <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {claimError}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseClaimModal}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                disabled={isSubmittingClaim}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClaim}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:bg-emerald-300"
                disabled={isSubmittingClaim}
              >
                {isSubmittingClaim ? "Registrando..." : "Confirmar solicitud"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
