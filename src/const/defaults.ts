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
