export interface FanficFeature1 {
  disabled?: boolean;
  name?: string;
  label?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  recommended_badge?: string;
  image?: Image;
  features?: FeatureItem[];
  statistics?: StatItem[];
}

export interface FeatureItem {
  icon?: string;
  title: string;
  description: string;
  highlight?: boolean;
}

export interface StatItem {
  value: string;
  label: string;
  icon?: string;
}

export interface Image {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}
