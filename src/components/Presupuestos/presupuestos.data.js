import {
  Home,
  Car,
  Utensils,
  Zap,
  DollarSign,
  ShoppingBag,
  Plane,
  Heart,
  Dumbbell,
  GraduationCap,
  Briefcase,
  Music,
  Gift,
  Coffee,
  Wifi,
  Settings,
} from "lucide-react";

// Lucide component map — extendido con más iconos
export const ICON_MAP = {
  home: Home,
  car: Car,
  utensils: Utensils,
  zap: Zap,
  "dollar-sign": DollarSign,
  "shopping-bag": ShoppingBag,
  plane: Plane,
  heart: Heart,
  dumbbell: Dumbbell,
  "graduation-cap": GraduationCap,
  briefcase: Briefcase,
  music: Music,
  gift: Gift,
  coffee: Coffee,
  wifi: Wifi,
  settings: Settings,
};

// Lista de iconos disponibles para el picker
export const AVAILABLE_ICONS = Object.keys(ICON_MAP);
