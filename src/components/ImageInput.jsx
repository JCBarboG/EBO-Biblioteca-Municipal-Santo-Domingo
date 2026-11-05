import { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n/translations';
import Icon from './Icons';

const MAX_IMAGES = 3;

export default function ImageInput({
  images,
  currentIndex,
  onImageAdded,
  onNavigate,
  onRotate,
  onClear,
  onExtract,
  isBusy,
  orientationWarning,
}) {
  const { lang, cameraEnabled } = useApp();
  const t = useT(lang);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const canAddMore = images.length < MAX_IMAGES;
  const hasImages = images.length > 0;
  const currentImage = images[currentIndex];

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) onImageAdded(file);
    e.target.value = '';
  };

  return (
    <div className={`image-input${hasImages ? ' image-input--has' : ''}`}>
      <div className="gallery-container">
        <div className="gallery-inner">
          <div className="gallery-image">
            {currentImage ? (
              <img src={currentImage.previewUrl} alt={`Imagen ${currentIndex + 1}`} />
            ) : (
              <div className="gallery-placeholder">
                <PlaceholderGlyph />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="image-input__controls">
        <div className="image-input__meta">
          <span className="image-input__counter">
            {t.ui.imageCounter(hasImages ? currentIndex + 1 : 0, MAX_IMAGES)}
          </span>
          <div className="gallery-dots">
            {[0, 1, 2].map((i) => {
              let cls = 'dot';
              if (i === currentIndex && i < images.length) cls += ' dot--active';
              else if (i < images.length) cls += ' dot--used';
              return (
                <div
                  key={i}
                  className={cls}
                  onClick={() => i < images.length && onNavigate(i)}
                />
              );
            })}
          </div>
        </div>

        <div className="image-input__nav">
          <button
            type="button"
            className="nav-btn"
            aria-label="Imagen anterior"
            onClick={() => onNavigate(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            <Icon name="chevronLeft" size={15} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="nav-btn"
            aria-label="Imagen siguiente"
            onClick={() => onNavigate(currentIndex + 1)}
            disabled={currentIndex >= images.length - 1}
          >
            <Icon name="chevronRight" size={15} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="nav-btn rotate-btn"
            aria-label="Rotar 90°"
            onClick={onRotate}
            disabled={isBusy || !currentImage}
          >
            <Icon name="rotate" size={16} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            className="btn btn--ghost image-input__clear"
            onClick={onClear}
            disabled={!hasImages || isBusy}
          >
            {t.step01.clear}
          </button>
        </div>

        <div className="btn-row">
          {cameraEnabled && (
            <button
              type="button"
              className="btn btn--outline"
              onClick={() => cameraInputRef.current?.click()}
              disabled={!canAddMore || isBusy}
            >
              {t.step01.takePhoto}
            </button>
          )}
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={!canAddMore || isBusy}
          >
            {t.step01.upload}
          </button>
        </div>

        <div className="btn-row">
          <button
            type="button"
            className="btn btn--primary"
            onClick={onExtract}
            disabled={!hasImages || isBusy}
          >
            {t.step01.extract}
          </button>
        </div>
      </div>

      {orientationWarning && (
        <p className="orientation-warning" role="alert">
          {orientationWarning}
        </p>
      )}

      <p className="image-hint">{t.step01.hint}</p>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        hidden
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        hidden
      />
    </div>
  );
}

function PlaceholderGlyph() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="19" cy="17" r="4" />
      <path d="M6 38l10-12 7 8 5-6 14 10" />
      <rect x="3" y="6" width="42" height="36" rx="3" />
    </svg>
  );
}
