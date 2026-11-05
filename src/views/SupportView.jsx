import { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n/translations';
import Icon from '../components/Icons';

// Configure your EmailJS credentials here
const EMAILJS_SERVICE_ID = 'service_dhokhvc';
const EMAILJS_TEMPLATE_ID = 'template_od1rur4';
const EMAILJS_PUBLIC_KEY = 'ejIEJTkMEVI-8zDnr';

const MAX_ATTACH = 4;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SupportView({ onBack, onNavigate }) {
  const { lang } = useApp();
  const t = useT(lang);
  const ts = t.support;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [status, setStatus] = useState('idle');
  const attachRef = useRef(null);

  const handleAttach = (e) => {
    const files = Array.from(e.target.files || []);
    const combined = [...attachments, ...files].slice(0, MAX_ATTACH);
    if (attachments.length + files.length > MAX_ATTACH) {
      alert(ts.imageLimitError);
    }
    setAttachments(combined);
    e.target.value = '';
  };

  const removeAttach = (i) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const base64Images = await Promise.all(attachments.map(fileToBase64));

      const templateParams = {
        from_name: name,
        from_email: email,
        message,
        image_count: attachments.length,
        image1: base64Images[0] || '',
        image2: base64Images[1] || '',
        image3: base64Images[2] || '',
        image4: base64Images[3] || '',
        to_email: 'jeanbarbozag05@gmail.com',
      };

      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
      setAttachments([]);
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="view">
      <div className="view-header">
        <button type="button" className="view-back" onClick={onBack} aria-label={t.ui.back}><Icon name="chevronLeft" size={16} strokeWidth={2} /></button>
        <h2>{ts.title}</h2>
      </div>

      <div className="view-body support-layout">
        <div className="support-intro">
          <p className="support-intro__title">{t.ui.supportIntroTitle}</p>
          <p className="support-intro__text">{t.ui.supportIntroText}</p>
          {onNavigate && (
            <button type="button" className="support-intro__link" onClick={() => onNavigate('guide')}>
              <Icon name="guide" size={20} strokeWidth={1.6} />
              <span>{t.menu.guide}</span>
            </button>
          )}
        </div>
        {status === 'success' ? (
          <div className="support-success">
            <span className="support-success__icon"><Icon name="check" size={26} strokeWidth={2} /></span>
            <p>{ts.success}</p>
          </div>
        ) : (
          <form className="support-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="sup-name">{ts.name}</label>
              <input
                id="sup-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={ts.namePlaceholder}
              />
            </div>

            <div className="form-field">
              <label htmlFor="sup-email">{ts.email}</label>
              <input
                id="sup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={ts.emailPlaceholder}
              />
            </div>

            <div className="form-field">
              <label htmlFor="sup-message">{ts.message}</label>
              <textarea
                id="sup-message"
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={ts.messagePlaceholder}
                rows={5}
              />
            </div>

            <div className="form-field">
              <span className="form-label">{ts.attachLabel}</span>
              <div
                className="attach-area"
                onClick={() => attachRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && attachRef.current?.click()}
              >
                <Icon name="image" size={22} strokeWidth={1.5} className="attach-icon" />
                <span className="attach-hint">{ts.attachHint}</span>
                <span className="attach-limit">{ts.imageLimit}</span>
              </div>
              <input
                ref={attachRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleAttach}
                hidden
              />
              {attachments.length > 0 && (
                <div className="attach-previews">
                  {attachments.map((file, i) => (
                    <div key={i} className="attach-thumb">
                      <img src={URL.createObjectURL(file)} alt={file.name} />
                      <button
                        type="button"
                        className="attach-remove"
                        onClick={() => removeAttach(i)}
                        aria-label="Eliminar imagen"
                      >
                        <Icon name="close" size={12} strokeWidth={2.2} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {status === 'error' && <p className="form-error">{ts.error}</p>}

            <button
              type="submit"
              className="btn btn--primary"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? ts.sending : ts.send}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
