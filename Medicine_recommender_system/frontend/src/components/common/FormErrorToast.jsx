import React, { useEffect, useState } from 'react';

/**
 * FormErrorToast – a fixed-position pop‑up that appears when the form has validation errors.
 * It receives an `errors` object where keys are field names and values are error messages.
 * The toast fades in, lists each message, and disappears automatically after a short timeout
 * or when the errors are cleared.
 */
const FormErrorToast = ({ errors, autoHideDuration = 5000 }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hasErrors = errors && Object.keys(errors).length > 0;
    setVisible(hasErrors);
    let timer;
    if (hasErrors) {
      timer = setTimeout(() => setVisible(false), autoHideDuration);
    }
    return () => clearTimeout(timer);
  }, [errors, autoHideDuration]);

  if (!visible) return null;

  return (
    <div className="fixed top-5 right-5 bg-red-600 text-white px-5 py-3 rounded-md shadow-lg z-50 animate-fadeIn">
      <ul className="list-disc list-inside text-sm">
        {Object.entries(errors).map(([field, message]) => (
          <li key={field}>{message}</li>
        ))}
      </ul>
    </div>
  );
};

export default FormErrorToast;
