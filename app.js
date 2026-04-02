const preview = document.getElementById("xmlPreview");
const singleErrors = document.getElementById("singleErrors");
const bulkErrors = document.getElementById("bulkErrors");
const singleWarnings = document.getElementById("singleWarnings");
const bulkWarnings = document.getElementById("bulkWarnings");
const xmlUploadErrors = document.getElementById("xmlUploadErrors");

const networkFields = {
  name: document.getElementById("networkName"),
  shortname: document.getElementById("networkShortname"),
  country: document.getElementById("networkCountry"),
  rubric: document.getElementById("networkRubric"),
  actualization: document.getElementById("networkActualization"),
  phoneType: document.getElementById("networkPhoneType"),
};

const singleStations = document.getElementById("singleStations");
const stationTemplate = document.getElementById("stationTemplate");
const bulkTable = document.getElementById("bulkTable").querySelector("tbody");

const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");

const today = new Date();
networkFields.actualization.value = today.toISOString().slice(0, 10);

const allowedPhotoTags = [
  "INTERIOR",
  "EXTERIOR",
  "ENTER",
  "LOGO",
  "FOOD",
  "GOODS",
  "MENU",
  "ACCESSIBILITY",
  "DEVICES",
  "SERVICES",
];

let rubricIndex = [];

const parseRubrics = (text) => {
  const trimmed = text.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    // rubric.json может быть списком объектов без внешних []
    try {
      const wrapped = `[${trimmed.replace(/^\s*,|,\s*$/g, "")}]`;
      return JSON.parse(wrapped);
    } catch {
      return [];
    }
  }
};

const loadRubrics = async () => {
  try {
    const response = await fetch("rubric.json", { cache: "no-store" });
    if (!response.ok) return;
    const text = await response.text();
    const data = parseRubrics(text);
    rubricIndex = data
      .map((item) => ({
        id: String(item["rubric-id"] || "").trim(),
        name: String(item["ru_rubric_names"] || "").trim(),
      }))
      .filter((item) => item.id && item.name)
      .map((item) => ({
        ...item,
        search: `${item.id} ${item.name}`.toLowerCase(),
      }));
  } catch {
    rubricIndex = [];
  }
};

const filterRubrics = (query) => {
  if (!query) return [];
  const q = query.toLowerCase();
  return rubricIndex.filter((item) => item.search.includes(q)).slice(0, 8);
};

const normalizeRubricValue = (value) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase();
  const exact = rubricIndex.find((item) => item.name.toLowerCase() === lower);
  if (exact) return exact.id;
  const partial = rubricIndex.find((item) => item.name.toLowerCase().includes(lower));
  return partial ? partial.id : trimmed;
};

const refreshRubricTags = () => {
  document.querySelectorAll(".rubric-tag").forEach((tag) => {
    const id = tag.dataset.id;
    const match = rubricIndex.find((item) => item.id === id);
    if (!match) return;
    const button = tag.querySelector("button");
    tag.textContent = `${match.name} — ${id}`;
    if (button) tag.appendChild(button);
  });
};

const escapeXml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const formatDate = (value) => {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
};

const normalizeDateToInput = (value) => {
  if (!value) return "";
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
    const [day, month, year] = value.split(".");
    return `${year}-${month}-${day}`;
  }
  if (/^\d{13}$/.test(value)) {
    const date = new Date(Number(value));
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  }
  return "";
};

const formatPhoneRu = (value) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  let normalized = digits;
  if (normalized.length === 11 && normalized.startsWith("8")) {
    normalized = `7${normalized.slice(1)}`;
  }
  if (normalized.length === 10 && normalized.startsWith("9")) {
    normalized = `7${normalized}`;
  }
  if (normalized.length !== 11 || !normalized.startsWith("7")) {
    return value;
  }
  const code = normalized.slice(1, 4);
  const part1 = normalized.slice(4, 7);
  const part2 = normalized.slice(7, 9);
  const part3 = normalized.slice(9, 11);
  return `+7 (${code}) ${part1}-${part2}-${part3}`;
};

const attachPhoneMask = (input) => {
  if (!input) return;
  input.addEventListener("blur", () => {
    const formatted = formatPhoneRu(input.value);
    if (formatted) input.value = formatted;
  });
};

