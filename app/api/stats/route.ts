import {
  ActionType,
  ClaimStatus,
  ListingStatus,
  Prisma,
  PickupStatus,
  RepairStatus,
} from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type {
  BadgeProgress,
  GamificationMessage,
  UserBadge,
  UserStatsMetrics,
  UserStatsResponse,
} from "@/src/types";

type GamificationCategory = "impact" | "achievement" | "next_step";

type GamificationMessageRow = {
  id: number;
  event_type: string;
  minimum_value: number;
  category: GamificationCategory;
  title: string;
  message: string;
  badge_code: string | null;
  active: boolean;
};

const DONE_LISTING_STATUSES = [
  ListingStatus.DONATED,
  ListingStatus.RECYCLED,
  ListingStatus.REPAIRED,
  ListingStatus.COMPLETED,
] as const;

const RECYCLING_LISTING_STATUSES = [
  ListingStatus.RECYCLED,
  ListingStatus.COLLECTED,
  ListingStatus.COMPLETED,
] as const;

const DONE_REPAIR_STATUSES = [
  RepairStatus.REPAIRED,
  RepairStatus.DELIVERED,
] as const;

function normalizeText(value: string | null) {
  return value?.trim() ?? "";
}

function pluralize(value: number, singular: string, plural: string) {
  return value === 1 ? singular : plural;
}

function interpolateMessage(
  template: string,
  replacements: Record<string, number | string>,
) {
  return Object.entries(replacements).reduce((message, [key, value]) => {
    return message.replaceAll(`{{${key}}}`, String(value));
  }, template);
}

function buildGamificationPayload(
  row: GamificationMessageRow,
  currentValue: number,
  badgeTitle: string | null,
): GamificationMessage {
  const remainingValue = Math.max(row.minimum_value - currentValue, 0);

  return {
    eventType: row.event_type,
    category: row.category,
    title: row.title,
    message: interpolateMessage(row.message, {
      count: currentValue,
      target: row.minimum_value,
      remaining: remainingValue,
      article_word: pluralize(currentValue, "artículo", "artículos"),
      delivery_word: pluralize(currentValue, "entrega", "entregas"),
      publication_word: pluralize(currentValue, "publicación", "publicaciones"),
      location_share_word: pluralize(
        currentValue,
        "vez",
        "veces",
      ),
      day_word: pluralize(currentValue, "día", "días"),
      remaining_article_word: pluralize(
        remainingValue,
        "artículo",
        "artículos",
      ),
      remaining_delivery_word: pluralize(
        remainingValue,
        "entrega",
        "entregas",
      ),
      remaining_day_word: pluralize(remainingValue, "día", "días"),
      badge_name: badgeTitle ?? row.title,
    }),
    badgeCode: row.badge_code,
    currentValue,
    targetValue: row.minimum_value,
    remainingValue,
  };
}

function createDefaultImpact(metrics: UserStatsMetrics): GamificationMessage {
  if (metrics.recoveredItems > 0) {
    return {
      eventType: "reused_items",
      category: "impact",
      title: "Impacto",
      message: `Has dado una segunda oportunidad a ${metrics.recoveredItems} ${pluralize(metrics.recoveredItems, "artículo", "artículos")} y evitado su descarte prematuro.`,
      badgeCode: null,
      currentValue: metrics.recoveredItems,
      targetValue: Math.max(metrics.recoveredItems, 1),
      remainingValue: 0,
    };
  }

  return {
    eventType: "items_published",
    category: "impact",
    title: "Impacto",
    message:
      "Tu historial todavía está comenzando. Cada publicación, entrega o reparación sumará impacto visible aquí.",
    badgeCode: null,
    currentValue: metrics.itemsPublished,
    targetValue: 1,
    remainingValue: Math.max(1 - metrics.itemsPublished, 0),
  };
}

function createDefaultAchievement(
  metrics: UserStatsMetrics,
): GamificationMessage {
  if (metrics.itemsPublished > 0) {
    return {
      eventType: "items_published",
      category: "achievement",
      title: "Primer paso",
      message:
        "Ya activaste tu cuenta con una publicación real y comenzaste a mover el flujo circular.",
      badgeCode: "FIRST_STEP",
      currentValue: metrics.itemsPublished,
      targetValue: 1,
      remainingValue: 0,
    };
  }

  return {
    eventType: "items_published",
    category: "achievement",
    title: "Aún sin insignia",
    message:
      "Cuando completes tu primera acción relevante, aquí aparecerá la insignia que acabas de desbloquear.",
    badgeCode: null,
    currentValue: 0,
    targetValue: 1,
    remainingValue: 1,
  };
}

