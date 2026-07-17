import "dotenv/config";

import {
  ActionType,
  ItemCondition,
  ListingStatus,
  Prisma,
  PrismaClient,
  UserRole,
  VerificationStatus,
  WasteCenterType,
} from "@prisma/client";
import { faker } from "@faker-js/faker";

import { resolveDatabaseUrl } from "../lib/database-url";
import { LISTING_IMAGE_LIBRARY } from "../lib/listing-images";

type CategorySlug =
  | "muebles"
  | "electrodomesticos"
  | "electronicos"
  | "decoracion"
  | "oficina"
  | "otros";

type DemoUserSeed = {
  id: string;
  addressId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  password: string;
  state: string;
  city: string;
  municipality: string;
  neighborhood: string;
  postalCode: string;
  addressLine1: string;
};

type ListingSeed = {
  id: string;
  addressId: string;
  imageId: string;
  title: string;
  categorySlug: CategorySlug;
  actionType: ActionType;
  condition: ItemCondition;
  status: ListingStatus;
  ownerEmail: string;
  state: string;
  city: string;
  municipality: string;
  neighborhood: string;
  postalCode: string;
  addressLine1: string;
  imageUrl: string;
  description: string;
  pickupAvailable: boolean;
};

type RepairWorkshopSeed = {
  id: string;
  addressId: string;
  slug: string;
  name: string;
  specialty: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  acceptsHomeVisit: boolean;
  state: string;
  city: string;
  municipality: string;
  neighborhood: string;
  postalCode: string;
  addressLine1: string;
};

const databaseUrl = new URL(resolveDatabaseUrl());
process.env.DATABASE_URL = databaseUrl.toString();

const prisma = new PrismaClient();

faker.seed(20260716);
faker.setDefaultRefDate("2026-07-16T00:00:00.000Z");

const makeSeedUuid = (value: number) =>
  `00000000-0000-0000-0000-${value.toString().padStart(12, "0")}`;

const CATEGORY_SEED = [
  {
    id: makeSeedUuid(11),
    slug: "muebles",
    name: "Muebles",
    description: "Sofas, mesas, sillas, camas y muebles del hogar.",
    sortOrder: 1,
  },
  {
    id: makeSeedUuid(12),
    slug: "electrodomesticos",
    name: "Electrodomésticos",
    description: "Refrigeradores, lavadoras, microondas y linea blanca.",
    sortOrder: 2,
  },
  {
    id: makeSeedUuid(13),
    slug: "electronicos",
    name: "Electrónicos",
    description: "Televisores, monitores, audio, consolas y pequeños gadgets.",
    sortOrder: 3,
  },
  {
    id: makeSeedUuid(14),
    slug: "decoracion",
    name: "Decoración",
    description: "Lamparas, espejos, alfombras y objetos para el hogar.",
    sortOrder: 4,
  },
  {
    id: makeSeedUuid(15),
    slug: "oficina",
    name: "Oficina",
    description: "Sillas, escritorios, archiveros y equipo de oficina.",
    sortOrder: 5,
  },
  {
    id: makeSeedUuid(16),
    slug: "otros",
    name: "Otros",
    description: "Artículos mixtos reutilizables o reciclables.",
    sortOrder: 6,
  },
] as const satisfies readonly {
  id: string;
  slug: CategorySlug;
  name: string;
  description: string;
  sortOrder: number;
}[];

const DEMO_USERS: DemoUserSeed[] = [
  {
    id: makeSeedUuid(101),
    addressId: makeSeedUuid(1101),
    firstName: "Clara",
    lastName: "Solís",
    email: "clara@recyclapp.mx",
    phone: "+52 55 2100 1101",
    role: UserRole.USER,
    password: "recyclapp123",
    state: "Ciudad de Mexico",
    city: "Benito Juarez",
    municipality: "Del Valle",
    neighborhood: "Narvarte Poniente",
    postalCode: "03020",
    addressLine1: "Eje 5 Sur 212",
  },
  {
    id: makeSeedUuid(102),
    addressId: makeSeedUuid(1102),
    firstName: "Rodrigo",
    lastName: "Sanhueza",
    email: "rodrigo@recyclapp.mx",
    phone: "+52 55 2100 1102",
    role: UserRole.USER,
    password: "recyclapp123",
    state: "Ciudad de Mexico",
    city: "Coyoacan",
    municipality: "Coyoacan",
    neighborhood: "Del Carmen",
    postalCode: "04100",
    addressLine1: "Avenida Miguel Angel de Quevedo 551",
  },
  {
    id: makeSeedUuid(103),
    addressId: makeSeedUuid(1103),
    firstName: "Marta",
    lastName: "Riquelme",
    email: "marta@recyclapp.mx",
    phone: "+52 55 2100 1103",
    role: UserRole.USER,
    password: "recyclapp123",
    state: "Jalisco",
    city: "Guadalajara",
    municipality: "Providencia",
    neighborhood: "Lomas del Valle",
    postalCode: "44657",
    addressLine1: "Avenida Terranova 1870",
  },
  {
    id: makeSeedUuid(104),
    addressId: makeSeedUuid(1104),
    firstName: "Pablo",
    lastName: "Cáceres",
    email: "pablo@recyclapp.mx",
    phone: "+52 55 2100 1104",
    role: UserRole.USER,
    password: "recyclapp123",
    state: "Nuevo Leon",
    city: "Monterrey",
    municipality: "San Pedro",
    neighborhood: "Del Valle",
    postalCode: "66220",
    addressLine1: "Calzada del Valle 310",
  },
  {
    id: makeSeedUuid(105),
    addressId: makeSeedUuid(1105),
    firstName: "Lucía",
    lastName: "Pérez",
    email: "lucia@recyclapp.mx",
    phone: "+52 55 2100 1105",
    role: UserRole.USER,
    password: "recyclapp123",
    state: "Ciudad de Mexico",
    city: "Cuauhtemoc",
    municipality: "Roma Norte",
    neighborhood: "Roma Norte",
    postalCode: "06700",
    addressLine1: "Orizaba 94",
  },
  {
    id: makeSeedUuid(106),
    addressId: makeSeedUuid(1106),
    firstName: "Valentina",
    lastName: "Morales",
    email: "valentina@recyclapp.mx",
    phone: "+52 55 2100 1106",
    role: UserRole.USER,
    password: "recyclapp123",
    state: "Jalisco",
    city: "Zapopan",
    municipality: "Chapalita",
    neighborhood: "Ciudad del Sol",
    postalCode: "45050",
    addressLine1: "Avenida Guadalupe 1221",
  },
  {
    id: makeSeedUuid(107),
    addressId: makeSeedUuid(1107),
    firstName: "Juan",
    lastName: "Camioneta",
    email: "juan.collector@recyclapp.mx",
    phone: "+52 55 2100 1107",
    role: UserRole.COLLECTOR,
    password: "recyclapp123",
    state: "Ciudad de Mexico",
    city: "Iztapalapa",
    municipality: "Iztapalapa",
    neighborhood: "Escuadron 201",
    postalCode: "09060",
    addressLine1: "Calzada Ermita Iztapalapa 1440",
  },
  {
    id: makeSeedUuid(108),
    addressId: makeSeedUuid(1108),
    firstName: "Lara",
    lastName: "Transporte",
    email: "lara.collector@recyclapp.mx",
    phone: "+52 55 2100 1108",
    role: UserRole.COLLECTOR,
    password: "recyclapp123",
    state: "Jalisco",
    city: "Tlaquepaque",
    municipality: "Centro",
    neighborhood: "Las Huertas",
    postalCode: "45500",
    addressLine1: "Avenida Niños Heroes 498",
  },
  {
    id: makeSeedUuid(109),
    addressId: makeSeedUuid(1109),
    firstName: "Sofía",
    lastName: "Navarro",
    email: "sofia.admin@recyclapp.mx",
    phone: "+52 55 2100 1109",
    role: UserRole.ADMIN,
    password: "recyclapp123",
    state: "Ciudad de Mexico",
    city: "Miguel Hidalgo",
    municipality: "Polanco",
    neighborhood: "Polanco",
    postalCode: "11550",
    addressLine1: "Avenida Presidente Masaryk 410",
  },
  {
    id: makeSeedUuid(110),
    addressId: makeSeedUuid(1110),
    firstName: "Carlos",
    lastName: "González",
    email: "carlos@recyclapp.mx",
    phone: "+52 55 2100 1110",
    role: UserRole.USER,
    password: "recyclapp123",
    state: "Puebla",
    city: "Puebla",
    municipality: "Angelopolis",
    neighborhood: "La Paz",
    postalCode: "72160",
    addressLine1: "Boulevard Atlantico 202",
  },
];

