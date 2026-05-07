import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { 
  Users, 
  MessageSquare, 
  Clock, 
  CheckCircle,
  UserCircle,
  Bell,
  Calendar,
  Plus,
  Trash2,
  Star,
  ClipboardList,
  Activity,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/common/ConfirmationModal';

const DoctorDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Overview State
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Availability State
  const [availabilities, setAvailabilities] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [newSlot, setNewSlot] = useState({ date: '', start_time: '', end_time: '' });
  const [isAddingSlot, setIsAddingSlot] = useState(false);

  // Reviews State
  const [reviewsData, setReviewsData] = useState({ averageRating: 0, totalReviews: 0, testimonials: [] });
  const [loadingReviews, setLoadingReviews] = useState(false);

  const [modalConfig, setModalConfig] = useState({ isOpen: false, slotId: null });

  useEffect(() => {
    fetchConsultations();
    fetchAvailabilities();
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const res = await api.get(`/testimonials/provider/${user.id}`);
      setReviewsData(res.data);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchConsultations = async () => {
    try {
      const res = await api.get('/consultations');
      setConsultations(res.data);
    } catch (err) {
      console.error('Failed to fetch consultations', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailabilities = async () => {
    try {
      setLoadingSlots(true);
      const res = await api.get('/availability', {
        params: { doctor_id: user.id }
      });
      setAvailabilities(res.data);
    } catch (err) {
      console.error('Failed to fetch availabilities', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!newSlot.date || !newSlot.start_time || !newSlot.end_time) return;
    
    try {
      setIsAddingSlot(true);
      await api.post('/availability', newSlot);
      setNewSlot({ date: '', start_time: '', end_time: '' });
      fetchAvailabilities();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add slot');
    } finally {
      setIsAddingSlot(false);
    }
  };

  const confirmDelete = (id) => {
    setModalConfig({ isOpen: true, slotId: id });
  };

  
  const handleResumeConsultation = async (id) => {
    try {
      await api.put(`/consultations/${id}/resume`);
      toast.success('Case resumed! You can now continue the consultation.');
      fetchConsultations();
      navigate(`/consultations?id=${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resume consultation');
    }
  };

  // ── Referral state ────────────────────────────────────────────────────────
  const SPECIALIST_TYPES = [
    'Psychiatrist', 'Dermatologist', 'Cardiologist', 'Internal Medicine',
    'Pediatrician', 'Gynecologist', 'Pulmonologist', 'Neurologist', 'Orthopedic'
  ];
  const [referralModal, setReferralModal] = useState({ isOpen: false, consultationId: null });
  const [referralForm, setReferralForm] = useState({ target_specialty: '', referral_notes: '' });
  const [referralLoading, setReferralLoading] = useState(false);

  const handleReferSubmit = async (e) => {
    e.preventDefault();
    if (!referralForm.target_specialty) return;
    setReferralLoading(true);
    try {
      await api.post(`/consultations/${referralModal.consultationId}/refer`, referralForm);
      toast.success(`Patient referred to ${referralForm.target_specialty} successfully.`);
      setReferralModal({ isOpen: false, consultationId: null });
      setReferralForm({ target_specialty: '', referral_notes: '' });
      fetchConsultations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create referral');
    } finally {
      setReferralLoading(false);
    }
  };

  const executeDelete = async () => {
    try {
      await api.delete(`/availability/${modalConfig.slotId}`);
      fetchAvailabilities();
      setModalConfig({ isOpen: false, slotId: null });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete slot');
    }
  };

    const stats = {
    pending: consultations.filter(c => c.status === 'assigned').length,
    activeChats: consultations.filter(c => c.status === 'in_progress').length,
    pendingResults: consultations.filter(c => c.status === 'waiting_for_results').length,
    resultsReady: consultations.filter(c => c.status === 'result_ready').length,
    completed: consultations.filter(c => c.status === 'completed').length,
  };

  const summaryCards = [
    { title: 'Pending Patients', value: stats.pending, icon: Users, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'Active Chats', value: stats.activeChats, icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Pending Results', value: stats.pendingResults, icon: Clock, color: 'text-slate-600', bg: 'bg-slate-100' },
    { title: 'Results Ready', value: stats.resultsReady, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dr. {user?.name || 'Doctor'}</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">Your clinical overview and active cases.</p>
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-2 text-slate-400 hover:text-primary-600 bg-white rounded-full border border-slate-200 shadow-sm relative transition-colors">
            <Bell size={20} />
          </button>
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50 transition">
            <UserCircle size={24} className="text-slate-400" />
            <span className="font-medium text-sm text-slate-700 hidden sm:block">Profile</span>
          </div>
        </div>
      </div>

      {/* Verification Status Banner */}
      {user?.verification_status === 'pending' && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <div className="bg-amber-100 p-2 rounded-full shrink-0">
            <Clock size={18} className="text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-amber-800 text-sm">Account Pending Verification</p>
            <p className="text-amber-700 text-xs mt-0.5">
              Your credentials are under review by our admin team. You'll receive an email once your account is approved. Some features may be limited until verification is complete.
            </p>
          </div>
        </div>
      )}

      {user?.verification_status === 'rejected' && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <div className="bg-red-100 p-2 rounded-full shrink-0">
            <XCircle size={18} className="text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-red-800 text-sm">Application Rejected</p>
            <p className="text-red-700 text-xs mt-0.5">
              Your application was not approved.
              {user?.rejection_reason && <> Reason: <strong>{user.rejection_reason}</strong>.</>}
              {' '}Please contact support or re-register with updated documents.
            </p>
          </div>
        </div>
      )}

      {user?.verification_status === 'suspended' && (
        <div className="mb-4 bg-slate-100 border border-slate-300 rounded-xl p-4 flex items-start gap-3">
          <div className="bg-slate-200 p-2 rounded-full shrink-0">
            <AlertTriangle size={18} className="text-slate-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">Account Suspended</p>
            <p className="text-slate-600 text-xs mt-0.5">
              Your account has been suspended.
              {user?.rejection_reason && <> Reason: <strong>{user.rejection_reason}</strong>.</>}
              {' '}Please contact support for assistance.
            </p>
          </div>
        </div>
      )}

      {user?.verification_status === 'verified' && user?.is_verified && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <div className="bg-emerald-100 p-2 rounded-full shrink-0">
            <ShieldCheck size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-emerald-800 text-sm">Verified Professional</p>
            <p className="text-emerald-700 text-xs mt-0.5">Your credentials have been verified. You can now accept patient consultations.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-slate-200 pb-0 shrink-0">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          Overview & Patients
        </button>
        
        <button 
          onClick={() => setActiveTab('history')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'history' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          Clinical History
        </button>
        <button 
          onClick={() => setActiveTab('reviews')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'reviews' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          My Reviews
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {loading ? (
            <div className="animate-pulse space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>)}
              </div>
              <div className="h-64 bg-slate-200 rounded-xl w-full"></div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {summaryCards.map((card, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center hover:shadow-md transition">
                    <div className={`${card.bg} ${card.color} p-4 rounded-full mr-4`}>
                      <card.icon size={24} />
                    </div>
                    <div>
                      <p className="text-slate-500 text-sm font-medium">{card.title}</p>
                      <h3 className="text-2xl font-bold text-slate-800">{card.value}</h3>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <h2 className="font-semibold text-slate-800 text-lg">Assigned Patients</h2>
                </div>
                
                {consultations.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <Users size={48} className="mx-auto text-slate-300 mb-4" />
                    <p>No patients currently assigned to you.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient Name</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Symptoms / Reason</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Appointment</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {consultations.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                                  {c.Patient?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-slate-900">{c.Patient?.name || 'Unknown Patient'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-slate-900 line-clamp-1 w-48" title={c.symptoms_description}>
                                {c.symptoms_description || c.reason}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                              {c.appointment_date ? (
                                <div>
                                  <div className="font-medium text-slate-700">{new Date(c.appointment_date).toLocaleDateString()}</div>
                                  <div className="text-xs">{c.appointment_time}</div>
                                </div>
                              ) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize
                                ${c.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                  c.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                                  c.status === 'result_ready' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse' :
                                  c.status === 'waiting_for_results' ? 'bg-slate-100 text-slate-800' :
                                  'bg-amber-100 text-amber-800'}`}>
                                {c.status === 'completed' ? 'Completed' : (c.status === 'in_progress' ? 'Active' : c.status.replace(/_/g, ' '))}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <div className="flex items-center justify-end gap-2">
                                {c.status === 'result_ready' && (
                                  <button
                                    onClick={() => handleResumeConsultation(c.id)}
                                    className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-all shadow-sm text-xs font-bold flex items-center"
                                  >
                                    <Activity size={13} className="mr-1" /> Resume Case
                                  </button>
                                )}
                                {/* Refer to Specialist — only for GP doctors on active consultations */}
                                {(c.status === 'in_progress' || c.status === 'assigned') && user?.specialty === 'General Practitioner' && (
                                  <button
                                    onClick={() => setReferralModal({ isOpen: true, consultationId: c.id })}
                                    className="bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100 px-3 py-1.5 rounded-md transition-all shadow-sm text-xs font-bold flex items-center"
                                  >
                                    <ClipboardList size={13} className="mr-1" /> Refer
                                  </button>
                                )}
                                {(c.status === 'in_progress' || c.status === 'assigned') && (
                                  <button 
                                    onClick={() => navigate(`/consultations?id=${c.id}`)}
                                    className="bg-white border border-slate-200 text-primary-600 hover:bg-primary-50 hover:border-primary-200 px-3 py-1.5 rounded-md transition-all shadow-sm text-xs font-bold flex items-center"
                                  >
                                    <MessageSquare size={13} className="mr-1" /> Chat
                                  </button>
                                )}
                                {c.status === 'waiting_for_results' && (
                                   <span className="text-xs text-slate-500 font-medium">Waiting on Lab...</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'availability' && (
        <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
          {/* Add Slot Form */}
          <div className="w-full md:w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 p-6 self-start shrink-0">
            <div className="flex items-center mb-6">
              <div className="bg-primary-100 text-primary-600 p-2 rounded-lg mr-3"><Calendar size={20} /></div>
              <h2 className="font-bold text-slate-800 text-lg">Add New Slot</h2>
            </div>
            <form onSubmit={handleAddSlot} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input 
                  type="date" required min={new Date().toISOString().split('T')[0]}
                  value={newSlot.date} onChange={e => setNewSlot({...newSlot, date: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                  <input 
                    type="time" required
                    value={newSlot.start_time} onChange={e => setNewSlot({...newSlot, start_time: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                  <input 
                    type="time" required
                    value={newSlot.end_time} onChange={e => setNewSlot({...newSlot, end_time: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isAddingSlot}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition disabled:opacity-50 flex justify-center items-center mt-6"
              >
                <Plus size={18} className="mr-1" /> {isAddingSlot ? 'Adding...' : 'Add Availability Slot'}
              </button>
            </form>
          </div>

          {/* Slots List */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="font-semibold text-slate-800 text-lg">Your Schedule</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 hidden-scrollbar">
              {loadingSlots ? (
                <div className="text-center text-slate-400 p-8">Loading schedule...</div>
              ) : availabilities.length === 0 ? (
                <div className="text-center text-slate-500 p-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <Clock size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="font-medium text-slate-700">No availability slots set</p>
                  <p className="text-sm mt-1">Add slots on the left to allow patients to book appointments with you.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availabilities.map(slot => (
                    <div key={slot.id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-center bg-white shadow-sm hover:border-primary-200 transition">
                      <div>
                        <p className="font-bold text-slate-800 flex items-center">
                          {new Date(slot.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-sm text-slate-500 mt-1 font-medium bg-slate-100 px-2 py-0.5 rounded inline-block">
                          {slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}
                        </p>
                        <div className="mt-2">
                          {slot.is_booked ? (
                            <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full flex inline-flex items-center">
                              <Users size={12} className="mr-1" /> Booked
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full flex inline-flex items-center">
                              <CheckCircle size={12} className="mr-1" /> Open
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {!slot.is_booked && (
                        <button 
                          onClick={() => confirmDelete(slot.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete slot"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="flex-1 overflow-y-auto pr-2 pb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <ClipboardList size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Full Clinical Records</h3>
            <p className="text-slate-500 text-sm mb-4">View your complete consultation history, all prescriptions issued, and treatment plans in one place.</p>
            <button
              onClick={() => navigate('/history')}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-2.5 rounded-lg transition shadow-sm"
            >
              Open Clinical History
            </button>
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="flex-1 overflow-y-auto pr-2 pb-6">
          {/* Rating Summary Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Big average */}
              <div className="flex flex-col items-center justify-center bg-amber-50 border border-amber-100 rounded-xl px-8 py-5 shrink-0">
                <div className="flex items-center gap-2 mb-1">
                  <Star size={28} className="fill-amber-400 text-amber-400" />
                  <span className="text-4xl font-bold text-slate-800">
                    {reviewsData.averageRating > 0 ? reviewsData.averageRating : '—'}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{reviewsData.totalReviews} review{reviewsData.totalReviews !== 1 ? 's' : ''}</p>
              </div>

              {/* Star distribution bars */}
              <div className="flex-1 w-full space-y-1.5">
                {[5, 4, 3, 2, 1].map(n => {
                  const count = reviewsData.testimonials.filter(r => r.rating === n).length;
                  const pct = reviewsData.totalReviews > 0 ? Math.round((count / reviewsData.totalReviews) * 100) : 0;
                  return (
                    <div key={n} className="flex items-center gap-2 text-sm">
                      <span className="w-4 text-right text-slate-500 font-medium">{n}</span>
                      <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-amber-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-xs text-slate-400">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="font-semibold text-slate-800 text-lg">Patient Feedback</h2>
            </div>
            <div className="p-6">
              {loadingReviews ? (
                <div className="space-y-4 animate-pulse">
                  {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl" />)}
                </div>
              ) : reviewsData.testimonials.length === 0 ? (
                <div className="text-center text-slate-500 py-16">
                  <Star size={44} className="mx-auto text-slate-200 mb-3" />
                  <p className="font-medium text-slate-600">No reviews yet</p>
                  <p className="text-sm mt-1 text-slate-400">Reviews will appear here after patients complete consultations with you.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewsData.testimonials.map(review => (
                    <div key={review.id} className="border border-slate-100 bg-slate-50 rounded-xl p-5 hover:border-slate-200 transition">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm shrink-0">
                            {review.Patient?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 text-sm">{review.Patient?.name || 'Anonymous'}</div>
                            <div className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(star => (
                            <Star key={star} size={15} className={star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-slate-600 italic border-l-2 border-amber-200 pl-3 py-1 mt-2 bg-white rounded-r-lg">
                          "{review.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ isOpen: false, slotId: null })}
        onConfirm={executeDelete}
        title="Delete Slot"
        message="Are you sure you want to delete this available slot? Patients will no longer be able to book it."
        confirmText="Delete"
        isDanger={true}
      />

      {/* Referral Modal */}
      {referralModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/60">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn" role="dialog" aria-modal="true">
            <div className="px-6 pt-6 pb-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Refer Patient to Specialist</h3>
                <p className="text-xs text-slate-500 mt-0.5">A new specialist consultation will be created for this patient.</p>
              </div>
              <button onClick={() => setReferralModal({ isOpen: false, consultationId: null })} className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none">&times;</button>
            </div>
            <form onSubmit={handleReferSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Specialist Type <span className="text-red-500">*</span></label>
                <select
                  required
                  value={referralForm.target_specialty}
                  onChange={e => setReferralForm(prev => ({ ...prev, target_specialty: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                >
                  <option value="" disabled>Select specialist type…</option>
                  {SPECIALIST_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Referral Notes</label>
                <textarea
                  rows={3}
                  value={referralForm.referral_notes}
                  onChange={e => setReferralForm(prev => ({ ...prev, referral_notes: e.target.value }))}
                  placeholder="Clinical summary, reason for referral, relevant findings…"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div className="flex flex-row-reverse gap-3 pt-2">
                <button type="submit" disabled={referralLoading || !referralForm.target_specialty}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-bold transition disabled:opacity-60 flex items-center gap-2">
                  {referralLoading && <Loader2 size={14} className="animate-spin" />}
                  Create Referral
                </button>
                <button type="button" onClick={() => setReferralModal({ isOpen: false, consultationId: null })}
                  className="px-5 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status-change confirmation modal removed — availability is now auto-computed */}
    </div>
  );
};

export default DoctorDashboard;
