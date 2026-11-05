import { useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n/translations';
import { useLibraryT } from '../i18n/library';
import { CATEGORIES_BY_TYPE, LANGUAGES } from '../constants/docTypes';
import { suggest } from '../utils/catalog';
import SuggestInput from './SuggestInput';
import Icon from './Icons';

// `columns`: lista final (columnas del tipo + propias) de utils/columns.js → getColumns.
// `index`: catálogo de la biblioteca para el autocompletado (null mientras carga).
export default function CategoryFields({
  fields, onFieldChange, selection, onAssign, activeKey, columns, flashKey,
  index, pinned = [], onTogglePin, nextId,
}) {
  const { lang, docType } = useApp();
  const t = useT(lang);
  const tl = useLibraryT(lang);
  const cats = columns || CATEGORIES_BY_TYPE[docType] || CATEGORIES_BY_TYPE.libro;
  const hasSelection = Boolean(selection.text && selection.text.trim());

  const handleEmptyInputMouseDown = (e, key) => {
    if (fields[key]) return; // ya tiene contenido: comportamiento normal de edición
    if (!hasSelection) return; // nada seleccionado: comportamiento normal (foco)
    e.preventDefault();
    onAssign(key);
    e.currentTarget.focus();
  };

  const authors = useCallback((q) => (index ? suggest(index.authors, q) : []), [index]);
  const subjects = useCallback((q) => (index ? suggest(index.subjects, q) : []), [index]);
  const places = useCallback((q) => (index ? suggest(index.places, q) : []), [index]);
  const languages = useCallback((q) => {
    const low = q.toLowerCase();
    return LANGUAGES.filter((l) => l !== q && l.toLowerCase().includes(low)).map((label) => ({ label }));
  }, []);
  const allLanguages = useCallback(() => LANGUAGES.map((label) => ({ label })), []);

  const suggestions = useMemo(() => ({
    autor: { getOptions: authors },
    materia: { getOptions: subjects, terms: true },
    lugarEditorial: { getOptions: places },
    idioma: { getOptions: (q) => (LANGUAGES.includes(q) ? allLanguages() : languages(q)), showOnFocus: true },
  }), [authors, subjects, places, languages, allLanguages]);

  return (
    <div className={`category-fields${hasSelection ? ' category-fields--selecting' : ''}`}>
      <div className="selection-bar">
        <p className="selection-bar__hint">
          {hasSelection ? (
            <>
              {t.step02.selectionPrefix}
              <span className="selection-bar__text">"{truncate(selection.text.trim(), 80)}"</span>
            </>
          ) : (
            t.step02.hint
          )}
        </p>
      </div>

      <div className="fields-scroll">
        <div className="category-grid">
          {cats.map((cat) => {
            const label = cat.fieldLabel[lang] || cat.fieldLabel.es;
            const empty = !String(fields[cat.key] || '').trim();
            const isPinned = pinned.includes(cat.key);
            const cls = [
              'category-grid__item',
              activeKey === cat.key && 'category-grid__item--active',
              cat.custom && 'category-grid__item--custom',
              flashKey === cat.key && 'oc-flash',
            ].filter(Boolean).join(' ');
            const inputProps = {
              id: `field-${cat.key}`,
              className: hasSelection && empty ? 'field-input--target' : undefined,
              onMouseDown: (e) => handleEmptyInputMouseDown(e, cat.key),
              placeholder: cat.key === 'registroId' && nextId ? tl.nextId(nextId) : `${label}…`,
            };
            const helper = suggestions[cat.key];
            return (
              <div className={cls} key={cat.key}>
                <div className="category-grid__row">
                  <div
                    className="category-grid__head"
                    role="button"
                    tabIndex={0}
                    onClick={() => onAssign(cat.key)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAssign(cat.key); } }}
                  >
                    <label htmlFor={`field-${cat.key}`}>{label}</label>
                    <span className="category-grid__tags">
                      {cat.custom && <span className="oc-badge">{t.cols.custom}</span>}
                      {cat.marcTag
                        ? <span className="category-grid__tag">{cat.marcTag}</span>
                        : cat.custom && <span className="category-grid__tag category-grid__tag--none">{t.cols.noMarc}</span>}
                    </span>
                  </div>
                  {cat.key !== 'registroId' && (
                    <button
                      type="button"
                      className={`field-pin${isPinned ? ' field-pin--on' : ''}`}
                      aria-pressed={isPinned}
                      aria-label={isPinned ? tl.unpin(label) : tl.pin(label)}
                      title={isPinned ? tl.unpin(label) : tl.pin(label)}
                      onClick={() => onTogglePin(cat.key)}
                    >
                      <Icon name="pin" size={13} strokeWidth={2} />
                    </button>
                  )}
                </div>
                {helper ? (
                  <SuggestInput
                    {...inputProps}
                    {...helper}
                    value={fields[cat.key] || ''}
                    onChange={(v) => onFieldChange(cat.key, v)}
                  />
                ) : (
                  <input
                    {...inputProps}
                    type="text"
                    value={fields[cat.key] || ''}
                    onChange={(e) => onFieldChange(cat.key, e.target.value)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
