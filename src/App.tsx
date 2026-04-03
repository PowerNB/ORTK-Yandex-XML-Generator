import Header from "./components/Header";
import Tabs from "./components/Tabs";
import NetworkForm from "./components/network/NetworkForm";
import StationCard from "./components/station/StationCard";
import BulkTable from "./components/bulk/BulkTable";
import ExportPanel from "./components/ExportPanel";
import Modal from "./components/Modal";
import { DEFAULT_STATION, createUid } from "./const";
import { buildCompanyXml, buildXml } from "./services/xml";
import { validateNetwork, validateStation } from "./utils/validation";
import { readText, readTextByLang, parseCompany } from "./services/xml";
import { readLocalStorage, writeLocalStorage } from "./hooks/useStorage";
import type { NetworkState, StationState, Rubric } from "./types";
import { useEffect, useState } from "react";

const STORAGE_KEY = "ortk-xml-state-v1";

type RubricRecord = Record<string | number, unknown>;

type StoredState = {
  tab?: string;
  network?: NetworkState;
  stations?: StationState[];
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
    writeLocalStorage(STORAGE_KEY, { tab, network, stations });
  }, [tab, network, stations]);

  const handleStationUpdate = (index: number, patch: Partial<StationState>) => {
    setStations((prev) => prev.map((station, i) => (i === index ? { ...station, ...patch } : station)));
  };

  const handleAddStation = () => {
    setStations((prev) => [...prev, DEFAULT_STATION()]);
  };

  const handleDuplicateStation = (index: number) => {
    setStations((prev) => {
      const clone: StationState = { ...prev[index], uid: createUid() };
      return [...prev.slice(0, index + 1), clone, ...prev.slice(index + 1)];
    });
  };

  const handleRemoveStation = (index: number) => {
    setStations((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [DEFAULT_STATION()];
    });
  };

  const handleGenerate = () => {
    const localWarnings: string[] = [];
    const networkErrors = validateNetwork(network, localWarnings);
    const stationErrors: string[] = [];
    const stationWarnings: string[] = [];

    stations.forEach((station) => {
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

    const xmlCompanies = stations.map((station) => buildCompanyXml(station, network)).join("\n");
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
        fuels: [],
        services: [],
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
        fuels: [],
        services: [],
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
          stations={stations}
          rubrics={rubrics}
          onStationUpdate={handleStationUpdate}
          onAddStation={handleAddStation}
          onDuplicateStation={handleDuplicateStation}
          onRemoveStation={handleRemoveStation}
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
