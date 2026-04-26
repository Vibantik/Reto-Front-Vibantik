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
} from "lucide-react";

// Lucide component
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
};

//icons
export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

//categorias iniciales test
export const INITIAL_CATEGORIES = [
  {
    id: "1",
    nombre: "Hogar",
    icon: "home",
    monto_limite: 15000,
    color: "#323E48",
    order: 1,
  },
  {
    id: "2",
    nombre: "Transporte",
    icon: "car",
    monto_limite: 3000,
    color: "#5B6670",
    order: 2,
  },
  {
    id: "3",
    nombre: "Comida",
    icon: "utensils",
    monto_limite: 6000,
    color: "#FFA400",
    order: 3,
  },
  {
    id: "4",
    nombre: "Servicios",
    icon: "zap",
    monto_limite: 2500,
    color: "#FF671B",
    order: 4,
  },
  {
    id: "5",
    nombre: "Salud",
    icon: "heart",
    monto_limite: 2000,
    color: "#EB0029",
    order: 5,
  },
  {
    id: "6",
    nombre: "Ingresos",
    icon: "dollar-sign",
    monto_limite: 35000,
    color: "#6CC04A",
    order: 6,
  },
];

