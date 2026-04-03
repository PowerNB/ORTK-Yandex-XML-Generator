import type { Photo } from "../../../types";
import { DEFAULT_PHOTO, VALID_PHOTO_TAGS } from "../../../const";
import { ensureHttp } from "../../../utils/helpers";

type Props = {
  galleryUrl: string;
  photos: Photo[];
  onGalleryChange: (value: string) => void;
  onPhotoChange: (index: number, next: Photo | null) => void;
};

const PhotosBlock = ({ galleryUrl, photos, onGalleryChange, onPhotoChange }: Props) => (
  <div className="block">
    <strong>Фотографии</strong>
    <p className="field-hint">
      URL фото должен быть постоянным и публично доступным. alt — текстовое описание фото.
      type: «interior» только для интерьерных снимков. tag — категория фото.
    </p>
    <label>
      <span className="label-title">Галерея (gallery-url)</span>
      <input
        type="text"
        value={galleryUrl}
        onChange={(event) => onGalleryChange(event.target.value)}
        onBlur={(event) => onGalleryChange(ensureHttp(event.target.value))}
      />
      <span className="field-hint">Ссылка на галерею объекта на внешнем ресурсе.</span>
    </label>
    {photos.length > 0 && (
      <p className="field-hint" style={{ marginTop: 12 }}>
        Для каждого фото: <strong>URL</strong> — прямая ссылка на изображение; <strong>Описание</strong> — текстовый alt; <strong>type</strong> — укажите «interior» только для фото интерьера; <strong>tag</strong> — категория (EXTERIOR, INTERIOR, ENTER, LOGO и др.).
      </p>
    )}
    <div className="stack">
      {photos.map((photo, photoIndex) => (
        <div className="photo-row" key={photoIndex}>
          <input
            type="text"
            value={photo.url}
            placeholder="https://..."
            onChange={(event) => onPhotoChange(photoIndex, { ...photo, url: event.target.value })}
            onBlur={(event) => onPhotoChange(photoIndex, { ...photo, url: ensureHttp(event.target.value) })}
          />
          <input
            type="text"
            value={photo.alt}
            placeholder="Описание фото"
            onChange={(event) => onPhotoChange(photoIndex, { ...photo, alt: event.target.value })}
          />
          <select
            value={photo.type}
            onChange={(event) => onPhotoChange(photoIndex, { ...photo, type: event.target.value })}
          >
            <option value="">type</option>
            <option value="interior">interior</option>
          </select>
          <select
            value={photo.tag}
            onChange={(event) => onPhotoChange(photoIndex, { ...photo, tag: event.target.value })}
          >
            <option value="">tag</option>
            {VALID_PHOTO_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          <button className="ghost small" type="button" onClick={() => onPhotoChange(photoIndex, null)}>
            ×
          </button>
        </div>
      ))}
    </div>
    <button className="ghost" type="button" onClick={() => onPhotoChange(-1, DEFAULT_PHOTO())}>
      Добавить фото
    </button>
  </div>
);

export default PhotosBlock;
