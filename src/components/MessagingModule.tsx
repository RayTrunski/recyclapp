import { FormEvent, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Clock3,
  LoaderCircle,
  LocateFixed,
  MapPin,
  MessageSquare,
  Radio,
  Send,
  ShieldCheck,
  UserRound,
  Wrench,
  X,
} from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  ConversationDetail,
  ConversationMessageRecord,
  ConversationSummary,
  UserLocationSnapshot,
  UserProfile,
} from "../types";

const SharedLocationMap = dynamic(() => import("./SharedLocationMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] items-center justify-center text-sm text-slate-500">
      Cargando mapa...
    </div>
  ),
});

interface MessagingModuleProps {
  currentUser: UserProfile | null;
  onLoginRequest: () => void;
}

type ConversationListResponse = {
  conversations: ConversationSummary[];
};

type ConversationDetailResponse = {
  conversation: ConversationDetail;
};

type PresenceState = Record<
  string,
  Array<{
    userId?: string;
    name?: string;
    onlineAt?: string;
  }>
>;

function formatAbsoluteDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatShortTime(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function buildMessagePreview(conversation: ConversationSummary) {
  if (!conversation.lastMessage) {
    return "Conversación lista para coordinar acción.";
  }

  if (conversation.lastMessage.messageType === "LOCATION") {
    return "Ubicación compartida lista para abrir en mapa.";
  }

  return conversation.lastMessage.body || "Mensaje sin contenido visible.";
}

function getConversationAccent(subject: string) {
  const normalized = subject.toLowerCase();

  if (normalized.includes("repar")) {
    return "bg-amber-50 text-amber-900 border-amber-100";
  }

  if (normalized.includes("donaci") || normalized.includes("solicitud")) {
    return "bg-blue-50 text-blue-900 border-blue-100";
  }

  return "bg-emerald-50 text-emerald-800 border-emerald-100";
}

function getConversationIcon(subject: string) {
  const normalized = subject.toLowerCase();

  if (normalized.includes("repar")) {
    return Wrench;
  }

  if (normalized.includes("ubic")) {
    return MapPin;
  }

  return ShieldCheck;
}

function formatCoordinate(value: number) {
  return value.toFixed(5);
}

function readApiError(payload: unknown, fallbackMessage: string) {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return fallbackMessage;
}

function extractCreatedMessageId(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    payload.message &&
    typeof payload.message === "object" &&
    "id" in payload.message &&
    typeof payload.message.id === "string"
  ) {
    return payload.message.id;
  }

  return "";
}

function sameCoordinates(
  first:
    | {
        latitude: number;
        longitude: number;
      }
    | null
    | undefined,
  second:
    | {
        latitude: number;
        longitude: number;
      }
    | null
    | undefined,
) {
  if (!first || !second) {
    return false;
  }

  return (
    Math.abs(first.latitude - second.latitude) < 0.00001 &&
    Math.abs(first.longitude - second.longitude) < 0.00001
  );
}

function buildLocationSummary(
  location: UserLocationSnapshot | ConversationMessageRecord["location"],
) {
  if (!location) {
    return "Sin ubicación disponible.";
  }

  return `Lat ${formatCoordinate(location.latitude)} · Lng ${formatCoordinate(location.longitude)}`;
}

function notifyConversationStateChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event("recyclapp:conversation-sync"));
}

