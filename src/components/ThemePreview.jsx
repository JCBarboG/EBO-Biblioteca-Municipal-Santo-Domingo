import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n/translations';

// Maqueta interactiva de la pantalla principal. Usa las mismas variables de
// color que la app (o las que reciba en `tokens`), así que muestra
// exactamente cómo quedará cada zona. Cada zona es un botón: al tocarla se
// llama a onPick(zona, rectángulo).
const BASE_W = 960;
const BASE_H = 600;
// Las zonas usan display: contents; el rectángulo real es el de su primer hijo.
const rectOf = (el) => (el.firstElementChild || el).getBoundingClientRect();

export default function ThemePreview({ onPick, active, tokens, interactive = true, label }) {
  const { lang } = useApp();
  const t = useT(lang).perso;
  const m = t.mock;
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(0.6);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / BASE_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const zone = (id) => (interactive ? {
    'data-zone': id,
    role: 'button',
    tabIndex: 0,
    'aria-label': `${t.zones[id][0]} · ${t.tapHint}`,
    className: `tp-z${active === id ? ' tp-z--on' : ''}`,
    onClick: (e) => { e.stopPropagation(); onPick?.(id, rectOf(e.currentTarget)); },
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onPick?.(id, rectOf(e.currentTarget)); }
    },
  } : { 'data-zone': id, className: 'tp-z' });

  const tag = (code) => <span {...zone('brass')}><span className="tp-tag">{code}</span></span>;

  const fields = [['Título', '245$a', 'La memoria del archivo'], ['Autor', '100$a', 'Solís Rojas, María F.'], ['Subtítulo', '245$b', ''],
    ['Editorial', '260$b', 'Ediciones Muestra'], ['Lugar', '260$a', 'San José'], ['Año', '260$c', '2024'], ['ISBN', '020$a', ''], ['Materia', '650$a', 'Archivos']];

  return (
    <div className="tp-wrap" ref={wrapRef} style={{ height: BASE_H * scale, ...(tokens || {}) }} aria-label={label || t.previewLabel}>
      <div className="tp" style={{ width: BASE_W, height: BASE_H, transform: `scale(${scale})` }}>
        <div {...zone('rail')}>
          <div className="tp-rail">
            <b>EBO</b>
            {[0, 1, 2, 3, 4].map((i) => <span key={i} className={`tp-rail__dot${i === 0 ? ' tp-rail__dot--on' : ''}`} />)}
            <span className="tp-rail__dot tp-rail__more" />
          </div>
        </div>
        <div {...zone('bg')}>
          <div className="tp-page">
            <div {...zone('head')}>
              <div className="tp-head">
                <span className="tp-head__title">{m.title}</span>
                <span className="tp-tabs">
                  {m.types.map((ty, i) => (
                    <span key={ty} {...(interactive ? { onClick: (e) => { e.stopPropagation(); setTab(i); } } : {})}
                      className={`tp-tab${tab === i ? ' tp-tab--on' : ''}`}>{ty}</span>
                  ))}
                </span>
                <span className="tp-head__actions">
                  <span {...zone('acc')}><span className="tp-btn tp-btn--acc">{m.save}</span></span>
                  <span {...zone('green')}><span className="tp-btn tp-btn--green">{m.export} ▾</span></span>
                </span>
              </div>
            </div>
            <div className="tp-strip">
              <div {...zone('capture')}>
                <div className="tp-cap">
                  <span className="tp-book"><i>La memoria del archivo</i></span>
                  <span className="tp-cap__ctl">
                    <span className="tp-mono">IMAGEN 1 / 3</span>
                    <span className="tp-mini">{m.photo}</span>
                    <span className="tp-mini tp-mini--ink">{m.extract} →</span>
                  </span>
                </div>
              </div>
              <div {...zone('ocr')}>
                <div className="tp-ocr">
                  <span className="tp-ocr__label">{m.ocrTitle}</span>
                  <span className="tp-mono">MARÍA FERNANDA SOLÍS ROJAS</span>
                  <span className="tp-mono"><mark>La memoria del archivo</mark></span>
                  <span className="tp-mono">Ensayos sobre patrimonio</span>
                  <span className="tp-mono">EDICIONES MUESTRA · 2024</span>
                </div>
              </div>
            </div>
            <div {...zone('fields')}>
              <div className="tp-fields">
                <span className="tp-sec"><b>{m.fields}</b><em>6 / 29</em></span>
                <div className="tp-grid">
                  {fields.map(([lb, code, val], i) => (
                    <span key={lb} className="tp-field">
                      <span className="tp-field__lb">{lb.toUpperCase()}{tag(code)}</span>
                      <span className={`tp-field__in${!val && i === 2 ? ' tp-field__in--target' : ''}`}>{val}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="tp-tablehead">
              <b>{m.table}</b>
              <span {...zone('danger')}><span className="tp-btn tp-btn--danger">{m.clear}</span></span>
            </div>
            <div className="tp-table">
              <div {...zone('tblHead')}>
                <div className="tp-tr tp-tr--head">
                  <span className="tp-rn">1</span>
                  {[['TÍTULO', '245$a'], ['AUTOR', '100$a'], ['EDITORIAL', '260$b'], ['PROCEDENCIA', '']].map(([h, code]) => (
                    <span key={h} className="tp-th">{h}{code ? tag(code) : <span className="tp-tag tp-tag--none">sin MARC</span>}<i className="tp-tri" /></span>
                  ))}
                </div>
              </div>
              <div {...zone('tblCell')}>
                <div className="tp-rows">
                  {[['La memoria del archivo', 'Solís Rojas, María F.', 'Ediciones Muestra', 'Donación'], ['Archivos y justicia', 'Herrera, Sofía', 'EUNED', ''], ['', '', '', '']].map((r, i) => (
                    <div key={i} className="tp-tr">
                      <span className="tp-rn">{i + 2}</span>
                      {r.map((c, j) => <span key={j} className="tp-td">{c}{j === 0 && c ? <b className="tp-sym"> /</b> : null}</span>)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
