import { useState } from "react";
import {
  Recycle,
  User,
  LogIn,
  Bell,
  Shield,
  MapPin,
  BarChart3,
  Wrench,
  Calendar,
  Heart,
  FileText,
} from "lucide-react";
import { UserProfile, Notification } from "../types";

interface NavbarProps {
  currentUser: UserProfile | null;
  notifications: Notification[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  technicalMode: boolean;
  setTechnicalMode: (mode: boolean) => void;
  onLogout: () => void;
  onLoginClick: () => void;
  onNotificationRead: (id: string) => void;
}

export default function Navbar({
  currentUser,
  notifications,
  activeTab,
  setActiveTab,
  technicalMode,
  setTechnicalMode,
  onLogout,
  onLoginClick,
  onNotificationRead,
}: NavbarProps) {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const mainNavItems = [
    { label: "Inicio", id: "inicio", icon: Recycle },
    { label: "Artículos", id: "articulos", icon: Heart },
    { label: "Donar / Reciclar", id: "publicar", icon: Heart },
    { label: "Recolecciones", id: "recolecciones", icon: Calendar },
    { label: "Reparaciones", id: "reparaciones", icon: Wrench },
    { label: "Centros", id: "centros", icon: MapPin },
    { label: "Estadísticas", id: "estadisticas", icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
            onClick={() => {
              setTechnicalMode(false);
              setActiveTab("inicio");
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-200">
              <Recycle className="w-5.5 h-5.5 text-white animate-spin-slow" />
            </div>
            <div>
              <span className="font-display text-xl font-bold tracking-tight text-slate-800 flex items-center gap-1">
                ReCyC<span className="text-emerald-600">lapp</span>
              </span>
              <span className="block text-[9px] text-emerald-700 font-medium tracking-widest uppercase -mt-1 font-mono"></span>
            </div>
          </div>

          {/* Navigation Links */}
          {!technicalMode && (
            <nav className="hidden lg:flex items-center gap-1.5">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
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
          )}

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            {/* Mode Selector Toggle (Technical Proposal vs App Showcase) */}
            <button
              onClick={() => setTechnicalMode(!technicalMode)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all ${
                technicalMode
                  ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100/80"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>
                {technicalMode
                  ? "Ver Demo Interactiva"
                  : "Propuesta Técnica NEXT.JS"}
              </span>
            </button>

            {/* Notification drop */}
            {!technicalMode && (
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
                    <div className="max-h-64 overflow-y-auto scrollbar-thin divide-y divide-slate-50">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-slate-400 text-xs">
                          No tienes notificaciones
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              onNotificationRead(notif.id);
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
            {!technicalMode && currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-2 p-1 pr-2.5 rounded-full hover:bg-slate-50 border border-slate-100 transition-all text-left"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full border border-emerald-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="hidden sm:block">
                    <div className="text-xs font-semibold text-slate-800 leading-tight">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-emerald-600 uppercase tracking-wider font-semibold font-mono leading-none">
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
              !technicalMode && (
                <button
                  onClick={onLoginClick}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200 text-xs font-semibold leading-tight transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Iniciar Sesión</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