const attachUrlPrefix = (input) => {
  if (!input) return;
  input.addEventListener("blur", () => {
    const value = input.value.trim();
    if (!value) return;
    if (/^https?:\/\//i.test(value)) return;
    input.value = `https://${value}`;
  });
};

const createPhoneRow = (data = {}) => {
  const row = document.createElement("div");
  row.className = "phone-row";

  row.innerHTML = `
    <input type="text" placeholder="+7 (___) ___-__-__" value="${data.number || ""}">
    <select>
      <option value="phone">phone</option>
      <option value="fax">fax</option>
      <option value="phone-fax">phone-fax</option>
    </select>
    <input type="text" placeholder="ext" value="${data.ext || ""}">
    <input type="text" placeholder="info" value="${data.info || ""}">
    <button class="remove" title="Удалить">×</button>
  `;

  const select = row.querySelector("select");
  select.value = data.type || networkFields.phoneType.value || "phone";
  const numberInput = row.querySelector("input");
  attachPhoneMask(numberInput);
  row.querySelector(".remove").addEventListener("click", () => row.remove());
  return row;
};

const createPhotoRow = (data = {}) => {
  const row = document.createElement("div");
  row.className = "photo-row";

  row.innerHTML = `
    <input type="text" placeholder="https://site.ru/photo.jpg" value="${data.url || ""}">
    <input type="text" placeholder="alt (описание)" value="${data.alt || ""}">
    <select>
      <option value="">type (необязательно)</option>
      <option value="interior">interior</option>
    </select>
    <select>
      <option value="">tag (необязательно)</option>
      ${allowedPhotoTags.map((tag) => `<option value="${tag}">${tag}</option>`).join("")}
    </select>
    <button class="remove" title="Удалить">×</button>
  `;

  const typeSelect = row.querySelectorAll("select")[0];
  typeSelect.value = data.type || "";
  const tagSelect = row.querySelectorAll("select")[1];
  tagSelect.value = data.tag || "";
  row.querySelector(".remove").addEventListener("click", () => row.remove());
  return row;
};

const createBulkRow = (data = {}) => {
  const row = document.createElement("tr");
  row.className = "bulk-row";

  row.innerHTML = `
    <td><input type="text" value="${data.id || ""}"></td>
    <td><input type="text" value="${data.address || ""}"></td>
    <td><input type="text" value="${data.phone || ""}"></td>
    <td><input type="text" value="${data.workingTime || ""}"></td>
    <td>
      <div class="rubric-cell">
        <input class="rubric-input" type="text" value="${data.rubric || ""}" autocomplete="off">
        <div class="rubric-suggestions"></div>
      </div>
    </td>
    <td><input type="text" value="${data.lon || ""}"></td>
    <td><input type="text" value="${data.lat || ""}"></td>
    <td><input type="text" value="${data.nameOther || ""}"></td>
    <td><input type="text" value="${data.locality || ""}"></td>
    <td><button class="duplicate" title="Дублировать">⧉</button></td>
    <td><button class="remove" title="Удалить">×</button></td>
  `;

  row.querySelector(".duplicate").addEventListener("click", () => {
    const inputs = row.querySelectorAll("input");
    const cloneData = {
      id: inputs[0].value.trim(),
      address: inputs[1].value.trim(),
      phone: inputs[2].value.trim(),
      workingTime: inputs[3].value.trim(),
      rubric: inputs[4].value.trim(),
      lon: inputs[5].value.trim(),
      lat: inputs[6].value.trim(),
      nameOther: inputs[7].value.trim(),
      locality: inputs[8].value.trim(),
    };
    const cloneRow = createBulkRow(cloneData);
    row.insertAdjacentElement("afterend", cloneRow);
  });

  row.querySelector(".remove").addEventListener("click", () => row.remove());

  const phoneInput = row.querySelectorAll("input")[2];
  attachPhoneMask(phoneInput);

  const rubricInput = row.querySelector(".rubric-input");
  const rubricSuggestions = row.querySelector(".rubric-suggestions");
  attachRubricAutocomplete(rubricInput, rubricSuggestions, (item) => {
    rubricInput.value = item.id;
  });

  return row;
};

const renderRubricSuggestions = (container, items, onPick) => {
  if (!container) return;
  if (!items.length) {
    container.classList.remove("active");
    container.innerHTML = "";
    return;
  }
  container.innerHTML = items
    .map(
      (item) =>
        `<button type="button" data-id="${item.id}">${item.name} — ${item.id}</button>`
    )
    .join("");
  container.classList.add("active");
  container.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;
      const match = items.find((item) => item.id === id);
      if (match) onPick(match);
      container.classList.remove("active");
    });
  });
};

