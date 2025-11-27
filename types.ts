
export interface Activity {
  time: string;
  description: string;
}

export interface DayPlan {
  day: number;
  date?: string; // YYYY-MM-DD
  title: string;
  activities: Activity[];
  note?: string;
  images?: string[];
}

export interface DestinationDetails {
  name: string;
  description: string;
  country: string;
  bestTimeToVisit: string;
  imageKeyword: string;
  rating?: number;
}

export interface Itinerary {
  id: string;
  destinationName: string;
  startDate?: string;
  endDate?: string;
  durationDays: number;
  coverImage: string;
  plans: DayPlan[];
}

export enum Tab {
  ITINERARY = 'ITINERARY',
  INSPIRATION = 'INSPIRATION',
  SEARCH = 'SEARCH',
}
