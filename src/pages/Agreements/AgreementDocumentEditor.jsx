import React, { useEffect, useRef } from 'react';

export default function AgreementDocumentEditor({ value, onChange, readOnly = false }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const command = (name, arg) => {
    if (readOnly) return;
    ref.current?.focus();
    document.execCommand(name, false, arg);
    onChange?.(ref.current?.innerHTML || '');
  };

  return (
    <div className="agreement-document-editor">
      {!readOnly && (
        <div className="agreement-editor-toolbar">
          <button type="button" onClick={() => command('bold')} aria-label="Bold"><b>B</b></button>
          <button type="button" onClick={() => command('italic')} aria-label="Italic"><i>I</i></button>
          <button type="button" onClick={() => command('underline')} aria-label="Underline"><u>U</u></button>
          <button type="button" onClick={() => command('insertUnorderedList')} aria-label="Bullet list">• List</button>
          <button type="button" onClick={() => command('formatBlock', 'H2')} aria-label="Heading">H2</button>
        </div>
      )}
      <div
        ref={ref}
        className="agreement-editor-canvas"
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={(event) => onChange?.(event.currentTarget.innerHTML)}
      />
    </div>
  );
}
