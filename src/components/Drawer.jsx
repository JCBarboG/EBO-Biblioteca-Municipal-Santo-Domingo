import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n/translations';
import { useLibraryT, LIBRARY_NAME } from '../i18n/library';
import Icon from './Icons';
import Logo from './Logo';

export default function Drawer({ open, onClose, onNewRecord, onExport, onOpenConfig, onNavigate }) {
  const { lang } = useApp();
  const t = useT(lang);
  const tl = useLibraryT(lang);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleItem = (cb) => {
    onClose();
    cb();
  };

  return (
    <>
      <div className={`drawer-overlay${open ? ' drawer-overlay--open' : ''}`} onClick={onClose} />
      <aside className={`drawer${open ? ' drawer--open' : ''}`} aria-modal="true" role="dialog">
        <div className="drawer-header">
          <Logo size={44} className="drawer-logo" />
          <div className="drawer-brand">
            <span className="drawer-title">EBO</span>
            <span className="drawer-subtitle">{LIBRARY_NAME}</span>
          </div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label={t.ui.close}><Icon name="close" size={20} /></button>
        </div>

        <nav className="drawer-nav">
          <button type="button" className="drawer-item" onClick={() => handleItem(onNewRecord)}>
            {t.menu.newRecord}
          </button>
          <button type="button" className="drawer-item" onClick={() => handleItem(onExport)}>
            {t.menu.export}
          </button>
          <button type="button" className="drawer-item" onClick={() => handleItem(() => onNavigate('catalog'))}>
            {tl.catalogNav}
          </button>
          <button type="button" className="drawer-item" onClick={() => handleItem(() => onNavigate('history'))}>
            {t.menu.history}
          </button>
          <button type="button" className="drawer-item" onClick={() => handleItem(onOpenConfig)}>
            {t.menu.config}
          </button>
          <button type="button" className="drawer-item" onClick={() => handleItem(() => onNavigate('guide'))}>
            {t.menu.guide}
          </button>
          <button type="button" className="drawer-item" onClick={() => handleItem(() => onNavigate('support'))}>
            {t.menu.support}
          </button>
          <button type="button" className="drawer-item" onClick={() => handleItem(() => onNavigate('personalize'))}>
            {t.perso.title}
          </button>
          <button type="button" className="drawer-item" onClick={() => handleItem(() => onNavigate('about'))}>
            {t.menu.about}
          </button>
          <button type="button" className="drawer-item drawer-item--premium" onClick={() => handleItem(() => onNavigate('premium'))}>
            {t.menu.premium}
          </button>
        </nav>
      </aside>
    </>
  );
}
