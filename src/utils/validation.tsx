import { VALID_PHOTO_TAGS } from "./constants";
import { parseScheduledEntries } from "./scheduled";
import { resolveRubricInput } from "./helpers";
import type { NetworkState, StationState } from "../types";

export const validateCompanyId = (value: string, errors: string[]) => {
  if (!value) {
    errors.push("company-id: поле обязательно.");
    return;
  }
  if (!/^[A-Za-z0-9_-]{2,60}$/.test(value)) {
    errors.push("company-id: используйте латиницу, цифры, _ или - (2-60 символов)." );
  }
};

export const validateTextValue = (label: string, value: string, errors: string[]) => {
  if (!value) return;
  if (/[<>]/.test(value)) errors.push(`${label}: нельзя использовать < или >.`);
  if (/\s{2,}/.test(value)) errors.push(`${label}: избегайте двойных пробелов.`);
};

export const validateName = (value: string, errors: string[]) => {
  if (!value) return;
  if (value === value.toUpperCase()) errors.push("name: нельзя писать капслоком.");
  if (/\"/.test(value)) errors.push("name: кавычки не допускаются.");
};

export const validateShortname = (value: string, errors: string[], warnings: string[]) => {
  if (!value) return;
  if (value.length > 55) errors.push("shortname: максимум 55 символов.");
  if (value.length > 25) warnings.push("shortname: рекомендовано до 25 символов.");
};

export const validateWorkingTime = (value: string, errors: string[], warnings: string[] = []) => {
  if (/\n/.test(value)) errors.push("working-time: значение должно быть в одной строке.");
  if (!/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/.test(value)) {
    errors.push("working-time: укажите хотя бы один интервал времени, например 10:00-21:00.");
  }
  if (/(выходн|нераб|празд)/i.test(value)) {
    warnings.push(
      "working-time: выходные/праздничные дни не указываются, используйте scheduled-working-time."
    );
  }
};

export const validateScheduled = (value: string, errors: string[]) => {
  if (!value) return;
  const entries = parseScheduledEntries(value);
  if (!entries.length) {
    errors.push(
      "scheduled-working-time: формат ДД.ММ.ГГГГ 10:00-22:00 (перерыв 14:00-14:30)."
    );
    return;
  }
  entries.forEach((entry) => {
    if (!entry.work) {
      errors.push(`scheduled-working-time: укажите интервал времени для даты ${entry.date}.`);
      return;
    }
    if (!/\d{1,2}:\d{2}/.test(entry.work.from) || !/\d{1,2}:\d{2}/.test(entry.work.to)) {
      errors.push(`scheduled-working-time: неверный интервал ${entry.work.from}-${entry.work.to}.`);
    }
    (entry.dinners || []).forEach((dinner) => {
      if (!/\d{1,2}:\d{2}/.test(dinner.from) || !/\d{1,2}:\d{2}/.test(dinner.to)) {
        errors.push(`scheduled-working-time: неверный перерыв ${dinner.from}-${dinner.to}.`);
      }
    });
  });
};

export const validateActualization = (value: string, errors: string[]) => {
  if (!value) return;
  if (!/\d{2}\.\d{2}\.\d{4}/.test(value)) {
    errors.push("actualization-date: формат ДД.ММ.ГГГГ.");
  }
};

export const validateAddressAdd = (value: string, errors: string[]) => {
  if (!value) return;
  if (/[\"']/g.test(value)) errors.push("address-add: не используйте кавычки.");
};

export const validatePhone = (value: string, errors: string[], label: string) => {
  if (!value) return;
  if (!/^\+\d{1,3}\s*\(\d{2,5}\)\s*\d{2,3}[-\s]?\d{2}[-\s]?\d{2}/.test(value)) {
    errors.push(`${label}: формат должен быть +7 (999) 888-77-66.`);
  }
};

export const validateExt = (value: string, errors: string[]) => {
  if (!value) return;
  if (!/^\d+$/.test(value)) errors.push("ext: добавочный номер — только цифры.");
};

export const validateUrl = (value: string, errors: string[], label: string, requireLowercase = true) => {
  if (!value) return;
  if (!/^https?:\/\//.test(value)) {
    errors.push(`${label}: укажите полный адрес с http:// или https://.`);
  }
  if (requireLowercase && value !== value.toLowerCase()) {
    errors.push(`${label}: адрес должен быть в нижнем регистре.`);
  }
};

export const validatePhotoType = (value: string, errors: string[]) => {
  if (!value) return;
  if (value !== "interior") errors.push("photo type: допустимо только interior.");
};

export const validatePhotoTag = (value: string, errors: string[]) => {
  if (!value) return;
  if (!VALID_PHOTO_TAGS.includes(value as (typeof VALID_PHOTO_TAGS)[number])) {
    errors.push(`photo tag: используйте одно из значений ${VALID_PHOTO_TAGS.join(", ")}.`);
  }
};

export const validateRubric = (value: string, errors: string[]) => {
  if (!value) errors.push("rubric-id: поле обязательно.");
  if (value && !/^\d+$/.test(value)) errors.push("rubric-id: только цифры.");
};

export const validateStation = (data: StationState, network: NetworkState) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  validateCompanyId(data.id, errors);
  if (!data.address) errors.push("address: поле обязательно.");
  if (!data.workingTime) errors.push("working-time: поле обязательно.");
  if (!data.phones.length || !data.phones.some((phone) => phone.number)) {
    errors.push("phone: добавьте хотя бы один телефон.");
  }
  if (!data.rubrics.length && !network.rubric) errors.push("rubric-id: укажите рубрику.");

  if (data.nameOther) validateTextValue("name-other", data.nameOther, errors);
  if (data.address) validateTextValue("address", data.address, errors);
  if (data.addressAdd) validateAddressAdd(data.addressAdd, errors);
  if (data.workingTime) validateWorkingTime(data.workingTime, errors, warnings);
  if (data.scheduled) validateScheduled(data.scheduled, errors);
  if (data.rubrics.length > 3) {
    errors.push("rubric-id: можно указывать не более трех рубрик.");
  }
  const effectiveRubrics = data.rubrics.length ? data.rubrics : network.rubric ? [network.rubric] : [];
  effectiveRubrics.forEach((rubric) => validateRubric(rubric, errors));

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("email: некорректный формат.");
  }

  if (data.url) validateUrl(data.url, errors, "url", true);
  if (data.addUrl) validateUrl(data.addUrl, errors, "add-url", true);
  if (data.infoPage) validateUrl(data.infoPage, errors, "info-page", true);
  if (data.galleryUrl) validateUrl(data.galleryUrl, errors, "gallery-url", false);

  if ((data.lon && !data.lat) || (!data.lon && data.lat)) {
    errors.push("coordinates: укажите и lon, и lat.");
  }
  if (data.lon && isNaN(Number(data.lon))) errors.push("lon: используйте число с точкой.");
  if (data.lat && isNaN(Number(data.lat))) errors.push("lat: используйте число с точкой.");

  data.phones.forEach((phone, index) => {
    if (phone.number) validatePhone(phone.number, errors, `phone ${index + 1}`);
    if (phone.ext) validateExt(phone.ext, errors);
  });

  data.photos.forEach((photo, index) => {
    if (photo.url) validateUrl(photo.url, errors, `photo ${index + 1} url`, false);
    validatePhotoType(photo.type, errors);
    validatePhotoTag(photo.tag, errors);
  });

  return { errors, warnings };
};

export const validateNetwork = (network: NetworkState, warnings: string[] = []) => {
  const errors: string[] = [];
  if (!network.name) errors.push("Укажите название сети.");
  if (!network.shortname) errors.push("Укажите короткое название сети.");
  if (!network.country) errors.push("Укажите страну.");
  if (!network.actualization) errors.push("Укажите дату актуализации.");
  validateTextValue("name", network.name, errors);
  validateTextValue("shortname", network.shortname, errors);
  validateTextValue("country", network.country, errors);
  if (network.name) validateName(network.name, errors);
  if (network.shortname) validateShortname(network.shortname, errors, warnings);
  validateActualization(network.actualization, errors);
  if (network.rubric) validateRubric(resolveRubricInput(network.rubric, []), errors);
  return errors;
};
