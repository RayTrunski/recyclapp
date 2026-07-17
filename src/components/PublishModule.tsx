import { useEffect, useRef, useState, FormEvent, ChangeEvent } from "react";
import { ArrowRight, ArrowLeft, Upload, Check, Sparkles, Sprout, Heart, Wrench, ShieldAlert } from "lucide-react";
import { PublishListingInput, ItemCategory, ItemState, ActionType, UserProfile } from "../types";
import { PUBLISH_PRESET_IMAGES } from "../../lib/listing-images";

interface PublishModuleProps {
  currentUser: UserProfile | null;
  onPublish: (listing: PublishListingInput) => Promise<void>;
  onLoginRequest: () => void;
}

const PRESET_MOCK_IMAGES = PUBLISH_PRESET_IMAGES;

function getFirstImageForCategory(category: ItemCategory) {
  return (
    PRESET_MOCK_IMAGES.find((image) => image.category === category)?.url ??
    PRESET_MOCK_IMAGES[0].url
  );
}

export default function PublishModule({ currentUser, onPublish, onLoginRequest }: PublishModuleProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ItemCategory>("muebles");
  const [state, setState] = useState<ItemState>("bueno");
  const [action, setAction] = useState<ActionType>("donar");
  const [description, setDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<string>(
    getFirstImageForCategory("muebles"),
  );
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [location, setLocation] = useState(currentUser?.address || "");
  const [pickupAvailable, setPickupAvailable] = useState(true);
  const [dateAvailable, setDateAvailable] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const categoryImages = PRESET_MOCK_IMAGES.filter((image) => image.category === category);
  const previewImage = uploadedPreviewUrl ?? selectedImage;
  const selectedMockLabel =
    categoryImages.find((image) => image.url === selectedImage)?.label ??
    "Imagen mock asignada";

  useEffect(() => {
    const selectedBelongsToCategory = categoryImages.some(
      (image) => image.url === selectedImage,
    );

    if (!selectedBelongsToCategory) {
      setSelectedImage(getFirstImageForCategory(category));
    }
  }, [category, categoryImages, selectedImage]);

  useEffect(() => {
    return () => {
      if (uploadedPreviewUrl) {
        URL.revokeObjectURL(uploadedPreviewUrl);
      }
    };
  }, [uploadedPreviewUrl]);

  if (!currentUser) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xs text-center max-w-lg mx-auto my-12 flex flex-col gap-6" id="publish-module-unauth">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-slate-800 text-lg">Inicia sesión para poder publicar</h3>
          <p className="text-slate-500 text-xs mt-2 leading-relaxed">
            Para garantizar la confiabilidad y el rastreo preciso del impacto ambiental de las donaciones y recolecciones rápidas, debes estar autenticado en ReCyClapp.
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

  const handleNext = () => {
    if (step === 1 && !title) {
      alert("Por favor ingresa un nombre o título para el artículo.");
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSelectPresetImage = (imageUrl: string) => {
    if (uploadedPreviewUrl) {
      URL.revokeObjectURL(uploadedPreviewUrl);
      setUploadedPreviewUrl(null);
      setUploadedFileName(null);
    }

    setSelectedImage(imageUrl);
  };

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (uploadedPreviewUrl) {
      URL.revokeObjectURL(uploadedPreviewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setUploadedPreviewUrl(objectUrl);
    setUploadedFileName(file.name);
    setSubmitError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!location) {
      alert("Por favor ingresa una dirección física.");
      return;
    }

    const newListing: PublishListingInput = {
      ownerId: currentUser.id,
      title,
      category,
      description,
      state,
      action,
      image: selectedImage,
      location,
      pickupAvailable,
      dateAvailable: dateAvailable || new Date().toISOString().split("T")[0],
    };

    try {
      setIsSubmitting(true);
      await onPublish(newListing);
      setSuccess(true);
      setStep(1);

      if (uploadedPreviewUrl) {
        URL.revokeObjectURL(uploadedPreviewUrl);
      }

      setTitle("");
      setCategory("muebles");
      setState("bueno");
      setAction("donar");
      setDescription("");
      setSelectedImage(getFirstImageForCategory("muebles"));
      setUploadedPreviewUrl(null);
      setUploadedFileName(null);
      setLocation(currentUser.address || "");
      setPickupAvailable(true);
      setDateAvailable("");
    } catch (error) {
      console.error("Error publicando artículo:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "No fue posible registrar el artículo en la base de datos.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" id="publish-module-component">
      
      {/* Top indicator bar */}
      <div className="bg-linear-to-r from-emerald-700 to-emerald-800 text-white px-6 py-6 text-left">
        <span className="text-[9px] uppercase tracking-wider font-mono text-emerald-300">Modulo de Publicación de Artículos</span>
        <h2 className="font-display text-xl font-bold mt-1">Registra Muebles o Electrodomésticos</h2>
        <p className="text-xs text-emerald-100 mt-1">Sigue los sencillos pasos para reincorporar estos artículos a la economía circular.</p>
      </div>

      {success ? (
        <div className="p-8 text-center flex flex-col gap-6 items-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-pulse">
            <Check className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-slate-800 text-lg">publicación Subida con Éxito</h3>
            <p className="text-slate-500 text-xs mt-2 leading-relaxed max-w-sm mx-auto">
              ¡Excelente trabajo! Tu artículo ya quedó registrado con estado <strong className="text-emerald-700">Aprobado</strong> y aparece de inmediato en el catálogo para esta demo.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setSuccess(false)}
              className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Publicar otro objeto
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 text-left">
          {submitError && (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
              {submitError}
            </div>
          )}
          
          {/* Step Progress indicators */}
          <div className="flex items-center justify-between mb-6 text-xs text-slate-400 font-mono">
            <span className={step === 1 ? "text-emerald-600 font-bold" : ""}>1. Datos básicos</span>
            <div className="h-px bg-slate-100 flex-1 mx-4" />
            <span className={step === 2 ? "text-emerald-600 font-bold" : ""}>2. Galería & Destino</span>
            <div className="h-px bg-slate-100 flex-1 mx-4" />
            <span className={step === 3 ? "text-emerald-600 font-bold" : ""}>3. Logística</span>
          </div>

          {/* STEP 1: GENERAL INFO */}
          {step === 1 && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-100">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Nombre o Título del Artículo *</label>
                <input
                  type="text"
                  placeholder="Ej. Sofá modular 3 cuerpos, Microondas Philips"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-emerald-500 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Categoría del Artículo</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ItemCategory)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-emerald-500 text-xs bg-white text-slate-700"
                  >
                    <option value="muebles">Muebles de Hogar</option>
                    <option value="electrodomesticos">Electrodomésticos</option>
                    <option value="electronicos">Electrónicos y TV</option>
                    <option value="decoracion">Decoración y Hogar</option>
                    <option value="oficina">Muebles de Oficina</option>
                    <option value="otros">Otros residuales</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Estado del Objeto</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value as ItemState)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-emerald-500 text-xs bg-white text-slate-700"
                  >
                    <option value="nuevo">Nuevo / Sellado</option>
                    <option value="bueno">Excelente Estado / Usable</option>
                    <option value="desgastado">Desgastado pero Usable</option>
                    <option value="dañado">Dañado (Requiere Reparación)</option>
                    <option value="inservible">Inservible o Chatarra (Reciclaje)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Descripción Corta / Detalles</label>
                <textarea
                  placeholder="Cuéntanos si tiene detalles de tapizado, si funciona perfectamente o partes rotas..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-emerald-500 text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-200 mt-2 cursor-pointer"
              >
                <span>Continuar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* STEP 2: IMAGES AND ACTIONS */}
          {step === 2 && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-100">
              
              {/* Action type */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700">¿Qué tipo de proceso deseas para este objeto?</label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAction("donar")}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                      action === "donar"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <Heart className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-bold block">Donación Social</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAction("reciclar")}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                      action === "reciclar"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <Sprout className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-bold block">Reciclar Materiales</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAction("reparar")}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                      action === "reparar"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <Wrench className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-bold block">Reparar / Taller</span>
                  </button>
                </div>
              </div>

              {/* Photos presets */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-bold text-slate-700">Foto del Objeto (Selección rápida / Simulador de cámara )</label>
                <p className="text-[10px] text-slate-400">Te mostramos fotos mock de la categoría elegida para que la vista previa corresponda mejor con tu artículo:</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {categoryImages.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectPresetImage(img.url)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 bg-slate-50 transition-all shrink-0 ${
                        selectedImage === img.url ? "border-emerald-500 scale-102 shadow-xs" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                
                {/* Image preview banner */}
                <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-100 shadow-xs max-h-40">
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-slate-900/40 backdrop-blur-xs p-2 text-white text-[10px] flex items-center justify-between">
                    <div className="flex flex-col">
                      <span>{uploadedFileName ?? selectedMockLabel}</span>
                      <span className="text-[9px] text-white/80">
                        Al publicar se guardará la imagen mock: {selectedMockLabel}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold"
                    >
                      Cambiar foto
                    </button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelection}
                />
                <p className="text-[10px] text-slate-500">
                  Prototipo: si eliges un archivo local, se usa solo como vista previa. La publicación guardará la imagen mock seleccionada arriba.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Atrás</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-200 cursor-pointer"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )}

          {/* STEP 3: LOGISTICS */}
          {step === 3 && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-100">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Dirección de Recolección *</label>
                <input
                  type="text"
                  placeholder="Ej. Av. Nueva Providencia 2250, Santiago"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-emerald-500 text-xs"
                  required
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 flex flex-col gap-2.5">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pickupAvailable}
                    onChange={(e) => setPickupAvailable(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Requiero recolección a domicilio programada en camión</span>
                </label>
                <p className="text-[10px] text-slate-500 leading-normal pl-5">
                  Si marcas esta opción, el artículo aparecerá en la grilla para que un Eco-Collector asigne rutas de retiro. De lo contrario, indica que lo llevarás tú mismo al punto verde cercano.
                </p>
              </div>

              {pickupAvailable && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Fecha de disponibilidad para colecta</label>
                  <input
                    type="date"
                    value={dateAvailable}
                    onChange={(e) => setDateAvailable(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-emerald-500 text-xs text-slate-700"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Atrás</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-200 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Registrando..." : "Publicar Ahora"}</span>
                </button>
              </div>

            </div>
          )}

        </form>
      )}

    </div>
  );
}
