import type { StationState, Rubric } from "../../../types";
import { formatPhoneRu, resolveRubricInput } from "../../../utils/helpers";

type Props = {
  stations: StationState[];
  rubrics: Rubric[];
  onStationUpdate: (index: number, patch: Partial<StationState>) => void;
  onAddStation: () => void;
  onDuplicateStation: (index: number) => void;
  onRemoveStation: (index: number) => void;
};

const BulkTable = ({ stations, rubrics, onStationUpdate, onAddStation, onDuplicateStation, onRemoveStation }: Props) => (
  <div className="card">
    <h2>Основные поля по всем станциям</h2>
    <p className="hint">
      Минимально нужны: company-id, address, phone, working-time, rubric-id (можно оставить пустым —
      возьмётся из настроек сети).
    </p>
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th><strong>company-id *</strong></th>
            <th><strong>address *</strong></th>
            <th><strong>phone *</strong></th>
            <th><strong>working-time *</strong><span className="field-hint">Пример: ежедн. 11:30-21:30.</span></th>
            <th><strong>rubric-id *</strong></th>
            <th>lon</th>
            <th>lat</th>
            <th>name-other</th>
            <th>копировать</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {stations.map((station, index) => {
            const phone = station.phones[0]?.number || "";
            const rubric = station.rubrics[0] || "";
            return (
              <tr key={station.uid || index}>
                <td><input value={station.id} onChange={(e) => onStationUpdate(index, { id: e.target.value })} /></td>
                <td><input value={station.address} onChange={(e) => onStationUpdate(index, { address: e.target.value })} /></td>
                <td>
                  <input
                    value={phone}
                    onChange={(e) => {
                      const base = station.phones[0] || { number: "", type: "phone", ext: "", info: "" };
                      onStationUpdate(index, { phones: [{ ...base, number: e.target.value }] });
                    }}
                    onBlur={(e) => {
                      const base = station.phones[0] || { number: "", type: "phone", ext: "", info: "" };
                      onStationUpdate(index, { phones: [{ ...base, number: formatPhoneRu(e.target.value) }] });
                    }}
                  />
                </td>
                <td><input value={station.workingTime} onChange={(e) => onStationUpdate(index, { workingTime: e.target.value })} /></td>
                <td>
                  <input
                    value={rubric}
                    onChange={(e) => {
                      const resolved = resolveRubricInput(e.target.value, rubrics);
                      onStationUpdate(index, { rubrics: resolved ? [resolved, ...station.rubrics.slice(1)] : station.rubrics.slice(1) });
                    }}
                  />
                </td>
                <td><input value={station.lon} onChange={(e) => onStationUpdate(index, { lon: e.target.value })} /></td>
                <td><input value={station.lat} onChange={(e) => onStationUpdate(index, { lat: e.target.value })} /></td>
                <td><input value={station.nameOther} onChange={(e) => onStationUpdate(index, { nameOther: e.target.value })} /></td>
                <td>
                  <button className="ghost small" type="button" onClick={() => onDuplicateStation(index)}>
                    ⧉
                  </button>
                </td>
                <td>
                  <button className="ghost small" type="button" onClick={() => onRemoveStation(index)}>
                    ×
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    <button className="ghost" type="button" onClick={onAddStation}>
      Добавить строку
    </button>
  </div>
);

export default BulkTable;
