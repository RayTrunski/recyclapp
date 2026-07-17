import { FormEvent, useState } from "react";
import {
  KeyRound,
  LogIn,
  Mail,
  User,
} from "lucide-react";

import { UserProfile, UserRole } from "../types";

interface AuthModuleProps {
  onLogin: (user: UserProfile, rememberSession: boolean) => void;
  onClose: () => void;
}

type LoginApiResponse = {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
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

function crearPerfilLocal(user: NonNullable<LoginApiResponse["user"]>): UserProfile {
  const nombreBase = user.email.split("@")[0].replace(/[._-]/g, " ");
  const nombreNormalizado = nombreBase.replace(/\b\w/g, (char) =>
    char.toUpperCase(),
  );

  return {
    id: user.id,
    name: nombreNormalizado || ROLE_LABELS[user.role],
    email: user.email,
    avatar: ROLE_AVATARS[user.role],
    role: user.role,
    address: "",
    phone: "",
    recycledCount: 0,
    donatedCount: 0,
    repairedCount: 0,
    co2Saved: 0,
  };
}

export default function AuthModule({ onLogin, onClose }: AuthModuleProps) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [rememberSession, setRememberSession] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
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

      const result = (await response.json()) as LoginApiResponse;

      if (!response.ok || !result.success || !result.user) {
        setErrorMsg(result.message || "No fue posible iniciar sesión.");
        return;
      }

      onLogin(crearPerfilLocal(result.user), rememberSession);
      onClose();
    } catch {
      setErrorMsg(
        "No se pudo conectar con el endpoint de login. Verifica que `/api/auth/login` esté disponible.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white text-left shadow-2xl animate-in fade-in zoom-in-95 duration-150">
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
            Inicia sesión con la base de datos
          </h3>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-emerald-50">
            Este formulario valida usuario y contraseña contra los registros
            guardados en PostgreSQL.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          {errorMsg && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs leading-tight font-semibold text-red-700">
              {errorMsg}
            </div>
          )}

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
              Usa el correo y la contraseña tal como quedaron guardados en la
              base de datos.
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
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-200 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
          >
            {isSubmitting ? (
              <Mail className="h-4 w-4" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            <span>
              {isSubmitting ? "Validando acceso..." : "Ingresar a mi portal"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
