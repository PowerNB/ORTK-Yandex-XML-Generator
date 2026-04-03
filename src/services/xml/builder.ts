import type { NetworkState, Photo, Phone, StationState } from "../../types";
import { escapeXml, composeAddress } from "../../utils/helpers";
import { buildScheduledXml } from "../../utils/scheduled";
import { FEATURE_FUEL_NAME, FEATURE_SERVICE_NAME } from "../../const";

export const buildPhoneXml = (phones: Phone[]): string =>
  phones
    .filter((phone) => phone.number)
    .map((phone) => {
      const lines = [`    <phone>`, `      <number>${escapeXml(phone.number)}</number>`];
      if (phone.type) lines.push(`      <type>${escapeXml(phone.type)}</type>`);
      if (phone.ext) lines.push(`      <ext>${escapeXml(phone.ext)}</ext>`);
      if (phone.info) lines.push(`      <info>${escapeXml(phone.info)}</info>`);
      lines.push(`    </phone>`);
      return lines.join("\n");
    })
    .join("\n");

export const buildPhotosXml = (photos: Photo[], galleryUrl: string): string => {
  if (!photos.length && !galleryUrl) return "";
  const galleryAttr = galleryUrl ? ` gallery-url="${escapeXml(galleryUrl)}"` : "";
  const photoXml = photos
    .filter((photo) => photo.url)
    .map((photo) => {
      const attrs = [`url="${escapeXml(photo.url)}"`];
      if (photo.alt) attrs.push(`alt="${escapeXml(photo.alt)}"`);
      if (photo.type) attrs.push(`type="${escapeXml(photo.type)}"`);
      const tag = photo.tag ? `\n      <tag>${escapeXml(photo.tag)}</tag>\n    ` : "";
      return `    <photo ${attrs.join(" ")}>${tag}</photo>`;
    })
    .join("\n");
  return `    <photos${galleryAttr}>\n${photoXml}\n    </photos>`;
};

export const buildCompanyXml = (data: StationState, network: NetworkState): string => {
  const blocks: string[] = [];
  const addressValue = composeAddress(data.address, data.locality);
  blocks.push(`  <company>`);
  blocks.push(`    <company-id>${escapeXml(data.id)}</company-id>`);
  blocks.push(`    <name lang="ru">${escapeXml(data.name || network.name)}</name>`);
  blocks.push(
    `    <shortname lang="ru">${escapeXml(
      data.shortname || network.shortname
    )}</shortname>`
  );
  if (data.nameOther) {
    blocks.push(`    <name-other lang="ru">${escapeXml(data.nameOther)}</name-other>`);
  }

  blocks.push(`    <address lang="ru">${escapeXml(addressValue)}</address>`);
  blocks.push(`    <country lang="ru">${escapeXml(network.country)}</country>`);
  if (data.addressAdd) {
    blocks.push(`    <address-add lang="ru">${escapeXml(data.addressAdd)}</address-add>`);
  }

  const phoneXml = buildPhoneXml(data.phones || []);
  if (phoneXml) blocks.push(phoneXml);

  if (data.email) blocks.push(`    <email>${escapeXml(data.email)}</email>`);
  if (data.url) blocks.push(`    <url>${escapeXml(data.url)}</url>`);
  if (data.addUrl) blocks.push(`    <add-url>${escapeXml(data.addUrl)}</add-url>`);
  if (data.infoPage) blocks.push(`    <info-page>${escapeXml(data.infoPage)}</info-page>`);

  blocks.push(`    <working-time lang="ru">${escapeXml(data.workingTime)}</working-time>`);

  const scheduledXml = buildScheduledXml(data.scheduled);
  if (scheduledXml) blocks.push(scheduledXml);

  const rubrics = data.rubrics && data.rubrics.length ? data.rubrics : network.rubric ? [network.rubric] : [];
  rubrics.forEach((rubric) => {
    if (rubric) blocks.push(`    <rubric-id>${escapeXml(rubric)}</rubric-id>`);
  });

  if (network.actualization) {
    blocks.push(`    <actualization-date>${escapeXml(network.actualization)}</actualization-date>`);
  }

  const photosXml = buildPhotosXml(data.photos || [], data.galleryUrl);
  if (photosXml) blocks.push(photosXml);

  (data.fuels || []).forEach((fuel) => {
    blocks.push(`    <feature-enum-multiple name="${FEATURE_FUEL_NAME}">${escapeXml(fuel)}</feature-enum-multiple>`);
  });
  (data.services || []).forEach((service) => {
    blocks.push(`    <feature-enum-multiple name="${FEATURE_SERVICE_NAME}">${escapeXml(service)}</feature-enum-multiple>`);
  });

  if (data.lon && data.lat) {
    blocks.push(`    <coordinates>`);
    blocks.push(`      <lon>${escapeXml(data.lon)}</lon>`);
    blocks.push(`      <lat>${escapeXml(data.lat)}</lat>`);
    blocks.push(`    </coordinates>`);
  }

  blocks.push(`  </company>`);
  return blocks.join("\n");
};

export const buildXml = (companies: string): string =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<companies>\n${companies}\n</companies>`;
