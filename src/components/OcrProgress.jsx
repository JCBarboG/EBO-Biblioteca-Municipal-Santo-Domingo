export default function OcrProgress({ statusLabel, progress }) {
  const percent = Math.round(progress * 100);
  return (
    <div className="ocr-progress" role="status" aria-live="polite">
      <div className="ocr-progress__bar-track">
        <div className="ocr-progress__bar-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="ocr-progress__label">
        {statusLabel || 'Procesando…'} {percent > 0 ? `${percent}%` : ''}
      </p>
    </div>
  );
}
