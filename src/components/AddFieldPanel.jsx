import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n/translations';
import Icon from './Icons';

// Botón "+ Agregar campo" y su panel. Llama a onAdd(nombre, etiquetaMarc).
export default function AddFieldPanel({ onAdd }) {
  const { lang } = useApp();
  const t = useT(lang);
  const tc = t.cols;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [error, setError] = useState(false);
  const wrapRef = useRef(null);
  const nameRef = useRef(null);

  const close = () => { setOpen(false); setName(''); setTag(''); setError(false); };

  useEffect(() => {
    if (!open) return undefined;
    nameRef.current?.focus();
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) close(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError(true); nameRef.current?.focus(); return; }
    onAdd(name.trim(), tag.trim());
    close();
  };

  return (
    <div className="oc-addfield" ref={wrapRef}>
      <button
        type="button"
        className="oc-btn oc-btn--dashed"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <Icon name="plus" size={14} strokeWidth={2} />{tc.addField}
      </button>
      {open && (
        <form className="oc-menu oc-addfield__panel" role="dialog" aria-label={tc.newField} onSubmit={submit}>
          <b className="oc-addfield__title">{tc.newField}</b>
          <label className="oc-label">
            {tc.fieldName}
            <input
              ref={nameRef}
              className="oc-input"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(false); }}
              placeholder={tc.fieldNamePlaceholder}
              aria-invalid={error}
              aria-required="true"
            />
          </label>
          {error && <span className="oc-addfield__error" role="alert">{tc.nameRequired}</span>}
          <label className="oc-label">
            {tc.marcTag}
            <input
              className="oc-input oc-mono"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder={tc.marcTagPlaceholder}
            />
          </label>
          <p className="oc-addfield__note">{tc.kohaNotice}</p>
          <div className="oc-addfield__actions">
            <button type="button" className="oc-btn oc-btn--ghost" onClick={close}>{tc.cancel}</button>
            <button type="submit" className="oc-btn oc-btn--acc-fill">{tc.add}</button>
          </div>
        </form>
      )}
    </div>
  );
}
