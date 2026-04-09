export interface Trip {
  id: string;
  title: string;
  country: string;
  startDate: string;
  endDate: string;
  status: 'published' | 'closed' | 'draft';
  coordinates: [number, number]; // [lng, lat]
  coverColor: string;
}

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