const WASTE_CENTER_SEED = [
  {
    id: makeSeedUuid(6001),
    addressId: makeSeedUuid(6101),
    slug: "centro-verde-del-valle",
    name: "Centro Verde del Valle",
    type: WasteCenterType.MUNICIPAL,
    description: "Punto municipal para muebles, metal y carton.",
    phone: "+52 55 4000 1001",
    email: "valle@recyclapp.mx",
    hours: "Lun - Sab: 08:00 a 17:00",
    acceptedMaterials: ["Madera", "Metal", "Carton", "Plastico"],
    state: "Ciudad de Mexico",
    city: "Benito Juarez",
    municipality: "Del Valle",
    neighborhood: "Del Valle Centro",
    postalCode: "03100",
    addressLine1: "Parroquia 1223",
  },
  {
    id: makeSeedUuid(6002),
    addressId: makeSeedUuid(6102),
    slug: "punto-donacion-chapalita",
    name: "Punto Donación Chapalita",
    type: WasteCenterType.DONATION,
    description: "Centro especializado en recuperación de muebles funcionales.",
    phone: "+52 33 4000 1002",
    email: "chapalita@recyclapp.mx",
    hours: "Lun - Vie: 09:00 a 18:00",
    acceptedMaterials: [
      "Sofas",
      "Mesas",
      "Sillas",
      "Electrodomesticos funcionales",
    ],
    state: "Jalisco",
    city: "Zapopan",
    municipality: "Chapalita",
    neighborhood: "Ciudad del Sol",
    postalCode: "45050",
    addressLine1: "Avenida de las Rosas 440",
  },
  {
    id: makeSeedUuid(6003),
    addressId: makeSeedUuid(6103),
    slug: "eco-repair-san-pedro",
    name: "Eco Repair San Pedro",
    type: WasteCenterType.REPAIR,
    description: "Recepción de equipos para reacondicionamiento técnico.",
    phone: "+52 81 4000 1003",
    email: "repair@recyclapp.mx",
    hours: "Lun - Sab: 09:00 a 16:00",
    acceptedMaterials: [
      "Refrigeradores",
      "Lavadoras",
      "Televisores",
      "Microondas",
    ],
    state: "Nuevo Leon",
    city: "Monterrey",
    municipality: "San Pedro",
    neighborhood: "Del Valle",
    postalCode: "66220",
    addressLine1: "Rio Orinoco 220",
  },
  {
    id: makeSeedUuid(6004),
    addressId: makeSeedUuid(6104),
    slug: "punto-verde-roma",
    name: "Punto Verde Roma",
    type: WasteCenterType.GREEN_POINT,
    description: "Punto limpio para electrónicos pequeños y materiales mixtos.",
    phone: "+52 55 4000 1004",
    email: "roma@recyclapp.mx",
    hours: "Lun - Dom: 10:00 a 19:00",
    acceptedMaterials: ["Vidrio", "Papel", "Plastico", "Electronicos pequenos"],
    state: "Ciudad de Mexico",
    city: "Cuauhtemoc",
    municipality: "Roma Norte",
    neighborhood: "Roma Norte",
    postalCode: "06700",
    addressLine1: "Alvaro Obregon 172",
  },
  {
    id: makeSeedUuid(6005),
    addressId: makeSeedUuid(6105),
    slug: "acopio-la-paz",
    name: "Acopio La Paz",
    type: WasteCenterType.MUNICIPAL,
    description: "Centro de acopio orientado a muebles grandes y madera.",
    phone: "+52 222 4000 1005",
    email: "lapaz@recyclapp.mx",
    hours: "Lun - Vie: 09:00 a 18:00, Sab: 09:00 a 14:00",
    acceptedMaterials: ["Madera", "Metal", "Carton", "Plastico"],
    state: "Puebla",
    city: "Puebla",
    municipality: "La Paz",
    neighborhood: "La Paz",
    postalCode: "72160",
    addressLine1: "Teziutlan Sur 41",
  },
];

