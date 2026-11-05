import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n/translations';
import { CATEGORIES_BY_TYPE } from '../constants/docTypes';
import { hasOverride, presetRuleFor, punctuationParts } from '../config/punctuationPresets';
import Icon, { DotsIcon } from './Icons';

// Símbolos de puntuación ISBD disponibles para el override manual por
// columna. `glyph` es solo para mostrar en la paleta; `value` es el sufijo
// real que se aplica (el espacio inicial es parte de la regla).
const PUNCT_SYMBOLS = [
  { value: '', glyph: '—', label: 'Ninguno' },
  { value: ' -', glyph: '-', label: '- guión' },
  { value: ' :', glyph: ':', label: ': dos puntos' },
  { value: ' /', glyph: '/', label: '/ barra' },
  { value: ' ;', glyph: ';', label: '; punto y coma' },
  { value: ',', glyph: ',', label: ', coma' },
  { value: '.', glyph: '.', label: '. punto' },
  { value: ' +', glyph: '+', label: '+ más' },
];

// Alto de la caja de la tabla (redimensionable arrastrando el borde inferior).
const TABLE_HEIGHT_KEY = 'ebo:tableHeight';
const DEFAULT_TABLE_HEIGHT = 300;
const MIN_TABLE_HEIGHT = 240;
const maxTableHeight = () => Math.round(window.innerHeight * 0.9);

// Filas vacías de relleno: al menos 6, y las que quepan en el alto elegido
// para que al alargar la tabla se vean más filas tipo Excel. Son solo
// visuales: no son registros.
const MIN_VISIBLE_ROWS = 6;
const HEADER_HEIGHT = 72;
const ROW_HEIGHT = 34;

const POP_WIDTH = 214;
const MENU_WIDTH = 260;
const POP_GAP = 6;
const VIEWPORT_MARGIN = 8;
const MOBILE_QUERY = '(max-width: 1099px)';

