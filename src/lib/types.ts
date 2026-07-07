export type Category = 'war' | 'politics' | 'economy' | 'technology';
export type TimeRange = '1_month' | '3_months' | '6_months' | '1_year';
export type PredictionStatus = 'active' | 'expired' | 'evaluated';
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  total_score: number;
  predictions_count: number;
  avg_score: number;
}

export interface Prediction {
  id: string;
  user_id: string;
  country_code: string;
  country_name: string;
  title: string;
  description: string;
  expected_outcome: string;
  time_range: TimeRange;
  category: Category;
  status: PredictionStatus;
  created_at: string;
  deadline: string;
  is_flagged: boolean;
  user?: User;
  prediction_scores?: PredictionScore[];
  likes?: Like[];
  comments?: Comment[];
  _count?: {
    likes: number;
    comments: number;
  };
}

export interface PredictionScore {
  id: string;
  prediction_id: string;
  score: number;
  ai_reasoning: string;
  evaluated_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  prediction_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  prediction_id: string;
  comment_text: string;
  created_at: string;
  is_flagged: boolean;
  user?: User;
}

export interface LeaderboardEntry extends User {
  rank: number;
  accuracy_percentage: number;
}

export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '1_month': '1 Ay',
  '3_months': '3 Ay',
  '6_months': '6 Ay',
  '1_year': '1 Yıl',
};

export const TIME_RANGE_DAYS: Record<TimeRange, number> = {
  '1_month': 30,
  '3_months': 90,
  '6_months': 180,
  '1_year': 365,
};

export const CATEGORY_LABELS: Record<Category, string> = {
  war: 'Savaş',
  politics: 'Politika',
  economy: 'Ekonomi',
  technology: 'Teknoloji',
};

export const CATEGORY_COLORS: Record<Category, string> = {
  war: '#ef4444',
  politics: '#3b82f6',
  economy: '#f59e0b',
  technology: '#8b5cf6',
};

export const SCORE_LABELS: Record<number, string> = {
  10: 'Tamamen Doğru',
  9: 'Neredeyse Tamamen Doğru',
  8: 'Büyük Ölçüde Doğru',
  7: 'Çoğunlukla Doğru',
  6: 'Kısmen Doğru',
  5: 'Orta Düzeyde Doğru',
  4: 'Biraz Doğru',
  3: 'Büyük Ölçüde Yanlış',
  2: 'Çoğunlukla Yanlış',
  1: 'Neredeyse Tamamen Yanlış',
  0: 'Tamamen Yanlış',
};

