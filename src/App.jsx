import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from './context/AppContext';
import { useT } from './i18n/translations';
import { emptyFieldsForType } from './constants/docTypes';
import { useLibraryT, LIBRARY_NAME } from './i18n/library';
import { findDuplicates, isStrongDuplicate, loadCatalog } from './utils/catalog';
import { validateRecord } from './utils/validateRecord';
import { nextRecordId, rememberRecordId } from './utils/recordId';
import { exportBooksToExcel } from './utils/exportExcel';
import { getColumns, newCustomColumn } from './utils/columns';
import { rotateImageBlob } from './utils/rotateImage';
import { useOcrWorker } from './hooks/useOcrWorker';
import { useToast } from './hooks/useToast';

import ImageInput from './components/ImageInput';
import OcrProgress from './components/OcrProgress';
import TextEditor from './components/TextEditor';
import CategoryFields from './components/CategoryFields';
import BooksTable from './components/BooksTable';
import CatalogAssistant from './components/CatalogAssistant';
import Footer from './components/Footer';
import Toast from './components/Toast';
import Drawer from './components/Drawer';
import ConfigPanel from './components/ConfigPanel';
import DocTypeSelector from './components/DocTypeSelector';
import HelpButton from './components/HelpButton';
import ConfirmDialog from './components/ConfirmDialog';
import NavRail from './components/NavRail';
import AddFieldPanel from './components/AddFieldPanel';
import Icon, { DotsIcon } from './components/Icons';

import SupportView from './views/SupportView';
import AboutView from './views/AboutView';
import PremiumView from './views/PremiumView';
import TermsView from './views/TermsView';
import PrivacyView from './views/PrivacyView';
import GuideView from './views/GuideView';
import HistoryView from './views/HistoryView';
import PersonalizeView from './views/PersonalizeView';
import CatalogView from './views/CatalogView';

import {
  HISTORY_LIMIT, HistoryQuotaError, createPackage, formatPackageDate, loadHistory,
  oldestPackage, packageFileStamp, writeHistory,
} from './utils/history';

import './App.css';

const MAX_IMAGES = 3;
const PINNED_KEY = 'ebo-bmsd:pinned';

function loadPinned() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PINNED_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function checkPortrait(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img.naturalHeight >= img.naturalWidth); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(true); };
    img.src = url;
  });
}

