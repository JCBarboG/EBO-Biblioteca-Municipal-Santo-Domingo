import { useApp } from '../context/AppContext';
import { useT } from '../i18n/translations';
import { useLibraryT } from '../i18n/library';
import Icon from '../components/Icons';

export default function GuideView({ onBack }) {
  const { lang } = useApp();
  const t = useT(lang);
  const tl = useLibraryT(lang);
  const tg = t.guide;

  return (
    <div className="view">
      <div className="view-header">
        <button type="button" className="view-back" onClick={onBack} aria-label={t.ui.back}><Icon name="chevronLeft" size={16} strokeWidth={2} /></button>
        <h2>{tg.title}</h2>
      </div>

      <div className="view-body guide-body">
        <p className="guide-intro">{tg.intro}</p>

        {/* Paso 01 — elegir tipo de documento */}
        <section className="guide-step">
          <div className="guide-step__head">
            <span className="guide-step__num">01</span>
            <h3>{tg.step1.title}</h3>
          </div>
          <p className="guide-step__desc">{tg.step1.desc}</p>
          <div className="guide-visual">
            <div className="guide-chip-row">
              {tg.step1.chips.map((label, i) => (
                <span key={i} className={`chip${i === 0 ? ' chip--active' : ''}`}>{label}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Paso 02 — seleccionar texto y asignarlo */}
        <section className="guide-step">
          <div className="guide-step__head">
            <span className="guide-step__num">02</span>
            <h3>{tg.step2.title}</h3>
          </div>
          <p className="guide-step__desc">{tg.step2.desc}</p>
          <div className="guide-visual guide-visual--split">
            <div className="guide-text-demo">
              {tg.step2.textBefore}
              <mark className="guide-highlight">{tg.step2.textHighlight}</mark>
              {tg.step2.textAfter}
            </div>
            <span className="guide-arrow" aria-hidden="true">→</span>
            <div className="guide-field-demo category-grid__item">
              <div className="category-grid__head">
                <label>{tg.step2.fieldLabel}</label>
                <span className="category-grid__tag">{tg.step2.fieldTag}</span>
              </div>
              <div className="guide-field-demo__value">{tg.step2.textHighlight}</div>
            </div>
          </div>
        </section>

        {/* Paso 03 — revisar tabla, puntuación y exportar */}
        <section className="guide-step">
          <div className="guide-step__head">
            <span className="guide-step__num">03</span>
            <h3>{tg.step3.title}</h3>
          </div>
          <p className="guide-step__desc">{tg.step3.desc}</p>
          <div className="guide-visual">
            <div className="excel-wrap guide-table-demo">
              <table className="excel-table">
                <thead>
                  <tr className="field-names">
                    <th className="field-names__cell">
                      <span className="col-punct-corner col-punct-corner--active" />
                      <span className="field-names__label">
                        {tg.step3.col1Label}
                        <span className="field-names__tag">{tg.step3.col1Tag}</span>
                      </span>
                    </th>
                    <th className="field-names__cell">
                      <span className="col-punct-corner" />
                      <span className="field-names__label">
                        {tg.step3.col2Label}
                        <span className="field-names__tag">{tg.step3.col2Tag}</span>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{tg.step3.row1}</td>
                    <td>{tg.step3.row2}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="guide-caption">{tg.step3.caption}</p>
          </div>
        </section>

        {/* Paso 04 — campos y columnas propias (nuevo) */}
        <section className="guide-step guide-step--new">
          <div className="guide-step__head">
            <span className="guide-step__num">04</span>
            <h3>{tg.step4.title}</h3>
          </div>
          <p className="guide-step__desc">{tg.step4.desc}</p>
          <div className="guide-visual">
            <div className="guide-demo-line">{tg.step4.demo}</div>
          </div>
        </section>

        <section className="guide-step">
          <div className="guide-step__head">
            <span className="guide-step__num">05</span>
            <h3>{tl.guideTitle}</h3>
          </div>
          <ul className="guide-library">
            {tl.guideItems.map(([title, desc]) => (
              <li key={title}><strong>{title}.</strong> {desc}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
