import { useCallback, useEffect, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { WORKER_PATH, CORE_PATH, LANG_PATH } from './tesseractPaths';

// Worker de OSD (Orientation and Script Detection), independiente del worker
// de reconocimiento. `worker.detect()` solo funciona con el motor Legacy
// (`legacyCore`/`legacyLang`), que el worker de reconocimiento no carga
// (usa solo LSTM, más liviano). Se inicializa con el paquete "osd", un
// traineddata especial e independiente del idioma pensado solo para
// detectar el ángulo del texto (rápido, no reconoce contenido).
export function useOrientationDetector() {
  const workerRef = useRef(null);
  const workerPromiseRef = useRef(null);

  const getWorker = useCallback(() => {
    if (workerRef.current) return Promise.resolve(workerRef.current);
    if (!workerPromiseRef.current) {
      workerPromiseRef.current = createWorker('osd', 1, {
        workerPath: WORKER_PATH,
        corePath: CORE_PATH,
        langPath: LANG_PATH,
        legacyCore: true,
        legacyLang: true,
      }).then((worker) => {
        workerRef.current = worker;
        return worker;
      }).catch((err) => {
        workerPromiseRef.current = null;
        throw err;
      });
    }
    return workerPromiseRef.current;
  }, []);

  useEffect(() => () => {
    workerRef.current?.terminate();
  }, []);

  // Devuelve 'vertical' (0°, listo para extraer), 'rotated' (apaisado o
  // invertido) o 'unknown' (no se pudo determinar: no bloquea al usuario).
  const detectOrientation = useCallback(async (image) => {
    try {
      const worker = await getWorker();
      const { data } = await worker.detect(image);
      if (typeof data?.orientation_degrees !== 'number') return 'unknown';
      return data.orientation_degrees === 0 ? 'vertical' : 'rotated';
    } catch {
      return 'unknown';
    }
  }, [getWorker]);

  return { detectOrientation };
}
