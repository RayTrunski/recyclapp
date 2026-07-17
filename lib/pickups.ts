import { PickupStatus } from "@prisma/client";

import type { ItemCategory, PickupRequest } from "@/src/types";

export const CLAIM_PICKUP_NOTE_PREFIX = "[DONACION]";
export const OWNER_PICKUP_NOTE_PREFIX = "[RECOLECCION]";

type PickupViewRow = {
  id_recoleccion: string;
  id_publicacion: string | null;
  nombre_categoria: string | null;
  titulo_item: string;
  notas: string | null;
  bloque_horario: string | null;
  estado_recoleccion: string;
  nombre_recolector: string | null;
  estado: string;
  ciudad: string;
  municipio: string | null;
  colonia: string | null;
  direccion_linea_1: string;
  direccion_linea_2: string | null;
  fecha_preferida: Date | string | null;
  fecha_programada: Date | string | null;
  fecha_recolectada: Date | string | null;
  fecha_cancelacion: Date | string | null;
  fecha_creacion: Date | string;
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function mapPickupCategoryFromName(
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

export function mapPickupStatus(
  status: PickupStatus | string,
): PickupRequest["status"] {
  switch (status) {
    case PickupStatus.REQUESTED:
    case PickupStatus.SCHEDULED:
    case PickupStatus.ASSIGNED:
    case "SOLICITADA":
    case "PROGRAMADA":
    case "ASIGNADA":
      return "programado";
    case PickupStatus.ON_ROUTE:
    case "EN_RUTA":
      return "en_ruta";
    case PickupStatus.COMPLETED:
    case "COMPLETADA":
      return "completado";
    default:
      return "cancelado";
  }
}

export function formatPickupAddress(row: {
  direccion_linea_1: string;
  direccion_linea_2?: string | null;
  colonia?: string | null;
  municipio?: string | null;
  ciudad: string;
  estado?: string | null;
}) {
  return [
    row.direccion_linea_1,
    row.direccion_linea_2,
    row.colonia,
    row.municipio,
    row.ciudad,
  ]
    .filter(Boolean)
    .join(", ");
}

function coerceDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
}

export function resolvePickupDate(row: PickupViewRow) {
  return (
    coerceDate(row.fecha_programada) ??
    coerceDate(row.fecha_preferida) ??
    coerceDate(row.fecha_recolectada) ??
    coerceDate(row.fecha_cancelacion) ??
    coerceDate(row.fecha_creacion)
  );
}

export function getPickupSource(notes: string | null | undefined) {
  if ((notes ?? "").startsWith(CLAIM_PICKUP_NOTE_PREFIX)) {
    return "donacion" as const;
  }

  return "recoleccion" as const;
}

export function stripPickupNotePrefix(notes: string | null | undefined) {
  const safeNotes = notes ?? "";

  return safeNotes
    .replace(CLAIM_PICKUP_NOTE_PREFIX, "")
    .replace(OWNER_PICKUP_NOTE_PREFIX, "")
    .trim();
}

export function buildPickupPayload(row: PickupViewRow): PickupRequest {
  const resolvedDate = resolvePickupDate(row);

  return {
    id: row.id_recoleccion,
    listingId: row.id_publicacion ?? undefined,
    itemId: row.id_publicacion ?? undefined,
    itemTitle: row.titulo_item,
    category: mapPickupCategoryFromName(row.nombre_categoria),
    address: formatPickupAddress(row),
    date: resolvedDate?.toISOString().split("T")[0] ?? "",
    timeSlot: row.bloque_horario ?? "Por coordinar",
    status: mapPickupStatus(row.estado_recoleccion),
    collectorName: row.nombre_recolector ?? undefined,
    notes: stripPickupNotePrefix(row.notas),
    source: getPickupSource(row.notas),
  };
}

export type { PickupViewRow };
