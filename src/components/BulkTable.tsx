import type { BulkRowState, Rubric } from "../types";
import { formatPhoneRu, resolveRubricInput } from "../utils/helpers";

type Props = {
  rows: BulkRowState[];
  rubrics: Rubric[];
  onRowChange: (index: number, patch: Partial<BulkRowState>) => void;
  onAddRow: () => void;
  onDuplicateRow: (index: number) => void;
  onRemoveRow: (index: number) => void;
};

const BulkTable = ({ rows, rubrics, onRowChange, onAddRow, onDuplicateRow, onRemoveRow }: Props) => (
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
          {rows.map((row, index) => (
            <tr key={index}>
              <td><input value={row.id} onChange={(e) => onRowChange(index, { id: e.target.value })} /></td>
              <td><input value={row.address} onChange={(e) => onRowChange(index, { address: e.target.value })} /></td>
              <td>
                <input
                  value={row.phone}
                  onChange={(e) => onRowChange(index, { phone: e.target.value })}
                  onBlur={(e) => onRowChange(index, { phone: formatPhoneRu(e.target.value) })}
                />
              </td>
              <td><input value={row.workingTime} onChange={(e) => onRowChange(index, { workingTime: e.target.value })} /></td>
              <td><input value={row.rubric} onChange={(e) => onRowChange(index, { rubric: resolveRubricInput(e.target.value, rubrics) })} /></td>
              <td><input value={row.lon} onChange={(e) => onRowChange(index, { lon: e.target.value })} /></td>
              <td><input value={row.lat} onChange={(e) => onRowChange(index, { lat: e.target.value })} /></td>
              <td><input value={row.nameOther} onChange={(e) => onRowChange(index, { nameOther: e.target.value })} /></td>
              <td>
                <button className="ghost small" type="button" onClick={() => onDuplicateRow(index)}>
                  ⧉
                </button>
              </td>
              <td>
                <button className="ghost small" type="button" onClick={() => onRemoveRow(index)}>
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <button className="ghost" type="button" onClick={onAddRow}>
      Добавить строку
    </button>
  </div>
);

export default BulkTable;