const REPAIR_WORKSHOP_SEED: RepairWorkshopSeed[] = [
  {
    id: makeSeedUuid(7001),
    addressId: makeSeedUuid(7101),
    slug: "electro-clinica-sostenible",
    name: "Electro-Clínica Sostenible",
    specialty: "Electrodomésticos pequeños y tarjetas electrónicas",
    description: "Diagnóstico y recuperación de pequeños aparatos con enfoque de reutilización.",
    phone: "+52 55 6100 2001",
    email: "contacto@electroclinica.mx",
    website: "https://electroclinica.recyclapp.mx",
    acceptsHomeVisit: false,
    state: "Ciudad de Mexico",
    city: "Cuauhtemoc",
    municipality: "Roma Norte",
    neighborhood: "Roma Norte",
    postalCode: "06700",
    addressLine1: "Zacatecas 44",
  },
  {
    id: makeSeedUuid(7002),
    addressId: makeSeedUuid(7102),
    slug: "taller-vintage-madera",
    name: "Taller Vintage Madera",
    specialty: "Restauración de muebles finos y tapicería",
    description: "Upcycling de mesas, sillas, libreros y piezas antiguas de madera.",
    phone: "+52 55 6100 2002",
    email: "hola@tallervintage.mx",
    website: "https://tallervintage.recyclapp.mx",
    acceptsHomeVisit: true,
    state: "Ciudad de Mexico",
    city: "Benito Juarez",
    municipality: "Del Valle",
    neighborhood: "Del Valle Centro",
    postalCode: "03100",
    addressLine1: "Parroquia 885",
  },
  {
    id: makeSeedUuid(7003),
    addressId: makeSeedUuid(7103),
    slug: "servicio-tecnico-hermanos-silva",
    name: "Servicio Técnico Hermanos Silva",
    specialty: "Refrigeración general y lavadoras",
    description: "Especialistas en línea blanca con repuestos reacondicionados.",
    phone: "+52 55 6100 2003",
    email: "silva@recyclapp.mx",
    website: "https://silva.recyclapp.mx",
    acceptsHomeVisit: true,
    state: "Ciudad de Mexico",
    city: "Coyoacan",
    municipality: "Coyoacan",
    neighborhood: "Del Carmen",
    postalCode: "04100",
    addressLine1: "Xicotencatl 215",
  },
  {
    id: makeSeedUuid(7004),
    addressId: makeSeedUuid(7104),
    slug: "upcycle-lab-zapopan",
    name: "Upcycle Lab Zapopan",
    specialty: "Muebles modulares y oficinas",
    description: "Renovación de escritorios, sillas y almacenamiento para oficina doméstica.",
    phone: "+52 33 6100 2004",
    email: "hola@upcyclelab.mx",
    website: "https://upcyclelab.recyclapp.mx",
    acceptsHomeVisit: false,
    state: "Jalisco",
    city: "Zapopan",
    municipality: "Chapalita",
    neighborhood: "Ciudad del Sol",
    postalCode: "45050",
    addressLine1: "Avenida de las Rosas 311",
  },
  {
    id: makeSeedUuid(7005),
    addressId: makeSeedUuid(7105),
    slug: "rescate-electronico-centro",
    name: "Rescate Electrónico Centro",
    specialty: "Monitores, audio y equipos vintage",
    description: "Recuperación funcional y reparación de electrónica de consumo.",
    phone: "+52 81 6100 2005",
    email: "rescate@recyclapp.mx",
    website: "https://rescateelectronico.recyclapp.mx",
    acceptsHomeVisit: false,
    state: "Nuevo Leon",
    city: "Monterrey",
    municipality: "San Pedro",
    neighborhood: "Del Valle",
    postalCode: "66220",
    addressLine1: "Calzada San Pedro 205",
  },
  {
    id: makeSeedUuid(7006),
    addressId: makeSeedUuid(7106),
    slug: "casa-del-repuesto-puebla",
    name: "Casa del Repuesto Puebla",
    specialty: "Microondas, hornos y pequeños motores",
    description: "Taller enfocado en reparación rápida de cocina y aparatos compactos.",
    phone: "+52 222 6100 2006",
    email: "repuesto@recyclapp.mx",
    website: "https://casadelrepuesto.recyclapp.mx",
    acceptsHomeVisit: false,
    state: "Puebla",
    city: "Puebla",
    municipality: "La Paz",
    neighborhood: "La Paz",
    postalCode: "72160",
    addressLine1: "Teziutlan Norte 12",
  },
  {
    id: makeSeedUuid(7007),
    addressId: makeSeedUuid(7107),
    slug: "tapiz-eco-atelier",
    name: "Tapiz Eco Atelier",
    specialty: "Tapicería, cojinería y reparación textil",
    description: "Reacondicionamiento de sillones, sofás y mobiliario suave.",
    phone: "+52 55 6100 2007",
    email: "atelier@recyclapp.mx",
    website: "https://tapizeco.recyclapp.mx",
    acceptsHomeVisit: true,
    state: "Ciudad de Mexico",
    city: "Miguel Hidalgo",
    municipality: "Anzures",
    neighborhood: "Anzures",
    postalCode: "11590",
    addressLine1: "Lafontaine 108",
  },
  {
    id: makeSeedUuid(7008),
    addressId: makeSeedUuid(7108),
    slug: "repara-tu-oficina",
    name: "Repara Tu Oficina",
    specialty: "Sillas, ruedas, pistones y mobiliario ejecutivo",
    description: "Mantenimiento técnico para home office y espacios corporativos.",
    phone: "+52 33 6100 2008",
    email: "oficina@recyclapp.mx",
    website: "https://reparatuoficina.recyclapp.mx",
    acceptsHomeVisit: true,
    state: "Jalisco",
    city: "Guadalajara",
    municipality: "Providencia",
    neighborhood: "Lomas del Valle",
    postalCode: "44657",
    addressLine1: "Montevideo 2679",
  },
  {
    id: makeSeedUuid(7009),
    addressId: makeSeedUuid(7109),
    slug: "linea-blanca-monterrey",
    name: "Línea Blanca Monterrey",
    specialty: "Lavadoras, secadoras y refrigeración mayor",
    description: "Diagnóstico a domicilio para línea blanca y reemplazo de componentes.",
    phone: "+52 81 6100 2009",
    email: "lineablanca@recyclapp.mx",
    website: "https://lineablanca.recyclapp.mx",
    acceptsHomeVisit: true,
    state: "Nuevo Leon",
    city: "Monterrey",
    municipality: "San Pedro",
    neighborhood: "Fuentes del Valle",
    postalCode: "66224",
    addressLine1: "Rio Guadalquivir 410",
  },
  {
    id: makeSeedUuid(7010),
    addressId: makeSeedUuid(7110),
    slug: "laboratorio-verde-digital",
    name: "Laboratorio Verde Digital",
    specialty: "Diagnóstico de TV, impresoras y pantallas",
    description: "Banco de pruebas para electrónica visual y periféricos del hogar.",
    phone: "+52 222 6100 2010",
    email: "labverde@recyclapp.mx",
    website: "https://labverde.recyclapp.mx",
    acceptsHomeVisit: false,
    state: "Puebla",
    city: "Puebla",
    municipality: "Angelopolis",
    neighborhood: "La Paz",
    postalCode: "72160",
    addressLine1: "Avenida Juarez 2908",
  },
];

