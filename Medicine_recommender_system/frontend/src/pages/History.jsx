import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import {
  History as HistoryIcon, Search, Filter, FileText, ChevronRight, Star, MessageSquare,
  Pill, ClipboardList, Stethoscope, ChevronDown, CheckCircle, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

//  Shared helpers 

const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const map = {
    completed: 'bg-green-100 text-green-700',
    in_progress: 'bg-blue-100 text-blue-700',
    assigned: 'bg-amber-100 text-amber-700',
    pending: 'bg-amber-100 text-amber-700',
  };
  const label = {
    completed: t('history.status.completed', 'Completed'),
    in_progress: t('history.status.inProgress', 'In Progress'),
    assigned: t('history.status.assigned', 'Assigned'),
    pending: t('history.status.pending', 'Pending'),
  };
  return (
    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded inline-block ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {label[status] || status?.replace('_', ' ')}
    </span>
  );
};

const applyDateFilter = (items, filterDate, dateField = 'created_at') => {
  if (filterDate === 'all') return items;
  const now = new Date();
  return items.filter(item => {
    const d = new Date(item[dateField]);
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (filterDate === '7days') return diffDays <= 7;
    if (filterDate === '30days') return diffDays <= 30;
    if (filterDate === 'older') return diffDays > 30;
    return true;
  });
};

const LoadingSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl" />)}
  </div>
);

const EmptyState = ({ icon: Icon, title, message }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
    <div className="bg-slate-50 p-6 rounded-full mb-4 border border-slate-200 border-dashed">
      <Icon size={48} className="text-slate-300" />
    </div>
    <h3 className="text-lg font-medium text-slate-600 mb-1">{title}</h3>
    <p className="text-sm">{message}</p>
  </div>
);


//  Patient: Consultations Tab 

