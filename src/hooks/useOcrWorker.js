import { useCallback, useEffect, useRef, useState } from 'react';
import { createWorker, PSM } from 'tesseract.js';
import { WORKER_PATH, CORE_PATH, LANG_PATH } from './tesseractPaths';
import { prepareImageForOcr, UnsupportedImageError } from '../utils/prepareImage';

// Mensajes de estado que emite Tesseract.js durante el reconocimiento,
// traducidos para mostrar al usuario.
const STATUS_LABELS = {
  'loading tesseract core': 'Cargando motor OCR…',
  'initializing tesseract': 'Inicializando OCR…',
  'loading language traineddata': 'Cargando datos de idioma…',
  'initializing api': 'Preparando reconocimiento…',
  'recognizing text': 'Extrayendo texto…',
};

export function useOcrWorker() {
  const workerRef = useRef(null);
  const workerPromiseRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const getWorker = useCallback(() => {
    if (workerRef.current) return Promise.resolve(workerRef.current);
    if (!workerPromiseRef.current) {
      workerPromiseRef.current = createWorker(['spa', 'eng'], 1, {
        workerPath: WORKER_PATH,
        corePath: CORE_PATH,
        langPath: LANG_PATH,
        logger: (m) => {
          if (typeof m.progress === 'number') setProgress(m.progress);
          if (m.status) setStatusLabel(STATUS_LABELS[m.status] || m.status);
        },
      }).then(async (worker) => {
        // Tesseract.js usa por defecto el modo "un solo bloque de texto",
        // pensado para párrafos. En una portada (título, autor y editorial
        // separados por espacios grandes) descartaba líneas enteras: en las
        // pruebas se perdían la editorial y el año. El modo automático
        // detecta cada bloque por separado y lee la portada completa.
        await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
        workerRef.current = worker;
        return worker;
      }).catch((err) => {
        // Sin esto, un fallo de carga (p. ej. red caída al bajar los datos de
        // idioma) quedaba guardado para siempre y cada intento posterior
        // fallaba igual hasta recargar la página.
        workerPromiseRef.current = null;
        throw err;
      });
    }
    return workerPromiseRef.current;
  }, []);

  useEffect(() => () => {
    workerRef.current?.terminate();
  }, []);

  // Descarta el worker actual (p. ej. tras un error dentro de Tesseract, que
  // puede dejarlo en mal estado) para que el siguiente intento cree uno nuevo.
  const resetWorker = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    workerPromiseRef.current = null;
  }, []);

  // Recibe una o varias imágenes y devuelve el texto de cada una.
  const recognize = useCallback(async (images) => {
    const list = Array.isArray(images) ? images : [images];
    setError(null);
    setIsProcessing(true);
    setProgress(0);
    setStatusLabel('Preparando…');
    try {
      const texts = [];
      for (let i = 0; i < list.length; i += 1) {
        const prefix = list.length > 1 ? `Imagen ${i + 1} de ${list.length}: ` : '';
        setStatusLabel(`${prefix}Preparando imagen…`);
        let prepared;
        try {
          prepared = await prepareImageForOcr(list[i]);
        } catch (err) {
          if (err instanceof UnsupportedImageError) {
            throw new Error(`${prefix}No se pudo leer la imagen. Usa una foto JPG o PNG (los formatos HEIC/HEIF no son compatibles con este navegador).`);
          }
          throw err;
        }
        const worker = await getWorker();
        try {
          const { data } = await worker.recognize(prepared);
          texts.push((data.text || '').trim());
        } catch (err) {
          resetWorker();
          throw err;
        }
      }
      return texts;
    } catch (err) {
      const raw = err?.message || String(err || '');
      const message = /fetch|network|load|traineddata|wasm|importScripts/i.test(raw) && !/No se pudo leer/.test(raw)
        ? 'No se pudo cargar el motor de OCR. Revisa tu conexión a internet e inténtalo de nuevo.'
        : (raw || 'No se pudo procesar la imagen.');
      setError(message);
      throw new Error(message);
    } finally {
      setIsProcessing(false);
    }
  }, [getWorker, resetWorker]);

  return { recognize, progress, statusLabel, isProcessing, error };
}
