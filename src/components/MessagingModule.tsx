import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Clock3,
  MapPin,
  MessageSquare,
  Send,
  ShieldCheck,
  UserRound,
  Wrench,
  LoaderCircle,
  LocateFixed,
  Radio,
} from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  ConversationDetail,
  ConversationSummary,
  UserProfile,
} from "../types";

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
    return "Ubicación compartida en tiempo real.";
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

function getMiniMapPositions(
  coordinates: Array<{ latitude: number; longitude: number }>,
) {
  if (coordinates.length === 0) {
    return [];
  }

  const latitudes = coordinates.map((point) => point.latitude);
  const longitudes = coordinates.map((point) => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latSpan = Math.max(maxLat - minLat, 0.01);
  const lngSpan = Math.max(maxLng - minLng, 0.01);

  return coordinates.map((point) => ({
    left: 12 + ((point.longitude - minLng) / lngSpan) * 76,
    top: 12 + ((maxLat - point.latitude) / latSpan) * 76,
  }));
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

  async function loadConversationDetail(userId: string, conversationId: string) {
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
            await loadConversationDetail(currentUser.id, selectedConversationId);
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
  const participantLocations =
    activeConversation?.participants
      .filter((participant) => participant.lastLocation)
      .map((participant) => ({
        userId: participant.userId,
        name:
          participant.userId === currentUser?.id
            ? "Tú"
            : participant.name.split(" ")[0] || participant.name,
        ...participant.lastLocation!,
      })) ?? [];
  const miniMapPositions = getMiniMapPositions(participantLocations);

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

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(
          payload.message || "No fue posible enviar el mensaje de texto.",
        );
      }

      setDraftMessage("");
      await loadConversations(currentUser.id);
      await loadConversationDetail(currentUser.id, selectedConversationId);
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
                locationLabel: `Lat ${formatCoordinate(position.coords.latitude)}, Lng ${formatCoordinate(position.coords.longitude)}`,
              }),
            },
          );

          const payload = (await response.json()) as { message?: string };

          if (!response.ok) {
            throw new Error(
              payload.message || "No fue posible compartir la ubicación.",
            );
          }

          await loadConversations(currentUser.id);
          await loadConversationDetail(currentUser.id, selectedConversationId);
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
    <section className="flex flex-col gap-6">
      <div className="rounded-[2rem] border border-slate-100 bg-linear-to-r from-slate-950 via-slate-900 to-emerald-900 p-8 text-white shadow-xl shadow-slate-900/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
              <MessageSquare className="h-3.5 w-3.5" />
              Centro de coordinación
            </div>
            <h2 className="mt-4 font-display text-3xl font-black tracking-tight">
              Mensajería real con ubicación compartida y presencia en vivo.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
              Cada conversación queda vinculada a una publicación y lista para
              usar `getCurrentPosition()` cuando necesites compartir punto de
              encuentro.
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
                Presence y actualizaciones desde Supabase Realtime.
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

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-1 pb-4">
            <div>
              <h3 className="font-display text-xl font-semibold text-slate-900">
                Bandeja prioritaria
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Conversaciones listas para coordinar acción.
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
                    className={`w-full rounded-3xl border p-4 text-left transition-all ${
                      isActive
                        ? "border-emerald-200 bg-emerald-50/70 shadow-sm"
                        : "border-slate-100 bg-slate-50/70 hover:border-slate-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-white p-3 text-slate-700 shadow-sm">
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <div
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${accent}`}
                          >
                            {conversation.listingTitle
                              ? "Publicación vinculada"
                              : "Coordinación"}
                          </div>
                          <h4 className="mt-3 font-display text-lg font-semibold text-slate-900">
                            {conversation.otherParticipant?.name ??
                              conversation.subject}
                          </h4>
                          <p className="mt-1 text-sm text-slate-500">
                            {conversation.listingTitle ?? conversation.subject}
                          </p>
                        </div>
                      </div>

                      {conversation.unreadCount > 0 && (
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-600 px-2 text-[11px] font-bold text-white">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-600">
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
              ubicación y revisar presencia online.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${getConversationAccent(activeConversation.subject)}`}
                  >
                    {activeSummary?.listingTitle ? "Publicación" : "Hilo activo"}
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
                          onlineParticipantIds.includes(peerParticipant.userId)
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

              <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4">
                  {activeConversation.messages.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                      Este hilo todavía no tiene mensajes.
                    </div>
                  ) : (
                    activeConversation.messages.map((message) => {
                      const isMine = message.senderUserId === currentUser.id;

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[88%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
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
                            {message.body && <p className="mt-1">{message.body}</p>}

                            {message.location && (
                              <div
                                className={`mt-3 rounded-2xl px-3 py-2 text-xs ${
                                  isMine
                                    ? "bg-emerald-500/40 text-emerald-50"
                                    : "bg-white text-slate-600"
                                }`}
                              >
                                <div className="flex items-center gap-2 font-semibold">
                                  <MapPin className="h-3.5 w-3.5" />
                                  Ubicación compartida
                                </div>
                                <div className="mt-2 space-y-1">
                                  <p>
                                    Lat {formatCoordinate(message.location.latitude)} ·
                                    Lng {formatCoordinate(message.location.longitude)}
                                  </p>
                                  <p>
                                    Precisión:{" "}
                                    {message.location.accuracyMeters
                                      ? `${Math.round(message.location.accuracyMeters)} m`
                                      : "No disponible"}
                                  </p>
                                </div>
                              </div>
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

                <div className="space-y-4">
                  <div className="overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-linear-to-br from-emerald-50 via-white to-teal-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-700">
                          Mapa del hilo
                        </p>
                        <h4 className="mt-2 font-display text-lg font-semibold text-slate-900">
                          Últimas posiciones conocidas
                        </h4>
                      </div>
                      <LocateFixed className="h-5 w-5 text-emerald-700" />
                    </div>

                    <div className="relative mt-4 min-h-[220px] overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white/75">
                      <div className="absolute inset-0 opacity-70">
                        <div className="absolute inset-x-0 top-[25%] h-px bg-emerald-100" />
                        <div className="absolute inset-x-0 top-[50%] h-px bg-emerald-100" />
                        <div className="absolute inset-x-0 top-[75%] h-px bg-emerald-100" />
                        <div className="absolute left-[25%] top-0 h-full w-px bg-emerald-100" />
                        <div className="absolute left-[50%] top-0 h-full w-px bg-emerald-100" />
                        <div className="absolute left-[75%] top-0 h-full w-px bg-emerald-100" />
                      </div>

                      {participantLocations.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-slate-500">
                          Cuando alguien entre a ReCyClapp o comparta su
                          ubicación en este hilo, el punto aparecerá aquí.
                        </div>
                      ) : (
                        participantLocations.map((participant, index) => (
                          <div
                            key={participant.userId}
                            className="absolute -translate-x-1/2 -translate-y-1/2"
                            style={{
                              left: `${miniMapPositions[index]?.left ?? 50}%`,
                              top: `${miniMapPositions[index]?.top ?? 50}%`,
                            }}
                          >
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full border-4 border-white shadow-lg ${
                                participant.userId === currentUser.id
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-900 text-white"
                              }`}
                            >
                              <MapPin className="h-4 w-4" />
                            </div>
                            <div className="absolute left-1/2 top-11 w-40 -translate-x-1/2 rounded-2xl border border-slate-100 bg-white/95 p-3 text-xs shadow-lg">
                              <p className="font-semibold text-slate-900">
                                {participant.name}
                              </p>
                              <p className="mt-1 text-slate-500">
                                {formatCoordinate(participant.latitude)},{" "}
                                {formatCoordinate(participant.longitude)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Ubicación registrada
                    </p>
                    <div className="mt-3 space-y-3">
                      {participantLocations.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          Todavía no hay posiciones registradas para este hilo.
                        </p>
                      ) : (
                        participantLocations.map((participant) => (
                          <div
                            key={participant.userId}
                            className="rounded-2xl border border-slate-100 bg-white px-3 py-2 text-sm text-slate-600"
                          >
                            <p className="font-semibold text-slate-900">
                              {participant.name}
                            </p>
                            <p className="mt-1">
                              Lat {formatCoordinate(participant.latitude)} · Lng{" "}
                              {formatCoordinate(participant.longitude)}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {formatAbsoluteDate(participant.capturedAt)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleSendMessage}
                className="mt-6 rounded-[1.75rem] border border-slate-100 bg-slate-50/80 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-slate-900">
                      Respuesta rápida
                    </label>
                    <p className="mt-1 text-sm text-slate-500">
                      El historial queda almacenado y se actualiza en tiempo
                      real para los participantes del hilo.
                    </p>
                    <textarea
                      value={draftMessage}
                      onChange={(event) => setDraftMessage(event.target.value)}
                      placeholder="Escribe aquí para coordinar la entrega, el punto de encuentro o una duda del artículo..."
                      className="mt-3 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-emerald-400"
                    />
                  </div>

                  <div className="flex gap-3 lg:flex-col">
                    <button
                      type="button"
                      onClick={handleShareLocation}
                      disabled={isSharingLocation || !selectedConversationId}
                      className="inline-flex min-w-44 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
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
                      className="inline-flex min-w-44 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {isSending ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Enviar respuesta
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
