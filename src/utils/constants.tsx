import type { Phone, Photo, StationState, BulkRowState } from "../types";

export const createUid = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `uid_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export const DEFAULT_PHONE = (): Phone => ({ number: "", type: "phone", ext: "", info: "" });
export const DEFAULT_PHOTO = (): Photo => ({ url: "", alt: "", type: "", tag: "" });
export const DEFAULT_STATION = (): StationState => ({
  uid: createUid(),
  id: "",
  nameOther: "",
  address: "",
  locality: "",
  addressAdd: "",
  workingTime: "",
  scheduled: "",
  rubrics: [],
  phones: [DEFAULT_PHONE()],
  email: "",
  url: "",
  addUrl: "",
  infoPage: "",
  lon: "",
  lat: "",
  galleryUrl: "",
  photos: [],
  fuels: [],
  services: [],
});

export const DEFAULT_BULK_ROW = (): BulkRowState => ({
  uid: createUid(),
  id: "",
  address: "",
  phone: "",
  workingTime: "",
  rubric: "",
  lon: "",
  lat: "",
  nameOther: "",
  locality: "",
});

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
