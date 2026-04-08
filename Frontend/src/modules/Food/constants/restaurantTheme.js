import { RED } from "./color";

const clampOpacity = (opacity) => {
  if (!Number.isFinite(opacity)) return 1;
  if (opacity < 0) return 0;
  if (opacity > 1) return 1;
  return opacity;
};

const hexToRgb = (hex) => {
  const normalized = String(hex || "")
    .trim()
    .replace(/^#/, "");

  if (normalized.length !== 6) {
    return { r: 226, g: 40, b: 27 };
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
};

const { r, g, b } = hexToRgb(RED);

export const RESTAURANT_BRAND_COLOR = RED;
export const restaurantBrandRgba = (opacity = 1) =>
  `rgba(${r}, ${g}, ${b}, ${clampOpacity(opacity)})`;

export const RESTAURANT_THEME = {
  brand: RESTAURANT_BRAND_COLOR,
  softBackground: restaurantBrandRgba(0.08),
  softBorder: restaurantBrandRgba(0.35),
  softText: restaurantBrandRgba(0.95),
};