const LISTING_SEED: ListingSeed[] = [
  {
    id: makeSeedUuid(2001),
    addressId: makeSeedUuid(3001),
    imageId: makeSeedUuid(4001),
    title: "Sofá modular gris de 3 cuerpos",
    categorySlug: "muebles",
    actionType: ActionType.DONATE,
    condition: ItemCondition.GOOD,
    status: ListingStatus.APPROVED,
    ownerEmail: "clara@recyclapp.mx",
    state: "Ciudad de Mexico",
    city: "Benito Juarez",
    municipality: "Del Valle",
    neighborhood: "Narvarte Poniente",
    postalCode: "03020",
    addressLine1: "Concepcion Beistegui 1515",
    imageUrl: LISTING_IMAGE_LIBRARY.sofa,
    description:
      "Sofá amplio con estructura firme, tapizado limpio y cojines completos. Ideal para una segunda vida en sala familiar.",
    pickupAvailable: true,
  },
  {
    id: makeSeedUuid(2002),
    addressId: makeSeedUuid(3002),
    imageId: makeSeedUuid(4002),
    title: "Refrigerador no frost 340L",
    categorySlug: "electrodomesticos",
    actionType: ActionType.REPAIR,
    condition: ItemCondition.DAMAGED,
    status: ListingStatus.APPROVED,
    ownerEmail: "rodrigo@recyclapp.mx",
    state: "Ciudad de Mexico",
    city: "Coyoacan",
    municipality: "Coyoacan",
    neighborhood: "Del Carmen",
    postalCode: "04100",
    addressLine1: "Felipe Carrillo Puerto 88",
    imageUrl: LISTING_IMAGE_LIBRARY.fridge,
    description:
      "Enfría bien abajo, pero el congelador genera escarcha. Puede recuperarse con mantenimiento y revisión de sellos.",
    pickupAvailable: true,
  },
  {
    id: makeSeedUuid(2003),
    addressId: makeSeedUuid(3003),
    imageId: makeSeedUuid(4003),
    title: "Mesa redonda restaurada",
    categorySlug: "muebles",
    actionType: ActionType.DONATE,
    condition: ItemCondition.WORN,
    status: ListingStatus.APPROVED,
    ownerEmail: "marta@recyclapp.mx",
    state: "Jalisco",
    city: "Guadalajara",
    municipality: "Providencia",
    neighborhood: "Lomas del Valle",
    postalCode: "44657",
    addressLine1: "Ontario 1110",
    imageUrl: LISTING_IMAGE_LIBRARY.table,
    description:
      "Mesa de madera maciza para comedor pequeño. Tiene marcas superficiales, pero conserva excelente estabilidad.",
    pickupAvailable: false,
  },
  {
    id: makeSeedUuid(2004),
    addressId: makeSeedUuid(3004),
    imageId: makeSeedUuid(4004),
    title: "Televisor de 21 pulgadas para reciclaje",
    categorySlug: "electronicos",
    actionType: ActionType.RECYCLE,
    condition: ItemCondition.UNUSABLE,
    status: ListingStatus.APPROVED,
    ownerEmail: "pablo@recyclapp.mx",
    state: "Nuevo Leon",
    city: "Monterrey",
    municipality: "San Pedro",
    neighborhood: "Del Valle",
    postalCode: "66220",
    addressLine1: "Vasconcelos 901",
    imageUrl: LISTING_IMAGE_LIBRARY.television,
    description:
      "Equipo antiguo con tarjeta dañada. Útil para recuperación de materiales y proyectos de upcycling decorativo.",
    pickupAvailable: true,
  },
  {
    id: makeSeedUuid(2005),
    addressId: makeSeedUuid(3005),
    imageId: makeSeedUuid(4005),
    title: "Silla ergonómica de oficina negra",
    categorySlug: "oficina",
    actionType: ActionType.DONATE,
    condition: ItemCondition.GOOD,
    status: ListingStatus.APPROVED,
    ownerEmail: "lucia@recyclapp.mx",
    state: "Ciudad de Mexico",
    city: "Cuauhtemoc",
    municipality: "Roma Norte",
    neighborhood: "Roma Norte",
    postalCode: "06700",
    addressLine1: "Colima 231",
    imageUrl: LISTING_IMAGE_LIBRARY.officeChair,
    description:
      "Silla giratoria con ajuste de altura y respaldo firme. Presenta uso ligero, pero funciona muy bien para home office.",
    pickupAvailable: false,
  },
  {
    id: makeSeedUuid(2006),
    addressId: makeSeedUuid(3006),
    imageId: makeSeedUuid(4006),
    title: "Lámpara de pie vintage cromada",
    categorySlug: "decoracion",
    actionType: ActionType.DONATE,
    condition: ItemCondition.GOOD,
    status: ListingStatus.APPROVED,
    ownerEmail: "valentina@recyclapp.mx",
    state: "Jalisco",
    city: "Zapopan",
    municipality: "Chapalita",
    neighborhood: "Ciudad del Sol",
    postalCode: "45050",
    addressLine1: "Avenida Tepeyac 480",
    imageUrl: LISTING_IMAGE_LIBRARY.standingLamp,
    description:
      "Lámpara funcional con base metálica y pantalla renovada. Ideal para salas, estudios o ambientación retro.",
    pickupAvailable: true,
  },
  {
    id: makeSeedUuid(2007),
    addressId: makeSeedUuid(3007),
    imageId: makeSeedUuid(4007),
    title: "Estantería alta de madera clara",
    categorySlug: "muebles",
    actionType: ActionType.DONATE,
    condition: ItemCondition.NEW,
    status: ListingStatus.APPROVED,
    ownerEmail: "carlos@recyclapp.mx",
    state: "Puebla",
    city: "Puebla",
    municipality: "Angelopolis",
    neighborhood: "La Paz",
    postalCode: "72160",
    addressLine1: "Circuito Juan Pablo II 2204",
    imageUrl: LISTING_IMAGE_LIBRARY.shelves,
    description:
      "Estantería armada recientemente, muy estable y con gran capacidad para libros o almacenaje decorativo.",
    pickupAvailable: true,
  },
  {
    id: makeSeedUuid(2008),
    addressId: makeSeedUuid(3008),
    imageId: makeSeedUuid(4008),
    title: "Lavadora de carga frontal 16 kg",
    categorySlug: "electrodomesticos",
    actionType: ActionType.REPAIR,
    condition: ItemCondition.DAMAGED,
    status: ListingStatus.APPROVED,
    ownerEmail: "clara@recyclapp.mx",
    state: "Ciudad de Mexico",
    city: "Benito Juarez",
    municipality: "Del Valle",
    neighborhood: "Del Valle Centro",
    postalCode: "03100",
    addressLine1: "Pilares 1020",
    imageUrl: LISTING_IMAGE_LIBRARY.washingMachine,
    description:
      "Lavadora con falla en el centrifugado. El panel responde bien, por lo que se perfila como buena candidata a reparación.",
    pickupAvailable: true,
  },
  {
    id: makeSeedUuid(2009),
    addressId: makeSeedUuid(3009),
    imageId: makeSeedUuid(4009),
    title: "Escritorio compacto de madera y metal",
    categorySlug: "oficina",
    actionType: ActionType.DONATE,
    condition: ItemCondition.GOOD,
    status: ListingStatus.APPROVED,
    ownerEmail: "rodrigo@recyclapp.mx",
    state: "Ciudad de Mexico",
    city: "Coyoacan",
    municipality: "Coyoacan",
    neighborhood: "Santa Catarina",
    postalCode: "04010",
    addressLine1: "Avenida Universidad 1330",
    imageUrl: LISTING_IMAGE_LIBRARY.desk,
    description:
      "Escritorio ideal para estudio o teletrabajo. La cubierta está en buen estado y la estructura es muy resistente.",
    pickupAvailable: false,
  },
  {
    id: makeSeedUuid(2010),
    addressId: makeSeedUuid(3010),
    imageId: makeSeedUuid(4010),
    title: "Microondas digital color plata",
    categorySlug: "electrodomesticos",
    actionType: ActionType.REPAIR,
    condition: ItemCondition.WORN,
    status: ListingStatus.APPROVED,
    ownerEmail: "marta@recyclapp.mx",
    state: "Jalisco",
    city: "Guadalajara",
    municipality: "Providencia",
    neighborhood: "Americana",
    postalCode: "44160",
    addressLine1: "Lopez Cotilla 1533",
    imageUrl: LISTING_IMAGE_LIBRARY.microwave,
    description:
      "Enciende correctamente, pero el plato dejó de girar. Puede aprovecharse para reparación o piezas funcionales.",
    pickupAvailable: true,
  },
  {
    id: makeSeedUuid(2011),
    addressId: makeSeedUuid(3011),
    imageId: makeSeedUuid(4011),
    title: "Mueble recibidor con espejo",
    categorySlug: "decoracion",
    actionType: ActionType.DONATE,
    condition: ItemCondition.GOOD,
    status: ListingStatus.APPROVED,
    ownerEmail: "pablo@recyclapp.mx",
    state: "Nuevo Leon",
    city: "Monterrey",
    municipality: "San Pedro",
    neighborhood: "Fuentes del Valle",
    postalCode: "66224",
    addressLine1: "Rio Amazonas 312",
    imageUrl: LISTING_IMAGE_LIBRARY.entrywayConsole,
    description:
      "Recibidor de entrada con cajón funcional y espejo rectangular. Útil para departamentos o espacios reducidos.",
    pickupAvailable: false,
  },
  {
    id: makeSeedUuid(2012),
    addressId: makeSeedUuid(3012),
    imageId: makeSeedUuid(4012),
    title: "Monitor LED de 24 pulgadas",
    categorySlug: "electronicos",
    actionType: ActionType.REPAIR,
    condition: ItemCondition.WORN,
    status: ListingStatus.APPROVED,
    ownerEmail: "lucia@recyclapp.mx",
    state: "Ciudad de Mexico",
    city: "Cuauhtemoc",
    municipality: "Condesa",
    neighborhood: "Hipodromo",
    postalCode: "06100",
    addressLine1: "Amsterdam 188",
    imageUrl: LISTING_IMAGE_LIBRARY.monitor,
    description:
      "Monitor con una línea tenue en la pantalla. Funciona para diagnóstico, reparación o reaprovechamiento técnico.",
    pickupAvailable: true,
  },
  {
    id: makeSeedUuid(2013),
    addressId: makeSeedUuid(3013),
    imageId: makeSeedUuid(4013),
    title: "Mesa lateral blanca con ruedas",
    categorySlug: "muebles",
    actionType: ActionType.DONATE,
    condition: ItemCondition.NEW,
    status: ListingStatus.APPROVED,
    ownerEmail: "valentina@recyclapp.mx",
    state: "Jalisco",
    city: "Zapopan",
    municipality: "Chapalita",
    neighborhood: "Jardines del Sol",
    postalCode: "45050",
    addressLine1: "Avenida de la Calma 241",
    imageUrl: LISTING_IMAGE_LIBRARY.rollingDesk,
    description:
      "Mesa lateral móvil perfecta para estudio, cama o sala. Recién ensamblada y lista para uso inmediato.",
    pickupAvailable: false,
  },
  {
    id: makeSeedUuid(2014),
    addressId: makeSeedUuid(3014),
    imageId: makeSeedUuid(4014),
    title: "Closet modular de 2 puertas",
    categorySlug: "muebles",
    actionType: ActionType.DONATE,
    condition: ItemCondition.GOOD,
    status: ListingStatus.APPROVED,
    ownerEmail: "carlos@recyclapp.mx",
    state: "Puebla",
    city: "Puebla",
    municipality: "La Paz",
    neighborhood: "Huexotitla",
    postalCode: "72534",
    addressLine1: "31 Poniente 2907",
    imageUrl: LISTING_IMAGE_LIBRARY.closetWithDoors,
    description:
      "Armario compacto con interiores limpios y bisagras firmes. Buen candidato para reutilización inmediata.",
    pickupAvailable: true,
  },
  {
    id: makeSeedUuid(2015),
    addressId: makeSeedUuid(3015),
    imageId: makeSeedUuid(4015),
    title: "Par de burós",
    categorySlug: "muebles",
    actionType: ActionType.DONATE,
    condition: ItemCondition.WORN,
    status: ListingStatus.APPROVED,
    ownerEmail: "clara@recyclapp.mx",
    state: "Ciudad de Mexico",
    city: "Benito Juarez",
    municipality: "Nápoles",
    neighborhood: "Nápoles",
    postalCode: "03810",
    addressLine1: "Pennsylvania 215",
    imageUrl: LISTING_IMAGE_LIBRARY.writingDeskPair,
    description:
      "Dos mesas de noche con detalles leves en las esquinas. Todavía lucen bien y sus cajones corren sin problema.",
    pickupAvailable: false,
  },
  {
    id: makeSeedUuid(2016),
    addressId: makeSeedUuid(3016),
    imageId: makeSeedUuid(4016),
    title: "Impresora multifuncional para reciclaje",
    categorySlug: "oficina",
    actionType: ActionType.RECYCLE,
    condition: ItemCondition.UNUSABLE,
    status: ListingStatus.APPROVED,
    ownerEmail: "rodrigo@recyclapp.mx",
    state: "Ciudad de Mexico",
    city: "Coyoacan",
    municipality: "Copilco",
    neighborhood: "Copilco el Bajo",
    postalCode: "04340",
    addressLine1: "Cerro del Agua 240",
    imageUrl: LISTING_IMAGE_LIBRARY.printer,
    description:
      "La impresora dejó de encender. Se ofrece para despiece, recuperación de materiales o reciclaje responsable.",
    pickupAvailable: true,
  },
  {
    id: makeSeedUuid(2017),
    addressId: makeSeedUuid(3017),
    imageId: makeSeedUuid(4017),
    title: "Base de cama matrimonial con cajones",
    categorySlug: "muebles",
    actionType: ActionType.DONATE,
    condition: ItemCondition.GOOD,
    status: ListingStatus.PENDING_REVIEW,
    ownerEmail: "marta@recyclapp.mx",
    state: "Jalisco",
    city: "Guadalajara",
    municipality: "Providencia",
    neighborhood: "Monraz",
    postalCode: "44670",
    addressLine1: "Juan Palomar y Arias 780",
    imageUrl: LISTING_IMAGE_LIBRARY.bedBase,
    description:
      "Base matrimonial robusta con cajones de guardado. Necesita revisión visual de un costado antes de publicar.",
    pickupAvailable: true,
  },
  {
    id: makeSeedUuid(2018),
    addressId: makeSeedUuid(3018),
    imageId: makeSeedUuid(4018),
    title: "Equipo de sonido con bocinas separadas",
    categorySlug: "electronicos",
    actionType: ActionType.REPAIR,
    condition: ItemCondition.DAMAGED,
    status: ListingStatus.PENDING_REVIEW,
    ownerEmail: "pablo@recyclapp.mx",
    state: "Nuevo Leon",
    city: "Monterrey",
    municipality: "San Pedro",
    neighborhood: "Miravalle",
    postalCode: "64660",
    addressLine1: "Lázaro Cárdenas 2400",
    imageUrl: LISTING_IMAGE_LIBRARY.stereo,
    description:
      "Enciende, pero una bocina presenta distorsión y el lector óptico ya no responde. Requiere inspección inicial.",
    pickupAvailable: false,
  },
  {
    id: makeSeedUuid(2019),
    addressId: makeSeedUuid(3019),
    imageId: makeSeedUuid(4019),
    title: "Sillón individual tapizado azul",
    categorySlug: "muebles",
    actionType: ActionType.DONATE,
    condition: ItemCondition.GOOD,
    status: ListingStatus.PENDING_REVIEW,
    ownerEmail: "lucia@recyclapp.mx",
    state: "Ciudad de Mexico",
    city: "Cuauhtemoc",
    municipality: "Roma Sur",
    neighborhood: "Roma Sur",
    postalCode: "06760",
    addressLine1: "Tehuantepec 121",
    imageUrl: LISTING_IMAGE_LIBRARY.sofa,
    description:
      "Sillón cómodo para rincón de lectura. Tiene limpieza reciente y queda pendiente la revisión fotográfica del moderador.",
    pickupAvailable: true,
  },
  {
    id: makeSeedUuid(2020),
    addressId: makeSeedUuid(3020),
    imageId: makeSeedUuid(4020),
    title: "Horno eléctrico compacto",
    categorySlug: "electrodomesticos",
    actionType: ActionType.RECYCLE,
    condition: ItemCondition.UNUSABLE,
    status: ListingStatus.PENDING_REVIEW,
    ownerEmail: "valentina@recyclapp.mx",
    state: "Jalisco",
    city: "Zapopan",
    municipality: "Chapalita",
    neighborhood: "Arboledas",
    postalCode: "45070",
    addressLine1: "Avenida Lopez Mateos Sur 5130",
    imageUrl: LISTING_IMAGE_LIBRARY.oven,
    description:
      "El horno ya no calienta y fue dado de baja del hogar. Se registra para reciclaje y validación administrativa.",
    pickupAvailable: true,
  },
];

function getFullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function getVerificationStatus(role: UserRole) {
  return role === UserRole.ADMIN
    ? VerificationStatus.VERIFIED
    : VerificationStatus.VERIFIED;
}

function getPublishedAt(index: number) {
  return new Date(Date.UTC(2026, 6, 1 + index, 14, 0, 0));
}

function getApprovedAt(index: number) {
  return new Date(Date.UTC(2026, 6, 2 + index, 16, 30, 0));
}

async function seedCategories() {
  for (const category of CATEGORY_SEED) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        isActive: true,
        sortOrder: category.sortOrder,
      },
      create: {
        id: category.id,
        slug: category.slug,
        name: category.name,
        description: category.description,
        isActive: true,
        sortOrder: category.sortOrder,
      },
    });
  }
}

async function seedUsers() {
  for (const user of DEMO_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: getFullName(user.firstName, user.lastName),
        phone: user.phone,
        avatarUrl: faker.image.avatar(),
        passwordHash: user.password,
        role: user.role,
        verificationStatus: getVerificationStatus(user.role),
        isActive: true,
        lastLoginAt: new Date("2026-07-15T18:00:00.000Z"),
      },
      create: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: getFullName(user.firstName, user.lastName),
        email: user.email,
        phone: user.phone,
        avatarUrl: faker.image.avatar(),
        passwordHash: user.password,
        role: user.role,
        verificationStatus: getVerificationStatus(user.role),
        isActive: true,
        lastLoginAt: new Date("2026-07-15T18:00:00.000Z"),
      },
    });

    await prisma.address.upsert({
      where: { id: user.addressId },
      update: {
        ownerId: user.id,
        label: "Casa principal",
        contactName: getFullName(user.firstName, user.lastName),
        phone: user.phone,
        state: user.state,
        city: user.city,
        municipality: user.municipality,
        neighborhood: user.neighborhood,
        postalCode: user.postalCode,
        addressLine1: user.addressLine1,
      },
      create: {
        id: user.addressId,
        ownerId: user.id,
        label: "Casa principal",
        contactName: getFullName(user.firstName, user.lastName),
        phone: user.phone,
        state: user.state,
        city: user.city,
        municipality: user.municipality,
        neighborhood: user.neighborhood,
        postalCode: user.postalCode,
        addressLine1: user.addressLine1,
      },
    });

    await prisma.user.update({
      where: { email: user.email },
      data: {
        defaultAddressId: user.addressId,
      },
    });

    await prisma.userImpactStats.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        itemsPublished: 0,
        itemsDonated: 0,
        itemsRecycled: 0,
        itemsRepaired: 0,
        pickupsCompleted: 0,
        co2SavedKg: new Prisma.Decimal(0),
      },
    });
  }
}

