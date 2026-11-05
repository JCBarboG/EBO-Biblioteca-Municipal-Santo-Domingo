import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n/translations';
import Icon from '../components/Icons';
import ThemePreview from '../components/ThemePreview';
import ZoneEditor from '../components/ZoneEditor';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  PRESETS, ZONES, buildTokens, emptyTheme, isDefaultTheme, resolveColors, themeWarnings,
} from '../utils/colorTheme';

const ZONE_KIND = Object.fromEntries(ZONES.map((z) => [z.id, z.kind]));
const MOBILE = '(max-width: 1099px)';

export default function PersonalizeView({ onBack, showToast }) {
  const { lang, theme, setTheme, darkMode, setDarkMode } = useApp();
  const t = useT(lang);
  const tp = t.perso;

  const [edit, setEdit] = useState(null); // { zone, anchor }
  const [darkAsk, setDarkAsk] = useState(false);
  const [resetAsk, setResetAsk] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia?.(MOBILE).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(MOBILE);
    if (!mq) return undefined;
    const on = () => setMobile(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);

  const colors = useMemo(() => resolveColors(theme, darkMode), [theme, darkMode]);
  const warnings = useMemo(() => themeWarnings(theme, darkMode), [theme, darkMode]);
  const lightTokens = useMemo(() => buildTokens(resolveColors(theme, false), false), [theme]);
  const darkTokens = useMemo(() => buildTokens(resolveColors(theme, true), true), [theme]);

  // En modo oscuro se editan los ajustes del modo oscuro; en claro, los colores base.
  const bucket = darkMode ? 'dark' : 'colors';
  const setZone = useCallback((zone, hex) => {
    setTheme((prev) => ({ ...prev, [bucket]: { ...prev[bucket], [zone]: hex } }));
  }, [bucket, setTheme]);
  const resetZone = (zone) => {
    setTheme((prev) => {
      const next = { ...prev[bucket] };
      delete next[zone];
      return { ...prev, [bucket]: next };
    });
  };

  const applyPreset = (p) => {
    setTheme(p.id === 'original' ? emptyTheme() : { v: 1, colors: { ...p.colors }, dark: {} });
    showToast?.(tp.appliedPreset(tp.presetNames[p.id]));
  };
  const presetOn = (p) => {
    const a = theme.colors; const b = p.colors;
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return Object.keys(theme.dark).length === 0 && [...keys].every((k) => a[k] === b[k]);
  };

  const pick = useCallback((zone, rect) => setEdit({ zone, anchor: rect }), []);
  const closeEdit = useCallback(() => setEdit(null), []);

  const onDarkToggle = () => {
    if (darkMode) setDarkMode(false);
    else setDarkAsk(true);
  };

  const zoneWarn = (zone) => warnings.filter((w) => w.zone === zone).map((w) => w.code);
  const isCustom = (zone) => Boolean(theme[bucket][zone]);

  return (
    <div className="view perso">
      <div className="view-header">
        <button type="button" className="view-back" onClick={onBack} aria-label={t.ui.back}>
          <Icon name="chevronLeft" size={16} strokeWidth={2} />
        </button>
        <h2>{tp.title}</h2>
      </div>

      <div className="view-body perso__body">
        <div className="perso__main">
          <p className="perso__intro"><Icon name="palette" size={18} />{tp.intro}</p>
          <ThemePreview onPick={pick} active={edit?.zone} />
          <p className="perso__saved">{tp.saved}</p>
        </div>

        <aside className="perso__side">
          <section className="perso-card">
            <h3>{tp.presets}</h3>
            <div className="perso-presets">
              {PRESETS.map((p) => {
                const c = resolveColors({ v: 1, colors: p.colors, dark: {} }, false);
                const on = presetOn(p);
                return (
                  <button key={p.id} type="button" className={`perso-preset${on ? ' perso-preset--on' : ''}`} aria-pressed={on} onClick={() => applyPreset(p)}>
                    <span className="perso-preset__sw">
                      <i style={{ background: c.rail }} /><i style={{ background: c.bg }} /><i style={{ background: c.acc }} />
                    </span>
                    {tp.presetNames[p.id]}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="perso-card perso-dark">
            <div>
              <h3>{tp.darkTitle}</h3>
              <p>{tp.darkDesc}</p>
            </div>
            <button type="button" role="switch" aria-checked={darkMode} aria-label={tp.darkTitle}
              className={`toggle${darkMode ? ' toggle--on' : ''}`} onClick={onDarkToggle}>
              <span className="toggle__thumb" />
            </button>
          </section>
          {darkMode && <p className="perso-note">{tp.darkEditing}</p>}

          <section className="perso-card">
            <h3>{tp.zonesTitle}</h3>
            <ul className="perso-zones">
              {ZONES.map((z) => (
                <li key={z.id}>
                  <button type="button" className={`perso-zone${edit?.zone === z.id ? ' perso-zone--on' : ''}`}
                    onClick={(e) => pick(z.id, e.currentTarget.getBoundingClientRect())}>
                    <span className="perso-zone__sw" style={{ background: colors[z.id] }} />
                    <span className="perso-zone__name">{tp.zones[z.id][0]}</span>
                    {isCustom(z.id) && <span className="oc-badge">{tp.changed}</span>}
                    {zoneWarn(z.id).length > 0 && <Icon name="alert" size={14} className="perso-zone__warn" />}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="perso-card">
            <h3>{tp.warningsTitle}</h3>
            {warnings.length === 0
              ? <p className="perso-ok"><Icon name="check" size={15} strokeWidth={2} />{tp.noWarnings}</p>
              : <ul className="perso-warns">{warnings.map((w) => <li key={w.code}><Icon name="alert" size={14} />{tp.warn[w.code]}</li>)}</ul>}
          </section>

          <button type="button" className="oc-btn perso-reset" onClick={() => setResetAsk(true)} disabled={isDefaultTheme(theme)}>
            <Icon name="reset" size={15} />{tp.reset}
          </button>
        </aside>
      </div>

      {edit && (
        <ZoneEditor
          zone={edit.zone}
          kind={ZONE_KIND[edit.zone]}
          value={colors[edit.zone]}
          isCustom={isCustom(edit.zone)}
          anchor={edit.anchor}
          sheet={mobile}
          warnings={zoneWarn(edit.zone)}
          darkEditing={darkMode}
          onChange={(hex) => setZone(edit.zone, hex)}
          onReset={() => resetZone(edit.zone)}
          onClose={closeEdit}
        />
      )}

      <ConfirmDialog
        open={darkAsk}
        title={tp.darkModalTitle}
        message={tp.darkModalText}
        onCancel={() => setDarkAsk(false)}
        actions={[
          { label: tp.cancel, variant: 'outline', onClick: () => setDarkAsk(false) },
          { label: tp.darkApply, variant: 'primary', onClick: () => { setDarkAsk(false); setDarkMode(true); } },
        ]}
      >
        <div className="perso-compare">
          <figure><ThemePreview interactive={false} tokens={lightTokens} /><figcaption>{tp.darkLight}</figcaption></figure>
          <figure><ThemePreview interactive={false} tokens={darkTokens} /><figcaption>{tp.darkDark}</figcaption></figure>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={resetAsk}
        title={tp.resetTitle}
        message={tp.resetText}
        onCancel={() => setResetAsk(false)}
        actions={[
          { label: tp.cancel, variant: 'outline', onClick: () => setResetAsk(false) },
          { label: tp.reset, variant: 'danger', onClick: () => { setResetAsk(false); setTheme(emptyTheme()); showToast?.(tp.resetDone); } },
        ]}
      />
    </div>
  );
}
