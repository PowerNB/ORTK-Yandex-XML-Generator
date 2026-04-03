// Уточни name-атрибуты после экспорта из Яндекс.Бизнеса (Автоматизация → Экспорт)
export const FEATURE_FUEL_NAME = "fuel_type";
export const FEATURE_SERVICE_NAME = "service";

export const FUEL_TYPES = [
  "АИ-92",
  "АИ-95",
  "АИ-95 ProFit",
  "АИ-100 ProFit",
  "ДТ",
  "СУГ",
] as const;

export const SERVICES = [
  "магазин",
  "кафе",
  "мойка",
  "шиномонтаж",
  "туалет",
] as const;

export const VALID_PHOTO_TAGS = [
  "INTERIOR",
  "EXTERIOR",
  "LOGO",
  "FOOD",
  "ENTER",
  "GOODS",
  "MENU",
  "DEVICES",
  "SERVICES",
  "ACCESSIBILITY",
] as const;
