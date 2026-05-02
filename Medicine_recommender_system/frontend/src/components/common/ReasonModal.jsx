import React, { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, PauseCircle } from 'lucide-react';

/**
 * ReasonModal — formal modal that asks the admin for a reason before
 * performing a destructive/sensitive action (reject, suspend, etc.)
 *
 * Props:
 *   isOpen        boolean
 *   onClose()     called on cancel / close
 *   onConfirm(reason: string)  called with the entered reason
 *   title         string
 *   description   string  — shown below the title
 *   placeholder   string  — textarea placeholder
 *   confirmText   string  — confirm button label
 *   variant       'danger' | 'warning'  — controls colour scheme
 *   required      boolean — whether a non-empty reason is required (default true)
 */
const ReasonModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Provide a Reason',
  description = '',
  placeholder = 'Enter reason…',
  confirmText = 'Confirm',
  variant = 'danger',
  required = true,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  const handleConfirm = () => {
    if (required && !reason.trim()) {
      setError('Please enter a reason before proceeding.');
      textareaRef.current?.focus();
      return;
    }
    onConfirm(reason.trim());
    onClose();
  };

  const handleKey = (e) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/60"
      onKeyDown={handleKey}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reason-modal-title"
      >
        {/* Header */}
        <div className={`px-6 pt-6 pb-4 flex items-start gap-4`}>
          <div className={`shrink-0 flex items-center justify-center h-10 w-10 rounded-full ${isDanger ? 'bg-red-100' : 'bg-amber-100'}`}>
            {isDanger
              ? <AlertTriangle size={20} className="text-red-600" />
              : <PauseCircle size={20} className="text-amber-600" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 id="reason-modal-title" className="text-base font-bold text-slate-900 leading-snug">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="shrink-0 text-slate-400 hover:text-slate-600 transition mt-0.5"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            {description && (
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">{description}</p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-4">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
            Reason {required && <span className="text-red-500">*</span>}
          </label>
          <textarea
            ref={textareaRef}
            rows={4}
            value={reason}
            onChange={e => { setReason(e.target.value); if (error) setError(''); }}
            placeholder={placeholder}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 transition
              ${error
                ? 'border-red-400 focus:ring-red-300'
                : isDanger
                  ? 'border-slate-300 focus:ring-red-300'
                  : 'border-slate-300 focus:ring-amber-300'
              }`}
          />
          {error && (
            <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
              <AlertTriangle size={11} /> {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-row-reverse gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-5 py-2 rounded-lg text-sm font-bold text-white transition shadow-sm
              ${isDanger
                ? 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-400'
                : 'bg-amber-500 hover:bg-amber-600 focus:ring-2 focus:ring-amber-400'
              }`}
          >
            {confirmText}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-medium text-slate-700 border border-slate-300 bg-white hover:bg-slate-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReasonModal;
