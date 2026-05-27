import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import io from 'socket.io-client';
import { useSearchParams } from 'react-router-dom';
import { Microscope, Clock, CheckCircle, FileText, UploadCloud, User, Stethoscope, AlertTriangle, PhoneCall, MessageSquare, Send, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { uploadResultSchema, formatZodErrors } from '../utils/validationSchemas';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

const SpecialistDashboard = () => {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('pending');
  const [requests, setRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);

  const [resultNotes, setResultNotes] = useState('');
  const [resultFile, setResultFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultFieldErrors, setResultFieldErrors] = useState({});

  // Chat tracking in modal
  const [chatMessages, setChatMessages] = useState([]);
  const [newChat, setNewChat] = useState('');
  const chatBottomRef = useRef(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editMessageText, setEditMessageText] = useState('');

  const [modalConfig, setModalConfig] = useState({ isOpen: false, msgId: null });

  // Track the req_id from notification click — read once on mount
  const pendingReqId = useRef(searchParams.get('req_id'));

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/service-requests');
      setRequests(res.data);
      const historyRes = await api.get('/service-requests?history=true');
      setHistoryRequests(historyRes.data);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 30000);
    // Clear the req_id from URL immediately so it doesn't persist on refresh
    if (pendingReqId.current) {
      setSearchParams({}, { replace: true });
    }
    return () => clearInterval(interval);
  }, []);

  // Once requests are loaded, handle the notification-click req_id
  useEffect(() => {
    const reqId = pendingReqId.current;
    if (!reqId || loading || requests.length === 0) return;

    // Only run once
    pendingReqId.current = null;

    const target = requests.find(r => r.id === reqId);
    if (!target) return;

    if (target.status === 'pending' && target.payment_status === 'paid') {
      // Auto-accept → marks active, decreases queue for patient and specialist
      api.put(`/service-requests/${reqId}/accept`)
        .then(() => {
          fetchRequests();
          setSelectedReq({ ...target, status: 'in_progress', queue_status: 'active' });
          toast.success('Request accepted — queue updated.');
        })
        .catch(err => {
          console.error('Auto-accept failed', err);
          setSelectedReq(target);
        });
    } else {
      // Unpaid or already active — just open the modal
      setSelectedReq(target);
    }
  }, [loading, requests]);

  // Real-time queue updates: refresh when any request status changes
  useEffect(() => {
    if (!user?.id) return;
    const socket = io(SOCKET_URL);
    socket.emit('join_user_room', user.id);
    socket.on('queue_updated', () => {
      fetchRequests();
    });
    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;

    if (selectedReq.payment_status !== 'paid') {
      toast.error("Cannot process this request because it hasn't been paid for yet.");
      return;
    }

    setResultFieldErrors({});
    const parsed = uploadResultSchema.safeParse({ result_notes: resultNotes, result_file: resultFile });
    if (!parsed.success) {
      setResultFieldErrors(formatZodErrors(parsed.error));
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('status', 'completed');
      if (resultNotes) formData.append('result_notes', resultNotes);
      if (resultFile) formData.append('result_file', resultFile);

      await api.put(`/service-requests/${selectedReq.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Service processed and completed successfully!');
      setSelectedReq(null);
      setResultNotes('');
      setResultFile(null);
      setResultFieldErrors({});
      fetchRequests();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update service request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Chat endpoints probably need to use the generic chat endpoints we created for lab tests earlier.
  // Wait, in Consultations.jsx, lab chat messages use `/chat/` with `chat_type`
  // Previously LaboratoristDashboard used `/lab-tests/:id/chat` which was in `labChatController`.
  // We need to fetch chat via `/chat/:consultationId?chat_type=laboratorist|radiologist` or just send it there.
  // For simplicity, let's keep the `chatMessages` logic aligned with `activeChatId` from Consultation.
  const loadChat = async (consultationId) => {
    try {
      const res = await api.get(`/chat/${consultationId}`);
      // Filter by user role (laboratorist or radiologist)
      setChatMessages(res.data.filter(m => m.chat_type === user.role));
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!newChat.trim() || !selectedReq) return;
    try {
      const res = await api.post(`/chat`, {
        consultation_id: selectedReq.consultation_id,
        message: newChat,
        chat_type: user.role
      });
      setChatMessages([...chatMessages, res.data]);
      setNewChat('');
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDeleteChat = (msgId) => {
    setModalConfig({ isOpen: true, msgId });
  };

  const executeDeleteChat = async () => {
    try {
      await api.delete(`/chat/${modalConfig.msgId}`);
      loadChat(selectedReq.consultation_id);
    } catch (error) {
      console.error(error);
    }
    setModalConfig({ isOpen: false, msgId: null });
  };

  const handleUpdateChat = async (msgId) => {
    if (!editMessageText.trim()) return;
    try {
      await api.put(`/chat/${msgId}`, { message: editMessageText });
      setEditingMessageId(null);
      setEditMessageText('');
      loadChat(selectedReq.consultation_id);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (selectedReq) {
      loadChat(selectedReq.consultation_id);
      const chatPoller = setInterval(() => loadChat(selectedReq.consultation_id), 10000); // 10s poll limit
      return () => clearInterval(chatPoller);
    }
  }, [selectedReq]);

  const handleOpenRequest = async (req) => {
    // Only accept paid, waiting requests — this is the queue-decrement trigger
    if (req.payment_status === 'paid' && req.queue_status === 'waiting') {
      try {
        await api.put(`/service-requests/${req.id}/accept`);
        setSelectedReq({ ...req, status: 'in_progress', queue_status: 'active' });
        fetchRequests();
        toast.success(`Queue #${req.queue_number} accepted — queue updated for waiting patients.`);
      } catch (err) {
        console.error('Accept failed', err);
        setSelectedReq(req);
      }
    } else {
      setSelectedReq(req);
    }
    if (req.consultation_id) loadChat(req.consultation_id);
  };

  const handleStartTest = async (reqId) => {
    try {
      await api.put(`/service-requests/${reqId}/accept`);
      fetchRequests();
      if (selectedReq && selectedReq.id === reqId) {
        setSelectedReq({ ...selectedReq, status: 'in_progress', queue_status: 'active' });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to start request.');
    }
  };

  // derived lists
  const pendingReqs = requests.filter(t => t.status === 'pending');
  const inProgressReqs = requests.filter(t => t.status === 'in_progress');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center capitalize">
            <Microscope className="mr-3 text-primary-600" /> {user.role} Dashboard
          </h1>
          <p className="text-slate-500 mt-1">Manage requested services, track patient queue, and upload results.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
          <div className="bg-amber-100 text-amber-600 p-4 rounded-full mr-4"><Clock size={24} /></div>
          <div>
            <p className="text-slate-500 font-medium text-sm">Pending Patients in Queue</p>
            <h2 className="text-2xl font-bold text-slate-800">{pendingReqs.length}</h2>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
          <div className="bg-blue-100 text-blue-600 p-4 rounded-full mr-4"><FileText size={24} /></div>
          <div>
            <p className="text-slate-500 font-medium text-sm">Services Pending Analysis</p>
            <h2 className="text-2xl font-bold text-slate-800">{inProgressReqs.length}</h2>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 p-4 flex space-x-1">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'pending' ? 'bg-white text-primary-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            Queue ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'history' ? 'bg-white text-primary-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            History ({historyRequests.length})
          </button>
        </div>

        {activeTab === 'pending' && (
          <div className="p-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-16 bg-slate-100 rounded w-full"></div>
              <div className="h-16 bg-slate-100 rounded w-full"></div>
            </div>
          ) : requests.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {requests.map((req, index) => (
                <div key={req.id} className="bg-white border border-slate-200 hover:border-primary-300 transition rounded-xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            Queue #{req.queue_number ?? index + 1}
                          </span>
                          {req.queue_status === 'active' && (
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-200">
                              Active
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 uppercase">{req.ServiceItem?.name}</h3>
                        {req.payment_status === 'paid' ? (
                          <span className="text-xs font-bold text-emerald-600">PAID</span>
                        ) : (
                          <span className="text-xs font-bold flex items-center text-rose-600 mt-1">
                             <AlertTriangle size={12} className="mr-1" /> UNPAID - Do Not Process
                          </span>
                        )}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-flex items-center ${req.queue_status === 'active' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                        {req.queue_status === 'active' ? 'In Progress' : 'Waiting'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm border-y border-slate-100 py-3">
                      <div>
                        <span className="text-slate-500 flex items-center mb-1"><User size={14} className="mr-1" /> Patient</span>
                        <span className="font-medium text-slate-800">{req.Patient?.name} ({req.Patient?.sex || 'U'}, {req.Patient?.age || 'N/A'})</span>
                      </div>
                      <div>
                        <span className="text-slate-500 flex items-center mb-1"><Stethoscope size={14} className="mr-1" /> Requested By</span>
                        <span className="font-medium text-slate-800">
                          Dr. {req.Doctor?.name} <span className="text-xs text-slate-500 font-normal block">{req.Doctor?.specialty || 'General'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="mb-4 bg-slate-50 border border-slate-100 rounded p-2 text-xs">
                       <p className="text-slate-600 font-medium pb-1 mb-1 border-b border-slate-200">Request Origin</p>
                       <p className="text-slate-700 font-semibold">{req.Doctor?.work_location || 'Unknown Location'}</p>
                       {req.Doctor?.phone_number && <p className="text-slate-500 mt-0.5"><PhoneCall size={10} className="inline mr-1" />{req.Doctor.phone_number}</p>}
                    </div>

                    {req.instructions && (
                      <div className="mb-4">
                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block mb-1">Clinical Notes</span>
                        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded border border-slate-100 italic">"{req.instructions}"</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleOpenRequest(req)}
                      className={`w-full py-2.5 rounded-lg font-bold transition flex items-center justify-center border shadow-sm ${req.payment_status === 'paid' ? 'bg-primary-50 text-primary-700 hover:bg-primary-600 hover:text-white border-primary-100' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'}`}
                      disabled={req.payment_status !== 'paid'}
                    >
                      {req.payment_status === 'paid' ? (
                        <>{req.queue_status === 'active' ? 'Continue Processing' : 'Open & Accept'} <CheckCircle size={16} className="ml-1.5" /></>
                      ) : (
                        <>Waiting for Payment</>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <Activity className="mx-auto text-slate-300 mb-3" size={48} />
              <p className="text-xl font-bold text-slate-700">No active service requests</p>
              <p className="text-slate-500 mt-1">Currently all catch up! There are no pending requests.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="p-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-16 bg-slate-100 rounded w-full"></div>
              <div className="h-16 bg-slate-100 rounded w-full"></div>
            </div>
          ) : historyRequests.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {historyRequests.map((req, index) => (
                <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-slate-800 uppercase">#{index + 1} - {req.ServiceItem?.name}</h3>
                        <span className="text-xs font-bold text-emerald-600 mt-1 block">PAID</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-flex items-center bg-emerald-100 text-emerald-700 border border-emerald-200">
                        COMPLETED
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm border-y border-slate-100 py-3">
                      <div>
                        <span className="text-slate-500 flex items-center mb-1"><User size={14} className="mr-1" /> Patient</span>
                        <span className="font-medium text-slate-800">{req.Patient?.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 flex items-center mb-1"><Stethoscope size={14} className="mr-1" /> Requested By</span>
                        <span className="font-medium text-slate-800">
                          Dr. {req.Doctor?.name}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4 bg-slate-50 border border-slate-100 rounded p-3 text-xs">
                       <p className="text-slate-600 font-medium pb-1 mb-1 border-b border-slate-200">Result Details</p>
                       <p className="text-slate-700 mb-2">{req.result_notes || 'No notes provided.'}</p>
                       {req.result_file_url && (
                         <a href={`${api.defaults.baseURL?.replace(/\/api$/, '') || 'http://localhost:5000'}${req.result_file_url}`} target="_blank" rel="noreferrer" className="text-primary-600 font-bold hover:underline flex items-center mt-2">
                           <FileText size={14} className="mr-1" /> View Uploaded Result
                         </a>
                       )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <CheckCircle className="mx-auto text-slate-300 mb-3" size={48} />
              <p className="text-xl font-bold text-slate-700">No completed requests yet</p>
              <p className="text-slate-500 mt-1">Processed tests will appear here.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && null}
      </div>

      {/* Process Request Modal */}
      {selectedReq && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center sticky top-0">
              <h3 className="font-bold text-xl text-slate-800 flex items-center capitalize">
                <Activity className="mr-2 text-primary-600" /> Process {user.role} Service
              </h3>
              <button
                onClick={() => { setSelectedReq(null); setResultFile(null); setResultNotes(''); }}
                className="text-slate-400 hover:text-slate-800 font-bold transition bg-slate-100 hover:bg-slate-200 rounded-full p-1"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 mb-6">
                <h4 className="font-bold text-primary-800 text-lg mb-1 uppercase">{selectedReq.ServiceItem?.name}</h4>
                <p className="text-sm text-primary-600 mb-1">Patient: <span className="font-semibold">{selectedReq.Patient?.name}</span></p>
                <p className="text-sm text-primary-600 mb-2">Requested By: <span className="font-semibold">Dr. {selectedReq.Doctor?.name} ({selectedReq.Doctor?.work_location || 'Unknown location'})</span></p>
                {selectedReq.instructions && <p className="text-sm italic text-slate-600 border-l-2 border-primary-300 pl-3 py-1">"{selectedReq.instructions}"</p>}

                {selectedReq.status === 'pending' && selectedReq.queue_status !== 'active' && (
                  <button
                    onClick={() => handleStartTest(selectedReq.id)}
                    className="mt-4 text-xs font-bold bg-white border border-primary-200 text-primary-700 px-3 py-1.5 rounded-lg shadow-sm hover:bg-primary-100 transition"
                  >
                    Start Analysis
                  </button>
                )}
              </div>

              {selectedReq.payment_status === 'paid' ? (
                <form onSubmit={handleUpdateStatus} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Analysis Notes / Summary</label>
                    <textarea
                      rows="4"
                      className={`w-full p-3 border ${resultFieldErrors.result_notes ? 'border-red-500 bg-red-50' : 'border-slate-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white resize-none`}
                      placeholder="Key findings, abnormalities, or summary info... (Optional)"
                      value={resultNotes}
                      onChange={(e) => {setResultNotes(e.target.value); setResultFieldErrors(prev => ({...prev, result_notes: undefined}));}}
                    ></textarea>
                    {resultFieldErrors.result_notes && <p className="text-red-500 text-xs mt-1">{resultFieldErrors.result_notes}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Upload Final Report (PDF/Image)</label>
                    <div
                      className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
                      onClick={() => document.getElementById('report-upload').click()}
                    >
                      <div className="space-y-1 text-center">
                        {resultFile ? (
                          <div className="flex flex-col items-center">
                            <CheckCircle className="mx-auto h-12 w-12 text-emerald-500 mb-2" />
                            <p className="text-sm font-bold text-slate-800 truncate max-w-[250px]">{resultFile.name}</p>
                            <p className="text-xs text-slate-500 mt-1">{(resultFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        ) : (
                          <>
                            <UploadCloud className="mx-auto h-12 w-12 text-slate-400 mb-2" />
                            <div className="flex text-sm text-slate-600 justify-center">
                              <span className="font-semibold text-primary-600 px-1">Click to browse</span>
                              <span>or drag and drop</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">PDF, PNG, JPG up to 10MB</p>
                          </>
                        )}
                        <input
                          id="report-upload"
                          type="file"
                          required
                          className="sr-only"
                          accept="image/jpeg, image/png, image/webp, application/pdf"
                          onChange={(e) => { 
                            if (e.target.files[0]) {
                                setResultFile(e.target.files[0]);
                                setResultFieldErrors(prev => ({...prev, result_file: undefined}));
                            } 
                          }}
                        />
                      </div>
                    </div>
                    {resultFieldErrors.result_file && <p className="text-red-500 text-xs mt-1 text-center">{resultFieldErrors.result_file}</p>}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => { setSelectedReq(null); setResultFile(null); setResultNotes(''); }}
                      className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !resultFile}
                      className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-bold shadow-md disabled:opacity-50 flex items-center"
                    >
                      {isSubmitting ? 'Uploading...' : 'Complete & Send Report'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center p-6 bg-red-50 text-red-700 rounded-lg border border-red-200">
                  <AlertTriangle className="mx-auto mb-2 text-red-500" size={32} />
                  <p className="font-bold">Test block applied!</p>
                  <p className="text-sm">Cannot upload results or start test because it has not been paid.</p>
                </div>
              )}

              {/* Lab Request Discussion / Chat */}
              <div className="mt-8 border-t border-slate-200 pt-6">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center"><MessageSquare className="mr-2 text-slate-400" size={18} /> Discussion with Doctor</h4>
                
                <div className="bg-slate-50 border border-slate-200 rounded-lg h-64 flex flex-col mb-4">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.length === 0 ? (
                      <p className="text-center text-slate-400 text-sm italic mt-10">No messages yet. Send a message to Dr. {selectedReq.Doctor?.name}.</p>
                    ) : (
                      chatMessages.map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.sender_id === user?.id ? 'items-end' : 'items-start'}`}>
                          {editingMessageId === msg.id ? (
                            <div className="w-full max-w-[80%] flex flex-col items-end">
                               <textarea 
                                 className="w-full text-sm p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-800"
                                 value={editMessageText}
                                 onChange={(e) => setEditMessageText(e.target.value)}
                               />
                               <div className="flex space-x-2 mt-1">
                                 <button onClick={() => setEditingMessageId(null)} className="text-[10px] text-slate-500 hover:text-slate-700 px-2 py-1 bg-slate-100 rounded">Cancel</button>
                                 <button onClick={() => handleUpdateChat(msg.id)} className="text-[10px] text-white bg-primary-600 hover:bg-primary-700 px-2 py-1 rounded">Save</button>
                               </div>
                            </div>
                          ) : (
                            <>
                              <div className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.sender_id === user?.id ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                                {msg.sender_id !== user?.id && <p className="text-xs font-bold mb-1 opacity-75">{msg.Sender?.name}</p>}
                                <p className={msg.is_deleted ? 'italic opacity-60' : ''}>
                                  {msg.message}
                                  {msg.created_at !== msg.updated_at && !msg.is_deleted && <span className="text-[10px] opacity-75 ml-2">(edited)</span>}
                                </p>
                              </div>
                              {msg.sender_id === user?.id && !msg.is_deleted && (
                                 <div className="flex space-x-3 mt-1">
                                    <button onClick={() => { setEditingMessageId(msg.id); setEditMessageText(msg.message); }} className="text-[10px] text-slate-400 hover:text-primary-600 transition">Edit</button>
                                    <button onClick={() => confirmDeleteChat(msg.id)} className="text-[10px] text-slate-400 hover:text-red-500 transition">Delete</button>
                                 </div>
                              )}
                            </>
                          )}
                        </div>
                      ))
                    )}
                    <div ref={chatBottomRef} />
                  </div>
                  <form onSubmit={handleSendChat} className="border-t border-slate-200 bg-white p-2 sm:p-3 flex items-center">
                    <input 
                      type="text" 
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500" 
                      placeholder="Type a message..." 
                      value={newChat} 
                      onChange={e => setNewChat(e.target.value)} 
                    />
                    <button type="submit" disabled={!newChat.trim()} className="ml-2 bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition"><Send size={16} /></button>
                  </form>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ isOpen: false, msgId: null })}
        onConfirm={executeDeleteChat}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
};

export default SpecialistDashboard;
