import React, { useState, useEffect, useContext, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
const socket = io(SOCKET_URL);

import { 
  Send, 
  Paperclip, 
  PlusCircle, 
  Clock, 
  Activity, 
  User, 
  Search, 
  Info,
  CreditCard,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  Video,
  X,
  PhoneCall
} from 'lucide-react';
import { JitsiMeeting } from '@jitsi/react-sdk';

const Consultations = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Video call state
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  // Payment form state
  const [paymentFile, setPaymentFile] = useState(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // New consultation form state
  const [newConsultation, setNewConsultation] = useState({
    reason: '',
    symptoms_description: ''
  });

  useEffect(() => {
    // Check if URL has ?action=new
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('action') === 'new') {
      setShowNewForm(true);
      // Clean up URL
      navigate('/consultations', { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/consultations');
      setConsultations(res.data);
      if (res.data.length > 0 && !activeChatId && !showNewForm) {
        // Auto-select first active or pending consultation
        const activeOrFirst = res.data.find(c => c.status !== 'completed') || res.data[0];
        setActiveChatId(activeOrFirst.id);
      }
    } catch (err) {
      console.error('Failed to fetch consultations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeChatId) {
      // 1. Fetch existing messages
      api.get(`/chat/${activeChatId}`).then(res => {
        const formattedMsgs = res.data.map(m => ({
          id: m.id,
          sender: m.sender_id === user.id ? user.role : (user.role === 'patient' ? 'doctor' : 'patient'),
          text: m.message,
          attachment_url: m.attachment_url,
          time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setMessages(formattedMsgs);
        scrollToBottom();
      }).catch(err => {
        console.error('Error fetching chat history:', err);
      });

      // 2. Join socket room
      socket.emit('join_consultation', activeChatId);

      // 3. Listen for new messages
      const handleReceiveMessage = (msgData) => {
        if (msgData.consultation_id === activeChatId) {
          const newMsg = {
            id: msgData.id,
            sender: msgData.sender_id === user.id ? user.role : (user.role === 'patient' ? 'doctor' : 'patient'),
            text: msgData.message,
            attachment_url: msgData.attachment_url,
            time: new Date(msgData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, newMsg]);
          setTimeout(scrollToBottom, 100);
        }
      };

      const handleIncomingCall = (data) => {
        if (data.consultation_id === activeChatId) {
          setIncomingCall(data);
        }
      };

      const handleCallEnded = (data) => {
        if (data.consultation_id === activeChatId) {
          setIsVideoActive(false);
          setIncomingCall(null);
          alert('Video call ended by the other participant.');
        }
      };

      socket.on('receive_message', handleReceiveMessage);
      socket.on('incoming_video_call', handleIncomingCall);
      socket.on('video_call_ended', handleCallEnded);

      return () => {
        socket.off('receive_message', handleReceiveMessage);
        socket.off('incoming_video_call', handleIncomingCall);
        socket.off('video_call_ended', handleCallEnded);
      };
    }
  }, [activeChatId, user.id, user.role]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartVideoCall = () => {
    setIsVideoActive(true);
    socket.emit('start_video_call', {
      consultation_id: activeChatId,
      initiator_id: user.id,
      initiator_name: user?.name || (user.role === 'patient' ? 'Patient' : 'Doctor')
    });
  };

  const handleEndVideoCall = () => {
    setIsVideoActive(false);
    socket.emit('end_video_call', { consultation_id: activeChatId });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId) return;

    socket.emit('send_message', {
      consultation_id: activeChatId,
      sender_id: user.id,
      message: newMessage
    });
    
    setNewMessage('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeChatId) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      socket.emit('send_message', {
        consultation_id: activeChatId,
        sender_id: user.id,
        message: 'Shared an attachment',
        attachment_url: res.data.fileUrl
      });
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      alert('File upload failed.');
    }
  };

  const handleSubmitConsultation = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/consultations', newConsultation);
      setShowNewForm(false);
      setNewConsultation({ reason: '', symptoms_description: '' });
      fetchConsultations(); // fetches list to sync sidebar
      
      // Auto-select and open the newly created consultation!
      if (res.data && res.data.consultation) {
        setActiveChatId(res.data.consultation.id);
      }
      
      alert('Consultation requested successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to request consultation.');
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentFile || !activeChatId) return;

    const consultation = consultations.find(c => c.id === activeChatId);
    if (!consultation?.Payment?.reference_code) return;

    setIsSubmittingPayment(true);
    const formData = new FormData();
    formData.append('consultation_id', activeChatId);
    formData.append('reference_code', consultation.Payment.reference_code);
    formData.append('amount', '800'); // Always send the fixed weekly amount
    formData.append('screenshot', paymentFile);

    try {
      await api.post('/payments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Payment submitted successfully! Waiting for admin verification.');
      setPaymentFile(null);
      fetchConsultations(); // refresh to update payment status
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to submit payment.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleDeleteScreenshot = async () => {
    if (!window.confirm('Are you sure you want to remove your payment screenshot? You will need to upload a new one to get verified.')) return;
    try {
      setIsSubmittingPayment(true);
      await api.delete(`/payments/${activeConsultation.Payment.id}/screenshot`);
      fetchConsultations(); // refresh
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to remove screenshot.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const activeConsultation = consultations.find(c => c.id === activeChatId);

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Sidebar - Chat List */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
          <h2 className="font-bold text-slate-800 text-lg">Consultations</h2>
          {user.role === 'patient' && (
            <button 
              onClick={() => { setShowNewForm(true); setActiveChatId(null); }}
              className="text-primary-600 hover:bg-primary-50 p-2 rounded-full transition"
            >
              <PlusCircle size={24} />
            </button>
          )}
        </div>
        
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hidden-scrollbar">
          {loading ? (
            <div className="p-4 space-y-4 animate-pulse">
               {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-200 rounded-lg"></div>)}
            </div>
          ) : consultations.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p>No active consultations.</p>
            </div>
          ) : (
            consultations.map(c => (
              <div 
                key={c.id} 
                onClick={() => { setActiveChatId(c.id); setShowNewForm(false); setIsVideoActive(false); setIncomingCall(null); }}
                className={`p-4 border-b border-slate-100 cursor-pointer transition-colors relative
                  ${activeChatId === c.id && !showNewForm ? 'bg-primary-50 border-l-4 border-l-primary-600' : 'hover:bg-slate-100 border-l-4 border-l-transparent'}
                `}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-slate-800 line-clamp-1">
                    {user.role === 'patient' 
                      ? (c.Doctor ? `Dr. ${c.Doctor.name}` : 'Awaiting Assignment') 
                      : (c.Patient?.name || 'Unknown Patient')}
                  </h4>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                    {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-sm text-slate-500 line-clamp-1 mb-2">{c.reason}</p>
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block
                    ${c.status === 'completed' ? 'bg-green-100 text-green-700' : 
                      c.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 
                      'bg-amber-100 text-amber-700'}
                  `}>
                    {c.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area (Chat or Info/Form) */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        
        {/* NEW CONSULTATION FORM */}
        {showNewForm ? (
          <div className="flex-1 overflow-y-auto p-8 max-w-2xl mx-auto w-full">
             <div className="mb-8 text-center">
               <div className="mx-auto bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                 <Activity size={32} />
               </div>
               <h2 className="text-2xl font-bold text-slate-800">Request a Consultation</h2>
               <p className="text-slate-500 mt-2">Describe your symptoms to get connected with an available doctor.</p>
             </div>
             
             <form onSubmit={handleSubmitConsultation} className="space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Primary Reason for Visit</label>
                  <input 
                    type="text" required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    placeholder="e.g., Fever and continuous coughing"
                    value={newConsultation.reason}
                    onChange={e => setNewConsultation({...newConsultation, reason: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Detailed Symptoms Description</label>
                  <textarea 
                    required rows="4"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white resize-none"
                    placeholder="Please provide details about when the symptoms started, how severe they are, etc."
                    value={newConsultation.symptoms_description}
                    onChange={e => setNewConsultation({...newConsultation, symptoms_description: e.target.value})}
                  ></textarea>
                </div>
                <div className="flex justify-end pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowNewForm(false)}
                    className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg mr-4 font-medium transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm transition"
                  >
                    Submit Request
                  </button>
                </div>
             </form>
          </div>
        ) : !activeConsultation ? (
          /* NO CHAT SELECTED STATE */
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
             <div className="bg-slate-50 p-6 rounded-full border border-slate-200 border-dashed mb-4">
               <Info size={48} className="text-slate-300" />
             </div>
             <h3 className="text-lg font-medium text-slate-600 mb-2">No Conversation Selected</h3>
             <p className="text-sm">Choose an active consultation from the sidebar or start a new one.</p>
          </div>
        ) : (
          /* CHAT INTERFACE */
          <>
            {/* Chat Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white shrink-0 shadow-sm z-10">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-gradient-to-tr from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold shadow-inner">
                  {user.role === 'patient' 
                     ? (activeConsultation.Doctor?.name?.charAt(0) || 'D') 
                     : (activeConsultation.Patient?.name?.charAt(0) || 'P')}
                </div>
                <div className="ml-3">
                  <h3 className="font-bold text-slate-800 leading-tight">
                    {user.role === 'patient' 
                      ? (activeConsultation.Doctor ? `Dr. ${activeConsultation.Doctor.name}` : 'Awaiting Doctor') 
                      : (activeConsultation.Patient?.name || 'Patient')}
                  </h3>
                  <div className="flex items-center text-xs text-slate-500">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 flex-shrink-0"></span>
                    Online
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {(!activeConsultation.Payment || activeConsultation.Payment.status === 'verified') && (
                  <button 
                    onClick={handleStartVideoCall}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-full font-bold text-xs transition shadow-sm"
                  >
                    <Video size={16} /> <span>Video Call</span>
                  </button>
                )}
                <button className="text-slate-400 hover:text-primary-600 p-2 rounded-full hover:bg-slate-100 transition" title="Consultation Details">
                  <Info size={20} />
                </button>
              </div>
            </div>

            {(!activeConsultation.Payment || activeConsultation.Payment.status !== 'verified') ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-100 overflow-y-auto">
                 {user.role === 'patient' ? (
                   <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                     <div className="flex justify-center mb-6">
                       {activeConsultation.Payment?.status === 'pending' && activeConsultation.Payment?.screenshot_url ? (
                         <div className="bg-amber-100 w-20 h-20 flex items-center justify-center rounded-full text-amber-600"><Clock size={40} /></div>
                       ) : activeConsultation.Payment?.status === 'failed' ? (
                         <div className="bg-red-100 w-20 h-20 flex items-center justify-center rounded-full text-red-600"><AlertCircle size={40} /></div>
                       ) : activeConsultation.Payment?.status === 'expired' ? (
                         <div className="bg-slate-100 w-20 h-20 flex items-center justify-center rounded-full text-slate-500"><Clock size={40} /></div>
                       ) : (
                         <div className="bg-primary-100 w-20 h-20 flex items-center justify-center rounded-full text-primary-600"><CreditCard size={40} /></div>
                       )}
                     </div>

                     {(activeConsultation.Payment?.status === 'pending' && activeConsultation.Payment?.screenshot_url && !paymentFile) ? (
                       <div className="text-center">
                         <h3 className="text-xl font-bold text-slate-800 mb-2">Payment Under Review</h3>
                         <p className="text-slate-600 border border-amber-200 bg-amber-50 p-3 rounded-lg mb-5 text-sm leading-relaxed text-amber-800">Your payment with Reference: <strong>{activeConsultation.Payment.reference_code}</strong> is currently under review by administration.</p>
                         
                         <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden mb-5 shadow-sm">
                             <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center text-left">
                               <span className="font-semibold text-slate-700 text-sm flex items-center"><CheckCircle size={16} className="text-emerald-500 mr-1.5" /> Submitted Proof</span>
                             </div>
                             <div className="p-4 flex flex-col items-center">
                               <a href={`${api.defaults.baseURL?.replace(/\/api$/, '') || 'http://localhost:5000'}${activeConsultation.Payment.screenshot_url}`} target="_blank" rel="noreferrer">
                                 <img src={`${api.defaults.baseURL?.replace(/\/api$/, '') || 'http://localhost:5000'}${activeConsultation.Payment.screenshot_url}`} alt="Payment Proof" className="max-h-56 object-contain rounded-lg border border-slate-200 shadow-sm transition hover:opacity-90" />
                               </a>
                               <div className="flex space-x-3 mt-5 w-full">
                                   <button 
                                     onClick={handleDeleteScreenshot}
                                     disabled={isSubmittingPayment}
                                     className="flex-1 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 rounded-lg text-sm font-bold transition shadow-sm disabled:opacity-50"
                                   >
                                     Delete
                                   </button>
                                   <button 
                                     onClick={() => document.getElementById('payment-upload-replace').click()}
                                     disabled={isSubmittingPayment}
                                     className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-bold transition shadow-sm disabled:opacity-50"
                                   >
                                     Replace
                                   </button>
                                   <input id="payment-upload-replace" type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={(e) => {
                                      if (e.target.files[0]) {
                                          setPaymentFile(e.target.files[0]);
                                      }
                                   }} />
                               </div>
                             </div>
                         </div>
                       </div>
                     ) : (
                       <>
                         <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">
                           {activeConsultation.Payment?.status === 'failed' ? 'Payment Failed' : 
                            activeConsultation.Payment?.status === 'expired' ? 'Access Expired' : 'Payment Required'}
                         </h3>
                         <p className="text-slate-600 text-sm text-center mb-6">
                           {activeConsultation.Payment?.status === 'failed' 
                             ? 'Your previous submission was rejected. Please review your transfer and re-upload the correct screenshot.' 
                             : activeConsultation.Payment?.status === 'expired'
                             ? 'Your 1-week consultation access has ended. Please submit a new 800 Birr payment to continue chatting with your doctor.'
                             : 'Before you can start your consultation, please complete the payment and upload the screenshot.'}
                         </p>
                         
                         {activeConsultation.Payment?.status === 'failed' && activeConsultation.Payment?.admin_notes && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm border border-red-100 text-center">
                              <strong>Reason:</strong> {activeConsultation.Payment.admin_notes}
                            </div>
                         )}
                         
                         <div className="bg-slate-50 rounded-lg p-5 mb-6 text-sm border border-slate-200 shadow-inner">
                           <p className="font-semibold text-slate-700 mb-2">Payment Instructions:</p>
                           <ul className="list-disc pl-5 text-slate-600 space-y-1 mb-4">
                             <li>Transfer to CBE: <span className="font-mono font-bold text-slate-800">1000252073918</span></li>
                             <li>Transfer to Telebirr: <span className="font-mono font-bold text-slate-800">0994887044</span></li>
                             <li>Amount: <span className="font-bold text-slate-800">800 Birr</span></li>
                           </ul>
                           <div className="bg-primary-50 p-3 rounded-md border border-primary-100 text-center">
                             <p className="text-xs text-primary-600 font-semibold mb-1 uppercase tracking-wider">Your Reference Code</p>
                             <p className="font-mono font-bold text-xl text-primary-800">{activeConsultation.Payment?.reference_code}</p>
                           </div>
                           <p className="text-xs text-slate-500 mt-3 text-center italic">* Include this code in your transfer description.</p>
                         </div>

                         <form onSubmit={handlePaymentSubmit} className="space-y-5">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-center items-center">
                              <span className="font-bold text-slate-900 text-lg">Weekly Amount = 800 Birr</span>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Payment Screenshot</label>
                              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg bg-slate-50 hover:bg-slate-100 hover:border-primary-400 transition cursor-pointer" onClick={() => document.getElementById('payment-upload').click()}>
                                <div className="space-y-1 text-center">
                                  {paymentFile ? (
                                    <div className="flex flex-col items-center">
                                      <div className="relative group rounded-md overflow-hidden border border-slate-300 shadow-sm mb-2 max-w-[200px]">
                                        <img src={URL.createObjectURL(paymentFile)} alt="Preview" className="w-full h-auto max-h-32 object-contain bg-white" />
                                        <button 
                                          type="button" 
                                          onClick={(e) => { e.stopPropagation(); setPaymentFile(null); document.getElementById('payment-upload').value = null; }}
                                          className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-1 transition opacity-0 group-hover:opacity-100"
                                        >
                                          <X size={14} />
                                        </button>
                                      </div>
                                      <p className="text-sm font-medium text-slate-700 truncate w-full max-w-[200px]">{paymentFile.name}</p>
                                    </div>
                                  ) : (
                                    <>
                                      <UploadCloud className="mx-auto h-12 w-12 text-slate-400 group-hover:text-primary-500 transition-colors" />
                                      <div className="flex text-sm text-slate-600 justify-center">
                                        <span className="font-semibold text-primary-600 hover:text-primary-500 px-1">Upload a file</span> 
                                        <span>or drag and drop</span>
                                      </div>
                                      <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
                                    </>
                                  )}
                                  <input id="payment-upload" type="file" className="sr-only" accept="image/jpeg, image/png, image/webp" onChange={(e) => { if(e.target.files[0]) setPaymentFile(e.target.files[0]); }} />
                                </div>
                              </div>
                           </div>
                           <div className="flex space-x-3">
                             {paymentFile && activeConsultation.Payment?.screenshot_url && (
                               <button type="button" onClick={() => setPaymentFile(null)} disabled={isSubmittingPayment} className="py-3 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition shadow-sm w-1/3">
                                 Cancel
                               </button>
                             )}
                             <button type="submit" disabled={isSubmittingPayment || !paymentFile} className={`py-3 px-4 rounded-lg bg-primary-600 text-white font-bold tracking-wide hover:bg-primary-700 transition disabled:opacity-50 shadow-md ${paymentFile && activeConsultation.Payment?.screenshot_url ? 'w-2/3' : 'w-full'}`}>
                               {isSubmittingPayment ? 'Submitting...' : (activeConsultation.Payment?.screenshot_url ? 'Confirm Replacement' : 'Submit Payment Proof')}
                             </button>
                           </div>
                         </form>
                       </>
                     )}
                   </div>
                 ) : (
                   <div className="max-w-md w-full text-center">
                      <div className="mx-auto bg-amber-100 text-amber-600 w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-sm">
                        <AlertCircle size={48} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-3">Awaiting Payment</h3>
                      <p className="text-slate-600 leading-relaxed text-lg">The patient has not completed their payment verification. Chat and consultation tools will remain locked until the payment is verified by administration.</p>
                   </div>
                 )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
                {/* Incoming Call Banner */}
                {incomingCall && !isVideoActive && (
                  <div className="absolute top-0 left-0 w-full bg-emerald-600 text-white p-4 flex justify-between items-center shadow-md drop-shadow-lg z-50">
                    <div className="flex items-center">
                      <div className="bg-white/20 p-2 rounded-full mr-3 animate-pulse"><PhoneCall size={24} /></div>
                      <div>
                        <p className="font-bold text-lg">{incomingCall.initiator_name} is inviting you to a Video Call!</p>
                        <p className="text-emerald-100 text-sm">Join now to speak face-to-face.</p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button onClick={() => setIncomingCall(null)} className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 rounded-lg font-bold transition">Decline</button>
                      <button onClick={() => { setIsVideoActive(true); setIncomingCall(null); }} className="px-6 py-2 bg-white text-emerald-600 rounded-lg font-bold shadow-lg hover:shadow-xl hover:scale-105 transition">Accept & Join</button>
                    </div>
                  </div>
                )}
                
                {isVideoActive ? (
                  <div className="flex-1 w-full relative bg-[#474747] z-40 flex flex-col">
                    <div className="bg-slate-900 text-white p-3 flex justify-between items-center z-50 shadow-md">
                      <div className="flex items-center font-bold">
                        <Video size={18} className="text-emerald-500 mr-2" /> Live Consultation
                      </div>
                      <button 
                        onClick={handleEndVideoCall}
                        className="bg-rose-600 text-white px-4 py-1.5 rounded-lg font-bold shadow-md hover:bg-rose-700 flex items-center transition"
                      >
                        <X size={16} className="mr-1.5" /> Leave Call
                      </button>
                    </div>
                    <div className="flex-1">
                      <JitsiMeeting
                        domain="meet.jit.si"
                        roomName={`HealthConnect-Consult-${activeChatId}`}
                        configOverwrite={{
                          startWithAudioMuted: false,
                          startWithVideoMuted: false,
                          disableModeratorIndicator: true,
                          enableWelcomePage: false,
                          prejoinPageEnabled: false
                        }}
                        interfaceConfigOverwrite={{
                          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
                        }}
                        userInfo={{
                          displayName: user?.name || 'User'
                        }}
                        getIFrameRef={(iframeRef) => { iframeRef.style.height = '100%'; iframeRef.style.width = '100%'; }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Chat Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 flex flex-col space-y-4">
                  {/* Initial Case Info Bubble */}
                  <div className="mx-auto bg-white border border-slate-200 rounded-lg p-4 max-w-md shadow-sm text-sm text-center mb-4">
                    <h4 className="font-semibold text-slate-700 mb-1 border-b border-slate-100 pb-2">Consultation Details</h4>
                    <p className="text-slate-600 mt-2 font-medium">Reason: {activeConsultation.reason}</p>
                    <p className="text-slate-500 mt-1 italic">"{activeConsultation.symptoms_description}"</p>
                    <div className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-50 flex justify-center items-center">
                      <Clock size={12} className="mr-1" /> Requested on {new Date(activeConsultation.created_at).toLocaleString()}
                    </div>
                  </div>

                  {messages.map((msg, index) => {
                    const isSentByMe = (msg.sender === user.role);
                    const isSystem = msg.sender === 'system';

                    if (isSystem) {
                      return (
                        <div key={index} className="flex justify-center my-2">
                           <span className="bg-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full">{msg.text}</span>
                        </div>
                      );
                    }

                    return (
                      <div key={index} className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                        {!isSentByMe && (
                          <div className="h-8 w-8 bg-slate-300 rounded-full mr-2 flex-shrink-0 self-end"></div>
                        )}
                        <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm relative group
                          ${isSentByMe 
                            ? 'bg-primary-600 text-white rounded-br-sm' 
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}
                        `}>
                          <p className="text-[15px] leading-relaxed break-words">{msg.text}</p>
                          
                          {msg.attachment_url && (
                            (() => {
                               const fullUrl = msg.attachment_url.startsWith('http') ? msg.attachment_url : `${SOCKET_URL}${msg.attachment_url}`;
                               return fullUrl.match(/\.(jpeg|jpg|gif|png)$/i) != null ? (
                                 <img src={fullUrl} alt="attachment" className="mt-2 rounded-lg max-w-full max-h-48 object-contain" />
                               ) : (
                                 <a href={fullUrl} target="_blank" rel="noopener noreferrer" className={`inline-block mt-2 px-3 py-1 rounded text-sm underline break-all ${isSentByMe ? 'bg-white/20' : 'bg-slate-100 text-primary-600'}`}>
                                   View Attachment
                                 </a>
                               );
                            })()
                          )}

                          <span className={`text-[10px] mt-1 block text-right font-medium opacity-70
                            ${isSentByMe ? 'text-primary-100' : 'text-slate-400'}
                          `}>
                            {msg.time}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input Area */}
                <div className="h-20 bg-white border-t border-slate-200 px-6 py-4 flex items-center shrink-0">
                  <input 
                     type="file" 
                     ref={fileInputRef} 
                     className="hidden" 
                     onChange={handleFileUpload}
                     disabled={activeConsultation.status === 'completed'}
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={activeConsultation.status === 'completed'}
                    className="text-slate-400 hover:text-slate-600 p-2 mr-2 transition disabled:opacity-50 disabled:hover:text-slate-400"
                  >
                    <Paperclip size={22} />
                  </button>
                  
                  <form onSubmit={handleSendMessage} className="flex-1 flex items-center relative">
                    <input 
                      type="text" 
                      autoComplete="off"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={activeConsultation.status === 'completed' ? "This consultation is closed." : "Type your message..."}
                      disabled={activeConsultation.status === 'completed'}
                      className="w-full bg-slate-100 rounded-full pl-5 pr-14 py-3 border-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                    />
                    <button 
                      type="submit"
                      disabled={!newMessage.trim() || activeConsultation.status === 'completed'}
                      className="absolute right-2 top-1.5 p-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-full transition disabled:opacity-50 disabled:hover:bg-primary-600 flex items-center justify-center h-9 w-9"
                    >
                      <Send size={16} className="ml-0.5" />
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        )}
      </>
    )}
  </div>
</div>
  );
};

export default Consultations;
