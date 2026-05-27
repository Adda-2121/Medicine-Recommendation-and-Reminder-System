import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Brain, Microscope, Heart, Stethoscope, Baby, Flower2,
  Wind, Zap, Bone, HelpCircle, ChevronRight, ChevronLeft,
  Star, CheckCircle, AlertCircle, ArrowRight,
  Activity, RefreshCw, MessageSquare, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { TRIAGE_REASONS, triageRoute } from '../utils/triageRules';

// Map triage keys to lucide icons
const REASON_ICONS = {
  mental_health: Brain,
  skin: Microscope,
  heart_chest: Heart,
  general_illness: Stethoscope,
  child_health: Baby,
  womens_health: Flower2,
  breathing: Wind,
  brain_nerve: Zap,
  bone_joint: Bone,
  not_sure: HelpCircle,
};

// Step indicator component
const StepIndicator = ({ current, t }) => {
  const steps = [
    { n: 1, label: t('findDoctor.steps.describe') },
    { n: 2, label: t('findDoctor.steps.match') },
    { n: 3, label: t('findDoctor.steps.confirm') },
  ];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              current > s.n
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                : current === s.n
                ? 'bg-primary-600 text-white shadow-md shadow-primary-200 ring-4 ring-primary-100'
                : 'bg-slate-100 text-slate-400'
            }`}>
              {current > s.n ? <CheckCircle size={16} /> : s.n}
            </div>
            <span className={`text-xs mt-1 font-medium ${current === s.n ? 'text-primary-600' : current > s.n ? 'text-emerald-600' : 'text-slate-400'}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-16 mx-1 mb-4 transition-all duration-500 ${current > s.n ? 'bg-emerald-400' : 'bg-slate-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// Helper: format wait time
const formatWait = (mins, t) => {
  if (mins === 0) return t('findDoctor.doctorCard.readyNow');
  if (mins < 60) return t('findDoctor.doctorCard.minWait', { mins });
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? t('findDoctor.doctorCard.hmWait', { h, m }) : t('findDoctor.doctorCard.hWait', { h });
};

// Doctor card used in step 2
const DoctorCard = ({ doctor, selected, onSelect, t }) => {
  const queue = doctor.activeQueueCount ?? 0;


  return (
    <button
      type="button"
      onClick={() => onSelect(doctor)}
      className={`w-full text-left bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden ${
        selected
          ? 'border-primary-500 shadow-md shadow-primary-100'
          : 'border-slate-200 hover:border-primary-300 hover:shadow-sm'
      }`}
    >
      {/* Decorative bar across the top */}
      <div className="h-1 w-full bg-primary-400" />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg uppercase ${
              selected ? 'bg-primary-600 text-white' : 'bg-primary-100 text-primary-600'
            }`}>
              {doctor.name.charAt(0)}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-slate-800 text-sm truncate">Dr. {doctor.name}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${status.className}`}>
                  {status.label}
                </span>
                {selected && <CheckCircle size={15} className="text-primary-600" />}
              </div>
            </div>
            <p className="text-xs text-primary-600 font-medium mt-0.5">
              {doctor.specialty ? t(`findDoctor.specialties.${doctor.specialty.toLowerCase().replace(/ /g, '_')}`, { defaultValue: doctor.specialty }) : t('findDoctor.specialties.gp')}
            </p>

            {/* Queue row */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                <Users size={10} />
                {queue === 0 ? t('findDoctor.doctorCard.noQueue') : t('findDoctor.doctorCard.inQueue', { count: queue })}
              </span>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {doctor.experience_years > 0 && (
                <span className="text-xs text-slate-400">
                  {t('findDoctor.doctorCard.yearsExp', { years: doctor.experience_years })}
                </span>
              )}

              {/* Rating */}
              {doctor.averageRating > 0 && (
                <span className="text-xs text-slate-500 flex items-center gap-0.5">
                  <Star size={10} className="text-amber-400 fill-amber-400" />
                  {doctor.averageRating}
                  <span className="text-slate-400">({doctor.totalReviews})</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

const FindDoctor = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ── Step state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // Step 1 — triage form
  const [selectedReason, setSelectedReason] = useState(null);
  const [symptomsText, setSymptomsText] = useState('');

  // Step 2 — recommendation + doctor list
  const [triageResult, setTriageResult] = useState(null);   // { doctorType, specialty, routingNote }
  const [useGpOverride, setUseGpOverride] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Step 3 — booking
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Fetch doctors when triage result or override changes ───────────────────
  const fetchDoctors = useCallback(async (specialization) => {
    setLoadingDoctors(true);
    setSelectedDoctor(null);
    try {
      const res = await api.get('/users/doctors', {
        params: specialization ? { specialization } : {},
      });
      setDoctors(res.data);
    } catch {
      toast.error(t('findDoctor.step2.errorLoadDoctors', { defaultValue: 'Could not load doctors. Please try again.' }));
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  }, []);

  useEffect(() => {
    if (step === 2 && triageResult) {
      const spec = useGpOverride ? 'General Practitioner' : triageResult.specialty;
      fetchDoctors(spec);
    }
  }, [step, triageResult, useGpOverride, fetchDoctors]);

  // Auto-refresh doctor list every 30s while on step 2
  useEffect(() => {
    if (step !== 2 || !triageResult) return;
    const spec = useGpOverride ? 'General Practitioner' : triageResult.specialty;
    const interval = setInterval(() => {
      // Silent refresh — don't show loading spinner for auto-refresh
      api.get('/users/doctors', { params: spec ? { specialization: spec } : {} })
        .then(res => setDoctors(res.data))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [step, triageResult, useGpOverride]);

  // ── Step 1 → 2: run triage ─────────────────────────────────────────────────
  const handleTriage = () => {
    if (!selectedReason) {
      toast.error(t('findDoctor.errorSelectReason'));
      return;
    }
    const result = triageRoute(selectedReason.key);
    setTriageResult(result);
    setUseGpOverride(false);
    setStep(2);
  };

  // ── Step 2 → 3: confirm doctor ─────────────────────────────────────────────
  const handleConfirmDoctor = () => {
    if (!selectedDoctor) {
      toast.error(t('findDoctor.errorSelectDoctor'));
      return;
    }
    setStep(3);
  };

  // ── Step 3: submit booking ─────────────────────────────────────────────────
  const handleBooking = async () => {
    if (!selectedDoctor || !triageResult) return;
    const finalType = useGpOverride ? 'gp' : (triageResult.doctorType || 'gp');
    const finalSpecialty = useGpOverride ? 'General Practitioner' : (triageResult.specialty || 'General Practitioner');

    try {
      setIsSubmitting(true);
      await api.post('/consultations', {
        doctor_id: selectedDoctor.id,
        reason: selectedReason.label,
        reason_for_visit: selectedReason.key,
        symptoms_description: symptomsText || selectedReason.label,
        consultation_type: finalType,
        target_specialty: finalSpecialty,
        assigned_specialization: finalSpecialty || 'General Practitioner',
      });
      toast.success(t('findDoctor.success'));
      navigate('/consultations');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setStep(1);
    setSelectedReason(null);
    setSymptomsText('');
    setTriageResult(null);
    setUseGpOverride(false);
    setDoctors([]);
    setSelectedDoctor(null);
  };

  const effectiveSpecialty = useGpOverride ? 'General Practitioner' : (triageResult?.specialty || 'General Practitioner');

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-primary-50/20">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">{t('findDoctor.pageTitle')}</h1>
          <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
            {t('findDoctor.pageSubtitle')}
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} t={t} />

        {/* ── STEP 1: Triage Form ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">{t('findDoctor.step1.title')}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{t('findDoctor.step1.subtitle')}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Reason cards grid */}
              <div className="grid grid-cols-2 gap-3">
                {TRIAGE_REASONS.map((reason) => {
                  const Icon = REASON_ICONS[reason.key] || HelpCircle;
                  const isSelected = selectedReason?.key === reason.key;
                  const isGpRoute = reason.doctorType === 'gp';
                  return (
                    <button
                      key={reason.key}
                      type="button"
                      onClick={() => setSelectedReason(reason)}
                      className={`relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all duration-200 group ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-100'
                          : 'border-slate-200 bg-white hover:border-primary-300 hover:bg-primary-50/40 hover:shadow-sm'
                      }`}
                    >
                      <div className={`p-2 rounded-lg transition-colors ${
                        isSelected ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-primary-100 group-hover:text-primary-600'
                      }`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold leading-tight ${isSelected ? 'text-primary-700' : 'text-slate-700'}`}>
                          {t(`findDoctor.reasons.${reason.key}.label`)}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 leading-snug line-clamp-2">{t(`findDoctor.reasons.${reason.key}.description`)}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle size={16} className="text-primary-600" />
                        </div>
                      )}
                      {isGpRoute && !isSelected && (
                        <div className="absolute top-2 right-2">
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">GP</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Symptoms textarea */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t('findDoctor.step1.symptomsLabel')}
                  <span className="ml-2 text-xs font-normal text-slate-400">({t('common.optional')})</span>
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-400 resize-none placeholder:text-slate-400 transition"
                  placeholder={t('findDoctor.step1.symptomsPlaceholder')}
                  value={symptomsText}
                  onChange={e => setSymptomsText(e.target.value)}
                />
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={11} />
                  {t('findDoctor.step1.symptomsNote')}
                </p>
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={handleTriage}
                disabled={!selectedReason}
                className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:shadow-none"
              >
                {t('findDoctor.step1.submit')}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Recommendation + Doctor List ── */}
        {step === 2 && triageResult && (
          <div className="space-y-4">
            {/* Recommendation card */}
            <div className={`rounded-2xl border-2 p-5 ${
              useGpOverride
                ? 'bg-amber-50 border-amber-300'
                : triageResult.doctorType === 'specialist'
                ? 'bg-gradient-to-br from-primary-50 to-blue-50 border-primary-300'
                : 'bg-gradient-to-br from-slate-50 to-blue-50 border-slate-300'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 ${useGpOverride ? 'bg-amber-200 text-amber-700' : 'bg-primary-200 text-primary-700'}`}>
                  <Stethoscope size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-0.5">{t('findDoctor.step2.recommendedTitle')}</p>
                  <p className={`text-xl font-extrabold ${useGpOverride ? 'text-amber-700' : 'text-primary-700'}`}>
                    {useGpOverride ? t('findDoctor.specialties.gp') : t(`findDoctor.specialties.${triageResult.specialty.toLowerCase().replace(/ /g, '_')}`, { defaultValue: triageResult.specialty })}
                  </p>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    {useGpOverride
                      ? t('findDoctor.step2.gpNote')
                      : t(`findDoctor.reasons.${selectedReason?.key}.routingNote`)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-white/80 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                      {selectedReason?.emoji} {t(`findDoctor.reasons.${selectedReason?.key}.label`)}
                    </span>
                  </div>
                </div>
              </div>

              {/* GP override toggle */}
              {!useGpOverride && triageResult.doctorType === 'specialist' && (
                <button
                  type="button"
                  onClick={() => setUseGpOverride(true)}
                  className="mt-3 text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
                >
                  {t('findDoctor.step2.preferGp')}
                </button>
              )}
              {useGpOverride && (
                <button
                  type="button"
                  onClick={() => setUseGpOverride(false)}
                  className="mt-3 text-xs text-primary-600 hover:text-primary-800 underline underline-offset-2 flex items-center gap-1"
                >
                  <ChevronLeft size={12} /> {t('findDoctor.step2.backToRecommended', { specialty: t(`findDoctor.specialties.${triageResult.specialty.toLowerCase().replace(/ /g, '_')}`, { defaultValue: triageResult.specialty }) })}
                </button>
              )}
            </div>

            {/* Doctor list */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {loadingDoctors ? t('findDoctor.step2.loadingDoctors') : t('findDoctor.step2.doctorsFound', { count: doctors.length })}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t('findDoctor.step2.showingSpecialists', { specialty: useGpOverride ? t('findDoctor.specialties.gp') : t(`findDoctor.specialties.${triageResult.specialty.toLowerCase().replace(/ /g, '_')}`, { defaultValue: triageResult.specialty }) })}
                  </p>
                </div>
                {/* Refresh button */}
                {!loadingDoctors && doctors.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => fetchDoctors(useGpOverride ? 'General Practitioner' : triageResult.specialty)}
                      className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition ml-1"
                      title="Refresh"
                    >
                      <RefreshCw size={13} className={loadingDoctors ? 'animate-spin' : ''} />
                    </button>
                  </div>
                )}
                {loadingDoctors && (
                  <RefreshCw size={15} className="animate-spin text-slate-400" />
                )}
              </div>

              <div className="p-4">
                {loadingDoctors ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : doctors.length === 0 ? (
                  <div className="text-center py-10">
                    <Activity size={36} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-600 font-medium text-sm">
                      {t('findDoctor.step2.noDoctors', { specialty: useGpOverride ? t('findDoctor.specialties.gp') : t(`findDoctor.specialties.${triageResult.specialty.toLowerCase().replace(/ /g, '_')}`, { defaultValue: triageResult.specialty }) })}
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      {t('findDoctor.step2.noDoctorsDesc')}
                    </p>
                    <div className="flex flex-col gap-2 max-w-xs mx-auto mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDoctor({ id: null, name: 'First Available', specialty: effectiveSpecialty });
                          setStep(3);
                        }}
                        className="py-2.5 bg-primary-600 text-white rounded-lg font-bold text-sm shadow-sm hover:bg-primary-700 transition"
                      >
                        {t('findDoctor.step2.bookAwaiting', { defaultValue: 'Book — Assign Next Available' })}
                      </button>

                      {!useGpOverride && (
                        <button
                          type="button"
                          onClick={() => setUseGpOverride(true)}
                          className="py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
                        >
                          {t('findDoctor.step2.seeGps')}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {doctors.map(doc => (
                      <DoctorCard
                        key={doc.id}
                        doctor={doc}
                        selected={selectedDoctor?.id === doc.id}
                        onSelect={setSelectedDoctor}
                        t={t}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-3 border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium rounded-xl transition flex items-center justify-center gap-2"
              >
                <ChevronLeft size={16} /> {t('findDoctor.step2.startOver')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDoctor}
                disabled={!selectedDoctor}
                className="flex-[2] py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
              >
                {t('findDoctor.step2.continueWith', { name: selectedDoctor?.name || '…' })}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Booking Confirmation ── */}
        {step === 3 && selectedDoctor && triageResult && (
          <div className="space-y-4">
            {/* Summary card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">{t('findDoctor.step3.summaryTitle')}</p>
                <h2 className="text-xl font-extrabold">{t('findDoctor.step3.title')}</h2>
              </div>

              <div className="p-6 space-y-4">
                {/* Doctor */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className={`h-14 w-14 ${selectedDoctor.id ? 'bg-primary-600' : 'bg-slate-400'} rounded-full flex items-center justify-center text-white font-bold text-xl uppercase shrink-0`}>
                    {selectedDoctor.id ? selectedDoctor.name.charAt(0) : <Users size={24} />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{selectedDoctor.id ? `Dr. ${selectedDoctor.name}` : 'Awaiting Professional Assignment'}</p>
                    <p className="text-sm text-primary-600 font-medium">
                      {selectedDoctor.specialty ? t(`findDoctor.specialties.${selectedDoctor.specialty.toLowerCase().replace(/ /g, '_')}`, { defaultValue: selectedDoctor.specialty }) : t('findDoctor.specialties.gp')}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {selectedDoctor.activeQueueCount !== undefined && (
                        <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                          <Users size={10} />
                          {selectedDoctor.activeQueueCount === 0 ? t('findDoctor.doctorCard.noQueue') : t('findDoctor.doctorCard.inQueue', { count: selectedDoctor.activeQueueCount })}
                        </span>
                      )}
                      {selectedDoctor.averageRating > 0 && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Star size={10} className="text-amber-400 fill-amber-400" />
                          {selectedDoctor.averageRating} ({selectedDoctor.totalReviews})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Triage details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">{t('findDoctor.step3.labels.reason')}</p>
                    <p className="text-sm font-semibold text-slate-700">{t(`findDoctor.reasons.${selectedReason?.key}.label`)}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">{t('findDoctor.step3.labels.routedTo')}</p>
                    <p className="text-sm font-semibold text-primary-700">
                      {useGpOverride ? t('findDoctor.specialties.gp') : t(`findDoctor.specialties.${triageResult.specialty.toLowerCase().replace(/ /g, '_')}`, { defaultValue: triageResult.specialty })}
                    </p>
                  </div>
                </div>

                {/* Symptoms preview */}
                {symptomsText && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1 flex items-center gap-1">
                      <MessageSquare size={10} /> {t('findDoctor.step3.labels.symptomsNote')}
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{symptomsText}</p>
                  </div>
                )}

                {/* Info note */}
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <AlertCircle size={14} className="text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    {t('findDoctor.step3.infoNote')}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3 border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium rounded-xl transition flex items-center justify-center gap-2"
              >
                <ChevronLeft size={16} /> {t('common.back')}
              </button>
              <button
                type="button"
                onClick={handleBooking}
                disabled={isSubmitting}
                className="flex-[2] py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> {t('findDoctor.step3.booking')}
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} /> {t('findDoctor.step3.confirm')}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        
      </div>
    </div>
  );
};

export default FindDoctor;
