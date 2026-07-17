"use client";

import { SyntheticEvent, useEffect, useMemo, useState } from "react";
import {
  Recycle,
  Sprout,
  Wrench,
  Heart,
  Award,
  MessageSquare,
} from "lucide-react";

import {
  Listing,
  ClaimListingInput,
  CreatePickupInput,
  CreateRepairInput,
  PickupRequest,
  RepairListingOption,
  RepairRequest,
  RepairWorkshopProfile,
  Notification,
  UserProfile,
  ItemCategory,
  PublishListingInput,
  ConversationSummary,
} from "./types";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import AuthModule from "./components/AuthModule";
import PublishModule from "./components/PublishModule";
import CatalogModule from "./components/CatalogModule";
import CollectionModule from "./components/CollectionModule";
import GeoModule from "./components/GeoModule";
import RepairModule from "./components/RepairModule";
import MessagingModule from "./components/MessagingModule";
import AdminPanel from "./components/AdminPanel";
import StatsModule from "./components/StatsModule";
import { CATEGORY_FALLBACK_IMAGES } from "../lib/listing-images";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const SESSION_STORAGE_KEY = "recyclapp.remembered-session";
const THEME_STORAGE_KEY = "recyclapp.theme-mode";

type ThemeMode = "light" | "dark";

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    title: "¡Bienvenido a ReCyClapp!",
    description:
      "Gracias por unirte al cambio ecológico. Puedes empezar publicando un mueble para donación o reciclaje hoy.",
    timestamp: "Hace 5 minutos",
    read: false,
    type: "success",
  },
  {
    id: "notif-2",
    title: "Tu solicitud de retiro fue asignada",
    description:
      "Nuestros recolectores confirmaron tu hora para el Refrigerador de Bilbao.",
    timestamp: "Hace 1 hora",
    read: false,
    type: "info",
  },
];