function createDefaultNextStep(metrics: UserStatsMetrics): GamificationMessage {
  if (metrics.itemsPublished === 0) {
    return {
      eventType: "items_published",
      category: "next_step",
      title: "Comienza tu impacto",
      message:
        "Crea tu primera publicación para desbloquear la insignia Primer paso.",
      badgeCode: null,
      currentValue: 0,
      targetValue: 1,
      remainingValue: 1,
    };
  }

  if (metrics.completedDeliveries < 3) {
    const remaining = Math.max(3 - metrics.completedDeliveries, 0);

    return {
      eventType: "completed_deliveries",
      category: "next_step",
      title: "Siguiente reto",
      message: `Completa ${remaining} ${pluralize(remaining, "entrega", "entregas")} más para desbloquear Reutilizador activo.`,
      badgeCode: null,
      currentValue: metrics.completedDeliveries,
      targetValue: 3,
      remainingValue: remaining,
    };
  }

  return {
    eventType: "active_days",
    category: "next_step",
    title: "Sigue avanzando",
    message:
      "Mantén actividad constante en la plataforma para seguir desbloqueando insignias y mejorar tu impacto local.",
    badgeCode: null,
    currentValue: metrics.activityDays,
    targetValue: Math.max(metrics.activityDays + 1, 1),
    remainingValue: 1,
  };
}

function pickImpactEvent(metrics: UserStatsMetrics) {
  if (metrics.recoveredItems > 0) return "reused_items";
  if (metrics.completedDeliveries > 0) return "completed_deliveries";
  if (metrics.itemsPublished > 0) return "items_published";
  if (metrics.sharedLocations > 0) return "shared_locations";
  if (metrics.repairsStarted > 0) return "repairs_started";
  if (metrics.activityDays > 0) return "active_days";
  return "profile_completion";
}

function getEventMetricValue(metrics: UserStatsMetrics, eventType: string) {
  switch (eventType) {
    case "items_published":
      return metrics.itemsPublished;
    case "received_claims":
      return metrics.requestsReceived;
    case "completed_deliveries":
      return metrics.completedDeliveries;
    case "shared_locations":
      return metrics.sharedLocations;
    case "reused_items":
      return metrics.recoveredItems;
    case "profile_completion":
      return metrics.profileCompletion;
    case "positive_ratings":
      return metrics.positiveRatings;
    case "active_days":
      return metrics.activityDays;
    case "appliance_publications":
      return metrics.appliancePublications;
    case "repairs_started":
      return metrics.repairsStarted;
    default:
      return 0;
  }
}

function buildBadgeTitleLookup(rows: GamificationMessageRow[]) {
  const lookup = new Map<string, string>();

  rows
    .filter((row) => row.category === "achievement")
    .forEach((row) => {
      lookup.set(`${row.event_type}:${row.minimum_value}`, row.title);
    });

  return lookup;
}

function selectImpactMessage(
  rows: GamificationMessageRow[],
  metrics: UserStatsMetrics,
) {
  const impactEvent = pickImpactEvent(metrics);
  const matchingRows = rows
    .filter(
      (row) =>
        row.category === "impact" &&
        row.event_type === impactEvent &&
        getEventMetricValue(metrics, row.event_type) >= row.minimum_value,
    )
    .sort((left, right) => right.minimum_value - left.minimum_value);

  return matchingRows[0] ?? null;
}

function selectAchievementMessages(
  rows: GamificationMessageRow[],
  metrics: UserStatsMetrics,
) {
  const priority = [
    "completed_deliveries",
    "reused_items",
    "items_published",
    "shared_locations",
    "profile_completion",
    "active_days",
    "appliance_publications",
  ];

  const unlocked = rows
    .filter(
      (row) =>
        row.category === "achievement" &&
        row.badge_code &&
        getEventMetricValue(metrics, row.event_type) >= row.minimum_value,
    )
    .sort((left, right) => {
      const priorityDiff =
        priority.indexOf(left.event_type) - priority.indexOf(right.event_type);

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return right.minimum_value - left.minimum_value;
    });

  return unlocked;
}

function selectNextStepMessage(
  rows: GamificationMessageRow[],
  metrics: UserStatsMetrics,
) {
  const orderedEvents = [
    metrics.itemsPublished === 0 ? "items_published" : null,
    metrics.completedDeliveries < 3 ? "completed_deliveries" : null,
    metrics.sharedLocations === 0 ? "shared_locations" : null,
    metrics.recoveredItems < 3 ? "reused_items" : null,
    metrics.profileCompletion < 100 ? "profile_completion" : null,
    metrics.activityDays < 3 ? "active_days" : null,
    metrics.appliancePublications === 0 ? "appliance_publications" : null,
  ].filter((eventType): eventType is string => Boolean(eventType));

  for (const eventType of orderedEvents) {
    const currentValue = getEventMetricValue(metrics, eventType);
    const row = rows
      .filter(
        (message) =>
          message.category === "next_step" &&
          message.event_type === eventType &&
          currentValue < message.minimum_value,
      )
      .sort((left, right) => left.minimum_value - right.minimum_value)[0];

    if (row) {
      return row;
    }
  }

  return null;
}

