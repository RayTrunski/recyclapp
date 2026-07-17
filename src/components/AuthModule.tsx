import { FormEvent, useMemo, useState } from "react";
import {
  KeyRound,
  LogIn,
  Mail,
  MapPin,
  Phone,
  User,
  UserPlus,
} from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { UserProfile, UserRole } from "../types";

interface AuthModuleProps {
  onLogin: (user: UserProfile, rememberSession: boolean) => void;
  onClose: () => void;
}

type AuthMode = "login" | "register";

type AuthApiResponse = {
  success: boolean;
  message?: string;
  realtimeEnabled?: boolean;
  realtimeMessage?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    phone: string;
    address: string;
    avatarUrl: string | null;
    role: UserRole;
  };
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  collector: "Recolector",
  user: "Usuario",
};

const ROLE_AVATARS: Record<UserRole, string> = {
  admin:
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
  collector:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
  user:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
};

function createProfileFromApiUser(
  user: NonNullable<AuthApiResponse["user"]>,
): UserProfile {
  return {
    id: user.id,
    name: user.name || ROLE_LABELS[user.role],
    email: user.email,
    avatar: user.avatarUrl ?? ROLE_AVATARS[user.role],
    role: user.role,
    address: user.address ?? "",
    phone: user.phone ?? "",
    recycledCount: 0,
    donatedCount: 0,
    repairedCount: 0,
    co2Saved: 0,
  };
}

