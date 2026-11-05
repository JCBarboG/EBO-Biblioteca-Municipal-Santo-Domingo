import { useDeferredValue, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLibraryT } from '../i18n/library';
import {
  findDuplicates, joinImprint, splitImprint, suggestClassification, suggest,
} from '../utils/catalog';
import { lookupIsbn } from '../utils/isbnLookup';
import { DEFAULT_LANGUAGE } from '../constants/docTypes';
import SuggestInput from './SuggestInput';
import BarcodeScanner from './BarcodeScanner';
import Icon from './Icons';

const MAX_TITLE_MATCHES = 4;

// Ayudas de catalogación de la biblioteca: duplicados, clasificación sugerida,
// constructores de campos, notas y búsqueda de ISBN. Trabaja sobre `fields` y
// no toca la tabla salvo por las acciones de App.jsx.
export default function CatalogAssistant({
  fields, onFieldChange, onMergeFields, index, status, tableRecords, ignoredRecord,
  columnKeys, onAddCopy, onUseData, onDuplicateLast, canDuplicate, showToast,
}) {
  const { lang, docType, cameraEnabled } = useApp();
  const tl = useLibraryT(lang);
  const [builder, setBuilder] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [looking, setLooking] = useState(false);

  const deferred = useDeferredValue(fields);
  const duplicates = useMemo(
    () => findDuplicates(index, deferred, tableRecords, docType).filter((d) => d.rec !== ignoredRecord),
    [index, deferred, tableRecords, docType, ignoredRecord],
  );
  const classification = useMemo(() => suggestClassification(index, deferred), [index, deferred]);

  const strong = duplicates.filter((d) => d.reason !== 'titulo');
  const titleOnly = duplicates.filter((d) => d.reason === 'titulo');
  const shown = [...strong, ...titleOnly.slice(0, MAX_TITLE_MATCHES)];
  const hidden = duplicates.length - shown.length;

  const handleLookup = async () => {
    if (!String(fields.isbn || '').trim()) { showToast(tl.lookupNeedIsbn); return; }
    setLooking(true);
    try {
      const book = await lookupIsbn(fields.isbn);
      if (!book) { showToast(tl.lookupNone); return; }
      const fill = {};
      Object.entries(book).forEach(([key, val]) => {
        if (!val || !columnKeys.includes(key)) return;
        const current = String(fields[key] || '').trim();
        if (!current || (key === 'idioma' && current === DEFAULT_LANGUAGE)) fill[key] = val;
      });
      if (fill.idioma === DEFAULT_LANGUAGE) delete fill.idioma;
      const count = Object.keys(fill).length;
      if (count) onMergeFields(fill);
      showToast(count ? tl.lookupDone(count) : tl.lookupNothingNew);
    } catch {
      showToast(tl.lookupOffline);
    } finally {
      setLooking(false);
    }
  };

  const handleScanned = (code) => {
    setScanning(false);
    onFieldChange('isbn', code);
    showToast(tl.scanFound(code));
  };

  const addNote = (phrase) => {
    const current = String(fields.nota || '').trim();
    onFieldChange('nota', current ? `${current} / ${phrase}` : phrase);
    document.getElementById('field-nota')?.focus();
  };

  const toggleBuilder = (name) => setBuilder((b) => (b === name ? null : name));
  const canScan = cameraEnabled && Boolean(navigator.mediaDevices?.getUserMedia);

  return (
    <div className="assistant">
      {status === 'loading' && <p className="assistant__status">{tl.loading}</p>}
      {status === 'error' && <p className="assistant__status assistant__status--error">{tl.loadError}</p>}

      <div className="assistant__tools" role="toolbar" aria-label={tl.guideTitle}>
        <button type="button" className="assistant__tool" onClick={onDuplicateLast} disabled={!canDuplicate}>
          <Icon name="copy" size={15} />{tl.duplicateLast}
        </button>
        <button type="button" className="assistant__tool" aria-expanded={builder === 'desc'} onClick={() => toggleBuilder('desc')}>
          <Icon name="pencil" size={15} />{tl.builderDesc}
        </button>
        <button type="button" className="assistant__tool" aria-expanded={builder === 'imprint'} onClick={() => toggleBuilder('imprint')}>
          <Icon name="pencil" size={15} />{tl.builderImprint}
        </button>
        {canScan && (
          <button type="button" className="assistant__tool" onClick={() => setScanning(true)}>
            <Icon name="barcode" size={15} />{tl.scan}
          </button>
        )}
        <button type="button" className="assistant__tool" onClick={handleLookup} disabled={looking} title={tl.lookupHint}>
          <Icon name="search" size={15} />{looking ? tl.lookupBusy : tl.lookupIsbn}
        </button>
      </div>

      {builder === 'desc' && (
        <DescriptionBuilder
          tl={tl}
          onApply={(v) => { onFieldChange('descFisica', v); setBuilder(null); }}
        />
      )}
      {builder === 'imprint' && (
        <ImprintBuilder
          key={fields.lugarEditorial || 'vacio'}
          tl={tl}
          index={index}
          initial={fields.lugarEditorial}
          year={fields.anioEdicion}
          onApply={(v) => { onFieldChange('lugarEditorial', v); setBuilder(null); }}
        />
      )}

      {shown.length > 0 && (
        <section className={`assistant__dup${strong.length ? ' assistant__dup--strong' : ''}`} aria-live="polite">
          <h3 className="assistant__title"><Icon name="alert" size={15} />{tl.dupTitle}</h3>
          <ul className="assistant__list">
            {shown.map((d) => (
              <DuplicateRow key={d.rec.id || d.rec.registroId || d.rec.titulo + d.rec.numeroRevista} dup={d} tl={tl} canAddCopy={docType !== 'revista' || d.reason !== 'titulo'} onAddCopy={onAddCopy} onUseData={onUseData} />
            ))}
          </ul>
          {hidden > 0 && <p className="assistant__more">{tl.dupMore(hidden)}</p>}
        </section>
      )}

      {classification.options.length > 0 && !String(fields.clasificacion || '').trim() && (
        <section className="assistant__class">
          <h3 className="assistant__title">{tl.classTitle}</h3>
          <p className="assistant__hint">{tl.classHint}</p>
          <div className="assistant__chips">
            {classification.options.map((opt) => (
              <button key={opt.number} type="button" className="assistant__chip" onClick={() => onFieldChange('clasificacion', opt.value)}>
                <strong>{opt.value}</strong><span>{tl.classCount(opt.count)}</span>
              </button>
            ))}
          </div>
          <p className="assistant__hint">
            {classification.cutterSource === 'autor' && tl.cutterFromAuthor(classification.cutter)}
            {classification.cutterSource === 'apellido' && tl.cutterFromSurname(classification.cutter)}
            {!classification.cutterSource && tl.cutterMissing}
          </p>
        </section>
      )}

      {columnKeys.includes('nota') && (
        <div className="assistant__notes">
          <span className="assistant__label">{tl.notesTitle}</span>
          {tl.notePhrases.map((phrase) => (
            <button key={phrase} type="button" className="assistant__note" onClick={() => addNote(phrase)}>{phrase.trim()}</button>
          ))}
        </div>
      )}

      {scanning && <BarcodeScanner tl={tl} onDetected={handleScanned} onClose={() => setScanning(false)} showToast={showToast} />}
    </div>
  );
}

