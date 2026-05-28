import React, { useState } from 'react';
import { Mail, User, MessageSquare, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const ContactForm = ({ recipientEmail }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, email, subject, message } = formData;

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error(t('contactForm.validationError'));
      return;
    }

    setSubmitting(true);

    const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(
      subject || 'Contact request from website'
    )}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;

    window.location.href = mailtoLink;
    toast.success(t('contactForm.mailtoNotice'));
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
      <div className="flex flex-col gap-2">
        <label htmlFor="contact-name" className="text-sm font-semibold text-slate-700">{t('contactForm.nameLabel')}</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="contact-name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder={t('contactForm.namePlaceholder')}
            aria-label={t('contactForm.namePlaceholder')}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="contact-email" className="text-sm font-semibold text-slate-700">{t('contactForm.emailLabel')}</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="contact-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              placeholder={t('contactForm.emailPlaceholder')}
              aria-label={t('contactForm.emailPlaceholder')}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="contact-subject" className="text-sm font-semibold text-slate-700">{t('contactForm.subjectLabel')}</label>
          <input
            id="contact-subject"
            name="subject"
            type="text"
            value={formData.subject}
            onChange={handleChange}
            className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-4 px-4 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder={t('contactForm.subjectPlaceholder')}
            aria-label={t('contactForm.subjectPlaceholder')}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="contact-message" className="text-sm font-semibold text-slate-700">{t('contactForm.messageLabel')}</label>
        <div className="relative">
          <MessageSquare className="absolute left-4 top-4 h-4 w-4 text-slate-400" aria-hidden="true" />
          <textarea
            id="contact-message"
            name="message"
            rows="6"
            value={formData.message}
            onChange={handleChange}
            required
            className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder={t('contactForm.messagePlaceholder')}
            aria-label={t('contactForm.messagePlaceholder')}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-4 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        {submitting ? t('contactForm.submitButtonLoading') : t('contactForm.submitButton')}
      </button>
    </form>
  );
};

export default ContactForm;