const PatientConsultationsTab = ({ consultations, myTestimonials, searchTerm, filterDate, navigate, openFeedback }) => {
  const { t } = useTranslation();
  const filtered = applyDateFilter(
    consultations.filter(c =>
      (c.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.Doctor?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    ),
    filterDate
  );

  if (filtered.length === 0) {
    return <EmptyState icon={FileText} title={t('history.empty.noConsultations')} message={t('history.empty.noConsultationsMsg')} />;
  }

  return (
    <div className="space-y-4">
      {filtered.map(record => (
        <div
          key={record.id}
          className="bg-white border border-slate-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-md transition cursor-pointer group flex flex-col sm:flex-row gap-4"
          onClick={() => navigate(`/consultations?id=${record.id}`)}
        >
          <div className="sm:w-48 shrink-0 flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-slate-100 pb-4 sm:pb-0 sm:pr-4">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              {new Date(record.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-xs text-slate-400 mt-1">
              {new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <div className="mt-3"><StatusBadge status={record.status} /></div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <h3 className="font-bold text-lg text-slate-800 mb-1">{record.reason || t('history.labels.generalConsultation')}</h3>
            <p className="text-slate-600 text-sm line-clamp-2 mb-2">{record.symptoms_description}</p>
            <p className="text-sm font-medium text-slate-700 flex items-center mt-auto pt-2">
              {t('history.labels.attendingDoctor')}{' '}
              <span className="ml-2 text-primary-600 font-bold">
                {record.Doctor ? `Dr. ${record.Doctor.name}` : t('history.labels.pendingAssignment')}
              </span>
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-end justify-center space-y-2">
            {record.status === 'completed' && record.Doctor && (
              myTestimonials.find(testim => testim.service_id === record.id) ? (
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center">
                    <Star size={12} className="mr-1 fill-emerald-600" /> {t('history.feedback.reviewed')}
                  </span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => {
                      const testim = myTestimonials.find(tst => tst.service_id === record.id);
                      return <Star key={s} size={10} className={s <= (testim?.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />;
                    })}
                  </div>
                </div>
              ) : (
                <button
                  onClick={(e) => openFeedback(e, record)}
                  className="text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1"
                >
                  <Star size={13} className="text-amber-300" /> {t('history.feedback.rateDr', { name: record.Doctor?.name?.split(' ')[0] })}
                </button>
              )
            )}
            <div className="bg-slate-50 group-hover:bg-primary-50 text-slate-400 group-hover:text-primary-600 p-2 rounded-full transition self-end mt-auto">
              <ChevronRight size={20} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};


//  Patient: Prescriptions Tab 

const PatientPrescriptionsTab = ({ prescriptions, searchTerm, filterDate }) => {
  const { t } = useTranslation();
  const filtered = applyDateFilter(
    prescriptions.filter(p =>
      (p.Drug?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.Consultation?.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.Doctor?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    ),
    filterDate
  );

  // Group by consultation_id
  const groups = filtered.reduce((acc, p) => {
    const key = p.consultation_id;
    if (!acc[key]) acc[key] = { consultation: p.Consultation, doctor: p.Doctor, items: [] };
    acc[key].items.push(p);
    return acc;
  }, {});

  const groupList = Object.values(groups);

  if (groupList.length === 0) {
    return <EmptyState icon={Pill} title={t('history.empty.noPrescriptions')} message={t('history.empty.noPrescriptionsMsg')} />;
  }

  return (
    <div className="space-y-6">
      {groupList.map((group, idx) => (
        <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-800">{group.consultation?.reason || t('history.labels.generalConsultation')}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {group.consultation?.created_at
                  ? new Date(group.consultation.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                  : ''}
                {group.doctor ? `  Dr. ${group.doctor.name}` : ''}
              </p>
            </div>
            <span className="text-xs font-semibold text-primary-600 bg-primary-50 border border-primary-100 px-3 py-1 rounded-full self-start sm:self-auto">
              {group.items.length} {group.items.length !== 1 ? t('history.labels.drugs') : t('history.labels.drug')}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {group.items.map((p, i) => (
              <div key={i} className="px-5 py-4 flex items-start gap-4">
                <div className="bg-primary-100 text-primary-600 p-2 rounded-lg shrink-0 mt-0.5">
                  <Pill size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{p.Drug?.name || t('history.labels.unknownDrug')}</p>
                  {p.Drug?.dosage && <p className="text-sm text-slate-600 mt-0.5">{t('history.labels.dosage')} <span className="font-medium">{p.Drug.dosage}</span></p>}
                  {p.Drug?.side_effects && <p className="text-sm text-slate-500 mt-0.5">{t('history.labels.sideEffects')} {p.Drug.side_effects}</p>}
                  {p.instructions && <p className="text-sm text-slate-600 mt-1 italic border-l-2 border-primary-200 pl-2">{p.instructions}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};


//  Doctor: Consultations Tab 

const DoctorConsultationsTab = ({ consultations, searchTerm, filterDate, navigate }) => {
  const { t } = useTranslation();
  const filtered = applyDateFilter(
    consultations.filter(c =>
      (c.Patient?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.symptoms_description || '').toLowerCase().includes(searchTerm.toLowerCase())
    ),
    filterDate
  );

  if (filtered.length === 0) {
    return <EmptyState icon={Stethoscope} title={t('history.empty.noDoctorConsultations')} message={t('history.empty.noDoctorConsultationsMsg')} />;
  }

  return (
    <div className="space-y-4">
      {filtered.map(record => (
        <div
          key={record.id}
          className="bg-white border border-slate-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-md transition cursor-pointer group flex flex-col sm:flex-row gap-4"
          onClick={() => navigate(`/consultations?id=${record.id}`)}
        >
          <div className="sm:w-48 shrink-0 flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-slate-100 pb-4 sm:pb-0 sm:pr-4">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              {new Date(record.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-xs text-slate-400 mt-1">
              {record.appointment_date
                ? new Date(record.appointment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : 'No appt.'}
            </span>
            <div className="mt-3"><StatusBadge status={record.status} /></div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <p className="text-sm font-bold text-primary-700 mb-1">
              {t('history.labels.patientName')} {record.Patient?.name || 'Unknown'}
            </p>
            <h3 className="font-bold text-slate-800 mb-1">{record.reason || t('history.labels.generalConsultation')}</h3>
            <p className="text-slate-600 text-sm line-clamp-2">{record.symptoms_description}</p>
          </div>

          <div className="shrink-0 flex items-center">
            <div className="bg-slate-50 group-hover:bg-primary-50 text-slate-400 group-hover:text-primary-600 p-2 rounded-full transition">
              <ChevronRight size={20} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};


//  Doctor: Prescriptions Issued Tab 

const DoctorPrescriptionsTab = ({ prescriptions, searchTerm, filterDate }) => {
  const { t } = useTranslation();
  const filtered = applyDateFilter(
    prescriptions.filter(p =>
      (p.Patient?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.Consultation?.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.Drug?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    ),
    filterDate
  );

  const groups = filtered.reduce((acc, p) => {
    const key = p.consultation_id;
    if (!acc[key]) acc[key] = { consultation: p.Consultation, patient: p.Patient, items: [] };
    acc[key].items.push(p);
    return acc;
  }, {});

  const groupList = Object.values(groups);

  if (groupList.length === 0) {
    return <EmptyState icon={Pill} title={t('history.empty.noDoctorPrescriptions')} message={t('history.empty.noDoctorPrescriptionsMsg')} />;
  }

  return (
    <div className="space-y-6">
      {groupList.map((group, idx) => (
        <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="font-bold text-slate-800">
                {t('history.labels.patientName')} <span className="text-primary-700">{group.patient?.name || 'Unknown'}</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {group.consultation?.reason || t('history.labels.generalConsultation')}
                {group.consultation?.created_at
                  ? `  ${new Date(group.consultation.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`
                  : ''}
              </p>
            </div>
            <span className="text-xs font-semibold text-primary-600 bg-primary-50 border border-primary-100 px-3 py-1 rounded-full self-start sm:self-auto">
              {group.items.length} {group.items.length !== 1 ? t('history.labels.drugs') : t('history.labels.drug')}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {group.items.map((p, i) => (
              <div key={i} className="px-5 py-4 flex items-start gap-4">
                <div className="bg-primary-100 text-primary-600 p-2 rounded-lg shrink-0 mt-0.5">
                  <Pill size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{p.Drug?.name || t('history.labels.unknownDrug')}</p>
                  {p.Drug?.dosage && <p className="text-sm text-slate-600 mt-0.5">{t('history.labels.dosage')} <span className="font-medium">{p.Drug.dosage}</span></p>}
                  {p.instructions && <p className="text-sm text-slate-600 mt-1 italic border-l-2 border-primary-200 pl-2">{p.instructions}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};


//  Doctor: Treatment Plans Tab 

const TreatmentPlanRow = ({ consultation }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [plan, setPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  const handleExpand = async () => {
    if (!expanded && !plan) {
      setLoadingPlan(true);
      try {
        const res = await api.get(`/treatments/${consultation.id}`);
        setPlan(res.data);
      } catch {
        setPlan(null);
      } finally {
        setLoadingPlan(false);
      }
    }
    setExpanded(prev => !prev);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <button
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition text-left"
        onClick={handleExpand}
      >
        <div className="flex-1">
          <p className="font-bold text-slate-800">{consultation.reason || t('history.labels.generalConsultation')}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('history.labels.patientName')} <span className="font-medium text-primary-700">{consultation.Patient?.name || 'Unknown'}</span>
            {'  '}
            {new Date(consultation.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform shrink-0 ml-4 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50">
          {loadingPlan ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          ) : !plan ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <AlertCircle size={16} className="text-amber-500" />
              {t('history.labels.noTreatmentPlan')}
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              {plan.medicine_recommendation && (
                <div>
                  <p className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                    <Pill size={14} className="text-primary-600" /> {t('history.labels.medicineRecommendation')}
                  </p>
                  <p className="text-slate-600 pl-5">{plan.medicine_recommendation}</p>
                </div>
              )}
              {plan.lifestyle_advice && (
                <div>
                  <p className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                    <CheckCircle size={14} className="text-emerald-600" /> {t('history.labels.lifestyleAdvice')}
                  </p>
                  <p className="text-slate-600 pl-5">{plan.lifestyle_advice}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-3 pt-1">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${plan.lab_test_needed ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                  {plan.lab_test_needed ? t('history.labels.labTestRequired') : t('history.labels.labTestNotRequired')}
                </span>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${plan.follow_up_needed ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                  {plan.follow_up_needed ? t('history.labels.followUpNeeded') : t('history.labels.followUpNotNeeded')}
                </span>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${plan.is_cured ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {plan.is_cured ? `${t('history.labels.cured')}${plan.cured_at ? '  ' + new Date(plan.cured_at).toLocaleDateString() : ''}` : t('history.labels.ongoing')}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DoctorTreatmentPlansTab = ({ consultations, searchTerm, filterDate }) => {
  const { t } = useTranslation();
  const completed = consultations.filter(c => c.status === 'completed');
  const filtered = applyDateFilter(
    completed.filter(c =>
      (c.Patient?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
    ),
    filterDate
  );

  if (filtered.length === 0) {
    return <EmptyState icon={ClipboardList} title={t('history.empty.noTreatmentPlans')} message={t('history.empty.noTreatmentPlansMsg')} />;
  }

  return (
    <div className="space-y-4">
      {filtered.map(c => <TreatmentPlanRow key={c.id} consultation={c} />)}
    </div>
  );
};


//  Feedback Modal (patient only) 

const FeedbackModal = ({ feedbackModal, rating, setRating, comment, setComment, isSubmitting, onClose, onSubmit }) => {
  const { t } = useTranslation();
  if (!feedbackModal.isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm shrink-0">
            {feedbackModal.doctorName.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">{t('history.feedback.rateDr', { name: feedbackModal.doctorName })}</h3>
            <p className="text-xs text-slate-500">{t('history.feedback.helpOthers')}</p>
          </div>
        </div>

        <div className="flex justify-center gap-2 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRating(star); }}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star size={38} className={rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-100'} />
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-slate-400 mb-5 h-4">
          {rating === 1 && t('history.feedback.poor')}{rating === 2 && t('history.feedback.fair')}{rating === 3 && t('history.feedback.good')}{rating === 4 && t('history.feedback.veryGood')}{rating === 5 && t('history.feedback.excellent')}
        </p>

        <label className="block text-sm font-medium text-slate-700 mb-1">
          {t('history.feedback.commentLabel')} <span className="text-slate-400 font-normal">({t('common.optional')})</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full border border-slate-300 rounded-lg p-3 mb-5 min-h-[90px] resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
          placeholder={t('history.feedback.commentPlaceholder')}
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition text-sm"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting || rating === 0}
            className="px-6 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition text-sm flex items-center gap-2"
          >
            <Star size={14} className={rating > 0 ? 'fill-amber-300 text-amber-300' : 'text-white'} />
            {isSubmitting ? t('common.submitting') : t('history.feedback.submitFeedback')}
          </button>
        </div>
      </div>
    </div>
  );
};


//  Main History Component 

const History = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isDoctor = user?.role === 'doctor';

  const [activeTab, setActiveTab] = useState('consultations');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('all');

  // Shared data
  const [consultations, setConsultations] = useState([]);
  const [loadingConsultations, setLoadingConsultations] = useState(true);

  // Patient-only
  const [prescriptions, setPrescriptions] = useState([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [myTestimonials, setMyTestimonials] = useState([]);

  // Doctor-only
  const [doctorPrescriptions, setDoctorPrescriptions] = useState([]);
  const [loadingDoctorPrescriptions, setLoadingDoctorPrescriptions] = useState(false);

  // Feedback modal state (patient only)
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, serviceId: null, type: null, doctorName: '' });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  //  Fetch consultations + testimonials on mount 
  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        setLoadingConsultations(true);
        const res = await api.get('/consultations');
        setConsultations(res.data);
      } catch (err) {
        console.error('Failed to fetch consultations', err);
      } finally {
        setLoadingConsultations(false);
      }
    };

    const fetchTestimonials = async () => {
      try {
        const res = await api.get('/testimonials/my').catch(() => ({ data: [] }));
        setMyTestimonials(res.data);
      } catch {
        setMyTestimonials([]);
      }
    };

    fetchConsultations();
    if (!isDoctor) fetchTestimonials();
  }, [isDoctor]);

  //  Lazy-load prescriptions when tab is activated 
  useEffect(() => {
    if (activeTab === 'prescriptions' && !isDoctor && prescriptions.length === 0) {
      setLoadingPrescriptions(true);
      api.get('/prescriptions/patient')
        .then(res => setPrescriptions(res.data))
        .catch(err => console.error('Failed to fetch patient prescriptions', err))
        .finally(() => setLoadingPrescriptions(false));
    }
    if (activeTab === 'prescriptions' && isDoctor && doctorPrescriptions.length === 0) {
      setLoadingDoctorPrescriptions(true);
      api.get('/prescriptions/doctor')
        .then(res => setDoctorPrescriptions(res.data))
        .catch(err => console.error('Failed to fetch doctor prescriptions', err))
        .finally(() => setLoadingDoctorPrescriptions(false));
    }
  }, [activeTab, isDoctor, prescriptions.length, doctorPrescriptions.length]);

  //  Feedback handlers 
  const openFeedback = (e, record) => {
    e.stopPropagation();
    setFeedbackModal({ isOpen: true, serviceId: record.id, type: 'consultation', doctorName: record.Doctor?.name || 'Doctor' });
    setRating(0);
    setComment('');
  };

  const submitFeedback = async () => {
    if (rating === 0) return toast.error('Please select a rating');
    setIsSubmitting(true);
    try {
      await api.post('/testimonials', { service_id: feedbackModal.serviceId, service_type: feedbackModal.type, rating, comment });
      toast.success('Feedback submitted successfully!');
      setFeedbackModal({ isOpen: false, serviceId: null, type: null, doctorName: '' });
      // Refresh testimonials
      const res = await api.get('/testimonials/my').catch(() => ({ data: [] }));
      setMyTestimonials(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  //  Tab definitions 
  const patientTabs = [
    { id: 'consultations', label: t('history.tabs.consultations'), count: consultations.length },
    { id: 'prescriptions', label: t('history.tabs.myPrescriptions'), count: null },
  ];

  const doctorTabs = [
    { id: 'consultations', label: t('history.tabs.consultations'), count: consultations.length },
    { id: 'prescriptions', label: t('history.tabs.prescriptionsIssued'), count: doctorPrescriptions.length || null },
    { id: 'treatments', label: t('history.tabs.treatmentPlans'), count: consultations.filter(c => c.status === 'completed').length || null },
  ];

  const tabs = isDoctor ? doctorTabs : patientTabs;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200">

      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <HistoryIcon className="mr-3 text-primary-600" size={28} />
            {isDoctor ? t('history.titleDoctor') : t('history.titlePatient')}
          </h1>
          <p className="text-slate-500 mt-1">
            {isDoctor
              ? t('history.subtitleDoctor')
              : t('history.subtitlePatient')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder={t('history.searchPlaceholder')}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          </div>

          <div className="relative flex-shrink-0">
            <select
              className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white appearance-none w-full"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            >
              <option value="all">{t('history.dateFilter.all')}</option>
              <option value="7days">{t('history.dateFilter.7days')}</option>
              <option value="30days">{t('history.dateFilter.30days')}</option>
              <option value="older">{t('history.dateFilter.older')}</option>
            </select>
            <Filter className="absolute left-3 top-2.5 text-slate-400" size={18} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-slate-200 px-6 shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Patient tabs */}
        {!isDoctor && activeTab === 'consultations' && (
          loadingConsultations
            ? <LoadingSkeleton />
            : <PatientConsultationsTab
                consultations={consultations}
                myTestimonials={myTestimonials}
                searchTerm={searchTerm}
                filterDate={filterDate}
                navigate={navigate}
                openFeedback={openFeedback}
              />
        )}
        {!isDoctor && activeTab === 'prescriptions' && (
          loadingPrescriptions
            ? <LoadingSkeleton />
            : <PatientPrescriptionsTab
                prescriptions={prescriptions}
                searchTerm={searchTerm}
                filterDate={filterDate}
              />
        )}

        {/* Doctor tabs */}
        {isDoctor && activeTab === 'consultations' && (
          loadingConsultations
            ? <LoadingSkeleton />
            : <DoctorConsultationsTab
                consultations={consultations}
                searchTerm={searchTerm}
                filterDate={filterDate}
                navigate={navigate}
              />
        )}
        {isDoctor && activeTab === 'prescriptions' && (
          loadingDoctorPrescriptions
            ? <LoadingSkeleton />
            : <DoctorPrescriptionsTab
                prescriptions={doctorPrescriptions}
                searchTerm={searchTerm}
                filterDate={filterDate}
              />
        )}
        {isDoctor && activeTab === 'treatments' && (
          loadingConsultations
            ? <LoadingSkeleton />
            : <DoctorTreatmentPlansTab
                consultations={consultations}
                searchTerm={searchTerm}
                filterDate={filterDate}
              />
        )}
      </div>

      {/* Feedback Modal (patient only) */}
      <FeedbackModal
        feedbackModal={feedbackModal}
        rating={rating}
        setRating={setRating}
        comment={comment}
        setComment={setComment}
        isSubmitting={isSubmitting}
        onClose={() => setFeedbackModal({ isOpen: false, serviceId: null, type: null, doctorName: '' })}
        onSubmit={submitFeedback}
      />
    </div>
  );
};

export default History;
