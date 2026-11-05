import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Ventana modal simple. `actions`: [{ label, onClick, variant: 'primary' | 'outline' | 'danger' | 'ghost' }].
// Esc y clic en el fondo equivalen a `onCancel`.
export default function ConfirmDialog({ open, title, message, children, actions, onCancel }) {
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Foco en el último botón (acción principal) para teclado.
    const btns = boxRef.current?.querySelectorAll('button');
    btns?.[btns.length - 1]?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="dialog-overlay" onClick={onCancel}>
      <div
        ref={boxRef}
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <p id="dialog-title" className="dialog__title">{title}</p>
        {message && <p className="dialog__message">{message}</p>}
        {children}
        <div className="dialog__actions">
          {actions.map((a) => (
            <button key={a.label} type="button" className={`btn btn--${a.variant || 'outline'}`} onClick={a.onClick}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
