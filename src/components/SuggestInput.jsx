import { useMemo, useState } from 'react';

// Casilla con sugerencias de la base. `getOptions(texto)` devuelve
// [{ label, count? }]. Con `terms`, cada término se completa por separado y se
// unen con " - ", como las materias de la biblioteca.
const lastTerm = (value) => value.split(/\s*-+\s*|;/).pop() || '';

export default function SuggestInput({ value, onChange, getOptions, terms = false, showOnFocus = false, ...inputProps }) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);

  const query = terms ? lastTerm(value) : value;
  const options = useMemo(() => (open ? getOptions(query) : []), [open, query, getOptions]);
  const listId = `${inputProps.id}-sugerencias`;

  const pick = (label) => {
    if (terms) {
      const head = value.slice(0, value.length - lastTerm(value).length).replace(/\s*-+\s*$|;\s*$/, '');
      onChange(head ? `${head} - ${label}` : label);
    } else {
      onChange(label);
    }
    setOpen(false);
    setCursor(-1);
  };

  const handleKeyDown = (e) => {
    if (!open || options.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => (c + 1) % options.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => (c <= 0 ? options.length - 1 : c - 1)); }
    else if (e.key === 'Enter' && cursor >= 0) { e.preventDefault(); pick(options[cursor].label); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div className="suggest">
      <input
        {...inputProps}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && options.length > 0}
        aria-controls={listId}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setCursor(-1); }}
        onFocus={() => { if (showOnFocus) setOpen(true); }}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
      />
      {open && options.length > 0 && (
        <ul className="suggest__list" id={listId} role="listbox">
          {options.map((opt, i) => (
            <li
              key={opt.label}
              role="option"
              aria-selected={cursor === i}
              className={`suggest__item${cursor === i ? ' suggest__item--on' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); pick(opt.label); }}
            >
              <span>{opt.label}</span>
              {opt.count > 0 && <span className="suggest__count">{opt.count}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