// `canAddCopy` es falso para otro fascículo de la misma revista: es otro número, no otro ejemplar.
export function DuplicateRow({ dup, tl, canAddCopy = true, onAddCopy, onUseData }) {
  const { rec, reason, source } = dup;
  const meta = [rec.clasificacion || tl.noClass, rec.anioEdicion, rec.numeroRevista, rec.ejemplares && tl.copies(rec.ejemplares)]
    .filter(Boolean).join(' · ');
  return (
    <li className="assistant__row">
      <div className="assistant__info">
        <span className="assistant__reason">{tl.dupReason[reason]} · {tl.dupSource[source]}</span>
        <span className="assistant__name">{rec.titulo}</span>
        {rec.autor && <span className="assistant__meta">{rec.autor}</span>}
        <span className="assistant__meta">{meta}</span>
      </div>
      <div className="assistant__actions">
        {canAddCopy && (
          <button type="button" className="btn btn--primary btn--sm" onClick={() => onAddCopy(dup)}>{tl.addCopy}</button>
        )}
        {source === 'catalogo' && (
          <button type="button" className="btn btn--outline btn--sm" onClick={() => onUseData(rec)}>{tl.useData}</button>
        )}
      </div>
    </li>
  );
}

function DescriptionBuilder({ tl, onApply }) {
  const d = tl.desc;
  const [pages, setPages] = useState('');
  const [volumes, setVolumes] = useState('');
  const [illustrated, setIllustrated] = useState(false);
  const [color, setColor] = useState(false);
  const [height, setHeight] = useState('');

  const extent = [volumes && `${volumes} volúmenes`, pages && `${pages} páginas`].filter(Boolean).join(', ');
  const art = illustrated || color ? `ilustraciones${color ? ' a color' : ''}` : '';
  const result = [extent, art, height && `${height} cm`].filter(Boolean).join('; ');

  return (
    <div className="assistant__builder">
      <label className="oc-label">{d.pages}
        <input className="oc-input" inputMode="numeric" value={pages} onChange={(e) => setPages(e.target.value.replace(/\D/g, ''))} />
      </label>
      <label className="oc-label">{d.volumes}
        <input className="oc-input" inputMode="numeric" value={volumes} onChange={(e) => setVolumes(e.target.value.replace(/\D/g, ''))} />
      </label>
      <label className="oc-label">{d.height}
        <input className="oc-input" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value.replace(/\D/g, ''))} />
      </label>
      <label className="assistant__check"><input type="checkbox" checked={illustrated} onChange={(e) => setIllustrated(e.target.checked)} />{d.illustrations}</label>
      <label className="assistant__check"><input type="checkbox" checked={color} onChange={(e) => setColor(e.target.checked)} />{d.color}</label>
      <p className="assistant__preview"><span>{d.preview}:</span> {result || '—'}</p>
      <button type="button" className="btn btn--primary btn--sm" disabled={!result} onClick={() => onApply(result)}>{d.apply}</button>
    </div>
  );
}

