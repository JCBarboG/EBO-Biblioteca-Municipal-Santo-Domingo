import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n/translations';
import Icon from '../components/Icons';

export default function PremiumView({ onBack }) {
  const { lang } = useApp();
  const t = useT(lang);
  const tp = t.premium;

  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const total = tp.slides.length;

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setSlide((s) => (s + 1) % total);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [paused, total]);

  const goTo = (i) => {
    setSlide(i);
    clearInterval(timerRef.current);
    setPaused(false);
  };

  return (
    <div className="view">
      <div className="view-header">
        <button type="button" className="view-back" onClick={onBack} aria-label={t.ui.back}><Icon name="chevronLeft" size={16} strokeWidth={2} /></button>
        <h2>{tp.title}</h2>
      </div>

      <div className="view-body">
        {/* Hero */}
        <div className="premium-hero">
          <span className="premium-badge">{tp.badge}</span>
          <h2 className="premium-hero__title">{tp.hero}</h2>
          <p className="premium-hero__desc">{tp.heroDesc}</p>
          <div className="premium-dev-notice">
            <Icon name="alert" size={16} strokeWidth={1.8} className="premium-dev-notice__icon" /> <span>{tp.devNotice}</span>
          </div>
        </div>

        {/* Carousel */}
        <div
          className="premium-carousel"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <button
            type="button"
            className="carousel-nav carousel-nav--prev"
            onClick={() => goTo((slide - 1 + total) % total)}
            aria-label="Anterior"
          >
            <Icon name="chevronLeft" size={16} strokeWidth={2} />
          </button>

          <div className="carousel-track">
            {tp.slides.map((s, i) => (
              <div
                key={i}
                className={`carousel-slide${i === slide ? ' carousel-slide--active' : ''}`}
              >
                <span className="carousel-slide__label">{s.label}</span>
                <h3 className="carousel-slide__title">{s.title}</h3>
                <p className="carousel-slide__desc">{s.desc}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="carousel-nav carousel-nav--next"
            onClick={() => goTo((slide + 1) % total)}
            aria-label="Siguiente"
          >
            <Icon name="chevronRight" size={16} strokeWidth={2} />
          </button>

          <div className="carousel-dots">
            {tp.slides.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`carousel-dot${i === slide ? ' carousel-dot--active' : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Features grid */}
        <div className="premium-features">
          {tp.features.map((f, i) => (
            <div key={i} className="premium-feature">
              <span className="premium-feature__label">{f.label}</span>
            </div>
          ))}
        </div>

        {/* Closing */}
        <p className="premium-closing">{tp.closing}</p>
      </div>
    </div>
  );
}
