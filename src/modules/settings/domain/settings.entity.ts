export interface PointsSystem {
  active?: boolean;
  value?: number;
  redemptionValue?: number;
}

export interface Announcement {
  active?: boolean;
  message?: string;
}

export interface SocialMedia {
  facebook?: string;
  instagram?: string;
  phone?: string;
  email?: string;
}

export interface PaymentInfo {
  vodafoneCash?: string;
  instaPay?: string;
}

export interface Promo {
  isActive?: boolean;
  image?: string;
  topBadge?: string;
  title?: string;
  description?: string;
  code?: string;
  buttonText?: string;
}

export interface Hero {
  badge?: string;
  titleLine1?: string;
  titleHighlight?: string;
  description?: string;
}

export interface Feature {
  title?: string;
  description?: string;
}

export interface JourneyStep {
  title?: string;
  description?: string;
}

export interface Journey {
  title?: string;
  steps?: JourneyStep[];
}

export interface Sections {
  categoriesTitle?: string;
  categoriesSubtitle?: string;
}

export interface Term {
  title?: string;
  description?: string;
}

export interface Quality {
  title?: string;
  description?: string;
  hotline?: string;
}

export interface Info {
  terms?: Term[];
  quality?: Quality;
}

export interface Content {
  hero?: Hero;
  features?: Feature[];
  journey?: Journey;
  sections?: Sections;
  info?: Info;
}

export interface StoreSettings {
  id: string;
  pointsSystem: PointsSystem | null;
  deliveryFee: string | null;
  announcement: Announcement | null;
  socialMedia: SocialMedia | null;
  paymentInfo: PaymentInfo | null;
  promo: Promo | null;
  content: Content | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreSettingsInput {
  pointsSystem?: PointsSystem;
  deliveryFee?: number;
  announcement?: Announcement;
  socialMedia?: SocialMedia;
  paymentInfo?: PaymentInfo;
  promo?: Promo;
  content?: Content;
}
