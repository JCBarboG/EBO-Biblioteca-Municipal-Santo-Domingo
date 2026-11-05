import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n/translations';
import { SWATCHES, normalizeHex } from '../utils/colorTheme';
import Icon from './Icons';

// Selector de color de una zona: muestras sugeridas + color propio.
// En escritorio flota junto a la zona tocada; en el celular sale desde abajo.
const W = 340;

export default function ZoneEditor({ zone, kind, value, isCustom, anchor, sheet, warnings, darkEditing, onChange, onReset, onClose }) {
  const { lang } = useApp();
  const tAll = useT(lang);
  const t = tAll.perso;
  const ref = useRef(null);
  const [hex, setHex] = useState(value);
  const [pos, setPos] = useState({ top: -9999, left: -9999 });

  useEffect(() => { setHex(value); }, [value]);

  useLayoutEffect(() => {
    if (sheet || !ref.current || !anchor) return;
    const h = ref.current.offsetHeight;
    const vw = window.innerWidth; const vh = window.innerHeight;
    let left = anchor.right + 12;
    if (left + W > vw - 12) left = anchor.left - W - 12;
    if (left < 12) left = Math.max(12, Math.min(vw - W - 12, anchor.left + anchor.width / 2 - W / 2));
    let top = anchor.top + anchor.height / 2 - h / 2;
    top = Math.max(12, Math.min(top, vh - h - 12));
    setPos({ top, left });
  }, [anchor, sheet, zone, warnings.length]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const onDown = (e) => {
      if (ref.current?.contains(e.target)) return;
      if (e.target instanceof Element && e.target.closest('[data-zone], .perso-zone')) return;
      onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown); };
  }, [onClose]);

  const groups = kind === 'rail'
    ? [['darkSw', SWATCHES.dark], ['strong', SWATCHES.strong], ['soft', SWATCHES.soft]]
    : kind === 'accent'
      ? [['strong', SWATCHES.strong], ['darkSw', SWATCHES.dark]]
      : [['soft', SWATCHES.soft], ['strong', SWATCHES.strong], ['darkSw', SWATCHES.dark]];

  const [title, desc] = t.zones[zone];
  const body = (
    <>
      <div className="ze-head">
        <span className="ze-chip" style={{ background: value }} />
        <span className="ze-titles"><b>{title}</b><small>{desc}</small></span>
        <button type="button" className="ze-x" onClick={onClose} aria-label={tAll.ui.close}><Icon name="close" size={16} /></button>
      </div>
      {darkEditing && <p className="ze-note">{t.darkEditing}</p>}
      {groups.map(([g, list]) => (
        <div key={g} className="ze-group">
          <span className="ze-group__t">{t[g]}</span>
          <div className="ze-sw">
            {list.map(([c, name]) => (
              <button key={c} type="button" className={`ze-dot${value === c ? ' ze-dot--on' : ''}`} style={{ background: c }}
                title={name} aria-label={name} aria-pressed={value === c} onClick={() => onChange(c)} />
            ))}
          </div>
        </div>
      ))}
      <div className="ze-custom">
        <label className="ze-picker" title={t.custom}>
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={t.custom} />
          <Icon name="pipette" size={15} />
          <span>{t.custom}</span>
        </label>
        <label className="ze-hex">
          <span>{t.hex}</span>
          <input value={hex} spellCheck={false} maxLength={7}
            onChange={(e) => { setHex(e.target.value); const n = normalizeHex(e.target.value); if (n && e.target.value.length >= 7) onChange(n); }}
            onBlur={() => { const n = normalizeHex(hex); if (n) onChange(n); else setHex(value); }} />
        </label>
      </div>
      {warnings.map((w) => <p key={w} className="ze-warn"><Icon name="alert" size={14} />{t.warn[w]}</p>)}
      <div className="ze-foot">
        <button type="button" className="oc-btn oc-btn--ghost" onClick={onReset} disabled={!isCustom}>
          <Icon name="reset" size={14} />{t.useOriginal}
        </button>
        <button type="button" className="oc-btn oc-btn--acc-fill" onClick={onClose}>{t.close}</button>
      </div>
    </>
  );

  if (sheet) {
    return createPortal(
      <>
        <div className="oc-sheet-overlay" onClick={onClose} />
        <section ref={ref} className="oc-sheet ze ze--sheet" role="dialog" aria-label={title}>
          <span className="oc-sheet__grip" aria-hidden="true" />
          {body}
        </section>
      </>,
      document.body,
    );
  }
  return createPortal(
    <section ref={ref} className="ze oc-menu" role="dialog" aria-label={title} style={{ position: 'fixed', top: pos.top, left: pos.left, width: W }}>
      {body}
    </section>,
    document.body,
  );
}
