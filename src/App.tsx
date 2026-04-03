import Header from "./components/Header";
import Tabs from "./components/Tabs";
import NetworkForm from "./components/NetworkForm";
import StationCard from "./components/StationCard";
import BulkTable from "./components/BulkTable";
import ExportPanel from "./components/ExportPanel";
import Modal from "./components/Modal";
import { DEFAULT_BULK_ROW, DEFAULT_STATION, createUid } from "./utils/constants";
import { buildCompanyXml, buildXml } from "./utils/xml";
import { validateNetwork, validateStation } from "./utils/validation";
import { readText, readTextByLang, parseCompany } from "./utils/parser";
import { readLocalStorage, writeLocalStorage } from "./hooks/storage";
import type { BulkRowState, NetworkState, StationState, Rubric } from "./types";
import { useEffect, useState } from "react";

const STORAGE_KEY = "ortk-xml-state-v1";

type RubricRecord = Record<string | number, unknown>;

type StoredState = {
  tab?: string;
  network?: NetworkState;
  stations?: StationState[];
  bulkRows?: BulkRowState[];
};

const withUid = (station: StationState): StationState => ({
  ...DEFAULT_STATION(),
  ...station,
  uid: station.uid || createUid(),
});

const normalizeStations = (list?: StationState[]): StationState[] => {
  if (!list || !list.length) return [DEFAULT_STATION()];
  return list.map((station) => withUid(station));
};

const buildBulkRowFromStation = (station: StationState): BulkRowState => ({
  uid: station.uid,
  id: station.id,
  address: station.address,
  phone: station.phones[0]?.number || "",
  workingTime: station.workingTime,
  rubric: station.rubrics[0] || "",
  lon: station.lon,
  lat: station.lat,
  nameOther: station.nameOther,
});

const normalizeBulkRows = (rows?: BulkRowState[], stations?: StationState[]): BulkRowState[] => {
  if (rows && rows.length) {
    return rows.map((row) => ({ ...row, uid: row.uid || createUid() }));
  }
  if (stations && stations.length) {
    return stations.map(buildBulkRowFromStation);
  }
  return [DEFAULT_BULK_ROW()];
};

const mergeBulkRows = (
  bulkRows: BulkRowState[],
  stations: StationState[],
  network: NetworkState
): StationState[] => {
  const byUid = new Map(stations.map((station) => [station.uid, station]));
  const byId = new Map(stations.map((station) => [station.id, station]));
  return bulkRows.map((row) => {
    const base = (row.uid && byUid.get(row.uid)) || byId.get(row.id) || DEFAULT_STATION();
    const updated: StationState = {
      ...base,
      id: row.id || base.id,
      address: row.address || base.address,
      workingTime: row.workingTime || base.workingTime,
      nameOther: row.nameOther || base.nameOther,
      lon: row.lon || base.lon,
      lat: row.lat || base.lat,
    };
    if (row.phone !== undefined) {
      const basePhone = base.phones[0] || { number: "", type: network.phoneType || "phone", ext: "", info: "" };
      updated.phones = [{ ...basePhone, number: row.phone }];
    }
    if (row.rubric) {
      updated.rubrics = [row.rubric];
    } else if (row.rubric === "") {
      updated.rubrics = [];
    }
    updated.uid = row.uid || base.uid || createUid();
    return updated;
  });
};