const attachRubricAutocomplete = (input, suggestions, onPick) => {
  if (!input || !suggestions) return;
  const handleInput = () => {
    const items = filterRubrics(input.value.trim());
    renderRubricSuggestions(suggestions, items, onPick);
  };
  input.addEventListener("input", handleInput);
  input.addEventListener("focus", handleInput);
  input.addEventListener("blur", () => {
    const normalized = normalizeRubricValue(input.value);
    const match = rubricIndex.find((item) => item.id === normalized);
    if (match) onPick(match);
  });
  document.addEventListener("click", (event) => {
    if (!suggestions.contains(event.target) && event.target !== input) {
      suggestions.classList.remove("active");
    }
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const items = filterRubrics(input.value.trim());
      if (items[0]) {
        event.preventDefault();
        onPick(items[0]);
        suggestions.classList.remove("active");
      }
    }
  });
};

const addRubricTag = (container, item) => {
  if (!container || !item) return;
  const existing = Array.from(container.querySelectorAll(".rubric-tag")).some(
    (tag) => tag.dataset.id === item.id
  );
  if (existing) return;
  if (container.querySelectorAll(".rubric-tag").length >= 3) return;

  const tag = document.createElement("span");
  tag.className = "rubric-tag";
  tag.dataset.id = item.id;
  tag.textContent = `${item.name} — ${item.id}`;

  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "×";
  remove.addEventListener("click", () => tag.remove());
  tag.appendChild(remove);

  container.appendChild(tag);
};

const attachRubricPicker = (station, data) => {
  const tagsContainer = station.querySelector('[data-list="rubrics"]');
  const input = station.querySelector('[data-field="rubric-input"]');
  const suggestions = station.querySelector('[data-list="rubric-suggestions"]');

  const addFromInput = (item) => {
    addRubricTag(tagsContainer, item);
    input.value = "";
  };

  attachRubricAutocomplete(input, suggestions, addFromInput);

  const rubrics = data.rubrics?.length
    ? data.rubrics
    : data.rubric
    ? [data.rubric]
    : [];

  rubrics.forEach((id) => {
    const match = rubricIndex.find((item) => item.id === String(id));
    addRubricTag(tagsContainer, match || { id: String(id), name: "Рубрика" });
  });
};

const createStationForm = (data = {}) => {
  const fragment = stationTemplate.content.cloneNode(true);
  const station = fragment.querySelector(".station-card");

  const setValue = (field, value) => {
    const input = station.querySelector(`[data-field="${field}"]`);
    if (!input) return;
    if (value === undefined || value === null || value === "") return;
    input.value = value;
  };

  setValue("company-id", data.id);
  setValue("name-other", data.nameOther);
  setValue("locality-name", data.locality);
  setValue("address", data.address);
  setValue("address-add", data.addressAdd);
  setValue("working-time", data.workingTime);
  setValue("scheduled-working-time", data.scheduled);
  setValue("rubric-id", data.rubric);
  setValue("email", data.email);
  setValue("url", data.url);
  setValue("add-url", data.addUrl);
  setValue("info-page", data.infoPage);
  setValue("lon", data.lon);
  setValue("lat", data.lat);
  setValue("gallery-url", data.galleryUrl);

  attachUrlPrefix(station.querySelector('[data-field="url"]'));
  attachUrlPrefix(station.querySelector('[data-field="add-url"]'));
  attachUrlPrefix(station.querySelector('[data-field="info-page"]'));
  attachUrlPrefix(station.querySelector('[data-field="gallery-url"]'));

  const phonesList = station.querySelector('[data-list="phones"]');
  phonesList.innerHTML = "";
  if (data.phones && data.phones.length) {
    data.phones.forEach((phone) => phonesList.appendChild(createPhoneRow(phone)));
  } else {
    phonesList.appendChild(createPhoneRow());
  }

  const photosList = station.querySelector('[data-list="photos"]');
  photosList.innerHTML = "";
  if (data.photos && data.photos.length) {
    data.photos.forEach((photo) => photosList.appendChild(createPhotoRow(photo)));
  } else {
    photosList.appendChild(createPhotoRow());
  }

  attachRubricPicker(station, data);

  station.querySelector('[data-action="add-phone"]').addEventListener("click", () => {
    phonesList.appendChild(createPhoneRow());
  });

  station.querySelector('[data-action="add-photo"]').addEventListener("click", () => {
    photosList.appendChild(createPhotoRow());
  });

  station.querySelector('[data-action="duplicate-station"]').addEventListener("click", () => {
    const cloneData = readStationData(station);
    const clone = createStationForm(cloneData);
    station.insertAdjacentElement("afterend", clone);
  });

  station.querySelector('[data-action="remove-station"]').addEventListener("click", () => {
    station.remove();
  });

  return station;
};

