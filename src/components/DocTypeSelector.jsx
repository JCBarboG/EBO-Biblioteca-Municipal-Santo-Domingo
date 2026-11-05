import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n/translations';
import Icon from './Icons';

// variant="tabs" (escritorio): pestañas subrayadas.
// variant="list" (móvil): botón con el tipo actual que abre una lista.
// En ambos casos se llama al mismo setDocType + onTypeChange de siempre.
export default function DocTypeSelector({ onTypeChange, variant = 'tabs' }) {
  const { lang, docType, setDocType } = useApp();
  const t = useT(lang);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const types = [
    { key: 'libro', label: t.docTypes.libro },
    { key: 'articulosLibro', label: t.docTypes.articulosLibro },
    { key: 'revista', label: t.docTypes.revista },
    { key: 'articuloRevista', label: t.docTypes.articuloRevista },
    { key: 'tesis', label: t.docTypes.tesis },
  ];

  const handleChange = (key) => {
    setDocType(key);
    if (onTypeChange) onTypeChange(key);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (variant === 'list') {
    const current = types.find((x) => x.key === docType) || types[0];
    return (
      <div className="doc-type-list" ref={wrapRef}>
        <button
          type="button"
          className="doc-type-list__btn"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`${t.ui.docType}: ${current.label}`}
          onClick={() => setOpen((o) => !o)}
        >
          <span>{current.label}</span>
          <Icon name="chevronDown" size={13} strokeWidth={2.2} />
        </button>
        {open && (
          <ul className="oc-menu doc-type-list__menu" role="listbox" aria-label={t.ui.docType}>
            {types.map(({ key, label }) => (
              <li key={key}>
                <button
                  type="button"
                  role="option"
                  aria-selected={docType === key}
                  className={`oc-menu__item${docType === key ? ' oc-menu__item--on' : ''}`}
                  onClick={() => { setOpen(false); handleChange(key); }}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="doc-type-selector" role="tablist" aria-label={t.ui.docType}>
      {types.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={docType === key}
          className={`doc-type-tab${docType === key ? ' doc-type-tab--active' : ''}`}
          onClick={() => handleChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