function excelColumnLetters(index) {
  // 0 -> A, 25 -> Z, 26 -> AA, 27 -> AB, ...
  let n = index;
  let letters = '';
  do {
    letters = String.fromCharCode(65 + (n % 26)) + letters;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return letters;
}

function readStoredHeight() {
  try {
    const v = parseInt(localStorage.getItem(TABLE_HEIGHT_KEY), 10);
    if (Number.isFinite(v)) return Math.max(MIN_TABLE_HEIGHT, v);
  } catch { /* almacenamiento no disponible */ }
  return DEFAULT_TABLE_HEIGHT;
}

function symbolLabel(value) {
  const found = PUNCT_SYMBOLS.find((s) => s.value === value);
  return found ? found.label : value.trim();
}

function describeRule(rule, t) {
  if (typeof rule === 'string') return rule ? symbolLabel(rule) : t.punct.none;
  if (rule && rule.conditional) {
    const { then, else: otherwise } = rule.conditional;
    return t.punct.conditional(then.trim(), otherwise.trim());
  }
  return t.punct.none;
}

function useIsMobile() {
  const get = () => typeof window !== 'undefined' && window.matchMedia?.(MOBILE_QUERY).matches;
  const [mobile, setMobile] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia?.(MOBILE_QUERY);
    if (!mq) return undefined;
    const on = () => setMobile(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return mobile;
}

export default function BooksTable({
  books, onSave, onExport, onSaveHistory, columnPunctuation, onPunctuationChange, onPunctuationReset,
  columns, onCellChange, onInsertRow, onRemoveRow, onAddRow,
  onInsertColumn, onRenameColumn, onRemoveColumn, flashKey,
}) {
  const { lang, docType } = useApp();
  const t = useT(lang);
  const tc = t.cols;
  const cats = columns || CATEGORIES_BY_TYPE[docType] || CATEGORIES_BY_TYPE.libro;
  const isMobile = useIsMobile();

  // Panel abierto: { kind: 'punct' | 'col' | 'row', key?, rowId?, rowIndex?, anchor: DOMRect, openedAt }
  const [menu, setMenu] = useState(null);
  const closeMenu = useCallback(() => setMenu(null), []);
  // Encabezado en edición: { key, value }
  const [renaming, setRenaming] = useState(null);
  // Celda con foco ("id|key"): muestra el texto crudo en vez del formateado.
  const [focusedCell, setFocusedCell] = useState(null);

  const [tableHeight, setTableHeight] = useState(readStoredHeight);
  const wrapRef = useRef(null);

  const openAt = (e, data) => {
    e.stopPropagation();
    const anchor = e.currentTarget.getBoundingClientRect();
    setMenu((prev) => {
      const same = prev && prev.kind === data.kind && prev.key === data.key && prev.rowId === data.rowId;
      return same ? null : { ...data, anchor, openedAt: performance.now() };
    });
  };

  // Cerrar el panel con Esc, scroll (tabla o página) o resize.
  useEffect(() => {
    if (!menu) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeMenu(); };
    const onScroll = (e) => {
      if (e.target instanceof Element && e.target.closest('.punct-pop, .oc-pop, .oc-sheet')) return;
      // Al tocar un ícono parcialmente visible el navegador puede desplazar
      // la tabla para mostrarlo; ese scroll inmediato no debe cerrar el panel.
      if (performance.now() - menu.openedAt < 250) return;
      closeMenu();
    };
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', closeMenu);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', closeMenu);
    };
  }, [menu, closeMenu]);

  // Al cambiar de tipo de documento, el panel abierto ya no aplica.
  useEffect(() => { closeMenu(); setRenaming(null); }, [docType, closeMenu]);

  // ── Redimensionar la tabla ──
  const dragRef = useRef(null);
  const onHandleDown = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, startH: wrapRef.current?.offsetHeight || tableHeight };
  };
  const onHandleMove = (e) => {
    if (!dragRef.current) return;
    const { startY, startH } = dragRef.current;
    const next = Math.min(maxTableHeight(), Math.max(MIN_TABLE_HEIGHT, startH + (e.clientY - startY)));
    setTableHeight(next);
  };
  const onHandleUp = (e) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ya liberado */ }
    setTableHeight((h) => {
      try { localStorage.setItem(TABLE_HEIGHT_KEY, String(Math.round(h))); } catch { /* sin espacio */ }
      return h;
    });
  };
  const onHandleKey = (e) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    setTableHeight((h) => {
      const next = Math.min(maxTableHeight(), Math.max(MIN_TABLE_HEIGHT, h + (e.key === 'ArrowDown' ? 40 : -40)));
      try { localStorage.setItem(TABLE_HEIGHT_KEY, String(next)); } catch { /* sin espacio */ }
      return next;
    });
  };

  const effectiveHeight = Math.min(tableHeight, Math.max(MIN_TABLE_HEIGHT, maxTableHeight()));
  const fillRows = Math.max(MIN_VISIBLE_ROWS, Math.floor((effectiveHeight - HEADER_HEIGHT) / ROW_HEIGHT));
  const emptyRows = Math.max(fillRows - books.length, 1);

  const menuCat = menu && menu.key ? cats.find((c) => c.key === menu.key) : null;
  const colLabelOf = (cat) => cat.colLabel[lang] || cat.colLabel.es;

  // ── Columnas ──
  const insertColumn = (index) => {
    closeMenu();
    const key = onInsertColumn?.(index);
    if (key) setRenaming({ key, value: tc.newColumn, fresh: true });
  };
  const startRename = (cat) => {
    closeMenu();
    setRenaming({ key: cat.key, value: colLabelOf(cat) });
  };
  const commitRename = () => {
    if (!renaming) return;
    const cat = cats.find((c) => c.key === renaming.key);
    const value = renaming.value.trim();
    if (cat && value) onRenameColumn?.(renaming.key, value);
    setRenaming(null);
  };
  const removeColumn = (cat) => {
    closeMenu();
    onRemoveColumn?.(cat.key, colLabelOf(cat));
  };

  // ── Filas ──
  const rowAction = (fn) => { closeMenu(); fn(); };

  return (
    <div className="books-table-section">
      <div className="excel-wrap" ref={wrapRef} style={{ height: effectiveHeight }}>
        <table className="excel-table" style={{ minWidth: 44 + cats.length * 190 }}>
          <thead>
            <tr className="col-letters">
              <th aria-hidden="true" />
              {cats.map((cat, i) => (
                <th key={cat.key} className={cat.custom ? 'col-letters__custom' : undefined}>{excelColumnLetters(i)}</th>
              ))}
            </tr>
            <tr className="field-names">
              <th>1</th>
              {cats.map((cat, i) => {
                const overridden = hasOverride(columnPunctuation, cat.key);
                const rule = presetRuleFor(cat, docType);
                const hasPunct = overridden ? Boolean(columnPunctuation[cat.key]) : Boolean(rule);
                const colLabel = colLabelOf(cat);
                const punctOpen = menu?.kind === 'punct' && menu.key === cat.key;
                const colOpen = menu?.kind === 'col' && menu.key === cat.key;
                const isRenaming = renaming?.key === cat.key;
                const cls = [
                  'field-names__cell',
                  cat.custom && 'field-names__cell--custom',
                  flashKey === cat.key && 'oc-flash',
                ].filter(Boolean).join(' ');
                return (
                  <th key={cat.key} className={cls}>
                    {isRenaming ? (
                      <input
                        className="oc-th-rename"
                        value={renaming.value}
                        aria-label={tc.columnName}
                        autoFocus
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => setRenaming((r) => ({ ...r, value: e.target.value }))}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
                          if (e.key === 'Escape') { e.stopPropagation(); setRenaming(null); }
                        }}
                      />
                    ) : (
                      <span className="field-names__label" title={colLabel}>{colLabel}</span>
                    )}
                    <span className={`field-names__tag${cat.marcTag ? '' : ' field-names__tag--none'}`}>
                      {cat.marcTag || (cat.custom ? tc.noMarc : '')}
                    </span>
                    {overridden && (
                      <span className="col-override-dot" title={t.punct.overrideHint} aria-label={t.punct.overrideHint} />
                    )}
                    <button
                      type="button"
                      className={`col-punct-corner${hasPunct ? ' col-punct-corner--active' : ''}`}
                      data-pop-toggle=""
                      aria-label={t.punct.choose(colLabel)}
                      aria-expanded={punctOpen}
                      onClick={(e) => openAt(e, { kind: 'punct', key: cat.key })}
                    />
                    <button
                      type="button"
                      className="oc-colmenu-btn"
                      data-pop-toggle=""
                      aria-label={tc.options(colLabel)}
                      aria-haspopup="menu"
                      aria-expanded={colOpen}
                      onClick={(e) => openAt(e, { kind: 'col', key: cat.key, index: i })}
                    >
                      <DotsIcon size={14} vertical />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {books.map((book, index) => {
              const rowOpen = menu?.kind === 'row' && menu.rowId === book.id;
              return (
                <tr key={book.id}>
                  <td className="oc-rownum-cell">
                    <button
                      type="button"
                      className="oc-rownum"
                      data-pop-toggle=""
                      aria-label={tc.rowOptions(index + 2)}
                      aria-haspopup="menu"
                      aria-expanded={rowOpen}
                      onClick={(e) => openAt(e, { kind: 'row', rowId: book.id, rowIndex: index })}
                    >
                      {index + 2}
                    </button>
                  </td>
                  {cats.map((cat) => {
                    const cellId = `${book.id}|${cat.key}`;
                    const focused = focusedCell === cellId;
                    const raw = book[cat.key] == null ? '' : String(book[cat.key]);
                    const { body, suffix } = punctuationParts(book, cat, docType, columnPunctuation);
                    return (
                      <td key={cat.key} className="oc-cell-td">
                        <input
                          className="oc-cell"
                          value={focused ? raw : body}
                          aria-label={tc.cell(colLabelOf(cat), index + 2)}
                          onFocus={() => setFocusedCell(cellId)}
                          onBlur={() => setFocusedCell((c) => (c === cellId ? null : c))}
                          onChange={(e) => onCellChange?.(book.id, cat.key, e.target.value)}
                        />
                        {suffix && <span className="marc-sym">{suffix}</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {Array.from({ length: emptyRows }).map((_, i) => (
              <tr key={`empty-${i}`} className="oc-filler" aria-hidden="true">
                <td className="empty-cell">{books.length + i + 2}</td>
                {cats.map((cat) => <td key={cat.key} />)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className="table-resize"
        role="separator"
        aria-orientation="horizontal"
        aria-label={t.punct.resize}
        aria-valuemin={MIN_TABLE_HEIGHT}
        aria-valuenow={Math.round(effectiveHeight)}
        tabIndex={0}
        onPointerDown={onHandleDown}
        onPointerMove={onHandleMove}
        onPointerUp={onHandleUp}
        onPointerCancel={onHandleUp}
        onKeyDown={onHandleKey}
      >
        <span className="table-resize__grip" />
      </div>

      <button type="button" className="oc-btn oc-btn--ghost oc-addrow" onClick={() => onAddRow?.()}>
        <Icon name="plus" size={14} strokeWidth={2} />{tc.addRow}
      </button>

      {/* Acciones heredadas: en el diseño Opción C viven en el encabezado
          (escritorio) o en la barra inferior (móvil); aquí quedan ocultas. */}
      <div className="btn-row books-table-legacy-actions">
        <button type="button" className="btn btn--outline" onClick={onSave}>
          {t.step03.save}
        </button>
        <button type="button" className="btn btn--primary" onClick={onExport}>
          {t.step03.export}
        </button>
      </div>
      <button type="button" className="btn btn--ghost btn--history books-table-legacy-actions" onClick={onSaveHistory}>
        {t.step03.saveHistory}
      </button>

      {menu?.kind === 'punct' && menuCat && (
        <Popover anchor={menu.anchor} width={POP_WIDTH} onClose={closeMenu} className="punct-pop" label={t.punct.title}>
          <PunctPanel
            cat={menuCat}
            lang={lang}
            docType={docType}
            overrides={columnPunctuation}
            onPick={(value) => onPunctuationChange(menuCat.key, value)}
            onReset={() => onPunctuationReset(menuCat.key)}
          />
        </Popover>
      )}

      {menu?.kind === 'col' && menuCat && !isMobile && (
        <Popover anchor={menu.anchor} width={MENU_WIDTH} onClose={closeMenu} className="oc-pop oc-menu" role="menu" label={tc.options(colLabelOf(menuCat))} alignRight>
          <ColumnActions
            cat={menuCat}
            t={t}
            onInsertLeft={() => insertColumn(menu.index)}
            onInsertRight={() => insertColumn(menu.index + 1)}
            onRename={() => startRename(menuCat)}
            onRemove={() => removeColumn(menuCat)}
          />
        </Popover>
      )}

      {menu?.kind === 'col' && menuCat && isMobile && (
        <Sheet onClose={closeMenu} label={tc.options(colLabelOf(menuCat))}>
          <p className="oc-sheet__title">
            <b>{colLabelOf(menuCat)}</b>
            <span className="oc-badge">{menuCat.marcTag || tc.noMarc}</span>
          </p>
          <p className="oc-sheet__section">{tc.punctSection}</p>
          <PunctPanel
            cat={menuCat}
            lang={lang}
            docType={docType}
            overrides={columnPunctuation}
            onPick={(value) => onPunctuationChange(menuCat.key, value)}
            onReset={() => onPunctuationReset(menuCat.key)}
            compact
          />
          <div className="oc-menu__sep" />
          <ColumnActions
            cat={menuCat}
            t={t}
            onInsertLeft={() => insertColumn(menu.index)}
            onInsertRight={() => insertColumn(menu.index + 1)}
            onRename={() => startRename(menuCat)}
            onRemove={() => removeColumn(menuCat)}
          />
        </Sheet>
      )}

      {menu?.kind === 'row' && (
        <Popover anchor={menu.anchor} width={220} onClose={closeMenu} className="oc-pop oc-menu" role="menu" label={tc.rowOptions(menu.rowIndex + 2)} side>
          <button type="button" role="menuitem" className="oc-menu__item" onClick={() => rowAction(() => onInsertRow?.(menu.rowIndex))}>
            <Icon name="rowAbove" size={15} />{tc.insertRowAbove}
          </button>
          <button type="button" role="menuitem" className="oc-menu__item" onClick={() => rowAction(() => onInsertRow?.(menu.rowIndex + 1))}>
            <Icon name="rowBelow" size={15} />{tc.insertRowBelow}
          </button>
          <div className="oc-menu__sep" />
          <button type="button" role="menuitem" className="oc-menu__item oc-menu__item--danger" onClick={() => rowAction(() => onRemoveRow?.(menu.rowId))}>
            <Icon name="trash" size={15} />{tc.removeRow}
          </button>
        </Popover>
      )}
    </div>
  );
}

function ColumnActions({ cat, t, onInsertLeft, onInsertRight, onRename, onRemove }) {
  const tc = t.cols;
  return (
    <>
      <button type="button" role="menuitem" className="oc-menu__item" onClick={onInsertLeft}>
        <Icon name="colLeft" size={15} />{tc.insertLeft}
      </button>
      <button type="button" role="menuitem" className="oc-menu__item" onClick={onInsertRight}>
        <Icon name="colRight" size={15} />{tc.insertRight}
      </button>
      <div className="oc-menu__sep" />
      {cat.custom ? (
        <>
          <button type="button" role="menuitem" className="oc-menu__item" onClick={onRename}>
            <Icon name="pencil" size={15} />{tc.rename}
          </button>
          <button type="button" role="menuitem" className="oc-menu__item oc-menu__item--danger" onClick={onRemove}>
            <Icon name="trash" size={15} />{tc.remove}
          </button>
        </>
      ) : (
        <p className="oc-menu__note">{tc.marcProtected}</p>
      )}
    </>
  );
}

// Panel flotante renderizado en <body> con position: fixed para que el
// contenedor con scroll de la tabla no lo recorte.
function Popover({ anchor, width, onClose, className, role = 'dialog', label, children, alignRight, side }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ top: -9999, left: -9999, placement: 'below' });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const h = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let placement = 'below';
    let top;
    let left;
    if (side) {
      // Menú de fila: se abre a la derecha del número de fila.
      top = anchor.top;
      left = anchor.right + POP_GAP;
    } else {
      top = anchor.bottom + POP_GAP;
      if (top + h > vh - VIEWPORT_MARGIN && anchor.top - POP_GAP - h >= VIEWPORT_MARGIN) {
        placement = 'above';
        top = anchor.top - POP_GAP - h;
      }
      // Por defecto se abre hacia la derecha desde el ícono; si no cabe, se
      // alinea su borde derecho con el ícono (se abre hacia la izquierda).
      left = alignRight ? anchor.right - width : anchor.left - 8;
      if (left + width > vw - VIEWPORT_MARGIN) left = anchor.right + 8 - width;
    }
    top = Math.max(VIEWPORT_MARGIN, Math.min(top, vh - h - VIEWPORT_MARGIN));
    left = Math.max(VIEWPORT_MARGIN, Math.min(left, vw - width - VIEWPORT_MARGIN));
    setPos({ top, left, placement });
  }, [anchor, width, side, alignRight, children]);

  // Clic/toque fuera del panel lo cierra. Se ignoran los propios botones que
  // lo abren para que su onClick pueda alternar abrir/cerrar.
  useEffect(() => {
    const onDown = (e) => {
      if (ref.current?.contains(e.target)) return;
      if (e.target instanceof Element && e.target.closest('[data-pop-toggle]')) return;
      onClose();
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      className={`${className} ${className.includes('punct-pop') ? `punct-pop--${pos.placement}` : ''}`}
      style={{ position: 'fixed', top: pos.top, left: pos.left, width }}
      role={role}
      aria-label={label}
    >
      {children}
    </div>,
    document.body,
  );
}

// Panel inferior (móvil) para las opciones de columna.
function Sheet({ onClose, label, children }) {
  return createPortal(
    <>
      <div className="oc-sheet-overlay" onClick={onClose} />
      <section className="oc-sheet" role="dialog" aria-modal="true" aria-label={label}>
        <span className="oc-sheet__grip" aria-hidden="true" />
        {children}
      </section>
    </>,
    document.body,
  );
}

function PunctPanel({ cat, lang, docType, overrides, onPick, onReset, compact }) {
  const t = useT(lang);
  const colLabel = cat.colLabel[lang] || cat.colLabel.es;
  const overridden = hasOverride(overrides, cat.key);
  const rule = presetRuleFor(cat, docType);
  // Símbolo marcado: el override si existe; si no, el del preset cuando es
  // fijo. Un preset condicional (245$a) no marca ningún botón: depende de la fila.
  const selectedValue = overridden
    ? overrides[cat.key] || ''
    : typeof rule === 'string' ? rule : rule ? null : '';

  return (
    <>
      {!compact && (
        <p className="punct-pop__title">
          {t.punct.title} · <span>{colLabel}{cat.marcTag ? ` ${cat.marcTag}` : ''}</span>
        </p>
      )}
      <div className="punct-grid">
        {PUNCT_SYMBOLS.map((s) => {
          const selected = selectedValue === s.value;
          return (
            <button
              type="button"
              key={s.label}
              className={`punct-btn${s.value === '' ? ' punct-btn--none' : ''}${selected ? ' punct-btn--active' : ''}`}
              aria-label={s.label}
              aria-pressed={selected}
              onClick={() => onPick(s.value)}
            >
              {s.glyph}
            </button>
          );
        })}
      </div>
      <p className="punct-pop__caption">
        {overridden ? (
          <>{t.punct.manual}: <b>{symbolLabel(overrides[cat.key] || '')}</b></>
        ) : (
          <>{t.punct.preset}: <b>{describeRule(rule, t)}</b></>
        )}
      </p>
      <button type="button" className="punct-reset" onClick={onReset} disabled={!overridden}>
        {t.punct.reset}
      </button>
    </>
  );
}
