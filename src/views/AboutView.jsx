import { useApp } from '../context/AppContext';
import { useT } from '../i18n/translations';
import { LIBRARY_NAME } from '../i18n/library';
import Icon from '../components/Icons';
import Logo from '../components/Logo';

export default function AboutView({ onBack, onNavigate }) {
  const { lang } = useApp();
  const t = useT(lang);
  const ta = t.about;

  return (
    <div className="view">
      <div className="view-header">
        <button type="button" className="view-back" onClick={onBack} aria-label={t.ui.back}><Icon name="chevronLeft" size={16} strokeWidth={2} /></button>
        <h2>{ta.title}</h2>
      </div>

      <div className="view-body">
        <div className="about-logo-section">
          <Logo size={112} className="about-logo" />
          <p className="about-ebo-title">EBO</p>
          <span className="about-version-badge">{LIBRARY_NAME}</span>
          <p className="about-tagline">{ta.tagline}</p>
        </div>

        <div className="about-prose">
          <p>{ta.desc1}</p>
          <p>{ta.desc2}</p>
        </div>

        <div className="about-meta">
          <div className="about-meta__row">
            <span className="about-meta__label">{ta.ownerLabel}</span>
            <span className="about-meta__value">{ta.ownerName}</span>
          </div>
          <div className="about-meta__row">
            <span className="about-meta__label">{ta.versionLabel}</span>
            <span className="about-meta__value">{ta.versionValue}</span>
          </div>
        </div>

        <div className="about-links">
          <button type="button" className="about-link-btn" onClick={() => onNavigate('terms')}>
            {ta.terms}
          </button>
          <button type="button" className="about-link-btn" onClick={() => onNavigate('privacy')}>
            {ta.privacy}
          </button>
        </div>
      </div>
    </div>
  );
}