const App = () => {
  const stored = readLocalStorage(STORAGE_KEY, null) as StoredState | null;

  const [tab, setTab] = useState<string>(stored?.tab || "single");
  const [network, setNetwork] = useState<NetworkState>(
    stored?.network || {
      name: "",
      shortname: "",
      country: "",
      rubric: "",
      actualization: "",
      phoneType: "phone",
    }
  );
  const [stations, setStations] = useState<StationState[]>(normalizeStations(stored?.stations));
  const [bulkRows, setBulkRows] = useState<BulkRowState[]>(
    normalizeBulkRows(stored?.bulkRows, stored?.stations)
  );
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [xmlOutput, setXmlOutput] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/rubric.json");
        const text = await response.text();
        let data: unknown;
        try {
          data = JSON.parse(text);
        } catch (err) {
          const normalized = `[${text.trim().replace(/}\s*\n\s*{/g, "},{")}]`;
          data = JSON.parse(normalized);
        }
        const items = Array.isArray(data) ? data : [];
        const mapped = items
          .map((item) => {
            const record = item as RubricRecord;
            return {
              id: String(record.id ?? record["rubric-id"] ?? record[0] ?? ""),
              name: String(
                record.name ??
                  record["rubric-name"] ??
                  record["ru_rubric_names"] ??
                  record["rubric_names"] ??
                  record[1] ??
                  ""
              ),
            };
          })
          .filter((item) => item.id && item.name);
        setRubrics(mapped);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    writeLocalStorage(STORAGE_KEY, { tab, network, stations, bulkRows });
  }, [tab, network, stations, bulkRows]);

  const syncBulkRowWithStation = (rows: BulkRowState[], station: StationState): BulkRowState[] => {
    const idx = rows.findIndex((row) => row.uid === station.uid);
    if (idx === -1) return rows;
    const nextRow: BulkRowState = {
      ...rows[idx],
      id: station.id,
      address: station.address,
      phone: station.phones[0]?.number || "",
      workingTime: station.workingTime,
      rubric: station.rubrics[0] || "",
      lon: station.lon,
      lat: station.lat,
      nameOther: station.nameOther,
    };
    return rows.map((row, i) => (i === idx ? nextRow : row));
  };

  const syncStationWithBulkRow = (list: StationState[], row: BulkRowState): StationState[] => {
    const idx = list.findIndex((station) => station.uid === row.uid);
    if (idx === -1) return list;
    const base = list[idx];
    const next: StationState = {
      ...base,
      id: row.id,
      address: row.address,
      workingTime: row.workingTime,
      nameOther: row.nameOther,
      lon: row.lon,
      lat: row.lat,
      rubrics: row.rubric ? [row.rubric] : [],
    };
    if (row.phone !== undefined) {
      const basePhone = base.phones[0] || { number: "", type: network.phoneType || "phone", ext: "", info: "" };
      next.phones = [{ ...basePhone, number: row.phone }];
    }
    return list.map((station, i) => (i === idx ? next : station));
  };

  const handleStationUpdate = (index: number, patch: Partial<StationState>) => {
    setStations((prev) => {
      const next = prev.map((station, i) => (i === index ? { ...station, ...patch } : station));
      const updated = next[index];
      setBulkRows((rows) => syncBulkRowWithStation(rows, updated));
      return next;
    });
  };

  const handleBulkRowUpdate = (index: number, patch: Partial<BulkRowState>) => {
    setBulkRows((prev) => {
      const next = prev.map((row, i) => (i === index ? { ...row, ...patch } : row));
      const updated = next[index];
      setStations((list) => syncStationWithBulkRow(list, updated));
      return next;
    });
  };

  const handleAddStation = () => {
    const station = DEFAULT_STATION();
    setStations((prev) => [...prev, station]);
    setBulkRows((prev) => [...prev, buildBulkRowFromStation(station)]);
  };

  const handleDuplicateStation = (index: number) => {
    setStations((prev) => {
      const clone: StationState = { ...prev[index], uid: createUid() };
      const next = [...prev.slice(0, index + 1), clone, ...prev.slice(index + 1)];
      setBulkRows((rows) => {
        const rowClone = buildBulkRowFromStation(clone);
        return [...rows.slice(0, index + 1), rowClone, ...rows.slice(index + 1)];
      });
      return next;
    });
  };

  const handleRemoveStation = (index: number) => {
    setStations((prev) => {
      const removed = prev[index];
      const next = prev.filter((_, i) => i !== index);
      setBulkRows((rows) => rows.filter((row) => row.uid !== removed.uid));
      return next.length ? next : [DEFAULT_STATION()];
    });
  };

  const handleAddBulkRow = () => {
    const row = DEFAULT_BULK_ROW();
    const station: StationState = {
      ...DEFAULT_STATION(),
      uid: row.uid,
      id: row.id,
      address: row.address,
      workingTime: row.workingTime,
      nameOther: row.nameOther,
      lon: row.lon,
      lat: row.lat,
      rubrics: row.rubric ? [row.rubric] : [],
      phones: row.phone
        ? [{ number: row.phone, type: network.phoneType || "phone", ext: "", info: "" }]
        : DEFAULT_STATION().phones,
    };
    setBulkRows((prev) => [...prev, row]);
    setStations((prev) => [...prev, station]);
  };

  const handleDuplicateBulkRow = (index: number) => {
    setBulkRows((prev) => {
      const clone: BulkRowState = { ...prev[index], uid: createUid() };
      const next = [...prev.slice(0, index + 1), clone, ...prev.slice(index + 1)];
      setStations((list) => {
        const base = list[index] || DEFAULT_STATION();
        const stationClone: StationState = {
          ...base,
          uid: clone.uid,
          id: clone.id,
          address: clone.address,
          workingTime: clone.workingTime,
          nameOther: clone.nameOther,
          lon: clone.lon,
          lat: clone.lat,
          rubrics: clone.rubric ? [clone.rubric] : [],
          phones: clone.phone
            ? [{ number: clone.phone, type: network.phoneType || "phone", ext: "", info: "" }]
            : base.phones,
        };
        return [...list.slice(0, index + 1), stationClone, ...list.slice(index + 1)];
      });
      return next;
    });
  };

  const handleRemoveBulkRow = (index: number) => {
    setBulkRows((prev) => {
      const removed = prev[index];
      const next = prev.filter((_, i) => i !== index);
      setStations((list) => list.filter((station) => station.uid !== removed.uid));
      return next.length ? next : [DEFAULT_BULK_ROW()];
    });
  };

  const handleGenerate = () => {
    const localWarnings: string[] = [];
    const networkErrors = validateNetwork(network, localWarnings);
    const stationErrors: string[] = [];
    const stationWarnings: string[] = [];

    const sourceStations = tab === "bulk" ? mergeBulkRows(bulkRows, stations, network) : stations;
    sourceStations.forEach((station) => {
      const { errors: stErrors, warnings: stWarnings } = validateStation(station, network);
      stationErrors.push(...stErrors.map((item) => `${station.id || "station"}: ${item}`));
      stationWarnings.push(...stWarnings.map((item) => `${station.id || "station"}: ${item}`));
    });

    const allErrors = [...networkErrors, ...stationErrors];
    const allWarnings = [...localWarnings, ...stationWarnings];
    setErrors(allErrors);
    setWarnings(allWarnings);

    if (allErrors.length) {
      setXmlOutput("");
      return;
    }

    const xmlCompanies = sourceStations.map((station) => buildCompanyXml(station, network)).join("\n");
    const xml = buildXml(xmlCompanies);
    setXmlOutput(xml);
    setShowExportModal(true);
  };

  const handleDownload = () => {
    if (!xmlOutput) return;
    const blob = new Blob([xmlOutput], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "yandex-branches.xml";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "application/xml");
        const companies = Array.from(doc.querySelectorAll("company"));
        if (!companies.length) return;
        const parsed = companies.map((company) => withUid(parseCompany(company)));
        const first = parsed[0];
        setNetwork((prev) => ({
          ...prev,
          name: first.name || prev.name,
          shortname: first.shortname || prev.shortname,
          country: readTextByLang(companies[0], "country") || prev.country,
          rubric: first.rubrics[0] || prev.rubric,
          actualization: readText(companies[0], "actualization-date") || prev.actualization,
        }));
        setStations(parsed);
        setBulkRows(parsed.map(buildBulkRowFromStation));
        setTab("single");
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const handleImportText = (value: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(value, "application/xml");
      const companies = Array.from(doc.querySelectorAll("company"));
      if (!companies.length) return;
      const parsed = companies.map((company) => withUid(parseCompany(company)));
      const first = parsed[0];
      setNetwork((prev) => ({
        ...prev,
        name: first.name || prev.name,
        shortname: first.shortname || prev.shortname,
        country: readTextByLang(companies[0], "country") || prev.country,
        rubric: first.rubrics[0] || prev.rubric,
        actualization: readText(companies[0], "actualization-date") || prev.actualization,
      }));
      setStations(parsed);
      setBulkRows(parsed.map(buildBulkRowFromStation));
      setTab("single");
      setShowImportModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const insertMock = () => {
    const today = new Date();
    const actualization = today.toISOString().slice(0, 10).split("-").reverse().join(".");
    const mockStations: StationState[] = [
      {
        uid: createUid(),
        id: "ORTK_0001",
        nameOther: "АЗС №1",
        address: "ул. Такая-то, д. 3",
        locality: "",
        addressAdd: "ТЦ, этаж, вход.",
        workingTime: "ежедн. 00:00-24:00",
        scheduled: "01.07.2026 12:50-13:40",
        rubrics: ["184105274"],
        lon: "37.286438",
        lat: "55.670312",
        phones: [
          { number: "+7 (999) 888-77-66", type: "phone", info: "касса", ext: "" },
          { number: "+7 (999) 777-66-55", type: "phone", info: "", ext: "" },
        ],
        email: "info@ortk.ru",
        url: "https://ortk.ru",
        addUrl: "https://ortk.ru/social",
        infoPage: "https://ortk.ru/stations/ortk_0001",
        galleryUrl: "https://ortk.ru/stations/ortk_0001/gallery",
        photos: [
          { url: "https://ortk.ru/assets/ortk_0001_1.jpg", alt: "Фасад", type: "", tag: "EXTERIOR" },
          {
            url: "https://ortk.ru/assets/ortk_0001_2.jpg",
            alt: "Магазин",
            type: "interior",
            tag: "INTERIOR",
          },
        ],
      },
      {
        uid: createUid(),
        id: "ORTK_0002",
        nameOther: "АЗС №2",
        address: "ул. Другая, д. 15",
        locality: "",
        addressAdd: "",
        workingTime: "ежедн. 06:00-23:00",
        scheduled: "01.01.2026 10:00-22:00; 02.01.2026 10:00-22:00",
        rubrics: ["184105274"],
        lon: "37.290100",
        lat: "55.674900",
        phones: [
          { number: "+7 (999) 555-44-33", type: "phone", info: "", ext: "" },
          { number: "+7 (999) 222-11-00", type: "phone", info: "", ext: "" },
        ],
        email: "info@ortk.ru",
        url: "https://ortk.ru",
        addUrl: "",
        infoPage: "https://ortk.ru/stations/ortk_0002",
        galleryUrl: "https://ortk.ru/stations/ortk_0002/gallery",
        photos: [
          { url: "https://ortk.ru/assets/ortk_0002_1.jpg", alt: "", type: "", tag: "ENTER" },
          { url: "https://ortk.ru/assets/ortk_0002_2.jpg", alt: "", type: "", tag: "SERVICES" },
        ],
      },
    ].map(withUid);
    setNetwork({
      name: "ортк",
      shortname: "ортк",
      country: "Россия",
      rubric: "184105274",
      actualization,
      phoneType: "phone",
    });
    setStations(mockStations);
    setBulkRows(mockStations.map(buildBulkRowFromStation));
    setTab("single");
  };

  return (
    <div className="page">
      <Header />
      <Tabs tab={tab} onTabChange={setTab} onInsertMock={insertMock} />
      <NetworkForm network={network} onChange={setNetwork} rubrics={rubrics} />

      {tab === "single" && (
        <div className="card">
          <h2>Станции — все поля</h2>
          {stations.map((station, index) => (
            <StationCard
              key={station.uid || `${station.id}-${index}`}
              station={station}
              rubrics={rubrics}
              networkRubric={network.rubric}
              onUpdate={(patch) => handleStationUpdate(index, patch)}
              onRemove={() => handleRemoveStation(index)}
              onDuplicate={() => handleDuplicateStation(index)}
            />
          ))}
          <button className="ghost" type="button" onClick={handleAddStation}>
            Добавить станцию
          </button>
        </div>
      )}

      {tab === "bulk" && (
        <BulkTable
          rows={bulkRows}
          rubrics={rubrics}
          onRowChange={(index, patch) => handleBulkRowUpdate(index, patch)}
          onAddRow={handleAddBulkRow}
          onDuplicateRow={handleDuplicateBulkRow}
          onRemoveRow={handleRemoveBulkRow}
        />
      )}

      <ExportPanel
        onGenerate={handleGenerate}
        onDownload={handleDownload}
        onImportClick={() => setShowImportModal(true)}
        errors={errors}
        warnings={warnings}
        xmlOutput={xmlOutput}
      />

      <Modal title="Импорт XML" open={showImportModal} onClose={() => setShowImportModal(false)}>
        <p className="field-hint">Вставьте XML-код или загрузите файл.</p>
        <textarea
          placeholder={'<?xml version="1.0" ...'}
          onBlur={(event) => {
            if (event.target.value.trim()) {
              handleImportText(event.target.value);
            }
          }}
        />
        <label className="secondary">
          Загрузить XML файл
          <input
            type="file"
            accept=".xml"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleImport(e.target.files[0]);
                setShowImportModal(false);
              }
            }}
            style={{ display: "none" }}
          />
        </label>
      </Modal>

      <Modal title="XML-файл" open={showExportModal} onClose={() => setShowExportModal(false)}>
        <textarea value={xmlOutput} readOnly />
        <button className="primary" onClick={handleDownload}>
          Скачать XML
        </button>
      </Modal>
    </div>
  );
};

export default App;