function buildNextBadge(
  rows: GamificationMessageRow[],
  metrics: UserStatsMetrics,
): BadgeProgress | null {
  const priority = [
    "completed_deliveries",
    "reused_items",
    "shared_locations",
    "items_published",
    "profile_completion",
    "active_days",
    "appliance_publications",
  ];

  const nextBadge = rows
    .filter(
      (row) =>
        row.category === "achievement" &&
        row.badge_code &&
        getEventMetricValue(metrics, row.event_type) < row.minimum_value,
    )
    .sort((left, right) => {
      const priorityDiff =
        priority.indexOf(left.event_type) - priority.indexOf(right.event_type);

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      const leftRemaining =
        left.minimum_value - getEventMetricValue(metrics, left.event_type);
      const rightRemaining =
        right.minimum_value - getEventMetricValue(metrics, right.event_type);

      if (leftRemaining !== rightRemaining) {
        return leftRemaining - rightRemaining;
      }

      return left.minimum_value - right.minimum_value;
    })[0];

  if (!nextBadge || !nextBadge.badge_code) {
    return null;
  }

  const currentValue = getEventMetricValue(metrics, nextBadge.event_type);

  return {
    code: nextBadge.badge_code,
    title: nextBadge.title,
    eventType: nextBadge.event_type,
    currentValue,
    targetValue: nextBadge.minimum_value,
    remainingValue: Math.max(nextBadge.minimum_value - currentValue, 0),
    progressRatio:
      nextBadge.minimum_value === 0
        ? 1
        : Math.min(currentValue / nextBadge.minimum_value, 1),
  };
}

