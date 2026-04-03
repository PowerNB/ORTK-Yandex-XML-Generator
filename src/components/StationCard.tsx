import type { StationState, Rubric } from "../types";
import RubricTagPicker from "./RubricTagPicker";
import PhonesBlock from "./PhonesBlock";
import PhotosBlock from "./PhotosBlock";
import { DEFAULT_PHONE, DEFAULT_PHOTO } from "../utils/constants";
import { ensureHttp } from "../utils/helpers";

type Props = {
  station: StationState;
  rubrics: Rubric[];
  networkRubric?: string;
  onUpdate: (patch: Partial<StationState>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
};

const StationCard = ({ station, rubrics, networkRubric, onUpdate, onRemove, onDuplicate }: Props) => {
  const updatePhones = (phoneIndex: number, next: StationState["phones"][number] | null) => {
    if (phoneIndex === -1) {
      onUpdate({ phones: [...station.phones, next || DEFAULT_PHONE()] });
      return;
    }
    if (next === null) {
      onUpdate({ phones: station.phones.filter((_, i) => i !== phoneIndex) });
      return;
    }
    onUpdate({ phones: station.phones.map((phone, i) => (i === phoneIndex ? next : phone)) });
  };

  const updatePhotos = (photoIndex: number, next: StationState["photos"][number] | null) => {
    if (photoIndex === -1) {
      onUpdate({ photos: [...station.photos, next || DEFAULT_PHOTO()] });
      return;
    }
    if (next === null) {
      onUpdate({ photos: station.photos.filter((_, i) => i !== photoIndex) });
      return;
    }
    onUpdate({ photos: station.photos.map((photo, i) => (i === photoIndex ? next : photo)) });
  };

  return (
    <div className="card station-card">
      <div className="station-header">
        <strong>Станция</strong>
        <div className="station-actions">
          <button className="ghost small" type="button" onClick={onRemove}>
            Удалить станцию
          </button>
          <button className="ghost small" type="button" onClick={onDuplicate}>
            Дублировать
          </button>
        </div>
      </div>
      <div className="grid">
        <label>
          <span className="label-title"><strong>Уникальный ID станции (company-id) *</strong></span>
          <input type="text" value={station.id} onChange={(event) => onUpdate({ id: event.target.value })} />
          <span className="field-hint">ID филиала, неизменный во всех файлах.</span>
        </label>
        <label>
          <span className="label-title">Альтернативное название (name-other)</span>
          <input type="text" value={station.nameOther} onChange={(event) => onUpdate({ nameOther: event.target.value })} />
          <span className="field-hint">Например, АЗС №1.</span>
        </label>
        <label>
          <span className="label-title"><strong>Адрес (address) *</strong></span>
          <input
            type="text"
            value={station.address}
            onChange={(event) => onUpdate({ address: event.target.value })}
            placeholder="Город, улица, дом"
          />
          <span className="field-hint">Укажите полный адрес одной строкой с городом/населённым пунктом.</span>
        </label>
        <label>
          <span className="label-title">Дополнение к адресу (address-add)</span>
          <input type="text" value={station.addressAdd} onChange={(event) => onUpdate({ addressAdd: event.target.value })} />
          <span className="field-hint">Например, вход со двора.</span>
        </label>
        <label>
          <span className="label-title"><strong>Время работы (working-time) *</strong></span>
          <input type="text" value={station.workingTime} onChange={(event) => onUpdate({ workingTime: event.target.value })} placeholder="ежедн. 00:00-24:00" />
          <span className="field-hint">Общий график без выходных. Пример: ежедн. 11:30-21:30 перерыв 14:00-14:30.</span>
        </label>
        <label>
          <span className="label-title">Праздничный график (scheduled-working-time)</span>
          <input type="text" value={station.scheduled} onChange={(event) => onUpdate({ scheduled: event.target.value })} placeholder="01.01.2026 10:00-22:00" />
          <span className="field-hint">Для праздничных дат. Формат: ДД.ММ.ГГГГ 10:00-22:00 (перерыв 14:00-14:30). Несколько дат — через ; или с новой строки.</span>
        </label>
        <label>
          <span className="label-title"><strong>Рубрика (rubric-id) *</strong></span>
          <RubricTagPicker
            rubrics={rubrics}
            selected={station.rubrics}
            networkRubric={networkRubric}
            onChange={(next) => onUpdate({ rubrics: next })}
          />
          <span className="field-hint">До 3 рубрик. Хотя бы одна должна совпадать с рубрикой сети.</span>
        </label>
        <label>
          <span className="label-title">Email</span>
          <input type="email" value={station.email} onChange={(event) => onUpdate({ email: event.target.value })} />
        </label>
        <label>
          <span className="label-title">Сайт (url)</span>
          <input type="text" value={station.url} onChange={(event) => onUpdate({ url: event.target.value })} onBlur={(event) => onUpdate({ url: ensureHttp(event.target.value) })} />
        </label>
        <label>
          <span className="label-title">Доп. сайт (add-url)</span>
          <input type="text" value={station.addUrl} onChange={(event) => onUpdate({ addUrl: event.target.value })} onBlur={(event) => onUpdate({ addUrl: ensureHttp(event.target.value) })} />
        </label>
        <label>
          <span className="label-title">Страница объекта (info-page)</span>
          <input type="text" value={station.infoPage} onChange={(event) => onUpdate({ infoPage: event.target.value })} onBlur={(event) => onUpdate({ infoPage: ensureHttp(event.target.value) })} />
        </label>
        <label>
          <span className="label-title">Долгота (lon)</span>
          <input type="text" value={station.lon} onChange={(event) => onUpdate({ lon: event.target.value })} />
          <span className="field-hint">Точка как разделитель.</span>
        </label>
        <label>
          <span className="label-title">Широта (lat)</span>
          <input type="text" value={station.lat} onChange={(event) => onUpdate({ lat: event.target.value })} />
          <span className="field-hint">Точка как разделитель.</span>
        </label>
      </div>

      <PhonesBlock phones={station.phones} onChange={updatePhones} />
      <PhotosBlock
        galleryUrl={station.galleryUrl}
        photos={station.photos}
        onGalleryChange={(value) => onUpdate({ galleryUrl: value })}
        onPhotoChange={updatePhotos}
      />
    </div>
  );
};

export default StationCard;
