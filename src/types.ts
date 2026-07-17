export type UserRole = "user" | "collector" | "admin";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  address: string;
  phone: string;
  recycledCount: number;
  donatedCount: number;
  repairedCount: number;
  co2Saved: number; // in kg
}

export type ItemCategory = "muebles" | "electrodomesticos" | "electronicos" | "decoracion" | "oficina" | "otros";

export type ItemState = "nuevo" | "bueno" | "desgastado" | "dañado" | "inservible";

export type ActionType = "donar" | "reciclar" | "reparar";

export interface Listing {
  id: string;
  title: string;
  category: ItemCategory;
  description: string;
  state: ItemState;
  action: ActionType;
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
  status: "pendiente" | "aprobado" | "recolectado" | "donado" | "reparado";
}

export interface PublishListingInput {
  ownerId: string;
  title: string;
  category: ItemCategory;
  description: string;
  state: ItemState;
  action: ActionType;
  image: string;
  location: string;
  pickupAvailable: boolean;
  dateAvailable: string;
}

export interface PickupRequest {
  id: string;
  itemId?: string;
  listingId?: string;
  itemTitle: string;
  category: ItemCategory;
  address: string;
  date: string;
  timeSlot: string;
  status: "programado" | "en_ruta" | "completado" | "cancelado";
  collectorName?: string;
  notes?: string;
  source: "donacion" | "recoleccion";
}

export interface PickupListingOption {
  id: string;
  title: string;
  category: ItemCategory;
  location: string;
  pickupAvailable: boolean;
  status: Listing["status"];
}

export interface CreatePickupInput {
  requesterId: string;
  listingId: string;
  address: string;
  date: string;
  timeSlot: string;
  notes: string;
}

export interface ClaimListingInput {
  claimantId: string;
  listingId: string;
  message: string;
}

export interface RepairRequest {
  id: string;
  listingId?: string;
  itemName: string;
  category: ItemCategory;
  description: string;
  status: "revisión" | "en_taller" | "reparado" | "no_reparable";
  shopName: string;
  estimatedCost: string;
  date: string;
}

export interface RepairListingOption {
  id: string;
  title: string;
  category: ItemCategory;
  location: string;
  status: Listing["status"];
}

export interface RepairWorkshopProfile {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  address: string;
  phone: string;
  logoColor: string;
}

export interface CreateRepairInput {
  requesterId: string;
  listingId: string;
  workshopId: string;
  description: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: "success" | "info" | "warning";
}

export interface UserLocationSnapshot {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  capturedAt: string;
  source: string;
}

export interface ConversationParticipantProfile {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  lastReadAt: string | null;
  lastLocation: UserLocationSnapshot | null;
}

export interface ConversationMessageRecord {
  id: string;
  senderUserId: string;
  senderName: string;
  senderAvatarUrl: string | null;
  messageType: "TEXT" | "LOCATION" | "SYSTEM" | string;
  body: string | null;
  createdAt: string;
  location: {
    latitude: number;
    longitude: number;
    accuracyMeters: number | null;
    label: string | null;
  } | null;
}

export interface ConversationSummary {
  id: string;
  listingId: string | null;
  listingTitle: string | null;
  subject: string;
  status: string;
  unreadCount: number;
  lastActivityAt: string;
  lastMessage: {
    id: string;
    body: string | null;
    messageType: string;
    createdAt: string;
    senderUserId: string;
  } | null;
  otherParticipant: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    lastLocation: UserLocationSnapshot | null;
  } | null;
}

export interface ConversationDetail {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
  } | null;
  unreadCount: number;
  participants: ConversationParticipantProfile[];
  messages: ConversationMessageRecord[];
}

export interface WasteCenter {
  id: string;
  name: string;
  type: "municipal" | "donaciones" | "reparacion" | "punto_verde";
  address: string;
  accepts: string[];
  contact: string;
  hours: string;
  xRatio: number; // For plotting on our interactive map (0 to 100)
  yRatio: number; // For plotting on our interactive map (0 to 100)
}