async function seedWasteCenters() {
  for (const center of WASTE_CENTER_SEED) {
    await prisma.address.upsert({
      where: { id: center.addressId },
      update: {
        label: "Centro ecológico",
        state: center.state,
        city: center.city,
        municipality: center.municipality,
        neighborhood: center.neighborhood,
        postalCode: center.postalCode,
        addressLine1: center.addressLine1,
        phone: center.phone,
      },
      create: {
        id: center.addressId,
        label: "Centro ecológico",
        state: center.state,
        city: center.city,
        municipality: center.municipality,
        neighborhood: center.neighborhood,
        postalCode: center.postalCode,
        addressLine1: center.addressLine1,
        phone: center.phone,
      },
    });

    await prisma.wasteCenter.upsert({
      where: { slug: center.slug },
      update: {
        name: center.name,
        type: center.type,
        description: center.description,
        addressId: center.addressId,
        phone: center.phone,
        email: center.email,
        hours: center.hours,
        acceptedMaterials: center.acceptedMaterials,
        ratingAverage: new Prisma.Decimal(
          faker.number.float({ min: 4.1, max: 4.9, fractionDigits: 2 }),
        ),
        isVerified: true,
      },
      create: {
        id: center.id,
        slug: center.slug,
        name: center.name,
        type: center.type,
        description: center.description,
        addressId: center.addressId,
        phone: center.phone,
        email: center.email,
        hours: center.hours,
        acceptedMaterials: center.acceptedMaterials,
        ratingAverage: new Prisma.Decimal(
          faker.number.float({ min: 4.1, max: 4.9, fractionDigits: 2 }),
        ),
        isVerified: true,
      },
    });
  }
}

