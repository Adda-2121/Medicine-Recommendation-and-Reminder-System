import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import io from 'socket.io-client';
import {
  PlusCircle,
  MessageSquare,
  Bell,
  History,
  Star,
  CreditCard,
  Stethoscope,
  MapPin,
  ArrowRight,
  UserRoundPlus
} from 'lucide-react';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

const PatientDashboard = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  // We'll keep these for potential quick views, but the main UI is action cards now
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading basic data if needed, or just remove if cards are purely navigation
    setTimeout(() => setLoading(false), 500);
  }, []);

  const actionCards = [
    {
      title: t('patientDashboard.actionCards.activeChats'),
      description: t('patientDashboard.actionCards.activeChatsDesc'),
      icon: MessageSquare,
      color: 'bg-blue-50 text-blue-600',
      onClick: () => navigate('/consultations')
    },
    {
      title: t('patientDashboard.actionCards.upcomingReminders'),
      description: t('patientDashboard.actionCards.upcomingRemindersDesc'),
      icon: Bell,
      color: 'bg-amber-50 text-amber-600',
      onClick: () => navigate('/reminders')
    },
    {
      title: t('patientDashboard.actionCards.medicalHistory'),
      description: t('patientDashboard.actionCards.medicalHistoryDesc'),
      icon: History,
      color: 'bg-emerald-50 text-emerald-600',
      onClick: () => navigate('/history')
    }
  ];

  return (
    <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{t('patientDashboard.welcome', { name: user?.name || t('patientDashboard.fallbackName') })}</h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base">{t('patientDashboard.overview')}</p>
          </div>
        </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-slate-100 h-40 rounded-xl"></div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {actionCards.map((card, idx) => (
              <div
                key={idx}
                onClick={card.onClick}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center text-center hover:shadow-md transition cursor-pointer hover:-translate-y-1"
              >
                <div className={`${card.color} p-4 rounded-full mx-auto mb-4`}>
                  <card.icon size={32} />
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">{card.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>

          {/* Quick Overview Section (Optional but good for UX) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <MessageSquare className="mr-2 text-slate-400" size={20} /> {t('patientDashboard.recentActivity')}
              </h2>
              <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                <p className="text-slate-500 mb-4 text-sm">{t('patientDashboard.noActivity')}</p>
                <button
                  onClick={() => navigate('/consultations?action=new')}
                  className="text-primary-600 font-medium hover:underline text-sm"
                >
                  {t('patientDashboard.startNew')}
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl shadow-md text-white p-6 relative overflow-hidden flex flex-col justify-center items-center text-center">
              <Bell size={100} className="absolute -right-6 -bottom-6 opacity-10" />
              <div className="bg-white/20 p-4 rounded-full mb-4 backdrop-blur-sm">
                <Bell size={32} className="text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 z-10">{t('patientDashboard.stayOnTrack')}</h3>
              <p className="text-primary-100 text-sm z-10 mb-6">{t('patientDashboard.checkReminders')}</p>
              <button
                onClick={() => navigate('/reminders')}
                className="bg-white text-primary-700 px-6 py-2 rounded-full font-medium text-sm shadow-sm hover:bg-slate-50 transition z-10"
              >
                {t('patientDashboard.viewSchedule')}
              </button>
            </div>
          </div>

          <PatientReferralPanel />
          <PatientServiceQueue />
          <PendingFeedback />
        </>
      )}
    </div>
  );
};

// ─── Active specialist referrals (GP → specialist workflow) ─────────────────
const PatientReferralPanel = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/consultations/my-referrals');
        setReferrals(res.data || []);
      } catch (err) {
        console.error('Failed to load referrals', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || referrals.length === 0) return null;

  const paymentLabel = (ref) => {
    const payStatus = ref.SpecialistConsultation?.Payment?.status;
    if (payStatus === 'verified') return t('patientDashboard.referral.paymentSuccess');
    return t('patientDashboard.referral.paymentRequired');
  };

  const consultLabel = (ref) => {
    const st = ref.SpecialistConsultation?.status;
    if (st === 'in_progress' || st === 'active' || st === 'assigned') {
      return t('patientDashboard.referral.activeConsultation');
    }
    return st || ref.status;
  };

  return (
    <div className="mb-8 bg-white rounded-xl shadow-sm border border-violet-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-violet-100 bg-violet-50 flex items-center gap-2">
        <UserRoundPlus size={20} className="text-violet-600" />
        <h2 className="text-lg font-bold text-slate-800">{t('patientDashboard.referral.title')}</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {referrals.map(ref => {
          const consultId = ref.SpecialistConsultation?.id;
          const paid = ref.SpecialistConsultation?.Payment?.status === 'verified';
          const room = ref.Specialist?.room_number || ref.Specialist?.work_location;

          return (
            <div key={ref.id} className="p-6 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-1">
                  {ref.specialty}
                </p>
                <p className="font-bold text-slate-800 text-lg">
                  {t('patientDashboard.referral.specialist')}: Dr. {ref.Specialist?.name || '—'}
                </p>
                {ref.referral_reason && (
                  <p className="text-sm text-slate-600 mt-1">{ref.referral_reason}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-3 text-sm">
                  {room && (
                    <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
                      <MapPin size={14} /> {t('patientDashboard.referral.room')}: {room}
                    </span>
                  )}
                  <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                    {t('patientDashboard.referral.consultationStatus')}: {consultLabel(ref)}
                  </span>
                  <span className={`px-2 py-1 rounded-md ${paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                    {t('patientDashboard.referral.paymentStatus')}: {paymentLabel(ref)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => consultId && navigate(`/consultations?id=${consultId}`)}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm text-white bg-violet-600 hover:bg-violet-700 transition"
              >
                {paid ? (
                  <>
                    <MessageSquare size={16} />
                    {t('patientDashboard.referral.openChat')}
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    {t('patientDashboard.referral.payNow')}
                  </>
                )}
                <ArrowRight size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Pending Feedback Component ───────────────────────────────────────────────
const PendingFeedback = () => {
  const [pending, setPending] = useState([]);   // completed consultations without a review
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, consultation: null, rating: 0, comment: '', submitting: false });

  const fetchPending = async () => {
    try {
      const [consRes, testRes] = await Promise.all([
        api.get('/consultations'),
        api.get('/testimonials/my').catch(() => ({ data: [] }))
      ]);
      const reviewed = new Set(testRes.data.map(t => t.service_id));
      const unreviewed = consRes.data.filter(
        c => c.status === 'completed' && c.doctor_id && !reviewed.has(c.id)
      );
      setPending(unreviewed);
    } catch (err) {
      console.error('Failed to fetch pending feedback', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const openModal = (consultation) => {
    setModal({ open: true, consultation, rating: 0, comment: '', submitting: false });
  };

  const closeModal = () => {
    setModal({ open: false, consultation: null, rating: 0, comment: '', submitting: false });
  };

  const submit = async () => {
    if (modal.rating === 0) return toast.error('Please select a star rating');
    setModal(prev => ({ ...prev, submitting: true }));
    try {
      await api.post('/testimonials', {
        service_id: modal.consultation.id,
        service_type: 'consultation',
        rating: modal.rating,
        comment: modal.comment
      });
      toast.success('Thank you for your feedback!');
      closeModal();
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
      setModal(prev => ({ ...prev, submitting: false }));
    }
  };

  if (loading || pending.length === 0) return null;

  const LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

  return (
    <>
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-amber-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-amber-100 text-amber-600 p-2 rounded-lg">
            <Star size={20} className="fill-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Rate Your Doctor</h2>
            <p className="text-xs text-slate-500">You have {pending.length} completed consultation{pending.length > 1 ? 's' : ''} waiting for your feedback</p>
          </div>
        </div>

        <div className="space-y-3">
          {pending.map(c => (
            <div key={c.id} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm shrink-0">
                  {c.Doctor?.name?.charAt(0) || 'D'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Dr. {c.Doctor?.name || 'Doctor'}</p>
                  <p className="text-xs text-slate-500">{c.reason || 'Consultation'} · {new Date(c.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button
                onClick={() => openModal(c)}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-sm shrink-0"
              >
                <Star size={13} className="fill-white" /> Leave Rating
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Rating Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-lg shrink-0">
                {modal.consultation?.Doctor?.name?.charAt(0) || 'D'}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Rate Dr. {modal.consultation?.Doctor?.name}</h3>
                <p className="text-xs text-slate-500">{modal.consultation?.reason || 'Consultation'}</p>
              </div>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-3 mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setModal(prev => ({ ...prev, rating: star }))}
                  className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    size={44}
                    className={modal.rating >= star
                      ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                      : 'text-slate-200 fill-slate-100'}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm font-medium text-amber-600 mb-5 h-5">
              {modal.rating > 0 ? LABELS[modal.rating] : ''}
            </p>

            {/* Comment */}
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Comment <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={modal.comment}
              onChange={e => setModal(prev => ({ ...prev, comment: e.target.value }))}
              rows={3}
              className="w-full border border-slate-300 rounded-xl p-3 text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none mb-5"
              placeholder="How was your experience with this doctor?"
            />

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={modal.submitting || modal.rating === 0}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                <Star size={14} className={modal.rating > 0 ? 'fill-amber-300 text-amber-300' : 'text-white'} />
                {modal.submitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Service Queue Component ───────────────────────────────────────────────────
const PatientServiceQueue = () => {
  const { user } = useContext(AuthContext);
  const [serviceReqs, setServiceReqs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check for Chapa payment return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tx_ref = params.get('payment_ref');
    if (tx_ref) {
      api.get(`/chapa/verify/${tx_ref}`)
        .then(() => {
          toast.success('Payment Verified Successfully!');
          window.history.replaceState({}, document.title, '/patient');
          fetchQueue();
        })
        .catch(err => {
          console.error(err);
          toast.error('Payment verification is pending or failed.');
          window.history.replaceState({}, document.title, '/patient');
        });
    }
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await api.get('/service-requests/queue');
      setServiceReqs(res.data);
    } catch (err) {
      console.error('Failed to fetch service queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for real-time queue updates from the specialist's actions
  useEffect(() => {
    if (!user?.id) return;
    const socket = io(SOCKET_URL);
    socket.emit('join_user_room', user.id);
    socket.on('queue_updated', () => {
      fetchQueue();
    });
    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  const handlePay = async (id) => {
    try {
      const res = await api.post('/chapa/initialize', { service_request_id: id });
      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initialization failed');
    }
  };

  if (loading) return <div className="mt-8 animate-pulse bg-slate-100 h-32 rounded-xl"></div>;
  if (serviceReqs.length === 0) return null;

  return (
    <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
        Service Requests Tracker
      </h2>
      <div className="space-y-4">
        {serviceReqs.map(test => (
          <div key={test.id} className="border border-slate-200 rounded-lg p-5 bg-slate-50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="font-bold text-slate-800 text-lg capitalize">{test.ServiceItem?.name || 'Service'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${test.status === 'completed' ? 'bg-purple-100 text-purple-800' : test.queue_status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'}`}>
                  {test.status === 'completed' ? 'Completed' : test.queue_status === 'active' ? 'Being Processed' : 'Waiting in Queue'}
                </span>
                {test.payment_status === 'paid' ? (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">Paid</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800">Unpaid - Action Required</span>
                )}
              </div>
              <p className="text-sm text-slate-600 mb-1">
                <strong>Location:</strong> {test.Specialist?.work_location || (test.service_type === 'radiology' ? 'Radiology Department (Pending Assignment)' : 'Laboratory Department (Pending Assignment)')}
              </p>
              <p className="text-sm text-slate-500">
                <strong>Assigned To:</strong> {test.Specialist ? `${test.Specialist.name} (${test.service_type})` : 'Waiting for specialist assignment...'}
              </p>
            </div>

            <div className="flex flex-col items-end md:items-center">
              {test.payment_status === 'paid' && test.status !== 'completed' && test.specialist_id ? (
                <div className="bg-white border flex flex-col items-center justify-center border-emerald-200 rounded-lg p-3 text-center mb-3 min-w-[160px] shadow-sm">
                  {test.queue_status === 'active' ? (
                    <>
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">Being Processed</span>
                      <span className="text-2xl font-bold text-blue-600">🔬 Active</span>
                      <span className="text-xs text-slate-500 mt-1">Your turn now</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-slate-500 font-medium">Queue Number</span>
                      <span className="text-3xl font-bold text-emerald-600">#{test.queue_number ?? test.queue_position}</span>
                      {test.patients_ahead > 0 ? (
                        <span className="text-xs text-slate-500 mt-1">{test.patients_ahead} patient{test.patients_ahead !== 1 ? 's' : ''} ahead</span>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold mt-1">You're next!</span>
                      )}
                    </>
                  )}
                </div>
              ) : test.payment_status !== 'paid' && test.status !== 'completed' ? (
                <div className="bg-rose-50 border flex flex-col items-center justify-center border-rose-200 rounded-lg p-3 text-center mb-3 min-w-[140px]">
                  <span className="text-sm text-rose-600 font-medium">Payment Required</span>
                  <span className="text-xs text-rose-500 mt-1">Pay to join queue</span>
                </div>
              ) : null}
              {test.payment_status !== 'paid' && test.status !== 'completed' && (
                <button
                  onClick={() => handlePay(test.id)}
                  className="bg-[#24a05f] hover:bg-[#1a7a48] text-white font-bold py-2 px-6 rounded shadow transition"
                >
                  Pay {test.price} Birr via Chapa
                </button>
              )}
              {test.status === 'completed' && (
                <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-2 rounded-full">
                  ✓ Service Completed
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientDashboard;