function ImprintBuilder({ tl, index, initial, year, onApply }) {
  const d = tl.imprint;
  const start = splitImprint(initial);
  const [place, setPlace] = useState(start.place);
  const [publisher, setPublisher] = useState(start.publisher);
  const [withYear, setWithYear] = useState(false);
  const cleanYear = String(year || '').trim();
  const result = joinImprint({ place, publisher, year: withYear ? cleanYear : '' });

  return (
    <div className="assistant__builder">
      <label className="oc-label">{d.place}
        <SuggestInput id="imprint-place" className="oc-input" value={place} onChange={setPlace} getOptions={(q) => (index ? suggest(index.places, q) : [])} />
      </label>
      <label className="oc-label">{d.publisher}
        <SuggestInput id="imprint-publisher" className="oc-input" value={publisher} onChange={setPublisher} getOptions={(q) => (index ? suggest(index.publishers, q) : [])} />
      </label>
      <label className="assistant__check">
        <input type="checkbox" checked={withYear} disabled={!cleanYear} onChange={(e) => setWithYear(e.target.checked)} />
        {cleanYear ? d.includeYear(cleanYear) : d.includeYearEmpty}
      </label>
      <p className="assistant__preview"><span>{d.preview}:</span> {result || '—'}</p>
      <button type="button" className="btn btn--primary btn--sm" disabled={!result} onClick={() => onApply(result)}>{d.apply}</button>
    </div>
  );
}
