import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n/translations';
import ConfirmDialog from '../components/ConfirmDialog';
import Icon from '../components/Icons';
import {
  HISTORY_LIMIT, formatPackageDate, loadHistory, writeHistory,
} from '../utils/history';

const FILTERS = ['all', 'libro', 'articulosLibro', 'articuloRevista', 'tesis', 'revista'];

export default function HistoryView({ onBack, onLoad, onDownload, showToast }) {
  const { lang } = useApp();
  const t = useT(lang);
  const th = t.history;

  const [packages, setPackages] = useState(loadHistory);
  const [filter, setFilter] = useState('all');
  const [toDelete, setToDelete] = useState(null);

  const visible = useMemo(
    () => (filter === 'all' ? packages : packages.filter((p) => p.docType === filter)),
    [packages, filter],
  );

  const confirmDelete = () => {
    const next = packages.filter((p) => p.id !== toDelete.id);
    try {
      writeHistory(next);
      setPackages(next);
      showToast(th.deleted);
    } catch {
      showToast(th.deleteError);
    }
    setToDelete(null);
  };

  const pct = Math.min(100, Math.round((packages.length / HISTORY_LIMIT) * 100));

  return (
    <div className="view">
      <div className="view-header">
        <button type="button" className="view-back" onClick={onBack} aria-label={t.ui.back}>
          <Icon name="chevronLeft" size={16} strokeWidth={2} />
        </button>
        <h2>{th.title}</h2>
      </div>

      <div className="view-body history">
        <div className="history__top">
          <div className="history__meter">
            <p className="history__count">{th.counter(packages.length, HISTORY_LIMIT)}</p>
            <span className="history__bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
          </div>
          <div className="history__filters" role="tablist" aria-label={th.filterLabel}>
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={filter === f}
                className={`history__filter${filter === f ? ' history__filter--active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? th.all : th.types[f]}
              </button>
            ))}
          </div>
        </div>

        <p className="history__notice">{th.notice}</p>

        {visible.length === 0 ? (
          <p className="history__empty">{packages.length === 0 ? th.empty : th.emptyFilter}</p>
        ) : (
          <ul className="history__list">
            {visible.map((p) => {
              const customCount = Array.isArray(p.customColumns) ? p.customColumns.length : 0;
              return (
                <li key={p.id} className="history-card">
                  <span className="history-card__stripe" aria-hidden="true" />
                  <div className="history-card__info">
                    <span className="history-card__date">{formatPackageDate(p.createdAt)}</span>
                    <span className="history-card__rows">{th.records(p.rowCount ?? p.rows.length)}</span>
                  </div>
                  <div className="history-card__meta">
                    <span className="history-card__type">{th.types[p.docType] || p.docType}</span>
                    {customCount > 0 && (
                      <span className="history-card__custom">{t.cols.customCount(customCount)}</span>
                    )}
                  </div>
                  <div className="history-card__actions">
                    <button type="button" className="btn btn--outline btn--sm" onClick={() => onDownload(p)}>
                      {th.download}
                    </button>
                    <button type="button" className="btn btn--primary btn--sm" onClick={() => onLoad(p)}>
                      {th.load}
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger-outline btn--sm history-card__remove"
                      onClick={() => setToDelete(p)}
                      aria-label={th.remove}
                      title={th.remove}
                    >
                      <Icon name="trash" size={16} strokeWidth={1.8} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={th.deleteTitle}
        message={toDelete ? th.packageSummary(formatPackageDate(toDelete.createdAt), th.types[toDelete.docType], toDelete.rowCount) : ''}
        onCancel={() => setToDelete(null)}
        actions={[
          { label: th.cancel, variant: 'outline', onClick: () => setToDelete(null) },
          { label: th.remove, variant: 'danger', onClick: confirmDelete },
        ]}
      />
    </div>
  );
}
