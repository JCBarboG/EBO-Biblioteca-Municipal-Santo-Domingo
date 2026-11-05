import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { checkIsbn } from '../utils/validateRecord';

// Lee el código de barras con la cámara. Usa el lector del navegador cuando
// existe (Chrome en Android) y, si no, carga ZXing solo en ese momento.
export default function BarcodeScanner({ tl, onDetected, onClose, showToast }) {
  const videoRef = useRef(null);
  // Las funciones cambian en cada render de App: la cámara no debe reiniciarse.
  const latest = useRef();
  latest.current = { tl, onDetected, onClose, showToast };

  useEffect(() => {
    const call = () => latest.current;
    let stopped = false;
    let stream = null;
    let controls = null;
    let timer = null;
    let lastInvalid = '';

    const handleCode = (code) => {
      if (stopped || !code) return;
      if (checkIsbn(code, 'libro')) { call().onDetected(code); return; }
      if (code !== lastInvalid) { lastInvalid = code; call().showToast(call().tl.scanNotIsbn(code)); }
    };

    const startNative = async () => {
      const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128'] });
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (stopped) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      const tick = async () => {
        if (stopped) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes[0]) handleCode(codes[0].rawValue);
        } catch { /* cuadro no disponible todavía */ }
        timer = setTimeout(tick, 250);
      };
      tick();
    };

    const startZxing = async () => {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      if (stopped) return;
      controls = await new BrowserMultiFormatReader().decodeFromConstraints(
        { video: { facingMode: 'environment' } },
        videoRef.current,
        (result) => { if (result) handleCode(result.getText()); },
      );
      if (stopped) controls.stop();
    };

    (window.BarcodeDetector ? startNative() : startZxing()).catch(() => {
      if (!stopped) { call().showToast(call().tl.scanError); call().onClose(); }
    });

    return () => {
      stopped = true;
      clearTimeout(timer);
      controls?.stop();
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return createPortal(
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog scanner" role="dialog" aria-modal="true" aria-label={tl.scanTitle} onClick={(e) => e.stopPropagation()}>
        <p className="dialog__title">{tl.scanTitle}</p>
        <p className="dialog__message">{tl.scanHelp}</p>
        <video ref={videoRef} className="scanner__video" muted playsInline />
        <div className="dialog__actions">
          <button type="button" className="btn btn--outline" onClick={onClose}>{tl.scanCancel}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
