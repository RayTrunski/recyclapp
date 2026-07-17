import {
  ActionType,
  ActionType as PrismaActionType,
  ItemCondition,
  ListingStatus,
  Prisma,
} from "@prisma/client";
import { NextResponse } from "next/server";

import { CATEGORY_FALLBACK_IMAGES } from "@/lib/listing-images";
import { prisma } from "@/lib/prisma";

type ListingCardPayload = {
  id: string;
  title: string;
  category: ReturnType<typeof mapCategorySlug>;
  description: string;
  state: ReturnType<typeof mapCondition>;
  action: ReturnType<typeof mapAction>;
  image: string;
  location: string;
  pickupAvailable: boolean;
  dateAvailable: string;
  ownerId: string;
  ownerName: string;
  ownerContact: string;
  isClaimed: boolean;
  claimedBy?: string;
  createdAt: string;
  status: ReturnType<typeof mapStatus>;
};

type CreateListingRequest = {
  ownerId?: string;
  title?: string;
  category?: string;
  description?: string;
  state?: string;
  action?: string;
  image?: string;
  location?: string;
  pickupAvailable?: boolean;
  dateAvailable?: string;
};

function mapCategorySlug(slug: string) {
  switch (slug) {
    case "muebles":
    case "electrodomesticos":
    case "electronicos":
    case "decoracion":
    case "oficina":
      return slug;
    default:
      return "otros";
  }
}

function mapCondition(condition: ItemCondition) {
  switch (condition) {
    case ItemCondition.NEW:
      return "nuevo";
    case ItemCondition.GOOD:
      return "bueno";
    case ItemCondition.WORN:
      return "desgastado";
    case ItemCondition.DAMAGED:
      return "dañado";
    default:
      return "inservible";
  }
}

function mapAction(actionType: PrismaActionType) {
  switch (actionType) {
    case PrismaActionType.DONATE:
      return "donar";
    case PrismaActionType.REPAIR:
      return "reparar";
    default:
      return "reciclar";
  }
}

function mapStatus(status: ListingStatus) {
  switch (status) {
    case ListingStatus.APPROVED:
      return "aprobado";
    case ListingStatus.COLLECTED:
      return "recolectado";
    case ListingStatus.DONATED:
      return "donado";
    case ListingStatus.REPAIRED:
      return "reparado";
    default:
      return "pendiente";
  }
}

function formatLocation(address?: {
  addressLine1: string;
  city: string;
  neighborhood: string | null;
}) {
  if (!address) {
    return "Ubicación por confirmar";
  }

  return [address.addressLine1, address.neighborhood, address.city]
    .filter(Boolean)
    .join(", ");
}

function formatOwnerName(owner: {
  displayName: string | null;
  firstName: string;
  lastName: string | null;
}) {
  return owner.displayName ?? `${owner.firstName} ${owner.lastName ?? ""}`.trim();
}

function normalizeText(value: string | undefined) {
  return value?.trim() ?? "";
}

function mapRequestCondition(state: string) {
  switch (state) {
    case "nuevo":
      return ItemCondition.NEW;
    case "bueno":
      return ItemCondition.GOOD;
    case "desgastado":
      return ItemCondition.WORN;
    case "dañado":
      return ItemCondition.DAMAGED;
    default:
      return ItemCondition.UNUSABLE;
  }
}

function mapRequestAction(action: string) {
  switch (action) {
    case "donar":
      return ActionType.DONATE;
    case "reparar":
      return ActionType.REPAIR;
    default:
      return ActionType.RECYCLE;
  }
}

function parseLocationInput(location: string) {
  const parts = location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    addressLine1: parts[0] ?? location,
    neighborhood: parts.length >= 3 ? parts[1] : null,
    city: parts.length >= 2 ? parts[parts.length - 1] : location,
    municipality: parts.length >= 3 ? parts[parts.length - 1] : null,
  };
}

function buildListingPayload(listing: {
  id: string;
  title: string;
  description: string;
  condition: ItemCondition;
  actionType: PrismaActionType;
  status: ListingStatus;
  pickupAvailable: boolean;
  availableFrom: Date | null;
  createdAt: Date;
  ownerId: string;
  category: {
    slug: string;
  };
  owner: {
    firstName: string;
    lastName: string | null;
    displayName: string | null;
    phone: string | null;
    defaultAddress?: {
      addressLine1: string;
      city: string;
      neighborhood: string | null;
    } | null;
  };
  pickupAddress?: {
    addressLine1: string;
    city: string;
    neighborhood: string | null;
  } | null;
  images: Array<{
    url: string;
  }>;
  claims: Array<{
    claimantId: string;
  }>;
}): ListingCardPayload {
  const category = mapCategorySlug(listing.category.slug);
  const primaryImage = listing.images[0]?.url ?? CATEGORY_FALLBACK_IMAGES[category];

  return {
    id: listing.id,
    title: listing.title,
    category,
    description: listing.description,
    state: mapCondition(listing.condition),
    action: mapAction(listing.actionType),
    image: primaryImage,
    location: formatLocation(
      listing.pickupAddress ?? listing.owner.defaultAddress ?? undefined,
    ),
    pickupAvailable: listing.pickupAvailable,
    dateAvailable: listing.availableFrom?.toISOString().split("T")[0] ?? "",
    ownerId: listing.ownerId,
    ownerName: formatOwnerName(listing.owner),
    ownerContact: listing.owner.phone ?? "Sin teléfono registrado",
    isClaimed: listing.claims.length > 0,
    claimedBy: listing.claims[0]?.claimantId,
    createdAt: new Intl.DateTimeFormat("es-MX").format(listing.createdAt),
    status: mapStatus(listing.status),
  };
}

