import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { History as HistoryIcon, Search, Filter, FileText, ChevronRight, Star, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const History = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('all');

  // Feedback Modal State
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, serviceId: null, type: null, doctorName: '' });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myTestimonials, setMyTestimonials] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [histRes, testRes] = await Promise.all([
        api.get('/consultations'),
        api.get('/testimonials/my').catch(() => ({ data: [] }))
      ]);
      setHistory(histRes.data);
      setMyTestimonials(testRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openFeedback = (e, record) => {
    e.stopPropagation();
    setFeedbackModal({
      isOpen: true,
      serviceId: record.id,
      type: 'consultation',
      doctorName: record.Doctor?.name || 'Doctor'
    });
    setRating(0);
    setComment('');
  };

  const submitFeedback = async () => {
    if (rating === 0) return toast.error('Please select a rating');
    setIsSubmitting(true);
    try {
      await api.post('/testimonials', {
        service_id: feedbackModal.serviceId,
        service_type: feedbackModal.type,
        rating,
        comment
      });
      toast.success('Feedback submitted successfully!');
      setFeedbackModal({ isOpen: false, serviceId: null, type: null, doctorName: '' });
      fetchData(); // Refresh to update "Already Reviewed" status
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredHistory = history.filter(c => {
    const matchesSearch = 
      (c.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.Doctor?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.Patient?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Simple date filter logic
    if (filterDate === 'all') return matchesSearch;
    
    const consDate = new Date(c.created_at);
    const now = new Date();
    const diffDays = Math.floor((now - consDate) / (1000 * 60 * 60 * 24));
    
    if (filterDate === '7days') return matchesSearch && diffDays <= 7;
    if (filterDate === '30days') return matchesSearch && diffDays <= 30;
    if (filterDate === 'older') return matchesSearch && diffDays > 30;
    
    return matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200">
      
      {/* Header Area */}
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-800 flex items-center">
             <HistoryIcon className="mr-3 text-primary-600" size={28} /> Medical History
           </h1>
           <p className="text-slate-500 mt-1">Review your past consultations, diagnoses, and treatment plans.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
           <div className="relative">
             <input 
               type="text" 
               placeholder="Search records..." 
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
               <option value="all">All Time</option>
               <option value="7days">Last 7 Days</option>
               <option value="30days">Last 30 Days</option>
               <option value="older">Older than 30 Days</option>
             </select>
             <Filter className="absolute left-3 top-2.5 text-slate-400" size={18} />
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="space-y-4 animate-pulse">
             {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl"></div>)}
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-12">
             <div className="bg-slate-50 p-6 rounded-full mb-4 border border-slate-200 border-dashed">
               <FileText size={48} className="text-slate-300" />
             </div>
             <h3 className="text-lg font-medium text-slate-600 mb-1">No Records Found</h3>
             <p className="text-sm">You do not have any consultation history matching your criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map(record => (
              <div 
                key={record.id} 
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-md transition cursor-pointer group flex flex-col sm:flex-row gap-4"
                onClick={() => navigate(`/consultations?id=${record.id}`)}
              >
                {/* Date/Status Block */}
                <div className="sm:w-48 shrink-0 flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-slate-100 pb-4 sm:pb-0 sm:pr-4">
                  <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    {new Date(record.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    {new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="mt-3">
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded w-max inline-block
                       ${record.status === 'completed' ? 'bg-green-100 text-green-700' : 
                         record.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}
                    `}>
                      {record.status === 'completed' ? 'Completed' : (record.status === 'in_progress' ? 'Pending' : record.status.replace('_', ' '))}
                    </span>
                  </div>
                </div>
                
                {/* Details Block */}
                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="font-bold text-lg text-slate-800 mb-1">{record.reason || 'General Consultation'}</h3>
                  <p className="text-slate-600 text-sm line-clamp-2 mb-2">{record.symptoms_description}</p>
                  <p className="text-sm font-medium text-slate-700 flex items-center mt-auto pt-2">
                    {user.role === 'patient' ? (
                      <>Attending Doctor: <span className="ml-2 text-primary-600 font-bold">{record.Doctor ? `Dr. ${record.Doctor.name}` : 'Pending Assignment'}</span></>
                    ) : (
                      <>Patient Name: <span className="ml-2 text-primary-600 font-bold">{record.Patient?.name || 'Unknown'}</span></>
                    )}
                  </p>
                </div>
                
                {/* Action Block */}
                <div className="shrink-0 flex flex-col items-end justify-center space-y-2">
                  {record.status === 'completed' && user.role === 'patient' && (
                    myTestimonials.find(t => t.service_id === record.id) ? (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full flex items-center">
                        <Star size={12} className="mr-1 fill-emerald-600" /> Reviewed
                      </span>
                    ) : (
                      <button 
                        onClick={(e) => openFeedback(e, record)}
                        className="text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg shadow-sm transition flex items-center"
                      >
                        <MessageSquare size={14} className="mr-1" /> Leave Feedback
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
        )}
      </div>

      {/* Feedback Modal */}
      {feedbackModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Rate Your Experience</h3>
            <p className="text-sm text-slate-500 mb-6">How was your consultation with Dr. {feedbackModal.doctorName}?</p>
            
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
                onClick={() => setFeedbackModal({ isOpen: false, serviceId: null, type: null, doctorName: '' })}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition"
              >
                Cancel
              </button>
              <button 
                onClick={submitFeedback}
                disabled={isSubmitting || rating === 0}
                className="px-6 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default History;