export default function App() {
  const { lang, docType, setDocType } = useApp();
  const t = useT(lang);
  const tl = useLibraryT(lang);

  const [view, setView] = useState('main');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  const [images, setImages] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [orientationWarn, setOrientationWarn] = useState('');
  const [helpVisible, setHelpVisible] = useState(true);

  const [ocrText, setOcrText] = useState('');
  const [fields, setFields] = useState(() => emptyFieldsForType(docType));
  const [records, setRecords] = useState([]);
  // Catálogo de la biblioteca (solo lectura) y ayudas que dependen de él.
  const [catalog, setCatalog] = useState({ index: null, status: 'loading' });
  // Campos que se conservan para el siguiente registro (la tachuela).
  const [pinned, setPinned] = useState(loadPinned);
  // Registro del que salieron los datos del formulario: no cuenta como duplicado.
  const [ignoredRecord, setIgnoredRecord] = useState(null);
  // Revisión antes de guardar: { issues, duplicates }.
  const [saveReview, setSaveReview] = useState(null);
  // Datos a cargar cuando un registro cambia el tipo de documento.
  const pendingFieldsRef = useRef(null);
  const [selection, setSelection] = useState({ start: 0, end: 0, text: '' });
  const [activeChip, setActiveChip] = useState(null);
  // Overrides manuales de puntuación por columna ({ [fieldKey]: símbolo }).
  // Sin entrada = se usa el preset del tipo de documento
  // (config/punctuationPresets.js). Pertenecen al tipo de documento actual.
  const [columnPunctuation, setColumnPunctuation] = useState({});
  // Ventana modal activa del historial: { kind: 'load' | 'limit' | 'quota', ... }
  const [historyDialog, setHistoryDialog] = useState(null);
  // Overrides a restaurar cuando un paquete del historial cambia el tipo de
  // documento (el efecto de docType limpia los overrides; ver abajo).
  const pendingOverridesRef = useRef(null);

  // Columnas propias por tipo de documento: { libro: [{ key, label, marcTag, custom }] }
  // y orden visible por tipo: { libro: ['fuenteCatA', ..., 'custom_x'] }.
  // Solo viven en la sesión (y en los paquetes del historial), igual que la
  // puntuación manual: no se guardan en localStorage por separado.
  const [customColumns, setCustomColumns] = useState({});
  const [columnOrder, setColumnOrder] = useState({});
  // Columna recién creada: se resalta con un destello breve.
  const [flashKey, setFlashKey] = useState(null);
  const flashTimerRef = useRef(null);
  // Diálogos nuevos: vaciar tabla y eliminar columna propia.
  const [clearOpen, setClearOpen] = useState(false);
  const [columnToRemove, setColumnToRemove] = useState(null);
  // Menús de presentación (Opción C): flecha de Exportar y "⋯" de la barra móvil.
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  const chipTimerRef = useRef(null);
  const imagesRef = useRef([]);
  const textareaRef = useRef(null);

  const { recognize, progress, statusLabel, isProcessing, error: ocrError } = useOcrWorker();
  const { toastMessage, showToast } = useToast();

  useEffect(() => { imagesRef.current = images; }, [images]);
  useEffect(() => () => {
    imagesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    if (chipTimerRef.current) clearTimeout(chipTimerRef.current);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
  }, []);

  const columns = useMemo(
    () => getColumns(docType, customColumns, columnOrder),
    [docType, customColumns, columnOrder],
  );

  // Cada tipo tiene sus columnas: la tabla y el Excel muestran solo las filas
  // del tipo actual, para que una revista no pierda datos al exportar como libro.
  const visibleRecords = useMemo(
    () => records.filter((r) => (r._type || docType) === docType),
    [records, docType],
  );
  const nextId = useMemo(() => nextRecordId(records), [records]);

  useEffect(() => {
    let active = true;
    loadCatalog()
      .then((index) => { if (active) setCatalog({ index, status: 'ready' }); })
      .catch(() => { if (active) setCatalog({ index: null, status: 'error' }); });
    return () => { active = false; };
  }, []);

  /** Formulario vacío del tipo, conservando los campos con tachuela. */
  const blankFields = (prev, type = docType) => {
    const blank = emptyFieldsForType(type);
    pinned.forEach((key) => {
      if (key in blank && String(prev[key] || '').trim()) blank[key] = prev[key];
    });
    return blank;
  };

  const handleTogglePin = (key) => {
    setPinned((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      try { localStorage.setItem(PINNED_KEY, JSON.stringify(next)); } catch { /* sin espacio */ }
      return next;
    });
  };

  useEffect(() => {
    const pendingFields = pendingFieldsRef.current;
    pendingFieldsRef.current = null;
    setFields((prev) => pendingFields || blankFields(prev));
    // Las columnas cambian de significado entre tipos de documento, así que
    // la puntuación asignada manualmente no debe arrastrarse de un tipo a otro:
    // al cambiar de tipo se carga el preset limpio del nuevo tipo. Excepción:
    // al cargar un paquete del historial se restauran sus overrides.
    setColumnPunctuation(pendingOverridesRef.current || {});
    pendingOverridesRef.current = null;
  }, [docType]);

  const handleNewRecord = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setCurrentIdx(0);
    setOrientationWarn('');
    setOcrText('');
    setFields(emptyFieldsForType(docType));
    setIgnoredRecord(null);
    setSelection({ start: 0, end: 0, text: '' });
    setDocType('libro');
    setView('main');
  };

  const handleImageAdded = (file) => {
    if (images.length >= MAX_IMAGES) return;
    setOrientationWarn('');
    const url = URL.createObjectURL(file);
    setImages((prev) => {
      const next = [...prev, { file, previewUrl: url }];
      setCurrentIdx(next.length - 1);
      return next;
    });
    setOcrText('');
    setFields(blankFields);
    setSelection({ start: 0, end: 0, text: '' });
  };

  const handleNavigate = (idx) =>
    setCurrentIdx(Math.max(0, Math.min(idx, images.length - 1)));

  const handleRotate = async () => {
    const cur = images[currentIdx];
    if (!cur) return;
    setOrientationWarn('');
    try {
      const rotated = await rotateImageBlob(cur.file, 90);
      const newUrl = URL.createObjectURL(rotated);
      URL.revokeObjectURL(cur.previewUrl);
      setImages((prev) => prev.map((img, i) =>
        i === currentIdx ? { file: rotated, previewUrl: newUrl } : img
      ));
    } catch {
      showToast(t.toastRotateError);
    }
  };

  const handleClearAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setCurrentIdx(0);
    setOrientationWarn('');
    setOcrText('');
    setFields((prev) => blankFields(prev));
    setSelection({ start: 0, end: 0, text: '' });
  };

  const handleExtract = async () => {
    if (images.length === 0 || isProcessing) return;
    const portraits = await Promise.all(images.map((img) => checkPortrait(img.file)));
    const bad = portraits.findIndex((p) => !p);
    if (bad !== -1) {
      const label = t.orientationLabel(bad + 1, images.length);
      setOrientationWarn(t.orientationWarning(label));
      setCurrentIdx(bad);
      return;
    }
    setOrientationWarn('');
    try {
      const texts = await recognize(images.map((img) => img.file));
      setOcrText(texts.join('\n\n---\n\n'));
    } catch { /* error shown via ocrError */ }
  };

  const handleAssign = (key) => {
    const frag = selection.text.trim();
    if (!frag) return;
    // El idioma ya viene marcado: lo seleccionado lo reemplaza, no se le suma.
    setFields((prev) => ({ ...prev, [key]: prev[key] && key !== 'idioma' ? `${prev[key]}; ${frag}` : frag }));
    setActiveChip(key);
    if (chipTimerRef.current) clearTimeout(chipTimerRef.current);
    chipTimerRef.current = setTimeout(() => setActiveChip(null), 400);

    // Limpiar la selección tras asignar: evita que un clic posterior en otra
    // casilla vacía pegue el mismo fragmento por accidente (ver
    // project_ebo_cliente_ui_decisions.md).
    setSelection({ start: 0, end: 0, text: '' });
    const ta = textareaRef.current;
    if (ta) {
      const pos = ta.selectionEnd;
      ta.setSelectionRange(pos, pos);
    }
  };

  const commitSave = () => {
    const next = { ...fields };
    // La columna "id" sigue la numeración de la base si la persona la deja vacía.
    if ('registroId' in next && !String(next.registroId).trim()) {
      next.registroId = String(nextId);
      rememberRecordId(nextId);
    }
    setRecords((prev) => [...prev, { id: crypto.randomUUID(), _type: docType, ...next }]);
    setFields(blankFields(fields));
    setIgnoredRecord(null);
    setSaveReview(null);
    showToast(t.step03.saved(docType));
  };

  const handleSave = () => {
    // El idioma marcado y los campos con tachuela no cuentan como datos nuevos.
    const hasData = Object.entries(fields).some(([key, v]) => key !== 'idioma' && !pinned.includes(key) && String(v).trim());
    if (!hasData) { showToast(t.step03.noData); return; }
    const issues = validateRecord(fields, docType);
    const ownId = String(fields.registroId || '').trim();
    const duplicates = findDuplicates(catalog.index, fields, visibleRecords, docType)
      .filter(isStrongDuplicate)
      .filter((d) => d.rec !== ignoredRecord && !(ownId && d.rec.registroId === ownId));
    if (issues.length || duplicates.length) { setSaveReview({ issues, duplicates }); return; }
    commitSave();
  };

  const handleExport = () => {
    if (visibleRecords.length === 0) { showToast(t.step03.noRecords); return; }
    showToast(t.step03.exporting(visibleRecords.length));
    exportBooksToExcel(visibleRecords, docType, lang, columnPunctuation, '', columns);
  };

  // ── Datos que vienen del catálogo ──
  /** Pone un registro en el formulario; si es de otra familia de columnas, cambia el tipo. */
  const loadIntoForm = (rec, overrides) => {
    let target = docType;
    if (rec._type === 'revista') target = 'revista';
    else if (docType === 'revista') target = 'libro';
    const values = emptyFieldsForType(target);
    Object.keys(values).forEach((key) => { if (rec[key]) values[key] = rec[key]; });
    Object.assign(values, overrides);
    setIgnoredRecord(rec);
    if (target === docType) {
      setFields(values);
    } else {
      pendingFieldsRef.current = values;
      setDocType(target);
    }
    setSaveReview(null);
    setView('main');
  };

  const handleAddCopy = ({ rec, source }) => {
    // Un ejemplares vacío en la base significa que hay al menos uno.
    const copies = (parseInt(rec.ejemplares, 10) || 1) + 1;
    if (source === 'tabla') {
      handleCellChange(rec.id, 'ejemplares', String(copies));
      setFields((prev) => blankFields(prev));
      setSaveReview(null);
      showToast(tl.addedCopyTable(copies));
      return;
    }
    loadIntoForm(rec, { ejemplares: String(copies) });
    showToast(tl.addedCopy(copies));
  };

  const handleUseData = (rec) => {
    const issue = rec._type === 'revista' ? { numeroRevista: '', fechaRevista: '', numeroVolumen: '' } : {};
    loadIntoForm(rec, { registroId: '', ejemplares: '', ...issue });
    showToast(tl.usedData);
  };

  const handleDuplicateLast = () => {
    const last = visibleRecords[visibleRecords.length - 1];
    if (!last) { showToast(tl.noLast); return; }
    const values = {};
    columns.forEach((c) => { values[c.key] = last[c.key] || ''; });
    values.registroId = '';
    ['numeroRevista', 'fechaRevista', 'numeroVolumen'].forEach((key) => { if (key in values) values[key] = ''; });
    setFields(values);
    setIgnoredRecord(last);
    showToast(tl.duplicatedLast);
  };

  const handlePunctuationChange = (key, value) => {
    setColumnPunctuation((prev) => ({ ...prev, [key]: value }));
  };

  const handlePunctuationReset = (key) => {
    setColumnPunctuation((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // ── Historial ──
  const downloadPackage = (pkg) => {
    // Paquetes nuevos: con sus columnas propias y su orden. Paquetes viejos
    // (sin esos datos): solo las columnas MARC, como siempre.
    const pkgColumns = Array.isArray(pkg.customColumns)
      ? getColumns(pkg.docType, { [pkg.docType]: pkg.customColumns }, { [pkg.docType]: pkg.columnOrder })
      : null;
    exportBooksToExcel(pkg.rows, pkg.docType, lang, pkg.overrides || {}, packageFileStamp(pkg.createdAt), pkgColumns);
  };

  const commitHistory = (pkg, list) => {
    try {
      writeHistory([pkg, ...list]);
      setHistoryDialog(null);
      showToast(t.step03.historySaved);
    } catch (e) {
      if (e instanceof HistoryQuotaError) setHistoryDialog({ kind: 'quota' });
      else { setHistoryDialog(null); showToast(t.history.quotaTitle); }
    }
  };

  const handleSaveHistory = () => {
    if (visibleRecords.length === 0) { showToast(t.step03.historyEmpty); return; }
    const pkg = createPackage(visibleRecords, docType, columnPunctuation, {
      customColumns: customColumns[docType] || [],
      columnOrder: columnOrder[docType] || null,
    });
    const list = loadHistory();
    if (list.length >= HISTORY_LIMIT) {
      setHistoryDialog({ kind: 'limit', pkg, list, oldest: oldestPackage(list) });
      return;
    }
    commitHistory(pkg, list);
  };

  const resolveLimit = (download) => {
    const { pkg, list, oldest } = historyDialog;
    if (download) downloadPackage(oldest);
    // Si todavía sobra (p. ej. >50 por datos viejos), se recorta a 49 + el nuevo.
    const kept = list.filter((p) => p.id !== oldest.id).slice(0, HISTORY_LIMIT - 1);
    commitHistory(pkg, kept);
  };

  const applyPackage = (pkg) => {
    setRecords(pkg.rows.map((r) => ({ ...r, id: r.id || crypto.randomUUID() })));
    // Columnas propias del paquete. Los paquetes viejos no las traen: en ese
    // caso no se toca nada y cargan igual que antes.
    if (Array.isArray(pkg.customColumns)) {
      setCustomColumns((prev) => ({ ...prev, [pkg.docType]: pkg.customColumns.map((c) => ({ ...c })) }));
      setColumnOrder((prev) => {
        const next = { ...prev };
        if (Array.isArray(pkg.columnOrder) && pkg.columnOrder.length) next[pkg.docType] = [...pkg.columnOrder];
        else delete next[pkg.docType];
        return next;
      });
    }
    if (pkg.docType === docType) {
      setColumnPunctuation({ ...(pkg.overrides || {}) });
    } else {
      pendingOverridesRef.current = { ...(pkg.overrides || {}) };
      setDocType(pkg.docType);
    }
    setHistoryDialog(null);
    setView('main');
    showToast(t.history.loaded(pkg.rows.length));
  };

  const handleLoadPackage = (pkg) => {
    if (records.length > 0) setHistoryDialog({ kind: 'load', pkg });
    else applyPackage(pkg);
  };

  // Vaciar tabla: misma acción de siempre, ahora confirmada con ConfirmDialog.
  const handleClearRecords = () => {
    setClearOpen(true);
  };
  const confirmClearRecords = () => {
    setClearOpen(false);
    setRecords((prev) => prev.filter((r) => (r._type || docType) !== docType));
  };

  // ── Columnas propias ──
  const flashColumn = (key) => {
    setFlashKey(key);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashKey(null), 1600);
  };

  /** Crea una columna propia en `index` del orden visible (al final si no se indica). Devuelve su clave. */
  const addCustomColumn = (label, marcTag = '', index) => {
    const col = newCustomColumn(label, marcTag);
    const order = columns.map((c) => c.key);
    const at = index == null ? order.length : Math.max(0, Math.min(index, order.length));
    order.splice(at, 0, col.key);
    setCustomColumns((prev) => ({ ...prev, [docType]: [...(prev[docType] || []), col] }));
    setColumnOrder((prev) => ({ ...prev, [docType]: order }));
    flashColumn(col.key);
    return col.key;
  };

  const handleAddField = (label, marcTag) => {
    addCustomColumn(label, marcTag);
  };

  const handleInsertColumn = (index) => addCustomColumn(t.cols.newColumn, '', index);

  const handleRenameColumn = (key, label) => {
    setCustomColumns((prev) => ({
      ...prev,
      [docType]: (prev[docType] || []).map((c) => (c.key === key ? { ...c, label } : c)),
    }));
  };

  const handleRemoveColumn = (key, label) => {
    setColumnToRemove({ key, label });
  };

  const confirmRemoveColumn = () => {
    const { key } = columnToRemove;
    setColumnToRemove(null);
    setCustomColumns((prev) => ({ ...prev, [docType]: (prev[docType] || []).filter((c) => c.key !== key) }));
    setColumnOrder((prev) => (prev[docType] ? { ...prev, [docType]: prev[docType].filter((k) => k !== key) } : prev));
    setRecords((prev) => prev.map((r) => {
      if (!Object.prototype.hasOwnProperty.call(r, key)) return r;
      const next = { ...r };
      delete next[key];
      return next;
    }));
    setFields((prev) => {
      if (!Object.prototype.hasOwnProperty.call(prev, key)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    handlePunctuationReset(key);
  };

  // ── Tabla editable ──
  const handleCellChange = (rowId, key, value) => {
    setRecords((prev) => prev.map((r) => (r.id === rowId ? { ...r, [key]: value } : r)));
  };

  const handleInsertRow = (index) => {
    // `index` es la posición en la tabla visible, que solo tiene filas del tipo actual.
    const anchor = visibleRecords[index];
    setRecords((prev) => {
      const next = [...prev];
      const at = anchor ? next.indexOf(anchor) : next.length;
      next.splice(at, 0, { id: crypto.randomUUID(), _type: docType });
      return next;
    });
  };

  const handleRemoveRow = (rowId) => {
    setRecords((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleAddRow = () => handleInsertRow(visibleRecords.length);

  const handleDocTypeChange = () => {
    setFields((prev) => blankFields(prev));
  };

  const openConfig = () => {
    setDrawerOpen(false);
    setConfigOpen(true);
  };

  const goTo = (v) => {
    setDrawerOpen(false);
    setConfigOpen(false);
    setView(v);
  };

  const shell = (content) => (
    <>
      <div className={`oc-shell oc-shell--${view}`}>
        <NavRail
          view={view}
          configOpen={configOpen}
          onNavigate={goTo}
          onOpenConfig={() => { setDrawerOpen(false); setConfigOpen((o) => !o); }}
          onNewRecord={handleNewRecord}
        />
        <div className="oc-body">
          <MobileHeader
            showDocType={view === 'main'}
            onDocTypeChange={handleDocTypeChange}
            onHamburger={() => setDrawerOpen(true)}
            onLogoClick={() => setView('main')}
          />
          {content}
          <Footer />
        </div>
      </div>
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNewRecord={handleNewRecord}
        onExport={handleExport}
        onOpenConfig={openConfig}
        onNavigate={(v) => setView(v)}
      />
      <ConfigPanel open={configOpen} onClose={() => setConfigOpen(false)} onPersonalize={() => goTo('personalize')} />
      <Toast message={toastMessage} />
      <ConfirmDialog
        open={historyDialog?.kind === 'load'}
        title={t.history.loadTitle}
        message={t.history.loadMessage}
        onCancel={() => setHistoryDialog(null)}
        actions={[
          { label: t.history.cancel, variant: 'outline', onClick: () => setHistoryDialog(null) },
          { label: t.history.load, variant: 'primary', onClick: () => applyPackage(historyDialog.pkg) },
        ]}
      />
      <ConfirmDialog
        open={historyDialog?.kind === 'limit'}
        title={t.history.limitTitle}
        message={t.history.limitMessage}
        onCancel={() => setHistoryDialog(null)}
        actions={[
          { label: t.history.cancel, variant: 'ghost', onClick: () => setHistoryDialog(null) },
          { label: t.history.limitContinue, variant: 'outline', onClick: () => resolveLimit(false) },
          { label: t.history.limitDownload, variant: 'primary', onClick: () => resolveLimit(true) },
        ]}
      >
        {historyDialog?.kind === 'limit' && historyDialog.oldest && (
          <p className="dialog__package">
            {t.history.packageSummary(
              formatPackageDate(historyDialog.oldest.createdAt),
              t.history.types[historyDialog.oldest.docType] || historyDialog.oldest.docType,
              historyDialog.oldest.rowCount ?? historyDialog.oldest.rows.length,
            )}
          </p>
        )}
      </ConfirmDialog>
      <ConfirmDialog
        open={historyDialog?.kind === 'quota'}
        title={t.history.quotaTitle}
        message={t.history.quotaMessage}
        onCancel={() => setHistoryDialog(null)}
        actions={[
          { label: t.history.close, variant: 'outline', onClick: () => setHistoryDialog(null) },
          { label: t.history.openHistory, variant: 'primary', onClick: () => { setHistoryDialog(null); setView('history'); } },
        ]}
      />
      <ConfirmDialog
        open={Boolean(saveReview)}
        title={tl.issuesTitle}
        onCancel={() => setSaveReview(null)}
        actions={[
          { label: tl.fixIt, variant: 'outline', onClick: () => setSaveReview(null) },
          ...(saveReview?.duplicates.length ? [{ label: tl.addCopy, variant: 'outline', onClick: () => handleAddCopy(saveReview.duplicates[0]) }] : []),
          { label: tl.saveAnyway, variant: 'primary', onClick: commitSave },
        ]}
      >
        {saveReview?.issues.length > 0 && (
          <ul className="save-review">
            {saveReview.issues.map((issue) => <li key={issue.code}>{tl.issue[issue.code](issue.value)}</li>)}
          </ul>
        )}
        {saveReview?.duplicates.length > 0 && (
          <>
            <p className="save-review__head">{tl.dupWarning(saveReview.duplicates.length)}</p>
            <ul className="save-review">
              {saveReview.duplicates.slice(0, 4).map((d, i) => (
                <li key={i}>{d.rec.titulo} · {d.rec.clasificacion || tl.noClass} ({tl.dupSource[d.source]})</li>
              ))}
            </ul>
          </>
        )}
      </ConfirmDialog>
      <ConfirmDialog
        open={clearOpen}
        title={t.step03.clearConfirm}
        onCancel={() => setClearOpen(false)}
        actions={[
          { label: t.history.cancel, variant: 'outline', onClick: () => setClearOpen(false) },
          { label: t.step03.clearTable, variant: 'danger', onClick: confirmClearRecords },
        ]}
      />
      <ConfirmDialog
        open={Boolean(columnToRemove)}
        title={columnToRemove ? t.cols.removeTitle(columnToRemove.label) : ''}
        message={t.cols.removeMessage}
        onCancel={() => setColumnToRemove(null)}
        actions={[
          { label: t.cols.cancel, variant: 'outline', onClick: () => setColumnToRemove(null) },
          { label: t.cols.remove, variant: 'danger', onClick: confirmRemoveColumn },
        ]}
      />
      {view !== 'guide' && (
        <HelpButton
          visible={helpVisible}
          onOpen={() => setView('guide')}
          onDismiss={() => setHelpVisible(false)}
        />
      )}
    </>
  );

  if (view === 'support') return shell(<SupportView onBack={() => setView('main')} onNavigate={setView} />);
  if (view === 'about') return shell(<AboutView onBack={() => setView('main')} onNavigate={setView} />);
  if (view === 'premium') return shell(<PremiumView onBack={() => setView('main')} />);
  if (view === 'terms') return shell(<TermsView onBack={() => setView('about')} />);
  if (view === 'privacy') return shell(<PrivacyView onBack={() => setView('about')} />);
  if (view === 'history') {
    return shell(
      <HistoryView
        onBack={() => setView('main')}
        onLoad={handleLoadPackage}
        onDownload={(pkg) => { showToast(t.history.downloading); downloadPackage(pkg); }}
        showToast={showToast}
      />,
    );
  }
  if (view === 'guide') return shell(<GuideView onBack={() => setView('main')} />);
  if (view === 'catalog') {
    return shell(
      <CatalogView
        onBack={() => setView('main')}
        index={catalog.index}
        status={catalog.status}
        onAddCopy={handleAddCopy}
        onUseData={handleUseData}
      />,
    );
  }
  if (view === 'personalize') return shell(<PersonalizeView onBack={() => setView('main')} showToast={showToast} />);

  // ── Diseño "Opción C · Riel y lectura de arriba abajo" (presentación) ──
  // Valores derivados de solo lectura; no alteran estado.
  const filledCount = columns.filter((c) => String(fields[c.key] || '').trim()).length;

  const saveHistoryFromMenu = () => { setExportMenuOpen(false); setMobileMoreOpen(false); handleSaveHistory(); };
  const clearFromMenu = () => { setExportMenuOpen(false); setMobileMoreOpen(false); handleClearRecords(); };

  return shell(
    <div className="oc-main">
      {/* Encabezado de escritorio */}
      <header className="oc-head">
        <div>
          <span className="oc-head__library">{LIBRARY_NAME}</span>
          <h1 className="oc-head__title">{t.menu.newRecord}</h1>
        </div>
        <DocTypeSelector onTypeChange={handleDocTypeChange} />
        <div className="oc-head__actions">
          <button type="button" className="oc-btn oc-btn--acc" onClick={handleSave}>
            <Icon name="save" size={15} strokeWidth={2} />{t.step03.save}
          </button>
          <MenuAnchor open={exportMenuOpen} onClose={() => setExportMenuOpen(false)} className="oc-split">
            <button type="button" className="oc-btn oc-btn--green oc-split__main" onClick={handleExport}>
              <Icon name="download" size={15} strokeWidth={2} />{t.step03.export}
            </button>
            <button
              type="button"
              className="oc-btn oc-btn--green oc-split__arrow"
              aria-label={t.ui.moreActions}
              aria-haspopup="menu"
              aria-expanded={exportMenuOpen}
              onClick={() => setExportMenuOpen((o) => !o)}
            >
              <Icon name="chevronDown" size={13} strokeWidth={2.4} />
            </button>
            {exportMenuOpen && (
              <div className="oc-menu oc-split__menu" role="menu">
                <button type="button" role="menuitem" className="oc-menu__item" onClick={saveHistoryFromMenu}>
                  <Icon name="history" size={15} />{t.step03.saveHistory}
                </button>
                <button type="button" role="menuitem" className="oc-menu__item oc-menu__item--danger" onClick={clearFromMenu}>
                  <Icon name="trash" size={15} />{t.step03.clearTable}
                </button>
              </div>
            )}
          </MenuAnchor>
        </div>
      </header>

      {/* Pestañas-ancla de móvil */}
      <MobileSteps t={t} />

      <main className="app__main oc-content">
        <section className="oc-strip" id="paso-1" aria-label={t.step01.title}>
          <div className="oc-capture">
            {isProcessing && <div className="oc-scan" aria-hidden="true" />}
            <ImageInput
              images={images}
              currentIndex={currentIdx}
              onImageAdded={handleImageAdded}
              onNavigate={handleNavigate}
              onRotate={handleRotate}
              onClear={handleClearAll}
              onExtract={handleExtract}
              isBusy={isProcessing}
              orientationWarning={orientationWarn}
            />
            {isProcessing && <OcrProgress statusLabel={statusLabel} progress={progress} />}
            {ocrError && <p className="error-text">{ocrError}</p>}
          </div>
          <div className="oc-ocr">
            <TextEditor ref={textareaRef} value={ocrText} onChange={setOcrText} onSelectionChange={setSelection} />
          </div>
        </section>

        <section className="oc-fields" id="paso-2" aria-labelledby="oc-fields-title">
          <div className="oc-section-head">
            <h2 className="oc-section-title" id="oc-fields-title">{t.ui.fieldsTitle}</h2>
            <span className="oc-count">{filledCount} / {columns.length}</span>
            <AddFieldPanel onAdd={handleAddField} />
          </div>
          <CategoryFields
            fields={fields}
            onFieldChange={(key, val) => setFields((prev) => ({ ...prev, [key]: val }))}
            selection={selection}
            onAssign={handleAssign}
            activeKey={activeChip}
            columns={columns}
            flashKey={flashKey}
            index={catalog.index}
            pinned={pinned}
            onTogglePin={handleTogglePin}
            nextId={nextId}
          />
          <CatalogAssistant
            fields={fields}
            onFieldChange={(key, val) => setFields((prev) => ({ ...prev, [key]: val }))}
            onMergeFields={(fill) => setFields((prev) => ({ ...prev, ...fill }))}
            index={catalog.index}
            status={catalog.status}
            tableRecords={visibleRecords}
            ignoredRecord={ignoredRecord}
            columnKeys={columns.map((c) => c.key)}
            onAddCopy={handleAddCopy}
            onUseData={handleUseData}
            onDuplicateLast={handleDuplicateLast}
            canDuplicate={visibleRecords.length > 0}
            showToast={showToast}
          />
        </section>

        <section className="oc-table" id="paso-3" aria-labelledby="oc-table-title">
          <div className="oc-section-head">
            <h2 className="oc-section-title" id="oc-table-title">{t.step03.title}</h2>
            <span className="oc-count oc-count--soft">{t.step03.count(visibleRecords.length)} · {t.ui.columnsCount(columns.length)}</span>
            <span className="oc-section-hint">{t.cols.tableHint}</span>
          </div>
          <BooksTable
            books={visibleRecords}
            onSave={handleSave}
            onExport={handleExport}
            onSaveHistory={handleSaveHistory}
            columnPunctuation={columnPunctuation}
            onPunctuationChange={handlePunctuationChange}
            onPunctuationReset={handlePunctuationReset}
            columns={columns}
            onCellChange={handleCellChange}
            onInsertRow={handleInsertRow}
            onRemoveRow={handleRemoveRow}
            onAddRow={handleAddRow}
            onInsertColumn={handleInsertColumn}
            onRenameColumn={handleRenameColumn}
            onRemoveColumn={handleRemoveColumn}
            flashKey={flashKey}
          />
        </section>
      </main>

      {/* Barra de acciones fija (móvil) */}
      <div className="oc-bottombar" role="toolbar" aria-label={t.ui.actions}>
        <button type="button" className="oc-btn oc-btn--acc" onClick={handleSave}>{t.step03.save}</button>
        <button type="button" className="oc-btn oc-btn--green" onClick={handleExport}>{t.step03.export}</button>
        <MenuAnchor open={mobileMoreOpen} onClose={() => setMobileMoreOpen(false)} className="oc-bottombar__more">
          <button
            type="button"
            className="oc-icon-btn"
            aria-label={`${t.ui.more}: ${t.step03.saveHistory}, ${t.step03.clearTable}`}
            aria-haspopup="menu"
            aria-expanded={mobileMoreOpen}
            onClick={() => setMobileMoreOpen((o) => !o)}
          >
            <DotsIcon size={18} />
          </button>
          {mobileMoreOpen && (
            <div className="oc-menu oc-bottombar__menu" role="menu">
              <button type="button" role="menuitem" className="oc-menu__item" onClick={saveHistoryFromMenu}>
                <Icon name="history" size={15} />{t.step03.saveHistory}
              </button>
              <button type="button" role="menuitem" className="oc-menu__item oc-menu__item--danger" onClick={clearFromMenu}>
                <Icon name="trash" size={15} />{t.step03.clearTable}
              </button>
            </div>
          )}
        </MenuAnchor>
      </div>
    </div>
  );
}

// Contenedor que cierra su menú con clic fuera o Esc.
function MenuAnchor({ open, onClose, className, children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  return <div className={className} ref={ref}>{children}</div>;
}

// Pestañas-ancla Captura · Campos · Tabla (móvil). La activa sigue el scroll.
function MobileSteps({ t }) {
  const [active, setActive] = useState('paso-1');
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const ids = ['paso-1', 'paso-2', 'paso-3'];
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    const obs = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: '-110px 0px -55% 0px' });
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  const tabs = [
    ['paso-1', t.ui.tabCapture],
    ['paso-2', t.ui.tabFields],
    ['paso-3', t.ui.tabTable],
  ];
  return (
    <nav className="oc-steps" aria-label={t.ui.steps}>
      {tabs.map(([id, label]) => (
        <a
          key={id}
          href={`#${id}`}
          className={active === id ? 'oc-steps__tab oc-steps__tab--on' : 'oc-steps__tab'}
          aria-current={active === id ? 'step' : undefined}
          onClick={() => setActive(id)}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}

function MobileHeader({ showDocType, onDocTypeChange, onHamburger, onLogoClick }) {
  const { lang } = useApp();
  const t = useT(lang);
  return (
    <header className="oc-mhead">
      <button type="button" className="oc-mhead__btn" onClick={onHamburger} aria-label={t.ui.openMenu}>
        <Icon name="menu" size={20} strokeWidth={1.8} />
      </button>
      <button type="button" className="oc-mhead__logo" onClick={onLogoClick} aria-label={t.header.goHome}>EBO</button>
      <span className="oc-mhead__library">{LIBRARY_NAME}</span>
      <span className="oc-mhead__spacer" />
      {showDocType && <DocTypeSelector variant="list" onTypeChange={onDocTypeChange} />}
    </header>
  );
}