const setActiveTab = (tabId) => {
  tabs.forEach((btn) => btn.classList.remove("active"));
  tabContents.forEach((section) => section.classList.remove("active"));
  const target = document.querySelector(`.tab[data-tab="${tabId}"]`);
  if (target) target.classList.add("active");
  const content = document.getElementById(tabId);
  if (content) content.classList.add("active");
};

const getNetworkData = () => ({
  name: networkFields.name.value.trim(),
  shortname: networkFields.shortname.value.trim(),
  country: networkFields.country.value.trim(),
  rubric: normalizeRubricValue(networkFields.rubric.value),
  actualization: formatDate(networkFields.actualization.value),
  phoneType: networkFields.phoneType.value,
});

const hasControlChars = (value) => /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(value);
const hasHtml = (value) => /<[^>]*>/.test(value);
const hasAngleBrackets = (value) => /[<>]/.test(value);
const hasQuotesOrBrackets = (value) => /["'«»()[\]{}<>]/.test(value);

const validateTextValue = (label, value, errors) => {
  if (!value) return;
  if (hasControlChars(value)) errors.push(`${label}: есть управляющие символы.`);
  if (hasHtml(value) || hasAngleBrackets(value)) {
    errors.push(`${label}: не допускаются HTML-теги или угловые скобки.`);
  }
};

const validateCompanyId = (value, errors) => {
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(value)) {
    errors.push(
      "company-id: допустимы только латинские буквы, цифры, дефис и подчёркивание, без пробелов (до 80 символов)."
    );
  }
};

const validateShortname = (value, errors, warnings) => {
  if (value.length > 55) {
    errors.push("shortname: длина не должна превышать 55 символов.");
  } else if (value.length > 25) {
    warnings.push("shortname: свыше 25 символов допускается только по отдельному согласованию.");
  }
};

const validateName = (value, errors) => {
  if (hasQuotesOrBrackets(value)) {
    errors.push("name: не используйте кавычки и скобки.");
  }
  const letters = value.replace(/[^A-Za-zА-Яа-яЁё]/g, "");
  if (letters && letters === letters.toUpperCase()) {
    errors.push("name: не используйте капслок.");
  }
};

const validateAddressAdd = (value, errors) => {
  if (hasQuotesOrBrackets(value)) {
    errors.push("address-add: не используйте кавычки и скобки.");
  }
};

const validatePhone = (value, errors, label = "phone") => {
  if (!/^\+?\d[\d\s\-]*\(\d+\)[\d\s\-]+$/.test(value)) {
    errors.push(
      `${label}: формат должен быть [код страны] (код города) номер, например +7 (343) 375-13-99.`
    );
  }
};

const validateExt = (value, errors) => {
  if (value && !/^\d+$/.test(value)) {
    errors.push("ext: допускаются только цифры без пробелов и разделителей.");
  }
};

const validateEmail = (value, errors) => {
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    errors.push("email: некорректный формат.");
  }
};

const validateUrl = (value, errors, label, requireLowercase = true) => {
  if (!value) return;
  if (!/^https?:\/\/.+/.test(value)) {
    errors.push(`${label}: укажите полный адрес с http:// или https://.`);
  }
  if (requireLowercase && value !== value.toLowerCase()) {
    errors.push(`${label}: адрес должен быть в нижнем регистре.`);
  }
};

const validateWorkingTime = (value, errors) => {
  if (/\n/.test(value)) errors.push("working-time: значение должно быть в одной строке.");
};

const validateScheduled = (value, errors) => {
  if (!value) return;
  if (!/\d{2}\.\d{2}\.\d{4}/.test(value)) {
    errors.push("scheduled-working-time: укажите даты в формате ДД.ММ.ГГГГ.");
  }
};

const validateActualization = (value, errors) => {
  if (!value) return;
  if (!/^(\d{2}\.\d{2}\.\d{4}|\d{13})$/.test(value)) {
    errors.push("actualization-date: допустимы ДД.ММ.ГГГГ или UNIX-time в миллисекундах (13 цифр).");
  }
};

const validateRubric = (value, errors) => {
  if (value && !/^\d+$/.test(value)) {
    errors.push("rubric-id: должен состоять только из цифр.");
  }
};

const validatePhotoTag = (value, errors) => {
  if (value && !allowedPhotoTags.includes(value)) {
    errors.push(`photo tag: недопустимое значение "${value}".`);
  }
};

const validatePhotoType = (value, errors) => {
  if (value && value !== "interior") {
    errors.push('photo type: допустимо только "interior".');
  }
};

