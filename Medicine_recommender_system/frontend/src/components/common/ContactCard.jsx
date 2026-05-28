import React, { useState } from 'react';
import { ArrowRight, ClipboardCopy } from 'lucide-react';

const ContactCard = ({ title, subtitle, href, icon: Icon, copyText }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!copyText || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error('Copy failed', error);
    }
  };

  return (
    <div className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="w-14 h-14 rounded-3xl bg-primary-50 text-primary-700 flex items-center justify-center shadow-sm transition-all duration-300 group-hover:bg-primary-100">
          <Icon size={28} aria-hidden="true" />
        </div>
        <span className="text-xs uppercase tracking-[0.3em] font-semibold text-slate-400">{title}</span>
      </div>

      <h3 className="text-xl font-semibold text-slate-800 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed mb-6">{subtitle}</p>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label={`Open ${title} profile in a new tab`}
        >
          Visit {title}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </a>

        {copyText && (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Copy email address to clipboard"
          >
            <ClipboardCopy size={16} />
            {copied ? 'Copied!' : 'Copy email'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ContactCard;