function formatNotificationTimestamp(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildMessageNotification(conversation: ConversationSummary): Notification | null {
  if (!conversation.unreadCount || !conversation.otherParticipant) {
    return null;
  }

  const senderName = conversation.otherParticipant.name.split(" ")[0] || "usuario";
  const pendingLabel =
    conversation.unreadCount === 1
      ? `Tienes 1 mensaje pendiente de ${senderName}.`
      : `Tienes ${conversation.unreadCount} mensajes pendientes de ${senderName}.`;
  const lastMessageLabel =
    conversation.lastMessage?.messageType === "LOCATION"
      ? "Última actualización: ubicación compartida."
      : conversation.lastMessage?.body || "Abre la mensajería para ver el contenido más reciente.";

  return {
    id: `message-${conversation.id}-${conversation.lastMessage?.id ?? conversation.lastActivityAt}`,
    title: `Mensaje pendiente de ${senderName}`,
    description: `${pendingLabel} ${lastMessageLabel}`,
    timestamp: formatNotificationTimestamp(conversation.lastActivityAt),
    read: false,
    type: "info",
    category: "message",
    targetTab: "mensajeria",
    targetConversationId: conversation.id,
  };
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [shouldPersistSession, setShouldPersistSession] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [listings, setListings] = useState<Listing[]>([]);
  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>([]);
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
  const [repairWorkshops, setRepairWorkshops] = useState<
    RepairWorkshopProfile[]
  >([]);
  const [featuredRepairWorkshops, setFeaturedRepairWorkshops] = useState<
    RepairWorkshopProfile[]
  >([]);
  const [notifications, setNotifications] = useState<Notification[]>(
    INITIAL_NOTIFICATIONS,
  );
  const [messageConversations, setMessageConversations] = useState<
    ConversationSummary[]
  >([]);
  const [seenMessageNotificationIds, setSeenMessageNotificationIds] = useState<
    string[]
  >([]);

  // HUD routing active tab
  const [activeTab, setActiveTab] = useState<string>("inicio");
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState<string | null>(null);

  // Form profile configs
  const [profileAddress, setProfileAddress] = useState(
    currentUser?.address || "",
  );
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || "");

  const refreshListings = async () => {
    try {
      setIsListingsLoading(true);
      setListingsError(null);

      const response = await fetch("/api/listings", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("No fue posible cargar las publicaciones.");
      }

      const payload = (await response.json()) as Listing[];
      setListings(payload);
      return payload;
    } catch (error) {
      console.error("Error cargando artículos:", error);
      setListingsError(
        "No se pudieron cargar los artículos desde la base de datos.",
      );
      return [];
    } finally {
      setIsListingsLoading(false);
    }
  };

  const messageNotifications = useMemo(() => {
    return messageConversations
      .map(buildMessageNotification)
      .filter((notification): notification is Notification => notification !== null)
      .map((notification) => ({
        ...notification,
        read: seenMessageNotificationIds.includes(notification.id),
      }));
  }, [messageConversations, seenMessageNotificationIds]);

  const combinedNotifications = useMemo(
    () => [...messageNotifications, ...notifications],
    [messageNotifications, notifications],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedSession = window.localStorage.getItem(SESSION_STORAGE_KEY);

    if (!storedSession) {
      return;
    }

    try {
      const parsedSession = JSON.parse(storedSession) as {
        user?: UserProfile;
      };

      if (!parsedSession.user) {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        return;
      }

      setCurrentUser(parsedSession.user);
      setProfileAddress(parsedSession.user.address);
      setProfilePhone(parsedSession.user.phone);
      setShouldPersistSession(true);
    } catch {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedThemeMode = window.localStorage.getItem(
      THEME_STORAGE_KEY,
    ) as ThemeMode | null;

    if (storedThemeMode === "light" || storedThemeMode === "dark") {
      setThemeMode(storedThemeMode);
      return;
    }

    const preferredThemeMode = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";

    setThemeMode(preferredThemeMode);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let isCancelled = false;

    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    document.documentElement.style.colorScheme = themeMode;

    const syncTheme = async () => {
      try {
        const DarkReader = await import("darkreader");

        if (isCancelled) {
          return;
        }

        DarkReader.setFetchMethod(window.fetch);

        if (themeMode === "dark") {
          DarkReader.enable(
            {
              brightness: 100,
              contrast: 95,
              sepia: 10,
              darkSchemeBackgroundColor: "#07131d",
              darkSchemeTextColor: "#e8f2f8",
            },
            {
              css: `
                img[alt="Logo ReCyClapp"],
                img[alt="ReCyClapp"] {
                  filter: none !important;
                }
              `,
              ignoreImageAnalysis: [
                'img[alt="Logo ReCyClapp"]',
                'img[alt="ReCyClapp"]',
              ],
              invert: [],
              ignoreInlineStyle: [],
              disableStyleSheetsProxy: true,
              ignoreCSSUrl: [
                "fonts.googleapis.com",
                "fonts.gstatic.com",
              ],
            },
          );
        } else {
          DarkReader.disable();
        }
      } catch (error) {
        console.warn("No fue posible aplicar DarkReader:", error);
      }
    };

    void syncTheme();

    return () => {
      isCancelled = true;
      void import("darkreader")
        .then((DarkReader) => {
          DarkReader.disable();
        })
        .catch(() => {
          // Ignoramos el cleanup si DarkReader no llegó a cargarse.
        });
    };
  }, [themeMode]);

  const loadPickupRequests = async (userId: string) => {
    const response = await fetch(
      `/api/pickups?userId=${encodeURIComponent(userId)}`,
    );

    if (!response.ok) {
      throw new Error("No fue posible cargar la agenda de recolecciones.");
    }

    const payload = (await response.json()) as PickupRequest[];
    setPickupRequests(payload);
    return payload;
  };

  const loadRepairDashboard = async (userId: string) => {
    const response = await fetch(
      `/api/repairs?userId=${encodeURIComponent(userId)}`,
    );

    if (!response.ok) {
      throw new Error("No fue posible cargar la información de reparaciones.");
    }

    const payload = (await response.json()) as {
      requests: RepairRequest[];
      workshops: RepairWorkshopProfile[];
      featuredWorkshops: RepairWorkshopProfile[];
    };

    setRepairRequests(payload.requests);
    setRepairWorkshops(payload.workshops);
    setFeaturedRepairWorkshops(payload.featuredWorkshops);
    return payload;
  };

  const loadConversationNotifications = async (userId: string) => {
    const response = await fetch(
      `/api/conversations?userId=${encodeURIComponent(userId)}`,
    );

    if (!response.ok) {
      throw new Error("No fue posible cargar las notificaciones de mensajes.");
    }

    const payload = (await response.json()) as {
      conversations?: ConversationSummary[];
    };

    setMessageConversations(payload.conversations ?? []);
    return payload.conversations ?? [];
  };

  useEffect(() => {
    let isCancelled = false;

    async function syncPickupRequests() {
      if (!currentUser?.id) {
        setPickupRequests([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/pickups?userId=${encodeURIComponent(currentUser.id)}`,
        );

        if (!response.ok) {
          throw new Error("No fue posible cargar la agenda de recolecciones.");
        }

        const payload = (await response.json()) as PickupRequest[];

        if (!isCancelled) {
          setPickupRequests(payload);
        }
      } catch (error) {
        console.error("Error cargando recolecciones:", error);

        if (!isCancelled) {
          setPickupRequests([]);
        }
      }
    }

    syncPickupRequests();

    return () => {
      isCancelled = true;
    };
  }, [currentUser?.id]);

  useEffect(() => {
    let isCancelled = false;

    async function syncRepairDashboard() {
      if (!currentUser?.id) {
        setRepairRequests([]);
        setRepairWorkshops([]);
        setFeaturedRepairWorkshops([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/repairs?userId=${encodeURIComponent(currentUser.id)}`,
        );

        if (!response.ok) {
          throw new Error(
            "No fue posible cargar la información de reparaciones.",
          );
        }

        const payload = (await response.json()) as {
          requests: RepairRequest[];
          workshops: RepairWorkshopProfile[];
          featuredWorkshops: RepairWorkshopProfile[];
        };

        if (!isCancelled) {
          setRepairRequests(payload.requests);
          setRepairWorkshops(payload.workshops);
          setFeaturedRepairWorkshops(payload.featuredWorkshops);
        }
      } catch (error) {
        console.error("Error cargando reparaciones:", error);

        if (!isCancelled) {
          setRepairRequests([]);
          setRepairWorkshops([]);
          setFeaturedRepairWorkshops([]);
        }
      }
    }

    syncRepairDashboard();

    return () => {
      isCancelled = true;
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (shouldPersistSession && currentUser) {
      window.localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ user: currentUser }),
      );
      return;
    }

    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }, [currentUser, shouldPersistSession]);

  useEffect(() => {
    setSeenMessageNotificationIds([]);

    if (!currentUser?.id) {
      setMessageConversations([]);
      return;
    }

    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    const refreshNotifications = async () => {
      try {
        const conversations = await loadConversationNotifications(currentUser.id);

        if (cancelled) {
          return;
        }

        setSeenMessageNotificationIds((previousIds) =>
          previousIds.filter((id) =>
            conversations.some((conversation) => {
              const notification = buildMessageNotification(conversation);
              return notification?.id === id;
            }),
          ),
        );
      } catch (error) {
        console.error("Error cargando notificaciones de mensajes:", error);

        if (!cancelled) {
          setMessageConversations([]);
        }
      }
    };

    void refreshNotifications();

    const conversationChannel = supabase
      .channel(`recyclapp-notifications-${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "recyclapp_schema",
          table: "t_mensaje_chat",
        },
        async () => {
          if (!cancelled) {
            await refreshNotifications();
          }
        },
      )
      .subscribe();

    const handleConversationSync = () => {
      void refreshNotifications();
    };

    window.addEventListener("recyclapp:conversation-sync", handleConversationSync);

    return () => {
      cancelled = true;
      window.removeEventListener(
        "recyclapp:conversation-sync",
        handleConversationSync,
      );
      void supabase.removeChannel(conversationChannel);
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser || typeof window === "undefined") {
      return;
    }

    if (!("geolocation" in navigator)) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await fetch("/api/location", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: currentUser.id,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracyMeters: position.coords.accuracy,
              source: "ACCESS",
            }),
          });
        } catch (error) {
          console.error("No fue posible registrar la ubicación de acceso:", error);
        }
      },
      (error) => {
        console.warn("Geolocalización no disponible al acceder:", error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  }, [currentUser]);

  useEffect(() => {
    let isCancelled = false;

    async function loadListings() {
      try {
        setIsListingsLoading(true);
        setListingsError(null);

        const response = await fetch("/api/listings");

        if (!response.ok) {
          throw new Error("No fue posible cargar las publicaciones.");
        }

        const payload = (await response.json()) as Listing[];

        if (!isCancelled) {
          setListings(payload);
        }
      } catch (error) {
        console.error("Error cargando artículos:", error);

        if (!isCancelled) {
          setListingsError(
            "No se pudieron cargar los artículos desde la base de datos.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsListingsLoading(false);
        }
      }
    }

    loadListings();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "articulos") {
      return;
    }

    void refreshListings();
  }, [activeTab]);

  // Notification action handler
  const handleReadNotification = (notification: Notification) => {
    if (notification.category === "message") {
      setSeenMessageNotificationIds((prev) =>
        prev.includes(notification.id) ? prev : [...prev, notification.id],
      );
      return;
    }

    setNotifications((prev: Notification[]) =>
      prev.map((n) =>
        n.id === notification.id ? { ...n, read: true } : n,
      ),
    );
  };

  const handleOpenNotification = (notification: Notification) => {
    if (notification.targetTab) {
      setActiveTab(notification.targetTab);
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("No fue posible cerrar la sesión de Supabase:", error);
    }

    setShouldPersistSession(false);
    setCurrentUser(null);
    setActiveTab("inicio");
    setMessageConversations([]);
    setSeenMessageNotificationIds([]);
    setNotifications((prev: Notification[]) => [
      {
        id: "logout-" + Date.now(),
        title: "Sesión cerrada",
        description: "Regresa pronto para seguir reduciendo residuos.",
        timestamp: "Ahora mismo",
        read: false,
        type: "info",
      },
      ...prev,
    ]);
  };

  const handleLogin = (user: UserProfile, rememberSession: boolean) => {
    setShouldPersistSession(rememberSession);
    setCurrentUser(user);
    setProfileAddress(user.address);
    setProfilePhone(user.phone);
    setShowAuthModal(false);
    void refreshListings();

    // Welcome message
    const welcomeNotif: Notification = {
      id: "welcome-back-" + Date.now(),
      title: `¡Sesión iniciada como ${user.email}!`,
      description: `Has ingresado con éxito con rol de ${user.role.toUpperCase()}.`,
      timestamp: "Ahora mismo",
      read: false,
      type: "success",
    };
    setNotifications((prev: Notification[]) => [welcomeNotif, ...prev]);
  };

  const handleListingImageError = (
    event: SyntheticEvent<HTMLImageElement>,
    category: ItemCategory,
  ) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = CATEGORY_FALLBACK_IMAGES[category];
  };

  // Listings interactions
  const handlePublishListing = async (newListing: PublishListingInput) => {
    const response = await fetch("/api/listings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newListing),
    });

    const payload = (await response.json()) as
      | { message?: string; listing?: Listing }
      | undefined;

    if (!response.ok || !payload?.listing) {
      throw new Error(
        payload?.message ??
          "No fue posible registrar el artículo en la base de datos.",
      );
    }

    const createdListing = payload.listing;

    // Add to state
    setListings((prev: Listing[]) => [createdListing, ...prev]);

    // Append auto-notification
    const pubNotif: Notification = {
      id: "pub-" + Date.now(),
      title: "Publicación activa",
      description: `Tu artículo "${createdListing.title}" ya quedó disponible en el catálogo.`,
      timestamp: "Hace unos segundos",
      read: false,
      type: "info",
    };
    setNotifications((prev: Notification[]) => [pubNotif, ...prev]);

    // Update user stats
    if (currentUser) {
      setCurrentUser((prev: UserProfile | null) => {
        if (!prev) return null;
        return {
          ...prev,
          recycledCount:
            createdListing.action === "reciclar"
              ? prev.recycledCount + 1
              : prev.recycledCount,
          donatedCount:
            createdListing.action === "donar"
              ? prev.donatedCount + 1
              : prev.donatedCount,
          repairedCount:
            createdListing.action === "reparar"
              ? prev.repairedCount + 1
              : prev.repairedCount,
          co2Saved:
            prev.co2Saved + (createdListing.action === "reciclar" ? 110 : 45),
        };
      });
    }
  };

  const handleClaimItem = async (listing: Listing, message: string) => {
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para solicitar una donación.");
    }

    const claimPayload: ClaimListingInput = {
      claimantId: currentUser.id,
      listingId: listing.id,
      message,
    };

    const response = await fetch("/api/claims", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(claimPayload),
    });

    const payload = (await response.json()) as { message?: string } | undefined;

    if (!response.ok) {
      throw new Error(
        payload?.message ??
          "No fue posible registrar la solicitud de donación.",
      );
    }

    setListings((prev: Listing[]) =>
      prev.map((listing: Listing) => {
        if (listing.id === claimPayload.listingId) {
          return { ...listing, isClaimed: true, claimedBy: currentUser?.id };
        }
        return listing;
      }),
    );

    await loadPickupRequests(currentUser.id);

    // Notification
    const claimNotif: Notification = {
      id: "claim-" + Date.now(),
      title: "¡Donación Solicitada!",
      description: `La solicitud del artículo "${listing.title}" ya quedó registrada y puedes seguirla en Recolecciones.`,
      timestamp: "Hace unos segundos",
      read: false,
      type: "success",
    };
    setNotifications((prev: Notification[]) => [claimNotif, ...prev]);
  };

  // Pickup interactions
  const handleAddPickup = async (newRequest: CreatePickupInput) => {
    const response = await fetch("/api/pickups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newRequest),
    });

    const payload = (await response.json()) as
      | { message?: string; pickup?: PickupRequest | null }
      | undefined;

    if (!response.ok) {
      throw new Error(
        payload?.message ??
          "No fue posible registrar la recolección en la base de datos.",
      );
    }

    if (currentUser) {
      await loadPickupRequests(currentUser.id);
    }

    // Add systems alerts
    const notif: Notification = {
      id: "pickup-add-" + Date.now(),
      title: "Colecta Programada",
      description: `Confirmamos el bloque horario de retiro para tu artículo programado.`,
      timestamp: "Hace unos segundos",
      read: false,
      type: "success",
    };
    setNotifications((prev: Notification[]) => [notif, ...prev]);
  };

  // Repair interactions
  const handleAddRepair = async (newRequest: CreateRepairInput) => {
    const response = await fetch("/api/repairs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newRequest),
    });

    const payload = (await response.json()) as
      | { message?: string; repair?: RepairRequest | null }
      | undefined;

    if (!response.ok) {
      throw new Error(
        payload?.message ??
          "No fue posible registrar la reparación en la base de datos.",
      );
    }

    if (currentUser) {
      await loadRepairDashboard(currentUser.id);
      setCurrentUser((prev) => {
        if (!prev) {
          return null;
        }

        return {
          ...prev,
          repairedCount: prev.repairedCount + 1,
        };
      });
    }

    // Alert info
    const notif: Notification = {
      id: "repair-add-" + Date.now(),
      title: "Presupuesto Solicitado",
      description:
        "Tu solicitud de reparación ya fue enviada al taller seleccionado.",
      timestamp: "Hace unos segundos",
      read: false,
      type: "info",
    };
    setNotifications((prev: Notification[]) => [notif, ...prev]);
  };

  // Admin interactions
  const handleApproveListing = (id: string) => {
    setListings((prev: Listing[]) =>
      prev.map((l: Listing) =>
        l.id === id ? { ...l, status: "aprobado" } : l,
      ),
    );

    const approved = listings.find((l: Listing) => l.id === id);
    const notif: Notification = {
      id: "admin-approve-" + Date.now(),
      title: "¡Publicación aprobada!",
      description: `La publicación "${approved?.title}" ha sido verificada y ahora es visible en el catálogo global.`,
      timestamp: "Ahora",
      read: false,
      type: "success",
    };
    setNotifications((prev: Notification[]) => [notif, ...prev]);
  };

  const handleRejectListing = (id: string) => {
    setListings((prev: Listing[]) => prev.filter((l: Listing) => l.id !== id));
  };

  const handleAssignCollector = (pickupId: string, collectorName: string) => {
    setPickupRequests((prev: PickupRequest[]) =>
      prev.map((p: PickupRequest) =>
        p.id === pickupId ? { ...p, status: "en_ruta", collectorName } : p,
      ),
    );
  };

  const CATEGORY_NAMES: Record<ItemCategory, string> = {
    muebles: "Muebles",
    electrodomesticos: "Electrodomésticos",
    electronicos: "Electrónicos",
    decoracion: "Decoración",
    oficina: "Oficina",
    otros: "Otros",
  };

  const userListings = currentUser
    ? listings.filter((listing) => listing.ownerId === currentUser.id)
    : [];
  const repairEligibleListings: RepairListingOption[] = userListings.map(
    (listing) => ({
      id: listing.id,
      title: listing.title,
      category: listing.category,
      location: listing.location,
      status: listing.status,
    }),
  );

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans flex flex-col justify-between transition-colors duration-300">
      {/* 1. Header Navigation */}
      <Navbar
        currentUser={currentUser}
        notifications={combinedNotifications}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onLoginClick={() => setShowAuthModal(true)}
        onNotificationRead={handleReadNotification}
        onNotificationOpen={handleOpenNotification}
        themeMode={themeMode}
        onThemeToggle={() =>
          setThemeMode((currentMode) =>
            currentMode === "light" ? "dark" : "light",
          )
        }
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-6">
          {(isListingsLoading || listingsError) && (
            <div
              className={`rounded-2xl border px-4 py-3 text-xs ${
                listingsError
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              {listingsError ??
                "Cargando artículos desde la base de datos de Supabase..."}
            </div>
          )}

          {/* Conditional warning banner about simulated actions */}
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-150 text-left flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                <Sprout className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 leading-tight">
                  Proyecto Piloto Comuna Ecológica ReCyClapp
                </h4>
                <p className="text-[11px] text-slate-500 leading-normal mt-0.5 max-w-xl">
                  Estás navegando la versión prototipo con autenticación
                  conectada a base de datos y módulos operativos todavía en
                  modo local para esta sesión.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!currentUser) {
                    setShowAuthModal(true);
                    return;
                  }

                  setActiveTab("mensajeria");
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3.5 py-1.5 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100 cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {currentUser ? "Abrir mensajería" : "Inicia sesión para mensajería"}
              </button>
            </div>
          </div>

          {/* TAB RENDERING ROUTER ENGINE */}
          <div className="animate-in fade-in duration-200">
            {activeTab === "inicio" && (
              <LandingPage
                onStartClick={() => {
                  if (!currentUser) setShowAuthModal(true);
                  else setActiveTab("publicar");
                }}
                onExploreClick={() => setActiveTab("articulos")}
              />
            )}

            {activeTab === "articulos" && (
              <CatalogModule
                listings={listings}
                currentUser={currentUser}
                onClaimItem={handleClaimItem}
                onLoginRequest={() => setShowAuthModal(true)}
              />
            )}

            {activeTab === "publicar" && (
              <PublishModule
                currentUser={currentUser}
                onPublish={handlePublishListing}
                onLoginRequest={() => setShowAuthModal(true)}
              />
            )}

            {activeTab === "recolecciones" && (
              <CollectionModule
                currentUser={currentUser}
                pickupRequests={pickupRequests}
                availableListings={userListings}
                onAddPickup={handleAddPickup}
                onLoginRequest={() => setShowAuthModal(true)}
              />
            )}

            {activeTab === "reparaciones" && (
              <RepairModule
                currentUser={currentUser}
                repairRequests={repairRequests}
                availableListings={repairEligibleListings}
                workshops={repairWorkshops}
                featuredWorkshops={featuredRepairWorkshops}
                onAddRepair={handleAddRepair}
                onLoginRequest={() => setShowAuthModal(true)}
              />
            )}

            {activeTab === "mensajeria" && (
              <MessagingModule
                currentUser={currentUser}
                onLoginRequest={() => setShowAuthModal(true)}
              />
            )}

            {activeTab === "centros" && (
              <GeoModule
                currentUser={currentUser}
                onLoginRequest={() => setShowAuthModal(true)}
              />
            )}

            {activeTab === "estadisticas" && (
              <StatsModule currentUser={currentUser} />
            )}

            {activeTab === "admin" && (
              <AdminPanel
                currentUser={currentUser}
                listings={listings}
                pickupRequests={pickupRequests}
                onApproveListing={handleApproveListing}
                onRejectListing={handleRejectListing}
                onAssignCollector={handleAssignCollector}
              />
            )}

            {/* USER PROFILE & LOGGED ACTIONS SECTION */}
            {activeTab === "perfil" && currentUser && (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs max-w-4xl mx-auto flex flex-col gap-8">
                  {/* Profile Header */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-slate-100 pb-6 text-center sm:text-left">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-20 h-20 rounded-full border-2 border-emerald-500 shadow-md p-1 bg-white shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2.5 justify-center sm:justify-start">
                        <h2 className="font-display font-bold text-slate-800 text-xl">
                          {currentUser.name}
                        </h2>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono tracking-wider uppercase font-extrabold shrink-0">
                          {currentUser.role.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-slate-450 text-xs mt-0.5">
                        {currentUser.email}
                      </p>

                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-600 justify-center sm:justify-start">
                        <span>
                          📍 Dirección:{" "}
                          <strong className="text-slate-800 font-semibold">
                            {currentUser.address}
                          </strong>
                        </span>
                        <span>
                          📞 Celular:{" "}
                          <strong className="text-slate-800 font-semibold">
                            {currentUser.phone}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Carbon Metrics scorecard */}
                  <div>
                    <h3 className="text-slate-800 font-display font-semibold text-sm mb-3">
                      Mi Consola de Descarbonización Comunal
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl">
                        <Award className="w-5 h-5 text-emerald-600 mb-1" />
                        <span className="block text-[10px] uppercase font-mono text-slate-400">
                          Puntaje de Carbono Rescatado
                        </span>
                        <div className="text-xl font-black font-mono text-slate-800 mt-0.5">
                          {currentUser.co2Saved || 0} kg
                        </div>
                        <span className="text-[10px] text-slate-500">
                          CO₂ evitado en su totalidad
                        </span>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl">
                        <Heart className="w-5 h-5 text-blue-600 mb-1" />
                        <span className="block text-[10px] uppercase font-mono text-slate-400">
                          Casos Asignados Donaciones
                        </span>
                        <div className="text-xl font-black font-mono text-slate-800 mt-0.5">
                          {currentUser.donatedCount || 0} items
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Muebles entregados con éxito
                        </span>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl">
                        <Recycle className="w-5 h-5 text-emerald-600 mb-1" />
                        <span className="block text-[10px] uppercase font-mono text-slate-400">
                          Total Materiales Reciclados
                        </span>
                        <div className="text-xl font-black font-mono text-slate-800 mt-0.5">
                          {currentUser.recycledCount || 0} unidades
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Metales y plásticos limpios
                        </span>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl">
                        <Wrench className="w-5 h-5 text-amber-600 mb-1" />
                        <span className="block text-[10px] uppercase font-mono text-slate-400">
                          Reparaciones en Curso
                        </span>
                        <div className="text-xl font-black font-mono text-slate-800 mt-0.5">
                          {currentUser.repairedCount || 0} talleres
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Dispositivos salvados del basurero
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* My listings history lists */}
                  <div>
                    <h3 className="text-slate-800 font-display font-semibold text-sm mb-3">
                      Historial de Publicaciones Registradas
                    </h3>

                    {listings.filter((l) => l.ownerId === currentUser.id)
                      .length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                        No has subido ningún artículo en esta sesión de
                        simulador todavía. Dirígete a la pestaña "Donar o
                        Reciclar" en el Menú superior.
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {listings
                          .filter((l) => l.ownerId === currentUser.id)
                          .map((listing) => (
                            <div
                              key={listing.id}
                              className="p-3.5 bg-slate-50 border border-slate-250/60 rounded-xl text-xs flex justify-between gap-4 items-center"
                            >
                              <div className="flex items-center gap-3 text-left">
                                  <img
                                    src={listing.image}
                                    alt={listing.title}
                                    onError={(event) =>
                                      handleListingImageError(event, listing.category)
                                    }
                                    className="w-12 h-10 object-cover rounded-md border border-slate-200"
                                  />
                                <div>
                                  <strong className="font-bold text-slate-800">
                                    {listing.title}
                                  </strong>
                                  <span className="block text-[10px] text-slate-500 mt-0.5">
                                    Destinado a:{" "}
                                    <strong className="text-emerald-700 capitalize">
                                      {listing.action}
                                    </strong>{" "}
                                    | {listing.createdAt}
                                  </span>
                                </div>
                              </div>

                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider font-mono uppercase ${
                                  listing.status === "aprobado"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                    : "bg-amber-100 text-amber-800 border-amber-200"
                                }`}
                              >
                                {listing.status}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Account detail settings simulation */}
                  <div className="border-t border-slate-100 pt-6">
                    <h3 className="text-slate-800 font-display font-semibold text-sm mb-3">
                      Configuración básica del Corriente
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label
                          className="text-xs font-bold text-slate-700"
                          htmlFor="address-input"
                        >
                          Cambiar Dirección Física Preferida
                        </label>
                        <input
                          id="address-input"
                          type="text"
                          title="Dirección física preferida"
                          placeholder="Ej: Avenida Providencia 1420, Santiago"
                          value={profileAddress}
                          onChange={(e) => setProfileAddress(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-emerald-500 text-xs"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          className="text-xs font-bold text-slate-700"
                          htmlFor="phone-input"
                        >
                          Teléfono Movil de Contacto
                        </label>
                        <input
                          id="phone-input"
                          type="text"
                          title="Número de teléfono de contacto"
                          placeholder="Ej: +56 9 1234 5678"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-emerald-500 text-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCurrentUser((prev) => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            address: profileAddress,
                            phone: profilePhone,
                          };
                        });
                        alert(
                          "¡Fantasutico! Tus datos de configuración física fueron guardados con éxito em LocalStorage simulation.",
                        );
                      }}
                      className="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Guardar Datos de Envío
                    </button>
                  </div>
                </div>
            )}
          </div>
        </div>
      </main>

      {/* 3. Footer Area */}
      <footer className="bg-slate-900 border-t border-slate-950 py-10 text-white font-sans text-xs shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col gap-3 text-left">
            <div className="flex items-center gap-2">
              <img
                src="/logos/logoRecyclapp.png"
                alt="Logo ReCyClapp"
                className="h-10 w-auto object-contain"
              />
              <img
                src="/logos/recyclappTexto.png"
                alt="ReCyClapp"
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="text-slate-400 leading-relaxed max-w-sm">
              Plataforma integradora para la descarbonización del hogar mediante
              la economía circular certificada de bienes de gran escala.
            </p>
          </div>

          <div className="text-left flex flex-col gap-3">
            <h4 className="font-bold text-slate-300 font-mono text-[10px] tracking-wider uppercase">
              Vistas Rápidas de la Demo
            </h4>
            <div className="grid grid-cols-2 gap-2 text-slate-400">
              <button
                onClick={() => setActiveTab("inicio")}
                className="hover:text-emerald-400 transition-colors text-left font-medium"
              >
                Inicio
              </button>
              <button
                onClick={() => setActiveTab("articulos")}
                className="hover:text-emerald-400 transition-colors text-left font-medium"
              >
                Ver Muebles
              </button>
              <button
                onClick={() => setActiveTab("recolecciones")}
                className="hover:text-emerald-400 transition-colors text-left font-medium"
              >
                Agendar Colectas
              </button>
              <button
                onClick={() => setActiveTab("centros")}
                className="hover:text-emerald-400 transition-colors text-left font-medium"
              >
                Mapa de Depósitos
              </button>
            </div>
          </div>

          <div className="text-left flex flex-col gap-3">
            <h4 className="font-bold text-slate-300 font-mono text-[10px] tracking-wider uppercase">
              Coordinación Operativa
            </h4>
            <p className="text-slate-400 leading-normal">
              Centraliza conversaciones con talleres, cuadrillas y centros para
              preparar el siguiente paso del flujo ciudadano.
            </p>
            <button
              onClick={() => {
                if (!currentUser) {
                  setShowAuthModal(true);
                  return;
                }

                setActiveTab("mensajeria");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="mt-1 px-4 py-2 bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-lg font-bold transition-all text-xs w-full text-center"
            >
              {currentUser
                ? "Abrir bandeja de mensajería"
                : "Iniciar sesión para coordinar"}
            </button>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800/60 pt-4 text-center text-slate-500 text-[10px] font-mono">
          ReCyClapp © 2026 | Arquitectura de Sistemas y Código Limpio para
          Municipios Circulares
        </div>
      </footer>

      {/* Login Authenticator Modal simulation */}
      {showAuthModal && (
        <AuthModule
          onLogin={handleLogin}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