export default function AuthModule({ onLogin, onClose }: AuthModuleProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [rememberSession, setRememberSession] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    addressLine1: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const modalWidthClass = useMemo(
    () => (mode === "register" ? "max-w-2xl" : "max-w-md"),
    [mode],
  );

  const resetErrors = () => {
    setErrorMsg("");
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    resetErrors();
  };

  const syncRealtimeSession = async (email: string, plainPassword: string) => {
    const supabase = createSupabaseBrowserClient();
    const { error: realtimeError } = await supabase.auth.signInWithPassword({
      email,
      password: plainPassword,
    });

    if (realtimeError) {
      throw new Error(
        "La cuenta se validó, pero la sesión de mensajería en tiempo real no pudo iniciarse.",
      );
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        if (!registerForm.firstName.trim()) {
          setErrorMsg("El nombre es obligatorio.");
          return;
        }

        if (!registerForm.email.trim() || !registerForm.password.trim()) {
          setErrorMsg("Correo y contraseña son obligatorios.");
          return;
        }

        if (registerForm.password !== registerForm.confirmPassword) {
          setErrorMsg("La confirmación de contraseña no coincide.");
          return;
        }

        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: registerForm.firstName,
            lastName: registerForm.lastName,
            displayName: registerForm.displayName,
            email: registerForm.email,
            phone: registerForm.phone,
            password: registerForm.password,
            addressLine1: registerForm.addressLine1,
            neighborhood: registerForm.neighborhood,
            city: registerForm.city,
            state: registerForm.state,
          }),
        });

        const result = (await response.json()) as AuthApiResponse;

        if (!response.ok || !result.success || !result.user) {
          setErrorMsg(result.message || "No fue posible crear la cuenta.");
          return;
        }

        if (result.realtimeEnabled === false && result.realtimeMessage) {
          console.warn(result.realtimeMessage);
        } else {
          await syncRealtimeSession(result.user.email, registerForm.password);
        }

        onLogin(createProfileFromApiUser(result.user), rememberSession);
        onClose();
        return;
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario,
          password,
        }),
      });

      const result = (await response.json()) as AuthApiResponse;

      if (!response.ok || !result.success || !result.user) {
        setErrorMsg(result.message || "No fue posible iniciar sesión.");
        return;
      }

      if (result.realtimeEnabled === false && result.realtimeMessage) {
        console.warn(result.realtimeMessage);
      } else {
        await syncRealtimeSession(result.user.email, password);
      }

      onLogin(createProfileFromApiUser(result.user), rememberSession);
      onClose();
    } catch {
      setErrorMsg(
        mode === "register"
          ? "No se pudo crear la cuenta en este momento."
          : "No se pudo conectar con el endpoint de login. Verifica que `/api/auth/login` esté disponible.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-xs">
      <div
        className={`w-full ${modalWidthClass} overflow-hidden rounded-2xl border border-slate-100 bg-white text-left shadow-2xl animate-in fade-in zoom-in-95 duration-150`}
      >
        <div className="relative bg-linear-to-r from-emerald-600 to-teal-700 px-6 py-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-lg p-1 text-sm font-bold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
          <span className="font-mono text-[10px] tracking-widest text-emerald-100 uppercase">
            Acceso ReCyClapp
          </span>
          <h3 className="mt-1 font-display text-xl font-bold">
            {mode === "login"
              ? "Inicia sesión con la base de datos"
              : "Crea tu cuenta en ReCyClapp"}
          </h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-emerald-50">
            {mode === "login"
              ? "Este formulario valida usuario y contraseña contra los registros guardados en PostgreSQL."
              : "Crearemos un usuario real en la base de datos y lo sincronizaremos con Supabase Auth para mensajería y tiempo real."}
          </p>
        </div>

        <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-3">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === "login"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === "register"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Crear cuenta
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          {errorMsg && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs leading-tight font-semibold text-red-700">
              {errorMsg}
            </div>
          )}

          {mode === "login" ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Usuario o correo
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="usuario@recyclapp.mx"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-xs focus:outline-emerald-500"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Usa el correo y la contraseña tal como quedaron guardados en
                  la base de datos.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <KeyRound className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-xs focus:outline-emerald-500"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Nombre
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    value={registerForm.firstName}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        firstName: event.target.value,
                      }))
                    }
                    placeholder="Clara"
                    className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-xs focus:outline-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Apellido
                </label>
                <input
                  type="text"
                  value={registerForm.lastName}
                  onChange={(event) =>
                    setRegisterForm((current) => ({
                      ...current,
                      lastName: event.target.value,
                    }))
                  }
                  placeholder="Sanhueza"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-emerald-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Nombre mostrado
                </label>
                <input
                  type="text"
                  value={registerForm.displayName}
                  onChange={(event) =>
                    setRegisterForm((current) => ({
                      ...current,
                      displayName: event.target.value,
                    }))
                  }
                  placeholder="Clara Verde"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-emerald-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Teléfono
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Phone className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    value={registerForm.phone}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="+52 55 1234 5678"
                    className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-xs focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">
                  Correo electrónico
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="clara@recyclapp.mx"
                    className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-xs focus:outline-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <KeyRound className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder="Contraseña"
                    className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-xs focus:outline-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <KeyRound className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        confirmPassword: event.target.value,
                      }))
                    }
                    placeholder="Repite tu contraseña"
                    className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-xs focus:outline-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">
                  Dirección principal opcional
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <MapPin className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    value={registerForm.addressLine1}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        addressLine1: event.target.value,
                      }))
                    }
                    placeholder="Av. Reforma 120"
                    className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-xs focus:outline-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Se guarda si completas calle, ciudad y estado.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Colonia
                </label>
                <input
                  type="text"
                  value={registerForm.neighborhood}
                  onChange={(event) =>
                    setRegisterForm((current) => ({
                      ...current,
                      neighborhood: event.target.value,
                    }))
                  }
                  placeholder="Centro"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-emerald-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={registerForm.city}
                  onChange={(event) =>
                    setRegisterForm((current) => ({
                      ...current,
                      city: event.target.value,
                    }))
                  }
                  placeholder="Ciudad de México"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-emerald-500"
                />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">
                  Estado
                </label>
                <input
                  type="text"
                  value={registerForm.state}
                  onChange={(event) =>
                    setRegisterForm((current) => ({
                      ...current,
                      state: event.target.value,
                    }))
                  }
                  placeholder="CDMX"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-emerald-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px]">
            <label className="flex items-center gap-1.5 text-slate-500">
              <input
                type="checkbox"
                checked={rememberSession}
                onChange={(e) => setRememberSession(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              Recordarme
            </label>
            {mode === "login" ? (
              <button
                type="button"
                className="font-semibold text-emerald-700 hover:underline"
                onClick={() =>
                  alert(
                    "La recuperación de contraseña la podemos agregar después con otro endpoint.",
                  )
                }
              >
                ¿Olvidaste contraseña?
              </button>
            ) : (
              <span className="text-slate-400">
                Rol inicial: ciudadano
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-200 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
          >
            {isSubmitting ? (
              <Mail className="h-4 w-4" />
            ) : mode === "login" ? (
              <LogIn className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            <span>
              {isSubmitting
                ? mode === "login"
                  ? "Validando acceso..."
                  : "Creando cuenta..."
                : mode === "login"
                  ? "Ingresar a mi portal"
                  : "Crear cuenta y entrar"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
