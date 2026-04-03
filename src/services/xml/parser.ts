import type { StationState } from "../../types";
import { DEFAULT_PHONE, FEATURE_FUEL_NAME, FEATURE_SERVICE_NAME } from "../../const";

export const readText = (parent: ParentNode, tag: string): string => {
  const node = parent.querySelector(tag);
  return node ? node.textContent?.trim() ?? "" : "";
};

export const readTextByLang = (parent: ParentNode, tag: string, lang = "ru"): string => {
  const nodes = Array.from(parent.querySelectorAll(tag));
  const exact = nodes.find((node) => node.getAttribute("lang") === lang);
  if (exact) return exact.textContent?.trim() ?? "";
  if (nodes[0]) return nodes[0].textContent?.trim() ?? "";
  return "";
};

export const parseCompany = (company: Element): StationState => {
  const phones = Array.from(company.querySelectorAll("phone")).map((node) => ({
    number: readText(node, "number"),
    type: readText(node, "type"),
    ext: readText(node, "ext"),
    info: readText(node, "info"),
  }));

  const photos = Array.from(company.querySelectorAll("photos photo")).map((node) => ({
    url: node.getAttribute("url") || "",
    alt: node.getAttribute("alt") || "",
    type: node.getAttribute("type") || "",
    tag: readText(node, "tag"),
  }));

  const scheduledEntries = Array.from(company.querySelectorAll("scheduled-working-time")).map(
    (node) => {
      const date = readText(node, "date");
      const workNode = node.querySelector("work");
      const workFrom = workNode ? workNode.getAttribute("from") : "";
      const workTo = workNode ? workNode.getAttribute("to") : "";
      const dinners = Array.from(node.querySelectorAll("dinner"))
        .map((dinner) => {
          const from = dinner.getAttribute("from");
          const to = dinner.getAttribute("to");
          return from && to ? `${from}-${to}` : "";
        })
        .filter(Boolean);

      let line = date || "";
      if (workFrom && workTo) {
        line = line ? `${line} ${workFrom}-${workTo}` : `${workFrom}-${workTo}`;
      }
      if (dinners.length) {
        dinners.forEach((dinner) => {
          line += ` перерыв ${dinner}`;
        });
      }
      return line.trim() || node.textContent?.trim() || "";
    }
  );

  const galleryNode = company.querySelector("photos");
  const galleryUrl = galleryNode ? galleryNode.getAttribute("gallery-url") || "" : "";

  const coordinates = company.querySelector("coordinates");
  const lon = coordinates ? readText(coordinates, "lon") : "";
  const lat = coordinates ? readText(coordinates, "lat") : "";

  const fuels = Array.from(company.querySelectorAll(`feature-enum-multiple[name="${FEATURE_FUEL_NAME}"]`))
    .map((n) => n.textContent?.trim() || "")
    .filter(Boolean);
  const services = Array.from(company.querySelectorAll(`feature-enum-multiple[name="${FEATURE_SERVICE_NAME}"]`))
    .map((n) => n.textContent?.trim() || "")
    .filter(Boolean);

  return {
    uid: "",
    id: readText(company, "company-id"),
    name: readTextByLang(company, "name"),
    shortname: readTextByLang(company, "shortname"),
    nameOther: readTextByLang(company, "name-other"),
    address: readTextByLang(company, "address"),
    locality: "",
    addressAdd: readTextByLang(company, "address-add"),
    workingTime: readTextByLang(company, "working-time"),
    scheduled: scheduledEntries.filter(Boolean).join("; "),
    email: readText(company, "email"),
    url: readText(company, "url"),
    addUrl: readText(company, "add-url"),
    infoPage: readText(company, "info-page"),
    rubrics: Array.from(company.querySelectorAll("rubric-id")).map((node) => node.textContent?.trim() || ""),
    phones: phones.length ? phones : [DEFAULT_PHONE()],
    photos,
    galleryUrl,
    lon,
    lat,
    fuels,
    services,
  };
};