async function seedRepairWorkshops() {
  for (const workshop of REPAIR_WORKSHOP_SEED) {
    await prisma.address.upsert({
      where: { id: workshop.addressId },
      update: {
        label: "Taller de reparación",
        state: workshop.state,
        city: workshop.city,
        municipality: workshop.municipality,
        neighborhood: workshop.neighborhood,
        postalCode: workshop.postalCode,
        addressLine1: workshop.addressLine1,
        phone: workshop.phone,
      },
      create: {
        id: workshop.addressId,
        label: "Taller de reparación",
        state: workshop.state,
        city: workshop.city,
        municipality: workshop.municipality,
        neighborhood: workshop.neighborhood,
        postalCode: workshop.postalCode,
        addressLine1: workshop.addressLine1,
        phone: workshop.phone,
      },
    });

    await prisma.repairWorkshop.upsert({
      where: { slug: workshop.slug },
      update: {
        name: workshop.name,
        specialty: workshop.specialty,
        description: workshop.description,
        phone: workshop.phone,
        email: workshop.email,
        website: workshop.website,
        addressId: workshop.addressId,
        ratingAverage: new Prisma.Decimal(
          faker.number.float({ min: 4.2, max: 4.98, fractionDigits: 2 }),
        ),
        acceptsHomeVisit: workshop.acceptsHomeVisit,
        isVerified: true,
      },
      create: {
        id: workshop.id,
        slug: workshop.slug,
        name: workshop.name,
        specialty: workshop.specialty,
        description: workshop.description,
        phone: workshop.phone,
        email: workshop.email,
        website: workshop.website,
        addressId: workshop.addressId,
        ratingAverage: new Prisma.Decimal(
          faker.number.float({ min: 4.2, max: 4.98, fractionDigits: 2 }),
        ),
        acceptsHomeVisit: workshop.acceptsHomeVisit,
        isVerified: true,
      },
    });
  }
}

