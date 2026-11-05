import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n/translations';
import { useLibraryT } from '../i18n/library';
import Icon, { DotsIcon } from './Icons';

// Riel izquierdo de escritorio (≥ 1100 px). En móvil se oculta por CSS y se
// usa el Drawer. Solo navega y llama a los handlers que ya existen.
export default function NavRail({ view, configOpen, onNavigate, onOpenConfig, onNewRecord }) {
  const { lang } = useApp();
  const t = useT(lang);
  const tl = useLibraryT(lang);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    if (!moreOpen) return undefined;
    const onDown = (e) => { if (!moreRef.current?.contains(e.target)) setMoreOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setMoreOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  const items = [
    { id: 'main', label: t.ui.catalog, icon: 'catalog' },
    { id: 'catalog', label: tl.catalogNav, icon: 'library' },
    { id: 'history', label: t.menu.history, icon: 'history' },
    { id: 'guide', label: t.menu.guide, icon: 'guide' },
    { id: 'support', label: t.menu.support, icon: 'support' },
  ];
  const moreViews = ['about', 'premium', 'terms', 'privacy', 'personalize'];

  const pick = (cb) => { setMoreOpen(false); cb(); };

  return (
    <nav className="oc-rail" aria-label="EBO">
      <button type="button" className="oc-rail__logo" onClick={() => onNavigate('main')} aria-label={t.header.goHome}>
        EBO
      </button>

      {items.map((it) => {
        const on = !configOpen && view === it.id;
        return (
          <button
            key={it.id}
            type="button"
            className={`oc-rail__btn${on ? ' oc-rail__btn--on' : ''}`}
            aria-label={it.label}
            aria-current={on ? 'page' : undefined}
            data-tip={it.label}
            onClick={() => onNavigate(it.id)}
          >
            <Icon name={it.icon} size={20} strokeWidth={1.6} />
          </button>
        );
      })}
      <button
        type="button"
        className={`oc-rail__btn${configOpen ? ' oc-rail__btn--on' : ''}`}
        aria-label={t.menu.config}
        data-tip={t.menu.config}
        onClick={onOpenConfig}
      >
        <Icon name="config" size={20} strokeWidth={1.6} />
      </button>

      <div className="oc-rail__bottom" ref={moreRef}>
        <button
          type="button"
          className={`oc-rail__btn${moreViews.includes(view) || moreOpen ? ' oc-rail__btn--on' : ''}`}
          aria-label={t.ui.moreMenu}
          aria-haspopup="menu"
          aria-expanded={moreOpen}
          data-tip={t.ui.more}
          onClick={() => setMoreOpen((o) => !o)}
        >
          <DotsIcon size={20} />
        </button>
        {moreOpen && (
          <div className="oc-menu oc-rail__menu" role="menu">
            <button type="button" role="menuitem" className="oc-menu__item" onClick={() => pick(onNewRecord)}>
              <Icon name="plus" size={16} />{t.menu.newRecord}
            </button>
            <button type="button" role="menuitem" className="oc-menu__item" onClick={() => pick(() => onNavigate('about'))}>
              <Icon name="info" size={16} />{t.menu.about}
            </button>
            <button type="button" role="menuitem" className="oc-menu__item" onClick={() => pick(() => onNavigate('premium'))}>
              <Icon name="star" size={16} />{t.menu.premium}
            </button>
            <button type="button" role="menuitem" className="oc-menu__item" onClick={() => pick(() => onNavigate('personalize'))}>
              <Icon name="palette" size={16} />{t.perso.title}
            </button>
            <div className="oc-menu__sep" />
            <button type="button" role="menuitem" className="oc-menu__item" onClick={() => pick(() => onNavigate('terms'))}>
              <Icon name="lines" size={16} />{t.ui.termsPrivacy}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
