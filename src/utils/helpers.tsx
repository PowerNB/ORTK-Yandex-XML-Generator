import type { Rubric } from "../types";

export const escapeXml = (value: string): string =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");

export const formatPhoneRu = (value: string): string => {
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  let normalized = digits;
  if (normalized.startsWith("8")) normalized = `7${normalized.slice(1)}`;
  if (normalized.length === 11 && normalized.startsWith("7")) {
    const p1 = normalized.slice(1, 4);
    const p2 = normalized.slice(4, 7);
    const p3 = normalized.slice(7, 9);
    const p4 = normalized.slice(9, 11);
    return `+7 (${p1}) ${p2}-${p3}-${p4}`;
  }
  return value;
};

export const ensureHttp = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export const composeAddress = (address: string, locality: string): string => {
  if (!locality) return address;
  const addressLower = (address || "").toLowerCase();
  const localityLower = locality.toLowerCase();
  if (addressLower.includes(localityLower)) return address;
  return `${locality}, ${address}`;
};

export const resolveRubricInput = (value: string, rubrics: Rubric[]): string => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^\d+$/.test(trimmed)) return trimmed;
  const match = rubrics.find((r) => r.name.toLowerCase() === trimmed.toLowerCase());
  if (match) return String(match.id);
  const byStart = rubrics.find((r) => r.name.toLowerCase().startsWith(trimmed.toLowerCase()));
  return byStart ? String(byStart.id) : trimmed;
};
