export interface Photo {
  src: string;
  thumb: string;
  alt: string;
}

export interface Day {
  id: string;
  date: string;
  title: string;
  description: string;
  photos: Photo[];
}

export interface Stage {
  id: string;
  name: string;
  city: string;
  description: string;
  coordinates: [number, number]; // [lat, lng]
  days: Day[];
}

export interface Trip {
  id: string;
  title: string;
  country: string;
  startDate: string;
  endDate: string;
  status: 'published' | 'closed' | 'draft';
  coordinates: [number, number]; // [lng, lat] for world map
  coverColor: string;
  stages?: Stage[];
}

const ICELAND_STAGES: Stage[] = [
  {
    id: 's1',
    name: 'Reykjavik',
    city: 'Reykjavik',
    description: "Capitale de l'Islande, Reykjavik mêle architecture colorée, musées et vie nocturne animée.",
    coordinates: [64.1355, -21.8954],
    days: [
      {
        id: 'd1', date: '2025-07-01', title: 'Arrivée et premiers pas',
        description: 'Atterrissage à Keflavik, route vers Reykjavik. Premier contact avec la lumière estivale islandaise.',
        photos: [
          { src: 'https://picsum.photos/seed/rvk1/1200/800', thumb: 'https://picsum.photos/seed/rvk1/400/300', alt: 'Arrivée à Reykjavik' },
          { src: 'https://picsum.photos/seed/rvk2/1200/800', thumb: 'https://picsum.photos/seed/rvk2/400/300', alt: 'Centre-ville' },
          { src: 'https://picsum.photos/seed/rvk3/1200/800', thumb: 'https://picsum.photos/seed/rvk3/400/300', alt: 'Hallgrímskirkja' },
        ],
      },
      {
        id: 'd2', date: '2025-07-02', title: 'Péninsule de Reykjanes',
        description: 'Champs de lave, geysers et le Blue Lagoon au coucher du soleil.',
        photos: [
          { src: 'https://picsum.photos/seed/rkj1/1200/800', thumb: 'https://picsum.photos/seed/rkj1/400/300', alt: 'Champs de lave' },
          { src: 'https://picsum.photos/seed/rkj2/1200/800', thumb: 'https://picsum.photos/seed/rkj2/400/300', alt: 'Blue Lagoon' },
          { src: 'https://picsum.photos/seed/rkj3/1200/800', thumb: 'https://picsum.photos/seed/rkj3/400/300', alt: 'Geyser' },
          { src: 'https://picsum.photos/seed/rkj4/1200/800', thumb: 'https://picsum.photos/seed/rkj4/400/300', alt: 'Côte volcanique' },
        ],
      },
      {
        id: 'd3', date: '2025-07-03', title: 'Musées et baleines',
        description: 'Musée national puis whale watching dans la baie de Faxaflói.',
        photos: [
          { src: 'https://picsum.photos/seed/whale1/1200/800', thumb: 'https://picsum.photos/seed/whale1/400/300', alt: 'Baleine à bosse' },
          { src: 'https://picsum.photos/seed/whale2/1200/800', thumb: 'https://picsum.photos/seed/whale2/400/300', alt: 'Vue du bateau' },
        ],
      },
    ],
  },
  {
    id: 's2',
    name: "Cercle d'Or",
    city: 'Þingvellir',
    description: "Þingvellir, Geysir et Gullfoss — les trois sites emblématiques du Cercle d'Or.",
    coordinates: [64.2559, -20.6124],
    days: [
      {
        id: 'd4', date: '2025-07-04', title: 'Þingvellir et Geysir',
        description: 'Parc national de Þingvellir puis Strokkur qui entre en éruption toutes les 5 minutes.',
        photos: [
          { src: 'https://picsum.photos/seed/thing1/1200/800', thumb: 'https://picsum.photos/seed/thing1/400/300', alt: 'Þingvellir' },
          { src: 'https://picsum.photos/seed/geyser1/1200/800', thumb: 'https://picsum.photos/seed/geyser1/400/300', alt: 'Strokkur en éruption' },
          { src: 'https://picsum.photos/seed/geyser2/1200/800', thumb: 'https://picsum.photos/seed/geyser2/400/300', alt: 'Colonnes de vapeur' },
        ],
      },
      {
        id: 'd5', date: '2025-07-05', title: 'Gullfoss',
        description: 'La "chute d\'or" se jette dans un canyon de 70 mètres — brume, arc-en-ciel, puissance de l\'eau.',
        photos: [
          { src: 'https://picsum.photos/seed/gull1/1200/800', thumb: 'https://picsum.photos/seed/gull1/400/300', alt: 'Gullfoss' },
          { src: 'https://picsum.photos/seed/gull2/1200/800', thumb: 'https://picsum.photos/seed/gull2/400/300', alt: 'Arc-en-ciel' },
          { src: 'https://picsum.photos/seed/gull3/1200/800', thumb: 'https://picsum.photos/seed/gull3/400/300', alt: 'Canyon' },
          { src: 'https://picsum.photos/seed/gull4/1200/800', thumb: 'https://picsum.photos/seed/gull4/400/300', alt: 'Panorama' },
          { src: 'https://picsum.photos/seed/gull5/1200/800', thumb: 'https://picsum.photos/seed/gull5/400/300', alt: 'Détail des chutes' },
        ],
      },
    ],
  },
  {
    id: 's3',
    name: 'Vik',
    city: 'Vík í Mýrdal',
    description: 'Le village le plus au sud de l\'Islande, bordé par la plage de sable noir de Reynisfjara.',
    coordinates: [63.4186, -19.0048],
    days: [
      {
        id: 'd6', date: '2025-07-06', title: 'Route vers le sud',
        description: 'Cascades de Seljalandsfoss et Skógafoss le long de la côte.',
        photos: [
          { src: 'https://picsum.photos/seed/selj1/1200/800', thumb: 'https://picsum.photos/seed/selj1/400/300', alt: 'Seljalandsfoss' },
          { src: 'https://picsum.photos/seed/skog1/1200/800', thumb: 'https://picsum.photos/seed/skog1/400/300', alt: 'Skógafoss' },
          { src: 'https://picsum.photos/seed/road1/1200/800', thumb: 'https://picsum.photos/seed/road1/400/300', alt: 'Route côtière' },
        ],
      },
      {
        id: 'd7', date: '2025-07-07', title: 'Reynisfjara',
        description: 'Plage de sable noir, colonnes basaltiques hexagonales et puffins dans les falaises.',
        photos: [
          { src: 'https://picsum.photos/seed/reyn1/1200/800', thumb: 'https://picsum.photos/seed/reyn1/400/300', alt: 'Plage noire' },
          { src: 'https://picsum.photos/seed/reyn2/1200/800', thumb: 'https://picsum.photos/seed/reyn2/400/300', alt: 'Colonnes basaltiques' },
          { src: 'https://picsum.photos/seed/puffin1/1200/800', thumb: 'https://picsum.photos/seed/puffin1/400/300', alt: 'Macareux moine' },
        ],
      },
    ],
  },
];

export const MOCK_TRIPS: Trip[] = [
  {
    id: '1',
    title: 'Road trip en Islande',
    country: 'Islande',
    startDate: '2025-07-01',
    endDate: '2025-07-15',
    status: 'published',
    coordinates: [-18.5, 64.9],
    coverColor: '#3d5a47',
    stages: ICELAND_STAGES,
  },
  {
    id: '2',
    title: 'Japon 2024',
    country: 'Japon',
    startDate: '2024-03-15',
    endDate: '2024-03-30',
    status: 'closed',
    coordinates: [138.2, 36.2],
    coverColor: '#7a3848',
  },
  {
    id: '3',
    title: 'Maroc — Désert et médinas',
    country: 'Maroc',
    startDate: '2023-09-10',
    endDate: '2023-09-20',
    status: 'published',
    coordinates: [-5.0, 32.0],
    coverColor: '#b87730',
  },
];

export const MOCK_USER = {
  id: '1',
  name: 'Benjamin',
  role: 'admin' as const,
};
