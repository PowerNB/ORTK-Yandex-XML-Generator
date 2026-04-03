import type { Phone } from "../types";
import { DEFAULT_PHONE } from "../utils/constants";
import { formatPhoneRu } from "../utils/helpers";
import { validatePhone, validateExt } from "../utils/validation";

type Props = {
  phones: Phone[];
  onChange: (index: number, next: Phone | null) => void;
};

const PhonesBlock = ({ phones, onChange }: Props) => (
  <div className="block">
    <strong>Телефоны *</strong>
    <p className="field-hint">Формат: +7 (343) 375-13-99. Тип: phone — телефон, fax — факс, phone-fax — оба. Доб. номер — только цифры.</p>
    <div className="stack">
      {phones.map((phone, phoneIndex) => {
        const phoneErrors: string[] = [];
        const extErrors: string[] = [];
        if (phone.number) validatePhone(phone.number, phoneErrors, "");
        if (phone.ext) validateExt(phone.ext, extErrors);
        return (
        <div className="phone-row" key={phoneIndex}>
          <div className="phone-input-wrap">
          <input
            type="text"
            value={phone.number}
            placeholder="+7 (___) ___-__-__"
            className={phoneErrors.length ? "input-error" : ""}
            onChange={(event) => onChange(phoneIndex, { ...phone, number: event.target.value })}
            onBlur={(event) => onChange(phoneIndex, { ...phone, number: formatPhoneRu(event.target.value) })}
          />
          {phoneErrors.length > 0 && <span className="inline-error">Формат: +7 (999) 888-77-66</span>}
          </div>
          <select
            value={phone.type}
            onChange={(event) => onChange(phoneIndex, { ...phone, type: event.target.value })}
          >
            <option value="phone">phone</option>
            <option value="fax">fax</option>
            <option value="phone-fax">phone-fax</option>
          </select>
          <input
            type="text"
            value={phone.ext}
            placeholder="доб."
            onChange={(event) => onChange(phoneIndex, { ...phone, ext: event.target.value })}
          />
          <input
            type="text"
            value={phone.info}
            placeholder="Пример: касса"
            onChange={(event) => onChange(phoneIndex, { ...phone, info: event.target.value })}
          />
          <button className="ghost small" type="button" onClick={() => onChange(phoneIndex, null)}>
            ×
          </button>
        </div>
        );
      })}
    </div>
    <button className="ghost" type="button" onClick={() => onChange(-1, DEFAULT_PHONE())}>
      Добавить телефон
    </button>
  </div>
);

export default PhonesBlock;
