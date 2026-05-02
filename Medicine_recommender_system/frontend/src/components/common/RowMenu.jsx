import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';

/**
 * RowMenu — three-dot context menu for table rows.
 *
 * Props:
 *   onEdit()   — called when "Edit" is clicked
 *   onDelete() — called when "Delete" is clicked
 *   editLabel   — optional label override (default "Edit")
 *   deleteLabel — optional label override (default "Delete")
 */
const RowMenu = ({ onEdit, onDelete, editLabel = 'Edit', deleteLabel = 'Delete' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        aria-label="Row actions"
      >
        <MoreVertical size={17} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-slate-200 z-50 py-1 animate-fadeIn">
          {onEdit && (
            <button
              type="button"
              onClick={() => { setOpen(false); onEdit(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <Pencil size={14} className="text-primary-500" />
              {editLabel}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => { setOpen(false); onDelete(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
            >
              <Trash2 size={14} />
              {deleteLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RowMenu;
