import { Button, Image, Announcement } from "@/types/blocks/base";

export interface Announcement {
  title?: string;
  description?: string;
  label?: string;
  url?: string;
  target?: string;
  show?: boolean;
}

export interface PrismBackground {
  enabled?: boolean;
  height?: number;
  baseWidth?: number;
  animationType?: 'rotate' | 'hover' | '3drotate';
  glow?: number;
  noise?: number;
  scale?: number;
  hueShift?: number;
  colorFrequency?: number;
  timeScale?: number;
  bloom?: number;
}

export interface Hero {
  name?: string;
  disabled?: boolean;
  announcement?: Announcement;
  title?: string;
  highlight_text?: string;
  description?: string;
  buttons?: Button[];
  image?: Image;
  tip?: string;
  show_happy_users?: boolean;
  show_badge?: boolean;
  prism_background?: PrismBackground;
}