async function seedListings() {
  const categories = await prisma.category.findMany({
    select: { id: true, slug: true },
  });
  const categoryBySlug = new Map(
    categories.map((category) => [category.slug, category.id]),
  );

  const users = await prisma.user.findMany({
    where: {
      email: {
        in: LISTING_SEED.map((listing) => listing.ownerEmail),
      },
    },
    select: { id: true, email: true },
  });
  const userByEmail = new Map(users.map((user) => [user.email, user.id]));

  for (const [index, listing] of LISTING_SEED.entries()) {
    const ownerId = userByEmail.get(listing.ownerEmail);
    const categoryId = categoryBySlug.get(listing.categorySlug);

    if (!ownerId || !categoryId) {
      throw new Error(`No pude resolver owner/category para ${listing.title}.`);
    }

    await prisma.address.upsert({
      where: { id: listing.addressId },
      update: {
        ownerId,
        label: "Punto de recolección",
        contactName: "ReCyClapp Seed",
        phone: DEMO_USERS.find((user) => user.email === listing.ownerEmail)
          ?.phone,
        state: listing.state,
        city: listing.city,
        municipality: listing.municipality,
        neighborhood: listing.neighborhood,
        postalCode: listing.postalCode,
        addressLine1: listing.addressLine1,
      },
      create: {
        id: listing.addressId,
        ownerId,
        label: "Punto de recolección",
        contactName: "ReCyClapp Seed",
        phone: DEMO_USERS.find((user) => user.email === listing.ownerEmail)
          ?.phone,
        state: listing.state,
        city: listing.city,
        municipality: listing.municipality,
        neighborhood: listing.neighborhood,
        postalCode: listing.postalCode,
        addressLine1: listing.addressLine1,
      },
    });

    const createdAt = getPublishedAt(index);
    const approvedAt =
      listing.status === ListingStatus.APPROVED ? getApprovedAt(index) : null;

    await prisma.listing.upsert({
      where: { id: listing.id },
      update: {
        ownerId,
        categoryId,
        pickupAddressId: listing.addressId,
        title: listing.title,
        description: listing.description,
        condition: listing.condition,
        actionType: listing.actionType,
        status: listing.status,
        pickupAvailable: listing.pickupAvailable,
        availableFrom: new Date(createdAt.getTime() + 1000 * 60 * 60 * 24 * 3),
        estimatedWeightKg: new Prisma.Decimal(
          faker.number.float({ min: 6, max: 95, fractionDigits: 2 }),
        ),
        estimatedValue: new Prisma.Decimal(
          faker.number.float({ min: 350, max: 12500, fractionDigits: 2 }),
        ),
        co2EstimateKg: new Prisma.Decimal(
          faker.number.float({ min: 8, max: 210, fractionDigits: 2 }),
        ),
        isActive: true,
        publishedAt:
          listing.status === ListingStatus.APPROVED ? createdAt : null,
        approvedAt,
      },
      create: {
        id: listing.id,
        ownerId,
        categoryId,
        pickupAddressId: listing.addressId,
        title: listing.title,
        description: listing.description,
        condition: listing.condition,
        actionType: listing.actionType,
        status: listing.status,
        pickupAvailable: listing.pickupAvailable,
        availableFrom: new Date(createdAt.getTime() + 1000 * 60 * 60 * 24 * 3),
        estimatedWeightKg: new Prisma.Decimal(
          faker.number.float({ min: 6, max: 95, fractionDigits: 2 }),
        ),
        estimatedValue: new Prisma.Decimal(
          faker.number.float({ min: 350, max: 12500, fractionDigits: 2 }),
        ),
        co2EstimateKg: new Prisma.Decimal(
          faker.number.float({ min: 8, max: 210, fractionDigits: 2 }),
        ),
        isActive: true,
        publishedAt:
          listing.status === ListingStatus.APPROVED ? createdAt : null,
        approvedAt,
        createdAt,
      },
    });

    await prisma.listingImage.upsert({
      where: { id: listing.imageId },
      update: {
        listingId: listing.id,
        url: listing.imageUrl,
        altText: listing.title,
        isPrimary: true,
        displayOrder: 1,
      },
      create: {
        id: listing.imageId,
        listingId: listing.id,
        url: listing.imageUrl,
        altText: listing.title,
        isPrimary: true,
        displayOrder: 1,
      },
    });
  }
}

async function updateImpactStats() {
  for (const user of DEMO_USERS) {
    const listings = await prisma.listing.findMany({
      where: { owner: { email: user.email } },
      select: { actionType: true, status: true, co2EstimateKg: true },
    });

    const itemsPublished = listings.length;
    const itemsDonated = listings.filter(
      (listing) => listing.actionType === ActionType.DONATE,
    ).length;
    const itemsRecycled = listings.filter(
      (listing) => listing.actionType === ActionType.RECYCLE,
    ).length;
    const itemsRepaired = listings.filter(
      (listing) => listing.actionType === ActionType.REPAIR,
    ).length;
    const co2SavedKg = listings.reduce(
      (total, listing) =>
        total.add(listing.co2EstimateKg ?? new Prisma.Decimal(0)),
      new Prisma.Decimal(0),
    );

    await prisma.userImpactStats.upsert({
      where: { userId: user.id },
      update: {
        itemsPublished,
        itemsDonated,
        itemsRecycled,
        itemsRepaired,
        co2SavedKg,
      },
      create: {
        userId: user.id,
        itemsPublished,
        itemsDonated,
        itemsRecycled,
        itemsRepaired,
        pickupsCompleted: 0,
        co2SavedKg,
      },
    });
  }
}

async function main() {
  console.log(
    `Seed ejecutandose sobre ${databaseUrl.hostname}/${databaseUrl.pathname.replace(/^\/+/, "")} con schema ${databaseUrl.searchParams.get("schema")}.`,
  );

  await seedCategories();
  await seedUsers();
  await seedWasteCenters();
  await seedRepairWorkshops();
  await seedListings();
  await updateImpactStats();

  console.log(
    `Seed finalizado con ${CATEGORY_SEED.length} categorías, ${DEMO_USERS.length} usuarios, ${REPAIR_WORKSHOP_SEED.length} talleres y ${LISTING_SEED.length} artículos.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
