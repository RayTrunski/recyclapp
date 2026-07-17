export const LISTING_IMAGE_LIBRARY = {
  sofa: "https://i.pinimg.com/736x/07/88/97/078897048c3d19c5f409b79a3bac4373.jpg",
  fridge:
    "https://i.pinimg.com/1200x/28/46/d0/2846d03bfc4140230b2159e7031f6655.jpg",
  table:
    "https://i.pinimg.com/736x/00/54/99/0054998779c9346cfd723b2f5a99f649.jpg",
  television:
    "https://i.pinimg.com/1200x/43/76/f3/4376f35be28403ec5192c29f40654fbe.jpg",
  officeChair:
    "https://i.pinimg.com/736x/53/7c/8d/537c8d5eb55621c22199de4b2ab405e0.jpg",
  lamp: "https://i.pinimg.com/1200x/f6/26/db/f626dbef126a3ea0cbbff4a9a544fcef.jpg",
  shelves:
    "https://i.pinimg.com/736x/58/9c/73/589c73835f44b6d9931feaec88deac32.jpg",
  washingMachine:
    "https://i.pinimg.com/736x/e6/7a/21/e67a21bb3178f3567a67077b42dba149.jpg",
  desk: "https://i.pinimg.com/736x/de/14/05/de1405a782ff0aa3402ae33ac9832edb.jpg",
  microwave:
    "https://i.pinimg.com/736x/3d/49/fe/3d49fe7f7c18dd2469e7d940df27fc01.jpg",
  entrywayConsole:
    "https://i.pinimg.com/736x/43/e7/44/43e744980f68e64d5fd4b3d745edfb41.jpg",
  monitor:
    "https://i.pinimg.com/1200x/5b/cc/69/5bcc69df4dfd18287eef45d086b44159.jpg",
  printer:
    "https://i.pinimg.com/1200x/78/8b/6c/788b6c57926e7403230693410185c125.jpg",
  bedBase:
    "https://i.pinimg.com/1200x/46/06/ab/4606ab9936c406f71db32d2b7aaac9dd.jpg",
  stereo:
    "https://i.pinimg.com/1200x/e0/bb/0c/e0bb0cd5c4a9fe99b6a12e41f7ad9afd.jpg",
  oven: "https://i.pinimg.com/736x/16/f9/4a/16f94a60ea2f38b83bbbac081516917e.jpg",
  standingLamp:
    "https://i.pinimg.com/736x/dd/43/13/dd4313f36d271f35561a79763cf92ba7.jpg",
  writingDeskPair:
    "https://i.pinimg.com/736x/3d/21/ff/3d21ff7dd59b2d4b8286bb3b93fb20b6.jpg",
  closetWithDoors:
    "https://i.pinimg.com/736x/51/68/96/51689645ac7d1b9a176a788cc0b1acaf.jpg",
  rollingDesk:
    "https://i.pinimg.com/1200x/b4/84/6d/b4846dd0760ac9776c7265ed506275ce.jpg",
  miscbox:
    "https://i.pinimg.com/1200x/a7/8a/84/a78a846ef5b865a4be600a5778533dff.jpg",
} as const;

export const CATEGORY_FALLBACK_IMAGES = {
  muebles: LISTING_IMAGE_LIBRARY.sofa,
  electrodomesticos: LISTING_IMAGE_LIBRARY.fridge,
  electronicos: LISTING_IMAGE_LIBRARY.monitor,
  decoracion: LISTING_IMAGE_LIBRARY.entrywayConsole,
  oficina: LISTING_IMAGE_LIBRARY.desk,
  otros: LISTING_IMAGE_LIBRARY.miscbox,
  rollingDesk: LISTING_IMAGE_LIBRARY.rollingDesk,
  writingDeskPair: LISTING_IMAGE_LIBRARY.writingDeskPair,
  closetWithDoors: LISTING_IMAGE_LIBRARY.closetWithDoors,
  standingLamp: LISTING_IMAGE_LIBRARY.standingLamp,
} as const;

export const PUBLISH_PRESET_IMAGES = [
  {
    label: "Sofa Modular",
    category: "muebles",
    url: LISTING_IMAGE_LIBRARY.sofa,
  },
  {
    label: "Mesa de Comedor",
    category: "muebles",
    url: LISTING_IMAGE_LIBRARY.table,
  },
  {
    label: "Estanteria de Madera",
    category: "muebles",
    url: LISTING_IMAGE_LIBRARY.shelves,
  },
  {
    label: "Sillon Individual",
    category: "muebles",
    url: LISTING_IMAGE_LIBRARY.bedBase,
  },
  {
    label: "Refrigerador",
    category: "electrodomesticos",
    url: LISTING_IMAGE_LIBRARY.fridge,
  },
  {
    label: "Lavadora",
    category: "electrodomesticos",
    url: LISTING_IMAGE_LIBRARY.washingMachine,
  },
  {
    label: "Microondas",
    category: "electrodomesticos",
    url: LISTING_IMAGE_LIBRARY.microwave,
  },
  {
    label: "Horno Electrico",
    category: "electrodomesticos",
    url: LISTING_IMAGE_LIBRARY.oven,
  },
  {
    label: "Televisor",
    category: "electronicos",
    url: LISTING_IMAGE_LIBRARY.television,
  },
  {
    label: "Monitor LED",
    category: "electronicos",
    url: LISTING_IMAGE_LIBRARY.monitor,
  },
  {
    label: "Equipo de Sonido",
    category: "electronicos",
    url: LISTING_IMAGE_LIBRARY.stereo,
  },
  {
    label: "Silla de Oficina",
    category: "oficina",
    url: LISTING_IMAGE_LIBRARY.officeChair,
  },
  {
    label: "Escritorio",
    category: "oficina",
    url: LISTING_IMAGE_LIBRARY.desk,
  },
  {
    label: "Impresora",
    category: "oficina",
    url: LISTING_IMAGE_LIBRARY.printer,
  },
  {
    label: "Lampara de Pie",
    category: "decoracion",
    url: LISTING_IMAGE_LIBRARY.lamp,
  },
  {
    label: "Recibidor con Espejo",
    category: "decoracion",
    url: LISTING_IMAGE_LIBRARY.entrywayConsole,
  },
  {
    label: "Caja de Objetos",
    category: "otros",
    url: LISTING_IMAGE_LIBRARY.miscbox,
  },
] as const;