export async function GET() {
  try {
    const listings = await prisma.listing.findMany({
      where: { isActive: true },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        description: true,
        condition: true,
        actionType: true,
        status: true,
        pickupAvailable: true,
        availableFrom: true,
        createdAt: true,
        ownerId: true,
        category: {
          select: {
            slug: true,
          },
        },
        owner: {
          select: {
            firstName: true,
            lastName: true,
            displayName: true,
            phone: true,
            defaultAddress: {
              select: {
                addressLine1: true,
                city: true,
                neighborhood: true,
              },
            },
          },
        },
        pickupAddress: {
          select: {
            addressLine1: true,
            city: true,
            neighborhood: true,
          },
        },
        images: {
          orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }],
          take: 1,
          select: {
            url: true,
          },
        },
        claims: {
          take: 1,
          select: {
            claimantId: true,
          },
        },
      },
    });

    const payload = listings.map(buildListingPayload);

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo publicaciones:", error);

    return NextResponse.json(
      {
        message: "No fue posible cargar las publicaciones desde la base de datos.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateListingRequest;

    const ownerId = normalizeText(body.ownerId);
    const title = normalizeText(body.title);
    const categorySlug = normalizeText(body.category);
    const description =
      normalizeText(body.description) ||
      "Publicación registrada desde el formulario prototipo de ReCyClapp.";
    const location = normalizeText(body.location);
    const image = normalizeText(body.image);

    if (!ownerId || !title || !categorySlug || !location || !image) {
      return NextResponse.json(
        {
          message:
            "Faltan datos obligatorios para registrar el artículo en la base de datos.",
        },
        { status: 400 },
      );
    }

    const [owner, category] = await Promise.all([
      prisma.user.findUnique({
        where: { id: ownerId },
        select: {
          id: true,
          phone: true,
          firstName: true,
          lastName: true,
          displayName: true,
          defaultAddress: {
            select: {
              country: true,
              state: true,
              city: true,
            },
          },
        },
      }),
      prisma.category.findUnique({
        where: { slug: categorySlug },
        select: { id: true, slug: true },
      }),
    ]);

    if (!owner || !category) {
      return NextResponse.json(
        {
          message:
            "No se pudo relacionar el artículo con el usuario o la categoría seleccionada.",
        },
        { status: 404 },
      );
    }

    const parsedLocation = parseLocationInput(location);
    const availableFrom = body.dateAvailable
      ? new Date(body.dateAvailable)
      : new Date();

    const createdListing = await prisma.$transaction(async (tx) => {
      const pickupAddress = await tx.address.create({
        data: {
          ownerId: owner.id,
          label: "Punto de recolección",
          contactName:
            owner.displayName ??
            `${owner.firstName} ${owner.lastName ?? ""}`.trim(),
          phone: owner.phone,
          country: owner.defaultAddress?.country ?? "MX",
          state: owner.defaultAddress?.state ?? parsedLocation.city,
          city: parsedLocation.city || owner.defaultAddress?.city || "Sin ciudad",
          municipality: parsedLocation.municipality,
          neighborhood: parsedLocation.neighborhood,
          addressLine1: parsedLocation.addressLine1,
        },
      });

      return tx.listing.create({
        data: {
          ownerId: owner.id,
          categoryId: category.id,
          pickupAddressId: pickupAddress.id,
          title,
          description,
          condition: mapRequestCondition(body.state ?? "bueno"),
          actionType: mapRequestAction(body.action ?? "donar"),
          status: ListingStatus.APPROVED,
          pickupAvailable: body.pickupAvailable ?? true,
          availableFrom,
          isActive: true,
          estimatedWeightKg: new Prisma.Decimal(12),
          estimatedValue: new Prisma.Decimal(0),
          co2EstimateKg: new Prisma.Decimal(18),
          images: {
            create: {
              url: image,
              altText: title,
              isPrimary: true,
              displayOrder: 1,
            },
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          condition: true,
          actionType: true,
          status: true,
          pickupAvailable: true,
          availableFrom: true,
          createdAt: true,
          ownerId: true,
          category: {
            select: {
              slug: true,
            },
          },
          owner: {
            select: {
              firstName: true,
              lastName: true,
              displayName: true,
              phone: true,
              defaultAddress: {
                select: {
                  addressLine1: true,
                  city: true,
                  neighborhood: true,
                },
              },
            },
          },
          pickupAddress: {
            select: {
              addressLine1: true,
              city: true,
              neighborhood: true,
            },
          },
          images: {
            orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }],
            take: 1,
            select: {
              url: true,
            },
          },
          claims: {
            take: 1,
            select: {
              claimantId: true,
            },
          },
        },
      });
    });

    return NextResponse.json(
      {
        message: "Artículo registrado correctamente.",
        listing: buildListingPayload(createdListing),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creando publicación:", error);

    return NextResponse.json(
      {
        message:
          "No fue posible registrar el artículo en la base de datos en este momento.",
      },
      { status: 500 },
    );
  }
}
