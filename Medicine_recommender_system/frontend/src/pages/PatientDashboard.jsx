import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  PlusCircle,
  MessageSquare,
  Bell,
  History,
  UserCircle,
  Star
} from 'lucide-react';
import toast from 'react-hot-toast';

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
      title: t('patientDashboard.actionCards.startConsultation'),
      description: t('patientDashboard.actionCards.startConsultationDesc'),
      icon: PlusCircle,
      color: 'bg-primary-50 text-primary-600',
      onClick: () => navigate('/consultations?action=new')
    },
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
      {/* Top Navbar / Header Area (Specific to the dashboard content area) */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{t('patientDashboard.welcome', { name: user?.name || t('patientDashboard.fallbackName') })}</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">{t('patientDashboard.overview')}</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 text-slate-400 hover:text-primary-600 bg-white rounded-full border border-slate-200 shadow-sm relative transition-colors">
            <Bell size={20} />
            <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50 transition">
            <UserCircle size={24} className="text-slate-400" />
            <span className="font-medium text-sm text-slate-700 hidden sm:block">{t('patientDashboard.myProfile')}</span>
          </div>
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

          <PatientServiceQueue />
        </>
      )}
    </div>
  );
};

const PatientServiceQueue = () => {
  const [serviceReqs, setServiceReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myTestimonials, setMyTestimonials] = useState([]);

  // Feedback Modal State
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, serviceId: null, type: null, providerName: '' });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Check for Chapa payment return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tx_ref = params.get('payment_ref');
    if (tx_ref) {
      // Call verify
      api.get(`/chapa/verify/${tx_ref}`)
        .then(res => {
          toast.success('Payment Verified Successfully!');
          // Remove from URL
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
      const [reqsRes, testsRes] = await Promise.all([
        api.get('/service-requests/queue'),
        api.get('/testimonials/my').catch(() => ({ data: [] }))
      ]);
      setServiceReqs(reqsRes.data);
      setMyTestimonials(testsRes.data);
    } catch (err) {
      console.error('Failed to fetch service queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

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

  const openFeedback = (test) => {
    setFeedbackModal({
      isOpen: true,
      serviceId: test.id,
      type: test.service_type,
      providerName: test.Specialist?.name || 'Specialist'
    });
    setRating(0);
    setComment('');
  };

  const submitFeedback = async () => {
    if (rating === 0) return toast.error('Please select a rating');
    setIsSubmittingFeedback(true);
    try {
      await api.post('/testimonials', {
        service_id: feedbackModal.serviceId,
        service_type: feedbackModal.type,
        rating,
        comment
      });
      toast.success('Feedback submitted successfully!');
      setFeedbackModal({ isOpen: false, serviceId: null, type: null, providerName: '' });
      fetchQueue();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
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
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${test.status === 'completed' ? 'bg-purple-100 text-purple-800' : test.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'}`}>
                  {test.status === 'completed' ? 'Completed' : (test.status === 'in_progress' || test.status === 'pending') ? 'Pending' : test.status}
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
                <strong>Assigned To:</strong> {test.Specialist ? `Dr./Mr. ${test.Specialist.name} (${test.service_type})` : 'Waiting for specialist assignment...'}
              </p>
            </div>

            <div className="flex flex-col items-end md:items-center">
              {test.payment_status === 'paid' && test.status !== 'completed' && test.specialist_id ? (
                <div className="bg-white border flex flex-col items-center justify-center border-emerald-200 rounded-lg p-3 text-center mb-3 min-w-[140px] shadow-sm">
                  <span className="text-sm text-slate-500 font-medium">Your Queue Position</span>
                  <span className="text-3xl font-bold text-emerald-600">#{test.queue_position}</span>
                  <span className="text-xs text-slate-500 mt-1 font-medium">Wait time: ~{test.estimated_wait_time_mins} mins</span>
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
                myTestimonials.find(t => t.service_id === test.id) ? (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-full flex items-center">
                    <Star size={14} className="mr-1 fill-emerald-600" /> Feedback Submitted
                  </span>
                ) : (
                  <button
                    onClick={() => openFeedback(test)}
                    className="text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg shadow-sm transition flex items-center"
                  >
                    <MessageSquare size={16} className="mr-1" /> Leave Feedback
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Feedback Modal */}
      {feedbackModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Rate Your Experience</h3>
            <p className="text-sm text-slate-500 mb-6">How was your service with Specialist {feedbackModal.providerName}?</p>

            <div className="flex justify-center space-x-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRating(star); }}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    size={36}
                    className={`${rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                  />
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium text-slate-700 mb-1">Comment (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-3 mb-6 min-h-[100px] resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="Share details of your experience..."
            ></textarea>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setFeedbackModal({ isOpen: false, serviceId: null, type: null, providerName: '' })}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={submitFeedback}
                disabled={isSubmittingFeedback || rating === 0}
                className="px-6 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition"
              >
                {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientDashboard;
