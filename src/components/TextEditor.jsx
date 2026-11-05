import { forwardRef } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n/translations';

const TextEditor = forwardRef(function TextEditor({ value, onChange, onSelectionChange }, ref) {
  const { lang } = useApp();
  const t = useT(lang);

  const handleSelect = (e) => {
    const { selectionStart, selectionEnd, value: text } = e.target;
    onSelectionChange({
      start: selectionStart,
      end: selectionEnd,
      text: text.slice(selectionStart, selectionEnd),
    });
  };

  return (
    <div className="text-editor">
      <label className="text-editor__label" htmlFor="raw-text">
        {t.step02.recognized}
      </label>
      <textarea
        ref={ref}
        id="raw-text"
        className="text-editor__area"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={handleSelect}
        onMouseUp={handleSelect}
        onKeyUp={handleSelect}
        placeholder={t.step02.placeholder}
        rows={10}
        spellCheck={false}
      />
    </div>
  );
});

export default TextEditor;
