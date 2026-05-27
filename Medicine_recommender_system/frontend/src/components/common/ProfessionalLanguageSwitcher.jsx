import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const ProfessionalLanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'am' ? 'en' : 'am';
    i18n.changeLanguage(nextLang);
  };

  const isAmharic = i18n.language === 'am';

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-700 hover:border-primary-500 hover:text-primary-600 transition-all shadow-sm group"
      title={isAmharic ? "Switch to English" : "ወደ አማርኛ ይቀይሩ"}
    >
      <Globe size={18} className="text-primary-500 group-hover:rotate-12 transition-transform" />
      <span className="text-xs font-bold uppercase tracking-wider">
        {isAmharic ? 'English' : 'አማርኛ'}
      </span>
    </button>
  );
};

export default ProfessionalLanguageSwitcher;
