import { useEffect, useMemo, useRef, useState } from "react";
import {
  Recycle,
  User,
  LogIn,
  Bell,
  Sun,
  Moon,
  Shield,
  MapPin,
  BarChart3,
  Wrench,
  Calendar,
  Heart,
  MessageSquare,
} from "lucide-react";
import { UserProfile, Notification } from "../types";

interface NavbarProps {
  currentUser: UserProfile | null;
  notifications: Notification[];
  activeTab: string;
  themeMode: "light" | "dark";
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onLoginClick: () => void;
  onNotificationRead: (notification: Notification) => void;
  onNotificationOpen: (notification: Notification) => void;
  onThemeToggle: () => void;
}

export default function Navbar({
  currentUser,
  notifications,
  activeTab,
  themeMode,
  setActiveTab,
  onLogout,
  onLoginClick,
  onNotificationRead,
  onNotificationOpen,
  onThemeToggle,
}: NavbarProps) {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const notificationListRef = useRef<HTMLDivElement | null>(null);
  const notificationItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const unreadCount = currentUser
    ? notifications.filter((n) => !n.read).length
    : 0;
  const ThemeIcon = themeMode === "light" ? Sun : Moon;
  const themeLabel = themeMode === "light" ? "Modo claro" : "Modo oscuro";
  const notificationLookup = useMemo(
    () => Object.fromEntries(notifications.map((notification) => [notification.id, notification])),
    [notifications],
  );

  useEffect(() => {
    if (!showNotifDropdown || !notificationListRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const notificationId = entry.target.getAttribute("data-notification-id");
          if (!notificationId) {
            return;
          }

          const notification = notificationLookup[notificationId];
          if (notification && !notification.read) {
            onNotificationRead(notification);
          }
        });
      },
      {
        root: notificationListRef.current,
        threshold: 0.65,
      },
    );

    Object.entries(notificationItemRefs.current).forEach(([id, element]) => {
      if (!element || !notificationLookup[id]) {
        return;
      }

      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [notificationLookup, onNotificationRead, showNotifDropdown]);

  const mainNavItems = [
    { label: "Inicio", id: "inicio", icon: Recycle },
    { label: "Artículos", id: "articulos", icon: Heart },
    { label: "Donar / Reciclar", id: "publicar", icon: Heart },
    { label: "Recolecciones", id: "recolecciones", icon: Calendar },
    { label: "Reparaciones", id: "reparaciones", icon: Wrench },
    { label: "Centros", id: "centros", icon: MapPin },
    { label: "Mensajería", id: "mensajeria", icon: MessageSquare },
    { label: "Estadísticas", id: "estadisticas", icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
            onClick={() => {
              setActiveTab("inicio");
            }}
          >
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

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 ml-7 xl:ml-10">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            {currentUser?.role === "admin" && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "admin"
                    ? "bg-emerald-800 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Panel de Admin</span>
              </button>
            )}
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3 lg:ml-6 xl:ml-8">
            <button
              type="button"
              onClick={onThemeToggle}
              aria-label={`Cambiar tema. Actual: ${themeLabel}`}
              title={`Cambiar tema. Actual: ${themeLabel}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/90 p-2.5 text-slate-600 shadow-xs transition-all hover:border-emerald-200 hover:text-emerald-700 hover:bg-emerald-50/70"
            >
              <ThemeIcon className="h-4 w-4" />
            </button>

            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-xl shadow-lg border border-slate-100 py-2.5 z-50 text-sm">
                    <div className="px-4 py-1.5 border-b border-slate-100 flex items-center justify-between font-semibold text-slate-800">
                      <span>Notificaciones</span>
                      <span className="text-xs text-slate-400 font-normal">
                        {unreadCount} nuevas
                      </span>
                    </div>
                    <div
                      ref={notificationListRef}
                      className="max-h-64 overflow-y-auto scrollbar-thin divide-y divide-slate-50"
                    >
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-slate-400 text-xs">
                          No tienes notificaciones
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            ref={(element) => {
                              notificationItemRefs.current[notif.id] = element;
                            }}
                            data-notification-id={notif.id}
                            onClick={() => {
                              onNotificationOpen(notif);
                              setShowNotifDropdown(false);
                            }}
                            className={`px-4 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer text-xs ${
                              !notif.read ? "bg-emerald-50/10" : ""
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span
                                className={`font-semibold ${!notif.read ? "text-slate-800" : "text-slate-600"}`}
                              >
                                {notif.title}
                              </span>
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-slate-500 text-[11px] mt-0.5 leading-normal">
                              {notif.description}
                            </p>
                            <span className="text-[9px] text-slate-400 mt-1 block">
                              {notif.timestamp}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Picker */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex min-w-[11rem] items-center gap-2 rounded-2xl border border-slate-100 px-1.5 py-1.5 pr-3 hover:bg-slate-50 transition-all text-left"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full border border-emerald-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="hidden min-w-0 flex-1 sm:block">
                    <div className="text-xs font-semibold leading-tight text-slate-800">
                      {currentUser.name}
                    </div>
                    <div className="mt-0.5 text-[10px] text-emerald-600 uppercase tracking-wider font-semibold font-mono leading-none">
                      {currentUser.role === "admin"
                        ? "Administrador"
                        : currentUser.role === "collector"
                          ? "Recolector"
                          : "Usuario"}
                    </div>
                  </div>
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 text-xs text-slate-700">
                    <div className="p-3 border-b border-slate-50 leading-tight">
                      <p className="font-bold text-slate-800">
                        {currentUser.name}
                      </p>
                      <p className="text-slate-400 text-[10px] truncate">
                        {currentUser.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab("perfil");
                        setShowProfileDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" /> Mi Perfil
                      / Estado
                    </button>
                    <button
                      onClick={() => {
                        onLogout();
                        setShowProfileDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-red-500 transition-colors flex items-center gap-1.5 border-t border-slate-100"
                    >
                      <LogIn className="w-3.5 h-3.5 text-red-400" /> Cerrar
                      Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200 text-xs font-semibold leading-tight transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Iniciar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