async function readGamificationMessages() {
  try {
    const tableLookup = await prisma.$queryRaw<Array<{ regclass: string | null }>>(
      Prisma.sql`SELECT to_regclass('public.gamification_messages')::text AS regclass`,
    );

    if (!tableLookup[0]?.regclass) {
      return [];
    }

    return await prisma.$queryRaw<GamificationMessageRow[]>(Prisma.sql`
      SELECT
        id,
        event_type,
        minimum_value,
        category,
        title,
        message,
        badge_code,
        active
      FROM public.gamification_messages
      WHERE active = true
      ORDER BY category ASC, event_type ASC, minimum_value ASC, id ASC
    `);
  } catch (error) {
    console.warn(
      "No fue posible leer public.gamification_messages. Se usarán mensajes locales.",
      error instanceof Error ? error.message : error,
    );

    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = normalizeText(searchParams.get("userId"));

    if (!userId) {
      return NextResponse.json(
        { message: "Debes indicar el usuario para consultar sus estadísticas." },
        { status: 400 },
      );
    }

    const [
      [
        user,
        itemsPublished,
        requestsReceived,
        completedClaimDeliveries,
        completedPickupDeliveries,
        sharedLocations,
        repairsStarted,
        repairedItems,
        donatedItems,
        recycledItems,
        recoveredItems,
        appliancePublications,
        co2Aggregate,
        listingActivity,
        claimActivity,
        pickupActivity,
        repairActivity,
        locationActivity,
      ],
      gamificationRows,
    ] = await Promise.all([
      prisma.$transaction([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            defaultAddressId: true,
          },
        }),
        prisma.listing.count({
          where: {
            ownerId: userId,
          },
        }),
        prisma.listingClaim.count({
          where: {
            listing: {
              ownerId: userId,
            },
          },
        }),
        prisma.listingClaim.count({
          where: {
            status: ClaimStatus.COMPLETED,
            OR: [
              { claimantId: userId },
              {
                listing: {
                  ownerId: userId,
                },
              },
            ],
          },
        }),
        prisma.pickupRequest.count({
          where: {
            requesterId: userId,
            status: PickupStatus.COMPLETED,
          },
        }),
        prisma.conversationMessage.count({
          where: {
            senderUserId: userId,
            messageType: "LOCATION",
          },
        }),
        prisma.repairRequest.count({
          where: {
            requesterId: userId,
          },
        }),
        prisma.repairRequest.count({
          where: {
            requesterId: userId,
            status: {
              in: [...DONE_REPAIR_STATUSES],
            },
          },
        }),
        prisma.listing.count({
          where: {
            ownerId: userId,
            actionType: ActionType.DONATE,
            status: {
              in: [ListingStatus.DONATED, ListingStatus.COMPLETED],
            },
          },
        }),
        prisma.listing.count({
          where: {
            ownerId: userId,
            actionType: ActionType.RECYCLE,
            status: {
              in: [...RECYCLING_LISTING_STATUSES],
            },
          },
        }),
        prisma.listing.count({
          where: {
            ownerId: userId,
            status: {
              in: [...DONE_LISTING_STATUSES],
            },
          },
        }),
        prisma.listing.count({
          where: {
            ownerId: userId,
            category: {
              OR: [
                {
                  slug: {
                    equals: "electrodomesticos",
                  },
                },
                {
                  name: {
                    contains: "electro",
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        }),
        prisma.listing.aggregate({
          where: {
            ownerId: userId,
            status: {
              in: [...DONE_LISTING_STATUSES],
            },
          },
          _sum: {
            co2EstimateKg: true,
          },
        }),
        prisma.listing.findMany({
          where: {
            ownerId: userId,
          },
          select: {
            createdAt: true,
          },
        }),
        prisma.listingClaim.findMany({
          where: {
            claimantId: userId,
          },
          select: {
            requestedAt: true,
          },
        }),
        prisma.pickupRequest.findMany({
          where: {
            requesterId: userId,
          },
          select: {
            createdAt: true,
          },
        }),
        prisma.repairRequest.findMany({
          where: {
            requesterId: userId,
          },
          select: {
            requestedAt: true,
          },
        }),
        prisma.conversationMessage.findMany({
          where: {
            senderUserId: userId,
            messageType: "LOCATION",
          },
          select: {
            createdAt: true,
          },
        }),
      ]),
      readGamificationMessages(),
    ]);

    if (!user) {
      return NextResponse.json(
        { message: "No se encontró el usuario solicitado." },
        { status: 404 },
      );
    }

    const activityDates = new Set(
      [
        ...listingActivity.map((item) => item.createdAt),
        ...claimActivity.map((item) => item.requestedAt),
        ...pickupActivity.map((item) => item.createdAt),
        ...repairActivity.map((item) => item.requestedAt),
        ...locationActivity.map((item) => item.createdAt),
      ].map((value) => value.toISOString().slice(0, 10)),
    );

    const profileFields = [
      Boolean(user.displayName ?? `${user.firstName} ${user.lastName ?? ""}`.trim()),
      Boolean(user.email),
      Boolean(user.phone),
      Boolean(user.avatarUrl),
      Boolean(user.defaultAddressId),
    ];
    const profileCompletion = Math.round(
      (profileFields.filter(Boolean).length / profileFields.length) * 100,
    );

    const metrics: UserStatsMetrics = {
      recoveredItems,
      completedDeliveries: Math.max(
        completedClaimDeliveries,
        completedPickupDeliveries,
        donatedItems,
      ),
      sharedLocations,
      itemsPublished,
      requestsReceived,
      repairsStarted,
      repairedItems,
      donatedItems,
      recycledItems,
      appliancePublications,
      positiveRatings: 0,
      activityDays: activityDates.size,
      profileCompletion,
      co2SavedKg: co2Aggregate._sum.co2EstimateKg
        ? Number(co2Aggregate._sum.co2EstimateKg.toString())
        : 0,
    };

    const badgeTitleLookup = buildBadgeTitleLookup(gamificationRows);
    const impactRow = selectImpactMessage(gamificationRows, metrics);
    const achievementRows = selectAchievementMessages(gamificationRows, metrics);
    const achievementRow = achievementRows[0] ?? null;
    const nextStepRow = selectNextStepMessage(gamificationRows, metrics);

    const impact =
      impactRow != null
        ? buildGamificationPayload(
            impactRow,
            getEventMetricValue(metrics, impactRow.event_type),
            badgeTitleLookup.get(
              `${impactRow.event_type}:${impactRow.minimum_value}`,
            ) ?? null,
          )
        : createDefaultImpact(metrics);

    const achievement =
      achievementRow != null
        ? buildGamificationPayload(
            achievementRow,
            getEventMetricValue(metrics, achievementRow.event_type),
            achievementRow.title,
          )
        : createDefaultAchievement(metrics);

    const nextStep =
      nextStepRow != null
        ? buildGamificationPayload(
            nextStepRow,
            getEventMetricValue(metrics, nextStepRow.event_type),
            badgeTitleLookup.get(
              `${nextStepRow.event_type}:${nextStepRow.minimum_value}`,
            ) ?? null,
          )
        : createDefaultNextStep(metrics);

    const unlockedBadges: UserBadge[] = achievementRows.map((row) => ({
      code: row.badge_code as string,
      title: row.title,
      eventType: row.event_type,
      unlockedAtValue: row.minimum_value,
    }));

    const response: UserStatsResponse = {
      metrics,
      impact,
      achievement,
      nextStep,
      unlockedBadges,
      nextBadge: buildNextBadge(gamificationRows, metrics),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error cargando estadísticas del usuario:", error);

    return NextResponse.json(
      { message: "No fue posible cargar el progreso ecológico del usuario." },
      { status: 500 },
    );
  }
}