const buildPhoneXml = (phones) =>
  phones
    .map((phone) => {
      const parts = [];
      parts.push(`<number>${escapeXml(phone.number)}</number>`);
      parts.push(`<type>${escapeXml(phone.type)}</type>`);
      if (phone.ext) parts.push(`<ext>${escapeXml(phone.ext)}</ext>`);
      if (phone.info) parts.push(`<info>${escapeXml(phone.info)}</info>`);
      return `    <phone>\n      ${parts.join("\n      ")}\n    </phone>`;
    })
    .join("\n");

const buildPhotosXml = (photos, galleryUrl) => {
  if (!photos.length && !galleryUrl) return "";
  const galleryAttr = galleryUrl ? ` gallery-url="${escapeXml(galleryUrl)}"` : "";
  const photoXml = photos
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

const buildCompanyXml = (data, network) => {
  const blocks = [];
  blocks.push(`  <company>`);
  blocks.push(`    <company-id>${escapeXml(data.id)}</company-id>`);
  blocks.push(`    <name lang="ru">${escapeXml(data.name || network.name)}</name>`);
  blocks.push(
    `    <shortname lang="ru">${escapeXml(data.shortname || network.shortname)}</shortname>`
  );
  blocks.push(`    <address lang="ru">${escapeXml(data.address)}</address>`);
  if (data.locality) {
    blocks.push(`    <locality-name lang="ru">${escapeXml(data.locality)}</locality-name>`);
  }
  blocks.push(`    <country lang="ru">${escapeXml(network.country)}</country>`);

  const phoneXml = buildPhoneXml(data.phones || []);
  if (phoneXml) blocks.push(phoneXml);

  blocks.push(`    <working-time lang="ru">${escapeXml(data.workingTime)}</working-time>`);

  if (data.scheduled) {
    blocks.push(
      `    <scheduled-working-time lang="ru">${escapeXml(data.scheduled)}</scheduled-working-time>`
    );
  }

  if (data.addressAdd) {
    blocks.push(`    <address-add lang="ru">${escapeXml(data.addressAdd)}</address-add>`);
  }

  if (data.nameOther) {
    blocks.push(`    <name-other lang="ru">${escapeXml(data.nameOther)}</name-other>`);
  }

  if (data.email) blocks.push(`    <email>${escapeXml(data.email)}</email>`);
  if (data.url) blocks.push(`    <url>${escapeXml(data.url)}</url>`);
  if (data.addUrl) blocks.push(`    <add-url>${escapeXml(data.addUrl)}</add-url>`);
  if (data.infoPage) blocks.push(`    <info-page>${escapeXml(data.infoPage)}</info-page>`);

  const photosXml = buildPhotosXml(data.photos || [], data.galleryUrl);
  if (photosXml) blocks.push(photosXml);

  const rubrics = data.rubrics && data.rubrics.length ? data.rubrics : network.rubric ? [network.rubric] : [];
  rubrics.forEach((rubric) => {
    if (rubric) blocks.push(`    <rubric-id>${escapeXml(rubric)}</rubric-id>`);
  });

  if (network.actualization) {
    blocks.push(`    <actualization-date>${escapeXml(network.actualization)}</actualization-date>`);
  }

  if (data.lon && data.lat) {
    blocks.push(`    <coordinates>`);
    blocks.push(`      <lon>${escapeXml(data.lon)}</lon>`);
    blocks.push(`      <lat>${escapeXml(data.lat)}</lat>`);
    blocks.push(`    </coordinates>`);
  }

  blocks.push(`  </company>`);
  return blocks.join("\n");
};

const buildXml = (companies) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<companies>\n${companies}\n</companies>`;

const validateNetwork = (network, warnings = []) => {
  const errors = [];
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
  return errors;
};

const validateStation = (data, network) => {
  const errors = [];
  const warnings = [];
  if (!data.id) errors.push("Укажите company-id.");
  if (!data.address) errors.push("Укажите адрес.");
  if (!data.workingTime) errors.push("Укажите время работы.");
  if (!data.phones.length) errors.push("Добавьте хотя бы один телефон.");
  if (!data.rubrics.length && !network.rubric) errors.push("Укажите rubric-id.");
  if (data.id) validateCompanyId(data.id, errors);
  if (data.nameOther) validateTextValue("name-other", data.nameOther, errors);
  if (data.locality) validateTextValue("locality-name", data.locality, errors);
  if (data.address) validateTextValue("address", data.address, errors);
  if (data.addressAdd) validateAddressAdd(data.addressAdd, errors);
  if (data.workingTime) validateWorkingTime(data.workingTime, errors);
  if (data.scheduled) validateScheduled(data.scheduled, errors);
  if (data.rubrics.length > 3) {
    errors.push("rubric-id: можно указывать не более трех рубрик.");
  }
  const effectiveRubrics = data.rubrics.length ? data.rubrics : network.rubric ? [network.rubric] : [];
  effectiveRubrics.forEach((rubric) => validateRubric(rubric, errors));
  if (network.rubric && data.rubrics.length && !data.rubrics.includes(network.rubric)) {
    errors.push("rubric-id: хотя бы одна рубрика должна совпадать с рубрикой сети.");
  }
  if (data.email) validateEmail(data.email, errors);
  if (data.url) validateUrl(data.url, errors, "url", true);
  if (data.addUrl) validateUrl(data.addUrl, errors, "add-url", true);
  if (data.infoPage) validateUrl(data.infoPage, errors, "info-page", true);
  if (data.galleryUrl) validateUrl(data.galleryUrl, errors, "gallery-url", false);

  data.phones.forEach((phone) => {
    validatePhone(phone.number, errors);
    validateExt(phone.ext, errors);
  });

  data.photos.forEach((photo, index) => {
    if (!photo.url) {
      errors.push(`photo ${index + 1}: укажите url.`);
      return;
    }
    validateUrl(photo.url, errors, `photo ${index + 1} url`, false);
    validatePhotoType(photo.type, errors);
    validatePhotoTag(photo.tag, errors);
  });

  return { errors, warnings };
};

const validateDuplicates = (ids, errors) => {
  const seen = new Set();
  ids.forEach((id) => {
    if (!id) return;
    if (seen.has(id)) {
      errors.push(`company-id: дубликат "${id}". Для каждой АЗС нужен свой уникальный ID.`);
    }
    seen.add(id);
  });
};

const validateBulkRow = (row, network, rowIndex) => {
  const errors = [];
  const rowLabel = `Строка ${rowIndex + 1}`;
  if (!row.id) errors.push(`${rowLabel}: нет company-id.`);
  if (!row.address) errors.push(`${rowLabel}: нет address.`);
  if (!row.phone) errors.push(`${rowLabel}: нет phone.`);
  if (!row.workingTime) errors.push(`${rowLabel}: нет working-time.`);
  if (!row.rubric && !network.rubric) errors.push(`${rowLabel}: нет rubric-id.`);
  if (row.id) validateCompanyId(row.id, errors);
  if (row.nameOther) validateTextValue(`${rowLabel} name-other`, row.nameOther, errors);
  if (row.locality) validateTextValue(`${rowLabel} locality-name`, row.locality, errors);
  if (row.address) validateTextValue(`${rowLabel} address`, row.address, errors);
  if (row.workingTime) validateWorkingTime(row.workingTime, errors);
  if (row.phone) validatePhone(row.phone, errors, `${rowLabel} phone`);
  validateRubric(row.rubric || network.rubric, errors);
  if (row.rubric && network.rubric && row.rubric !== network.rubric) {
    errors.push(`${rowLabel}: rubric-id должен совпадать с рубрикой сети или быть среди них.`);
  }
  return errors;
};

const readStationData = (station) => {
  const getValue = (field) => {
    const input = station.querySelector(`[data-field="${field}"]`);
    return input ? input.value.trim() : "";
  };

  const phones = Array.from(station.querySelectorAll(".phone-row")).map((row) => {
    const inputs = row.querySelectorAll("input");
    return {
      number: inputs[0].value.trim(),
      type: row.querySelector("select").value,
      ext: inputs[1].value.trim(),
      info: inputs[2].value.trim(),
    };
  });

  const photos = Array.from(station.querySelectorAll(".photo-row"))
    .map((row) => {
      const inputs = row.querySelectorAll("input");
      const selects = row.querySelectorAll("select");
      return {
        url: inputs[0].value.trim(),
        alt: inputs[1].value.trim(),
        type: selects[0].value,
        tag: selects[1].value,
      };
    })
    .filter((photo) => photo.url || photo.alt || photo.type || photo.tag);

  const rubrics = Array.from(station.querySelectorAll(".rubric-tag")).map(
    (tag) => tag.dataset.id
  );

  return {
    id: getValue("company-id"),
    nameOther: getValue("name-other"),
    locality: getValue("locality-name"),
    address: getValue("address"),
    addressAdd: getValue("address-add"),
    workingTime: getValue("working-time"),
    scheduled: getValue("scheduled-working-time"),
    rubrics,
    email: getValue("email"),
    url: getValue("url"),
    addUrl: getValue("add-url"),
    infoPage: getValue("info-page"),
    lon: getValue("lon"),
    lat: getValue("lat"),
    galleryUrl: getValue("gallery-url"),
    phones: phones.filter((phone) => phone.number),
    photos,
  };
};

const collectStations = () =>
  Array.from(singleStations.querySelectorAll(".station-card")).map((station) =>
    readStationData(station)
  );

const collectBulk = () =>
  Array.from(bulkTable.querySelectorAll("tr")).map((row) => {
    const inputs = row.querySelectorAll("input");
    return {
      id: inputs[0].value.trim(),
      address: inputs[1].value.trim(),
      phone: inputs[2].value.trim(),
      workingTime: inputs[3].value.trim(),
      rubric: normalizeRubricValue(inputs[4].value),
      lon: inputs[5].value.trim(),
      lat: inputs[6].value.trim(),
      nameOther: inputs[7].value.trim(),
      locality: inputs[8].value.trim(),
    };
  });

const readText = (parent, tag) => {
  const node = parent.querySelector(tag);
  return node ? node.textContent.trim() : "";
};

const readTextByLang = (parent, tag, lang = "ru") => {
  const nodes = Array.from(parent.querySelectorAll(tag));
  const exact = nodes.find((node) => node.getAttribute("lang") === lang);
  if (exact) return exact.textContent.trim();
  if (nodes[0]) return nodes[0].textContent.trim();
  return "";
};

const extractCompany = (company) => {
  const phones = Array.from(company.querySelectorAll("phone")).map((phone) => ({
    number: readText(phone, "number"),
    type: readText(phone, "type") || networkFields.phoneType.value,
    ext: readText(phone, "ext"),
    info: readText(phone, "info"),
  }));

  const photosRoot = company.querySelector("photos");
  const photos = photosRoot
    ? Array.from(photosRoot.querySelectorAll("photo")).map((photo) => ({
        url: photo.getAttribute("url") || "",
        alt: photo.getAttribute("alt") || "",
        type: photo.getAttribute("type") || "",
        tag: readText(photo, "tag").toUpperCase(),
      }))
    : [];

  return {
    id: readText(company, "company-id"),
    name: readTextByLang(company, "name"),
    shortname: readTextByLang(company, "shortname"),
    nameOther: readTextByLang(company, "name-other"),
    address: readTextByLang(company, "address"),
    locality: readTextByLang(company, "locality-name"),
    addressAdd: readTextByLang(company, "address-add"),
    workingTime: readTextByLang(company, "working-time"),
    scheduled: readTextByLang(company, "scheduled-working-time"),
    email: readText(company, "email"),
    url: readText(company, "url"),
    addUrl: readText(company, "add-url"),
    infoPage: readText(company, "info-page"),
    rubrics: Array.from(company.querySelectorAll("rubric-id")).map((node) =>
      node.textContent.trim()
    ),
    actualization: readText(company, "actualization-date"),
    lon: readText(company, "coordinates > lon"),
    lat: readText(company, "coordinates > lat"),
    phones: phones.filter((phone) => phone.number),
    galleryUrl: photosRoot ? photosRoot.getAttribute("gallery-url") || "" : "",
    photos,
  };
};

const fillNetworkFields = (companyData, companies) => {
  if (companyData.name) networkFields.name.value = companyData.name;
  if (companyData.shortname) networkFields.shortname.value = companyData.shortname;
  if (companyData.country) {
    networkFields.country.value = companyData.country;
  }
  const actualization = companyData.actualization;
  if (actualization) {
    networkFields.actualization.value = normalizeDateToInput(actualization);
  }
  const firstRubric = companyData.rubrics?.[0];
  if (firstRubric) {
    networkFields.rubric.value = firstRubric;
  }
};

const fillSingleStations = (companies) => {
  singleStations.innerHTML = "";
  if (!companies.length) {
    singleStations.appendChild(createStationForm());
    return;
  }
  companies.forEach((company) => singleStations.appendChild(createStationForm(company)));
};

const fillBulkTable = (companies) => {
  bulkTable.innerHTML = "";
  companies.forEach((company) => {
    bulkTable.appendChild(
      createBulkRow({
        id: company.id,
        address: company.address,
        phone: company.phones[0]?.number || "",
        workingTime: company.workingTime,
        rubric: company.rubrics?.[0] || "",
        lon: company.lon,
        lat: company.lat,
        nameOther: company.nameOther,
        locality: company.locality,
      })
    );
  });
  if (!companies.length) {
    bulkTable.appendChild(createBulkRow());
  }
};

const renderXml = (xml) => {
  preview.value = xml;
};

const downloadXml = (xml) => {
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ortk-branches.xml";
  a.click();
  URL.revokeObjectURL(url);
};

document.getElementById("addStation").addEventListener("click", () => {
  const last = singleStations.querySelector(".station-card:last-child");
  if (!last) {
    singleStations.appendChild(createStationForm());
    return;
  }
  const data = readStationData(last);
  data.id = "";
  singleStations.appendChild(createStationForm(data));
});

document.getElementById("addBulkRow").addEventListener("click", () => {
  bulkTable.appendChild(createBulkRow());
});

document.getElementById("generateSingle").addEventListener("click", () => {
  const network = getNetworkData();
  const stations = collectStations();
  const warnings = [];
  const errors = [...validateNetwork(network, warnings)];

  stations.forEach((data, index) => {
    const result = validateStation(data, network);
    errors.push(...result.errors.map((err) => `Станция ${index + 1}: ${err}`));
    warnings.push(...result.warnings.map((warn) => `Станция ${index + 1}: ${warn}`));
  });

  validateDuplicates(
    stations.map((station) => station.id),
    errors
  );

  singleErrors.textContent = errors.join(" ");
  singleWarnings.textContent = warnings.join(" ");
  if (errors.length) return;
  const companiesXml = stations.map((data) => buildCompanyXml(data, network)).join("\n");
  renderXml(buildXml(companiesXml));
});

document.getElementById("downloadSingle").addEventListener("click", () => {
  if (!preview.value.trim()) return;
  downloadXml(preview.value);
});

document.getElementById("generateBulk").addEventListener("click", () => {
  const network = getNetworkData();
  const rows = collectBulk();
  const warnings = [];
  const errors = [...validateNetwork(network, warnings)];
  rows.forEach((row, index) => {
    errors.push(...validateBulkRow(row, network, index));
  });
  validateDuplicates(
    rows.map((row) => row.id),
    errors
  );
  bulkErrors.textContent = errors.join(" ");
  bulkWarnings.textContent = warnings.join(" ");
  if (errors.length) return;

  const companiesXml = rows
    .filter((row) => row.id && row.address)
    .map((row) => {
      const data = {
        id: row.id,
        address: row.address,
        workingTime: row.workingTime,
        rubrics: row.rubric ? [row.rubric] : [],
        nameOther: row.nameOther,
        locality: row.locality,
        lon: row.lon,
        lat: row.lat,
        phones: row.phone
          ? [
              {
                number: row.phone,
                type: network.phoneType,
              },
            ]
          : [],
      };
      return buildCompanyXml(data, network);
    })
    .join("\n");

  renderXml(buildXml(companiesXml));
});

document.getElementById("downloadBulk").addEventListener("click", () => {
  if (!preview.value.trim()) return;
  downloadXml(preview.value);
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((btn) => btn.classList.remove("active"));
    tabContents.forEach((section) => section.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

document.getElementById("xmlUpload").addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  xmlUploadErrors.textContent = "";
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = reader.result;
      if (typeof text !== "string") throw new Error("Неверный формат файла.");
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "application/xml");
      const parseError = doc.querySelector("parsererror");
      if (parseError) throw new Error("XML содержит ошибки и не может быть прочитан.");
      const companiesRoot = doc.querySelector("companies");
      if (!companiesRoot) throw new Error("Корневой элемент <companies> не найден.");
      const companies = Array.from(companiesRoot.querySelectorAll("company"));
      if (!companies.length) throw new Error("В файле нет элементов <company>.");

      const extracted = companies.map((company) => {
        const data = extractCompany(company);
        data.country = readTextByLang(company, "country");
        return data;
      });

      fillNetworkFields(extracted[0], extracted);
      fillSingleStations(extracted);
      fillBulkTable(extracted);
      setActiveTab("single");
      renderXml(text.trim());
    } catch (error) {
      xmlUploadErrors.textContent = error.message;
    }
  };
  reader.readAsText(file, "UTF-8");
});

const networkRubricInput = document.getElementById("networkRubric");
const networkRubricSuggestions = document.getElementById("networkRubricSuggestions");
attachRubricAutocomplete(networkRubricInput, networkRubricSuggestions, (item) => {
  networkRubricInput.value = item.id;
});

loadRubrics().then(refreshRubricTags);

// Bootstrap
singleStations.appendChild(createStationForm());
bulkTable.appendChild(createBulkRow());
