
export type Genre =
  | 'Afro-Beats'
  | 'Afro-Jazz'
  | 'Afro-R&B'
  | 'Afro-Reggae'
  | 'Afro-House'
  | 'Gospel';
export type Mood = 'Nostalgic' | 'Upbeat' | 'Romantic' | 'Melancholic';

export interface Song {
  id: string;
  title: string;
  genre: string;
  duration: string;
  description: string;
  coverUrl: string;
  artist?: string;
  tags?: string[];
  audioUrl?: string | null;
  story?: string;
}

export interface ProductionStep {
  title: string;
  desc: string;
  icon: string;
  status: 'Completed' | 'In Progress' | 'Upcoming';
  active: boolean;
  locked: boolean;
  progress: number;
}

export interface OrderData {
  id: string;
  songTitle: string;
  genre: string;
  mood: string;
  tempo: number;
  occasion: string;
  story: string;
  status: string;
  createdAt: string;
  deliveryDate: string;
  overallProgress: number;
  currentStep: number;
  steps: ProductionStep[];
  timeLeft: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
  amount: number;
}

