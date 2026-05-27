import React from 'react';

/**
 * FieldTooltip – a styled popup bubble that appears beneath a form field
 * to communicate a validation error (e.g. "Please fill out this field").
 *
 * Usage:
 *   {fieldErrors.email && <FieldTooltip message={fieldErrors.email} />}
 */
const FieldTooltip = ({ message }) => {
  if (!message) return null;

  return (
    <div className="relative mt-1" role="alert" aria-live="polite">
      {/* Arrow pointing up */}
      <div className="absolute left-4 -top-1.5 w-3 h-3 rotate-45 bg-red-500 border-l border-t border-red-500 z-10" />
      {/* Bubble */}
      <div className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-md shadow-md relative z-20">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5 flex-shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span>{message}</span>
      </div>
    </div>
  );
};

export default FieldTooltip;