export const COUNTRIES: { code: string; name: string; lat: number; lng: number }[] = [
  { code: 'US', name: 'Amerika Birleşik Devletleri', lat: 37.09, lng: -95.71 },
  { code: 'CN', name: 'Çin', lat: 35.86, lng: 104.19 },
  { code: 'RU', name: 'Rusya', lat: 61.52, lng: 105.31 },
  { code: 'GB', name: 'Birleşik Krallık', lat: 55.37, lng: -3.43 },
  { code: 'FR', name: 'Fransa', lat: 46.22, lng: 2.21 },
  { code: 'DE', name: 'Almanya', lat: 51.16, lng: 10.45 },
  { code: 'JP', name: 'Japonya', lat: 36.2, lng: 138.25 },
  { code: 'IN', name: 'Hindistan', lat: 20.59, lng: 78.96 },
  { code: 'BR', name: 'Brezilya', lat: -14.23, lng: -51.92 },
  { code: 'AU', name: 'Avustralya', lat: -25.27, lng: 133.77 },
  { code: 'CA', name: 'Kanada', lat: 56.13, lng: -106.34 },
  { code: 'MX', name: 'Meksika', lat: 23.63, lng: -102.55 },
  { code: 'IT', name: 'İtalya', lat: 41.87, lng: 12.56 },
  { code: 'ES', name: 'İspanya', lat: 40.46, lng: -3.74 },
  { code: 'KR', name: 'Güney Kore', lat: 35.9, lng: 127.76 },
  { code: 'TR', name: 'Türkiye', lat: 38.96, lng: 35.24 },
  { code: 'SA', name: 'Suudi Arabistan', lat: 23.88, lng: 45.07 },
  { code: 'IL', name: 'İsrail', lat: 31.04, lng: 34.85 },
  { code: 'IR', name: 'İran', lat: 32.42, lng: 53.68 },
  { code: 'PK', name: 'Pakistan', lat: 30.37, lng: 69.34 },
  { code: 'ID', name: 'Endonezya', lat: -0.78, lng: 113.92 },
  { code: 'UA', name: 'Ukrayna', lat: 48.37, lng: 31.16 },
  { code: 'PL', name: 'Polonya', lat: 51.91, lng: 19.14 },
  { code: 'NL', name: 'Hollanda', lat: 52.13, lng: 5.29 },
  { code: 'SE', name: 'İsveç', lat: 60.12, lng: 18.64 },
  { code: 'NO', name: 'Norveç', lat: 60.47, lng: 8.46 },
  { code: 'FI', name: 'Finlandiya', lat: 61.92, lng: 25.74 },
  { code: 'DK', name: 'Danimarka', lat: 56.26, lng: 9.5 },
  { code: 'CH', name: 'İsviçre', lat: 46.81, lng: 8.22 },
  { code: 'AT', name: 'Avusturya', lat: 47.51, lng: 14.55 },
  { code: 'BE', name: 'Belçika', lat: 50.5, lng: 4.46 },
  { code: 'GR', name: 'Yunanistan', lat: 39.07, lng: 21.82 },
  { code: 'CZ', name: 'Çekya', lat: 49.81, lng: 15.47 },
  { code: 'PT', name: 'Portekiz', lat: 39.39, lng: -8.22 },
  { code: 'RO', name: 'Romanya', lat: 45.94, lng: 24.96 },
  { code: 'HU', name: 'Macaristan', lat: 47.16, lng: 19.5 },
  { code: 'EG', name: 'Mısır', lat: 26.82, lng: 30.8 },
  { code: 'NG', name: 'Nijerya', lat: 9.08, lng: 8.67 },
  { code: 'ZA', name: 'Güney Afrika', lat: -30.55, lng: 22.93 },
  { code: 'AR', name: 'Arjantin', lat: -38.41, lng: -63.61 },
  { code: 'CL', name: 'Şili', lat: -35.67, lng: -71.54 },
  { code: 'CO', name: 'Kolombiya', lat: 4.57, lng: -74.29 },
  { code: 'PE', name: 'Peru', lat: -9.19, lng: -75.01 },
  { code: 'VN', name: 'Vietnam', lat: 14.05, lng: 108.27 },
  { code: 'TH', name: 'Tayland', lat: 15.87, lng: 100.99 },
  { code: 'MY', name: 'Malezya', lat: 4.21, lng: 101.97 },
  { code: 'SG', name: 'Singapur', lat: 1.35, lng: 103.81 },
  { code: 'PH', name: 'Filipinler', lat: 12.87, lng: 121.77 },
  { code: 'NZ', name: 'Yeni Zelanda', lat: -40.9, lng: 174.88 },
  { code: 'AE', name: 'Birleşik Arap Emirlikleri', lat: 23.42, lng: 53.84 },
  { code: 'IQ', name: 'Irak', lat: 33.22, lng: 43.67 },
  { code: 'AF', name: 'Afganistan', lat: 33.93, lng: 67.7 },
  { code: 'KZ', name: 'Kazakistan', lat: 48.01, lng: 66.92 },
  { code: 'UZ', name: 'Özbekistan', lat: 41.37, lng: 64.58 },
  { code: 'BD', name: 'Bangladeş', lat: 23.68, lng: 90.35 },
  { code: 'MM', name: 'Myanmar', lat: 21.91, lng: 95.95 },
];
