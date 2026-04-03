import type { NetworkState, Rubric } from "../../../types";
import RubricPicker from "../../ui/RubricPicker";

type Props = {
  network: NetworkState;
  onChange: (next: NetworkState) => void;
  rubrics: Rubric[];
};

const NetworkForm = ({ network, onChange, rubrics }: Props) => (
  <div className="card">
    <h2>Настройки сети</h2>
    <div className="grid">
      <label>
        <span className="label-title"><strong>Название сети (name) *</strong></span>
        <input
          type="text"
          value={network.name}
          onChange={(event) => onChange({ ...network, name: event.target.value })}
        />
        <span className="field-hint">Официальное название сети без кавычек и капслока. Одинаково для всех филиалов.</span>
      </label>
      <label>
        <span className="label-title"><strong>Короткое название (shortname) *</strong></span>
        <input
          type="text"
          value={network.shortname}
          onChange={(event) => onChange({ ...network, shortname: event.target.value })}
        />
        <span className="field-hint">Краткое название, отображаемое на картах. До 25 символов — рекомендация, максимум 55.</span>
      </label>
      <label>
        <span className="label-title"><strong>Страна (country) *</strong></span>
        <input
          type="text"
          value={network.country}
          onChange={(event) => onChange({ ...network, country: event.target.value })}
        />
        <span className="field-hint">Полное название страны. Пример: Россия.</span>
      </label>
      <label>
        <span className="label-title"><strong>Рубрика сети (rubric-id) *</strong></span>
        <RubricPicker
          value={network.rubric}
          rubrics={rubrics}
          placeholder="ID или название"
          onChange={(val) => onChange({ ...network, rubric: val })}
          onSelect={(val) => onChange({ ...network, rubric: val })}
        />
        <span className="field-hint">Рубрика сети по умолчанию. Применяется ко всем филиалам, у которых не выбрана своя рубрика. Хотя бы одна рубрика каждого филиала должна совпадать с этой.</span>
      </label>
      <label>
        <span className="label-title"><strong>Дата актуализации *</strong></span>
        <input
          type="date"
          value={network.actualization ? network.actualization.split(".").reverse().join("-") : ""}
          onChange={(event) => {
            const value = event.target.value;
            if (!value) return onChange({ ...network, actualization: "" });
            const [year, month, day] = value.split("-");
            onChange({ ...network, actualization: `${day}.${month}.${year}` });
          }}
        />
        <span className="field-hint">Дата последнего обновления данных в формате ДД.ММ.ГГГГ. Яндекс учитывает её при модерации.</span>
      </label>
      <label>
        <span className="label-title"><strong>Тип телефона по умолчанию</strong></span>
        <select
          value={network.phoneType}
          onChange={(event) => onChange({ ...network, phoneType: event.target.value })}
        >
          <option value="phone">phone</option>
          <option value="fax">fax</option>
          <option value="phone-fax">phone-fax</option>
        </select>
        <span className="field-hint">Тип по умолчанию для телефонов в режиме быстрого ввода (bulk). Можно переопределить для каждого телефона отдельно.</span>
      </label>
    </div>
  </div>
);

export default NetworkForm;
