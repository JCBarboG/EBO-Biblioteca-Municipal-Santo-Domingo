import { useApp } from '../context/AppContext';
import { useT } from '../i18n/translations';
import Icon from './Icons';

// Ícono flotante de ayuda: siempre visible en la esquina inferior derecha
// mientras dure la sesión. Si el usuario lo cierra con la "x", desaparece
// hasta que la app se recargue — no hay persistencia (ver
// project_ebo_cliente_ui_decisions.md, mismo patrón que columnPunctuation).
// El estado `visible` vive en App.jsx (no aquí) para que no se reinicie al
// simplemente navegar entre vistas.
export default function HelpButton({ visible, onOpen, onDismiss }) {
  const { lang } = useApp();
  const t = useT(lang);

  if (!visible) return null;

  return (
    <div className="help-fab">
      <button
        type="button"
        className="help-fab__btn"
        onClick={onOpen}
        aria-label={t.help.open}
      >
        ?
      </button>
      <button
        type="button"
        className="help-fab__close"
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        aria-label={t.help.dismiss}
      >
        <Icon name="close" size={12} strokeWidth={2.2} />
      </button>
    </div>
  );
}