export default function MessagingModule({
  currentUser,
  onLoginRequest,
}: MessagingModuleProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [activeConversation, setActiveConversation] =
    useState<ConversationDetail | null>(null);
  const [selectedLocationMessageId, setSelectedLocationMessageId] =
    useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [realtimeReady, setRealtimeReady] = useState(true);
  const [onlineParticipantIds, setOnlineParticipantIds] = useState<string[]>(
    [],
  );

  async function loadConversations(userId: string) {
    const response = await fetch(
      `/api/conversations?userId=${encodeURIComponent(userId)}`,
    );
    const payload = (await response.json()) as
      | ConversationListResponse
      | { message?: string };

    if (!response.ok || !("conversations" in payload)) {
      throw new Error(
        ("message" in payload && payload.message) ||
          "No fue posible cargar la bandeja de mensajes.",
      );
    }

    setConversations(payload.conversations);
    setSelectedConversationId((currentSelectedId) => {
      if (
        currentSelectedId &&
        payload.conversations.some(
          (conversation) => conversation.id === currentSelectedId,
        )
      ) {
        return currentSelectedId;
      }

      return payload.conversations[0]?.id ?? "";
    });
  }

  async function loadConversationDetail(
    userId: string,
    conversationId: string,
  ) {
    const response = await fetch(
      `/api/conversations/${conversationId}?userId=${encodeURIComponent(userId)}`,
    );
    const payload = (await response.json()) as
      | ConversationDetailResponse
      | { message?: string };

    if (!response.ok || !("conversation" in payload)) {
      throw new Error(
        ("message" in payload && payload.message) ||
          "No fue posible cargar el detalle del hilo.",
      );
    }

    setActiveConversation(payload.conversation);

    if (payload.conversation.unreadCount > 0) {
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      notifyConversationStateChanged();
    }
  }

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        await loadConversations(currentUser.id);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "No fue posible cargar la mensajería.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  useEffect(() => {
    setSelectedLocationMessageId("");
  }, [selectedConversationId]);

  useEffect(() => {
    if (!currentUser || !selectedConversationId) {
      setActiveConversation(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        await loadConversationDetail(currentUser.id, selectedConversationId);
        await loadConversations(currentUser.id);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "No fue posible cargar el hilo seleccionado.",
          );
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [currentUser, selectedConversationId]);

  useEffect(() => {
    if (!activeConversation || !selectedLocationMessageId) {
      return;
    }

    const stillExists = activeConversation.messages.some(
      (message) =>
        message.id === selectedLocationMessageId && message.location != null,
    );

    if (!stillExists) {
      setSelectedLocationMessageId("");
    }
  }, [activeConversation, selectedLocationMessageId]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    let isMounted = true;

    const messageChannel = supabase
      .channel(`recyclapp-conversations-${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "recyclapp_schema",
          table: "t_mensaje_chat",
        },
        async () => {
          if (!isMounted) {
            return;
          }

          await loadConversations(currentUser.id);

          if (selectedConversationId) {
            await loadConversationDetail(
              currentUser.id,
              selectedConversationId,
            );
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "recyclapp_schema",
          table: "d_ubicacion_usuario_actual",
        },
        async () => {
          if (!isMounted || !selectedConversationId) {
            return;
          }

          await loadConversationDetail(currentUser.id, selectedConversationId);
        },
      )
      .subscribe(async (status) => {
        if (!isMounted) {
          return;
        }

        if (status === "SUBSCRIBED") {
          setRealtimeReady(true);
          return;
        }

        if (status === "CHANNEL_ERROR") {
          const { data } = await supabase.auth.getSession();
          setRealtimeReady(Boolean(data.session));
        }
      });

    return () => {
      isMounted = false;
      void supabase.removeChannel(messageChannel);
    };
  }, [currentUser, selectedConversationId, supabase]);

  useEffect(() => {
    if (!currentUser || !selectedConversationId) {
      setOnlineParticipantIds([]);
      return;
    }

    const channel = supabase.channel(`conversation:${selectedConversationId}`, {
      config: {
        private: true,
        presence: {
          key: currentUser.id,
        },
      },
    });

    const syncPresence = () => {
      const state = channel.presenceState() as PresenceState;
      setOnlineParticipantIds(Object.keys(state));
    };

    channel
      .on("presence", { event: "sync" }, syncPresence)
      .on("presence", { event: "join" }, syncPresence)
      .on("presence", { event: "leave" }, syncPresence)
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") {
          return;
        }

        await channel.track({
          userId: currentUser.id,
          name: currentUser.name,
          onlineAt: new Date().toISOString(),
        });
      });

    return () => {
      void channel.untrack();
      void supabase.removeChannel(channel);
      setOnlineParticipantIds([]);
    };
  }, [currentUser, selectedConversationId, supabase]);

  const activeSummary = conversations.find(
    (conversation) => conversation.id === selectedConversationId,
  );
  const peerParticipant = activeConversation?.participants.find(
    (participant) => participant.userId !== currentUser?.id,
  );
  const locationMessages =
    activeConversation?.messages.filter((message) => message.location) ?? [];
  const selectedLocationMessage =
    activeConversation?.messages.find(
      (message) =>
        message.id === selectedLocationMessageId && message.location != null,
    ) ?? null;
  const selectedLocationParticipant =
    activeConversation?.participants.find(
      (participant) =>
        participant.userId === selectedLocationMessage?.senderUserId,
    ) ?? null;
  const selectedSenderLastLocation =
    selectedLocationParticipant?.lastLocation ?? null;
  const showLatestSenderMarker =
    Boolean(selectedLocationMessage?.location) &&
    Boolean(selectedSenderLastLocation) &&
    !sameCoordinates(
      selectedLocationMessage?.location,
      selectedSenderLastLocation,
    );

  useEffect(() => {
    if (!selectedLocationMessageId) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedLocationMessageId("");
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectedLocationMessageId]);

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();

    if (!currentUser || !selectedConversationId || !draftMessage.trim()) {
      return;
    }

    setIsSending(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/conversations/${selectedConversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUser.id,
            body: draftMessage.trim(),
            messageType: "TEXT",
          }),
        },
      );

      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        throw new Error(
          readApiError(payload, "No fue posible enviar el mensaje de texto."),
        );
      }

      setDraftMessage("");
      await loadConversations(currentUser.id);
      await loadConversationDetail(currentUser.id, selectedConversationId);
      notifyConversationStateChanged();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No fue posible enviar el mensaje.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleShareLocation = async () => {
    if (!currentUser || !selectedConversationId) {
      return;
    }

    if (!("geolocation" in navigator)) {
      setErrorMessage(
        "Este navegador no expone Geolocation API en el entorno actual.",
      );
      return;
    }

    setIsSharingLocation(true);
    setErrorMessage("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `/api/conversations/${selectedConversationId}/messages`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: currentUser.id,
                body: "Compartí mi ubicación actual para coordinar la entrega.",
                messageType: "LOCATION",
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracyMeters: position.coords.accuracy,
                locationLabel: `Lat ${formatCoordinate(position.coords.latitude)} · Lng ${formatCoordinate(position.coords.longitude)}`,
              }),
            },
          );

          const payload = (await response.json()) as unknown;

          if (!response.ok) {
            throw new Error(
              readApiError(payload, "No fue posible compartir la ubicación."),
            );
          }

          const createdMessageId = extractCreatedMessageId(payload);
          if (createdMessageId) {
            setSelectedLocationMessageId(createdMessageId);
          }

          await loadConversations(currentUser.id);
          await loadConversationDetail(currentUser.id, selectedConversationId);
          notifyConversationStateChanged();
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "No fue posible compartir la ubicación.",
          );
        } finally {
          setIsSharingLocation(false);
        }
      },
      (error) => {
        const fallbackMessage =
          error.code === error.PERMISSION_DENIED
            ? "El usuario rechazó el permiso de geolocalización."
            : error.code === error.POSITION_UNAVAILABLE
              ? "No fue posible determinar la posición actual del dispositivo."
              : "La obtención de ubicación excedió el tiempo de espera.";

        setErrorMessage(fallbackMessage);
        setIsSharingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  };

  if (!currentUser) {
    return (
      <section className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-xs">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800">
              <MessageSquare className="h-3.5 w-3.5" />
              Mensajería operativa
            </div>
            <h2 className="mt-4 font-display text-3xl font-black tracking-tight text-slate-900">
              Coordina entregas, recolecciones y ubicación desde una sola
              bandeja.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Aquí se abrirán hilos reales entre propietario e interesado cada
              vez que una publicación reciba una solicitud.
            </p>
          </div>

          <button
            onClick={onLoginRequest}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition-colors hover:bg-emerald-700"
          >
            <UserRound className="h-4 w-4" />
            Iniciar sesión para ver mensajes
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="flex flex-col gap-6">
        <div className="rounded-[2rem] border border-slate-100 bg-linear-to-r from-slate-950 via-slate-900 to-emerald-900 p-8 text-white shadow-xl shadow-slate-900/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
                <MessageSquare className="h-3.5 w-3.5" />
                Centro de coordinación
              </div>
              <h2 className="mt-4 font-display text-3xl font-black tracking-tight">
                Mensajería real con ubicación compartida y mapa abierto bajo
                demanda.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
                Cada mensaje conserva su snapshot de ubicación y la última
                posición viva del usuario se actualiza por separado en Supabase.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-100/80">
                  Conversaciones activas
                </p>
                <div className="mt-2 text-3xl font-black">
                  {conversations.length}
                </div>
                <p className="mt-1 text-xs text-slate-200">
                  Hilos asociados a publicaciones reales.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-100/80">
                  Realtime
                </p>
                <div className="mt-2 flex items-center gap-2 text-lg font-black">
                  <Radio className="h-4 w-4 text-emerald-300" />
                  {realtimeReady ? "Conectado" : "Sin sesión realtime"}
                </div>
                <p className="mt-1 text-xs text-slate-200">
                  Presence y sincronización instantánea desde Supabase.
                </p>
              </div>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {errorMessage}
          </div>
        )}

        {!realtimeReady && (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            La sesión principal está abierta, pero Supabase Realtime no detecta
            una sesión activa. Puedes seguir usando el hilo, aunque la presencia
            online y la sincronización instantánea podrían requerir volver a
            iniciar sesión.
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(290px,0.68fr)_minmax(0,1.32fr)]">
          <div className="rounded-[2rem] border border-slate-100 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-1 pb-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-900">
                  Bandeja prioritaria
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Hilos listos para coordinar acción.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                {currentUser.name}
              </span>
            </div>

            {isLoading ? (
              <div className="flex min-h-[280px] items-center justify-center text-slate-400">
                <LoaderCircle className="h-5 w-5 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-7 text-slate-500">
                Aún no tienes conversaciones abiertas. En cuanto solicites una
                publicación o recibas interés sobre una tuya, el hilo aparecerá
                aquí automáticamente.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {conversations.map((conversation) => {
                  const Icon = getConversationIcon(conversation.subject);
                  const isActive = conversation.id === selectedConversationId;
                  const accent = getConversationAccent(conversation.subject);

                  return (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversationId(conversation.id)}
                      className={`w-full rounded-[1.7rem] border p-3.5 text-left transition-all ${
                        isActive
                          ? "border-emerald-200 bg-emerald-50/70 shadow-sm"
                          : "border-slate-100 bg-slate-50/70 hover:border-slate-200 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl bg-white p-3 text-slate-700 shadow-sm">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${accent}`}
                            >
                              {conversation.listingTitle
                                ? "Publicación vinculada"
                                : "Coordinación"}
                            </div>
                            <h4 className="mt-3 line-clamp-1 font-display text-xl font-semibold text-slate-900">
                              {conversation.otherParticipant?.name ??
                                conversation.subject}
                            </h4>
                            <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                              {conversation.listingTitle ??
                                conversation.subject}
                            </p>
                          </div>
                        </div>

                        {conversation.unreadCount > 0 && (
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-600 px-2 text-[11px] font-bold text-white">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>

                      <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
                        {buildMessagePreview(conversation)}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatAbsoluteDate(conversation.lastActivityAt)}
                        </div>
                        {conversation.otherParticipant && (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                onlineParticipantIds.includes(
                                  conversation.otherParticipant.id,
                                )
                                  ? "bg-emerald-500"
                                  : "bg-slate-300"
                              }`}
                            />
                            {onlineParticipantIds.includes(
                              conversation.otherParticipant.id,
                            )
                              ? "En línea"
                              : "Sin presencia"}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xs">
            {!activeConversation ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm leading-7 text-slate-500">
                Selecciona una conversación para ver el historial, compartir tu
                ubicación y abrir en mapa cualquier snapshot enviado.
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${getConversationAccent(activeConversation.subject)}`}
                    >
                      {activeSummary?.listingTitle
                        ? "Publicación"
                        : "Hilo activo"}
                    </div>
                    <h3 className="mt-3 font-display text-2xl font-semibold text-slate-900">
                      {peerParticipant?.name ?? activeConversation.subject}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {activeConversation.listing?.title ??
                        activeConversation.subject}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">
                        Estado del hilo:
                      </span>{" "}
                      Coordinación activa
                    </div>
                    {peerParticipant && (
                      <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            onlineParticipantIds.includes(
                              peerParticipant.userId,
                            )
                              ? "bg-emerald-500"
                              : "bg-slate-300"
                          }`}
                        />
                        {onlineParticipantIds.includes(peerParticipant.userId)
                          ? "Usuario conectado"
                          : "Usuario sin presencia"}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 space-y-5">
                  <div className="max-h-[34rem] space-y-4 overflow-y-auto pr-1 scrollbar-thin">
                    {activeConversation.messages.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                        Este hilo todavía no tiene mensajes.
                      </div>
                    ) : (
                      activeConversation.messages.map((message) => {
                        const isMine = message.senderUserId === currentUser.id;
                        const isSelectedLocation =
                          selectedLocationMessageId === message.id &&
                          message.location != null;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[92%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm lg:max-w-[78%] ${
                                isMine
                                  ? "bg-emerald-600 text-white"
                                  : "border border-slate-100 bg-slate-50 text-slate-700"
                              }`}
                            >
                              <div
                                className={`text-[11px] font-semibold ${
                                  isMine ? "text-emerald-50" : "text-slate-500"
                                }`}
                              >
                                {isMine ? "Tú" : message.senderName}
                              </div>
                              {message.body && (
                                <p className="mt-1">{message.body}</p>
                              )}

                              {message.location && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedLocationMessageId(message.id)
                                  }
                                  title="Haz clic para abrir esta ubicación en el mapa sin mover el hilo."
                                  className={`group relative mt-3 block w-full rounded-2xl border px-3 py-2.5 text-left text-xs transition ${
                                    isMine
                                      ? isSelectedLocation
                                        ? "border-emerald-100 bg-emerald-500/50 text-emerald-50"
                                        : "border-transparent bg-emerald-500/35 text-emerald-50 hover:bg-emerald-500/50"
                                      : isSelectedLocation
                                        ? "border-emerald-200 bg-emerald-50 text-slate-700"
                                        : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/60"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 font-semibold">
                                      <MapPin className="h-3.5 w-3.5" />
                                      Ubicación compartida
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
                                      Abrir mapa
                                    </span>
                                  </div>
                                  <div className="mt-2 space-y-1">
                                    <p>
                                      {buildLocationSummary(message.location)}
                                    </p>
                                    <p>
                                      Precisión:{" "}
                                      {message.location.accuracyMeters
                                        ? `${Math.round(message.location.accuracyMeters)} m`
                                        : "No disponible"}
                                    </p>
                                  </div>
                                  <span
                                    className={`pointer-events-none absolute -top-11 left-3 hidden rounded-xl px-3 py-2 text-[11px] font-medium shadow-lg group-hover:block ${
                                      isMine
                                        ? "bg-emerald-950 text-emerald-50"
                                        : "bg-slate-900 text-white"
                                    }`}
                                  >
                                    Haz clic para abrir el mapa.
                                  </span>
                                </button>
                              )}

                              <div
                                className={`mt-2 text-[11px] ${
                                  isMine ? "text-emerald-100" : "text-slate-400"
                                }`}
                              >
                                {formatShortTime(message.createdAt)}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="pt-1">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                      <div className="flex-1">
                        <label className="text-sm font-semibold text-slate-900"></label>
                        <p className="mt-0.5 text-xs text-slate-500"></p>
                        <textarea
                          value={draftMessage}
                          onChange={(event) =>
                            setDraftMessage(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              event.currentTarget.form?.requestSubmit();
                            }
                          }}
                          placeholder="Escribe aquí para coordinar la entrega, el punto de encuentro o una duda del artículo..."
                          className="mt-2 min-h-20 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-emerald-400"
                        />
                      </div>

                      <div className="flex gap-3 lg:flex-col">
                        <button
                          type="button"
                          onClick={handleShareLocation}
                          disabled={
                            isSharingLocation || !selectedConversationId
                          }
                          className="inline-flex min-w-40 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSharingLocation ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <LocateFixed className="h-4 w-4" />
                          )}
                          Enviar ubicación
                        </button>
                        <button
                          type="submit"
                          disabled={isSending || !draftMessage.trim()}
                          className="inline-flex min-w-40 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          {isSending ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Contestar Mensaje
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {selectedLocationMessage?.location && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          onClick={() => setSelectedLocationMessageId("")}
        >
          <div
            className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-2xl shadow-slate-950/20"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-linear-to-r from-emerald-50 via-white to-teal-50 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-700">
                  Mapa de ubicación
                </p>
                <h4 className="mt-2 font-display text-2xl font-semibold text-slate-900">
                  Punto abierto desde el mensaje
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  Snapshot exacto compartido en el chat sobre Leaflet +
                  OpenStreetMap.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLocationMessageId("")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50"
              >
                <X className="h-4 w-4" />
                Cerrar mapa
              </button>
            </div>

            <div className="max-h-[calc(92vh-96px)] overflow-y-auto p-6">
              <div className="overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white">
                <div className="h-[420px]">
                  <SharedLocationMap
                    snapshotPoint={{
                      latitude: selectedLocationMessage.location.latitude,
                      longitude: selectedLocationMessage.location.longitude,
                      title: "Snapshot del mensaje",
                      description: `${selectedLocationMessage.senderName} • ${buildLocationSummary(selectedLocationMessage.location)}`,
                      tone: "snapshot",
                    }}
                    latestPoint={
                      showLatestSenderMarker && selectedSenderLastLocation
                        ? {
                            latitude: selectedSenderLastLocation.latitude,
                            longitude: selectedSenderLastLocation.longitude,
                            title: "Última ubicación registrada",
                            description: `${selectedLocationParticipant?.name ?? selectedLocationMessage.senderName} • ${buildLocationSummary(selectedSenderLastLocation)}`,
                            tone: "latest",
                          }
                        : null
                    }
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 text-sm text-slate-600">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-700">
                    Snapshot del mensaje
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {selectedLocationMessage.senderUserId === currentUser.id
                      ? "Tú"
                      : selectedLocationMessage.senderName}
                  </p>
                  <p className="mt-1">
                    {buildLocationSummary(selectedLocationMessage.location)}
                  </p>
                  <p className="mt-1">
                    Precisión:{" "}
                    {selectedLocationMessage.location.accuracyMeters
                      ? `${Math.round(selectedLocationMessage.location.accuracyMeters)} m`
                      : "No disponible"}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {formatAbsoluteDate(selectedLocationMessage.createdAt)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
                    Última ubicación registrada
                  </p>
                  {selectedSenderLastLocation ? (
                    <>
                      <p className="mt-2 font-semibold text-slate-900">
                        {selectedLocationParticipant?.name ??
                          selectedLocationMessage.senderName}
                      </p>
                      <p className="mt-1">
                        {buildLocationSummary(selectedSenderLastLocation)}
                      </p>
                      <p className="mt-1">
                        Fuente: {selectedSenderLastLocation.source}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        {formatAbsoluteDate(
                          selectedSenderLastLocation.capturedAt,
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">
                      Este usuario todavía no tiene una última ubicación
                      registrada fuera del snapshot del mensaje.
                    </p>
                  )}
                </div>
              </div>

              <p className="mt-4 text-xs leading-6 text-slate-500">
                El mensaje conserva este punto aunque el usuario comparta otra
                ubicación posteriormente. Así evitamos que un mensaje antiguo
                cambie de posición al actualizarse `user_last_locations`.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
