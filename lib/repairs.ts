import { RepairStatus } from "@prisma/client";

import type { ItemCategory, RepairRequest, RepairWorkshopProfile } from "@/src/types";

const WORKSHOP_COLORS = [
  "bg-amber-100 text-amber-800",
  "bg-blue-100 text-blue-800",
  "bg-emerald-100 text-emerald-800",
  "bg-rose-100 text-rose-800",
  "bg-violet-100 text-violet-800",
  "bg-cyan-100 text-cyan-800",
];

type RepairViewRow = {
  id_reparacion: string;
  id_publicacion: string | null;
  nombre_item: string;
  nombre_categoria: string | null;
  descripcion_problema: string | null;
  costo_estimado_min: PrismaDecimalLike | null;
  costo_estimado_max: PrismaDecimalLike | null;
  estado_reparacion: string;
  nombre_taller: string | null;
  fecha_solicitud: Date | string;
  fecha_cotizacion: Date | string | null;
  fecha_finalizacion: Date | string | null;
};

type WorkshopViewRow = {
  id_taller_reparacion: string;
  nombre_taller: string;
  especialidad: string;
  telefono: string | null;
  calificacion_promedio: PrismaDecimalLike | null;
  direccion_linea_1: string | null;
  colonia: string | null;
  ciudad: string | null;
};

type PrismaDecimalLike = {
  toString(): string;
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function mapRepairCategoryFromName(
  categoryName: string | null | undefined,
): ItemCategory {
  const normalized = normalizeText(categoryName ?? "");

  switch (normalized) {
    case "muebles":
      return "muebles";
    case "electrodomesticos":
      return "electrodomesticos";
    case "electronicos":
      return "electronicos";
    case "decoracion":
      return "decoracion";
    case "oficina":
      return "oficina";
    default:
      return "otros";
  }
}

export function mapRepairStatus(
  status: RepairStatus | string,
): RepairRequest["status"] {
  switch (status) {
    case RepairStatus.IN_WORK:
    case "EN_TRABAJO":
      return "en_taller";
    case RepairStatus.REPAIRED:
    case RepairStatus.DELIVERED:
    case "REPARADA":
    case "ENTREGADA":
      return "reparado";
    case RepairStatus.UNREPAIRABLE:
    case RepairStatus.CANCELLED:
    case "NO_REPARABLE":
    case "CANCELADA":
      return "no_reparable";
    default:
      return "revisión";
  }
}

function coerceDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
}

function formatRepairCost(
  min: PrismaDecimalLike | null | undefined,
  max: PrismaDecimalLike | null | undefined,
) {
  const minValue = min ? Number(min.toString()) : 0;
  const maxValue = max ? Number(max.toString()) : minValue;

  const formatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  });

  return `${formatter.format(minValue)} - ${formatter.format(maxValue)}`;
}

export function buildRepairPayload(row: RepairViewRow): RepairRequest {
  const displayDate =
    coerceDate(row.fecha_cotizacion) ??
    coerceDate(row.fecha_finalizacion) ??
    coerceDate(row.fecha_solicitud);

  return {
    id: row.id_reparacion,
    listingId: row.id_publicacion ?? undefined,
    itemName: row.nombre_item,
    category: mapRepairCategoryFromName(row.nombre_categoria),
    description: row.descripcion_problema ?? "",
    status: mapRepairStatus(row.estado_reparacion),
    shopName: row.nombre_taller ?? "Taller por asignar",
    estimatedCost: formatRepairCost(
      row.costo_estimado_min,
      row.costo_estimado_max,
    ),
    date: displayDate
      ? new Intl.DateTimeFormat("es-MX").format(displayDate)
      : "Por definir",
  };
}

function formatWorkshopAddress(row: WorkshopViewRow) {
  return [row.direccion_linea_1, row.colonia, row.ciudad]
    .filter(Boolean)
    .join(", ");
}

function getWorkshopColor(index: number) {
  return WORKSHOP_COLORS[index % WORKSHOP_COLORS.length];
}

export function buildWorkshopPayload(
  row: WorkshopViewRow,
  index: number,
): RepairWorkshopProfile {
  return {
    id: row.id_taller_reparacion,
    name: row.nombre_taller,
    specialty: row.especialidad,
    rating: row.calificacion_promedio
      ? Number(row.calificacion_promedio.toString())
      : 0,
    address: formatWorkshopAddress(row),
    phone: row.telefono ?? "Sin teléfono registrado",
    logoColor: getWorkshopColor(index),
  };
}

export type { RepairViewRow, WorkshopViewRow };
