import { useDeferredValue, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n/translations';
import { useLibraryT } from '../i18n/library';
import { searchCatalog } from '../utils/catalog';
import { DuplicateRow } from '../components/CatalogAssistant';
import Icon from '../components/Icons';

// Consulta del catálogo de la biblioteca. Solo lee: las acciones cargan el
// registro en el formulario, donde la persona decide si lo guarda.
export default function CatalogView({ onBack, index, status, onAddCopy, onUseData }) {
  const { lang } = useApp();
  const t = useT(lang);
  const tl = useLibraryT(lang);
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const { results, total } = useMemo(() => searchCatalog(index, deferred), [index, deferred]);

  return (
    <div className="view">
      <div className="view-header">
        <button type="button" className="view-back" onClick={onBack} aria-label={t.ui.back}>
          <Icon name="chevronLeft" size={16} strokeWidth={2} />
        </button>
        <h2>{tl.catalogTitle}</h2>
      </div>

      <div className="view-body catalog-view">
        <p className="assistant__hint">{tl.catalogIntro}</p>
        <input
          type="search"
          className="oc-input catalog-view__search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tl.catalogPlaceholder}
          aria-label={tl.catalogPlaceholder}
        />
        {status === 'loading' && <p className="assistant__status">{tl.loading}</p>}
        {status === 'error' && <p className="assistant__status assistant__status--error">{tl.loadError}</p>}
        {index && !deferred.trim() && <p className="assistant__hint">{tl.catalogStart(index.records.length)}</p>}
        {index && deferred.trim() && (
          <p className="assistant__hint" aria-live="polite">
            {total === 0 ? tl.catalogEmpty : tl.catalogTotal(total, results.length)}
          </p>
        )}
        <ul className="assistant__list">
          {results.map((rec, i) => (
            <DuplicateRow
              key={`${rec.registroId || rec.titulo}-${i}`}
              dup={{ rec, reason: 'titulo', source: 'catalogo' }}
              tl={{ ...tl, dupReason: { titulo: rec.registroId ? `id ${rec.registroId}` : tl.dupSource.catalogo }, dupSource: { catalogo: rec._type === 'revista' ? t.docTypes.revista : t.docTypes.libro } }}
              onAddCopy={onAddCopy}
              onUseData={onUseData}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
