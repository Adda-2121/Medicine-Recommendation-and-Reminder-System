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
  PhoneCall,
  Trash2,
  MessageSquare,
  Star,
  Mic,
  Square,
  Phone,
  Pause,
  Play
} from 'lucide-react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/common/ConfirmationModal';

const Consultations = () => {
  const { t } = useTranslation();
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

  // Chat Modes
  const [activeChatType, setActiveChatType] = useState('patient');

  // Chat message selection state
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState('me'); // 'me' or 'everyone'
  const longPressTimerRef = useRef(null);

  // Video call state
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const cancelRecordingRef = useRef(false);

  // Payment form state
  const [globalConsultationFee, setGlobalConsultationFee] = useState('100');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // New consultation form state
  const [newConsultation, setNewConsultation] = useState({
    reason: '',
    symptoms_description: ''
  });

  // Service requests state
  const [serviceReqs, setServiceReqs] = useState([]);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceRequestForm, setServiceRequestForm] = useState({ service_item_id: '', instructions: '' });
  const [availableServices, setAvailableServices] = useState([]);

  // Manage individual service request details / chat
  const [selectedService, setSelectedService] = useState(null);
  const [editingConfig, setEditingConfig] = useState(false);
  const [editServiceForm, setEditServiceForm] = useState({ instructions: '' });

  // Prescription state
  const [prescriptions, setPrescriptions] = useState([]);
  const [showPrescribeModal, setShowPrescribeModal] = useState(false);
  const [drugSearchQuery, setDrugSearchQuery] = useState('');
  const [drugSearchResults, setDrugSearchResults] = useState([]);
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [isPrescribing, setIsPrescribing] = useState(false);
  
  const [modalConfig, setModalConfig] = useState({ isOpen: false, reqId: null });
  const [isMarkingCured, setIsMarkingCured] = useState(false);

  // Consultation feedback state (patient submitting after consultation completed)
  const [consultFeedback, setConsultFeedback] = useState({ isOpen: false, rating: 0, comment: '', submitting: false });
  const [myTestimonials, setMyTestimonials] = useState([]);

  useEffect(() => {
    // Check if URL has ?action=new
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('action') === 'new') {
      setShowNewForm(true);
      // Clean up URL
      navigate('/consultations', { replace: true });
    }

    // Check for Chapa payment return
    const tx_ref = queryParams.get('payment_ref');
    if (tx_ref) {
      setIsSubmittingPayment(true);
      api.get(`/chapa/verify/${tx_ref}`)
        .then(res => {
          toast.success('Payment Verified Successfully!');
          navigate('/consultations', { replace: true });
          fetchConsultations(); // Refresh to see the assigned doctor immediately
        })
        .catch(err => {
          console.error(err);
          toast.error('Payment verification is pending or failed.');
          navigate('/consultations', { replace: true });
        })
        .finally(() => {
          setIsSubmittingPayment(false);
        });
    }
  }, [location, navigate]);

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const [consRes, servRes, settingsRes, testRes] = await Promise.all([
        api.get('/consultations'),
        api.get('/services/items'),
        api.get('/settings'),
        user.role === 'patient' ? api.get('/testimonials/my').catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
      ]);
      setConsultations(consRes.data);
      setAvailableServices(servRes.data);
      setMyTestimonials(testRes.data);
      
      const feeSetting = settingsRes.data.find(s => s.key === 'consultation_fee');
      if (feeSetting) {
        setGlobalConsultationFee(feeSetting.value);
      }
      if (consRes.data.length > 0 && !activeChatId && !showNewForm) {
        // Auto-select first active or pending consultation
        const activeOrFirst = consRes.data.find(c => c.status !== 'completed') || consRes.data[0];
        setActiveChatId(activeOrFirst.id);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
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
          chat_type: m.chat_type || 'patient',
          time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setMessages(formattedMsgs);
        scrollToBottom();
      }).catch(err => {
        console.error('Error fetching chat history:', err);
      });

      api.get(`/service-requests/consultation/${activeChatId}`).then(res => {
        setServiceReqs(res.data);
      }).catch(err => {
        console.error('Error fetching service requests:', err);
      });

      if (user.role === 'patient') {
        api.get(`/prescriptions/consultation/${activeChatId}`).then(res => {
          setPrescriptions(res.data);
        }).catch(err => {
          console.error('Error fetching prescriptions:', err);
        });
      }

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
            chat_type: msgData.chat_type || 'patient',
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

      const handleMessagesDeleted = (data) => {
        if (data.mode === 'everyone' || data.requester_role === user.role) {
          setMessages(prev => prev.filter(m => !data.message_ids.includes(m.id)));
          setSelectedMessages(new Set());
        }
      };

      const handleCallEnded = (data) => {
        if (data.consultation_id === activeChatId) {
          setIsVideoActive(false);
          setIncomingCall(null);
          toast.success('Video call ended by the other participant.');
        }
      };

      socket.on('receive_message', handleReceiveMessage);
      socket.on('incoming_video_call', handleIncomingCall);
      socket.on('video_call_ended', handleCallEnded);
      socket.on('messages_deleted', handleMessagesDeleted);

      return () => {
        socket.off('receive_message', handleReceiveMessage);
        socket.off('incoming_video_call', handleIncomingCall);
        socket.off('video_call_ended', handleCallEnded);
        socket.off('messages_deleted', handleMessagesDeleted);
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      cancelRecordingRef.current = false;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setIsRecordingPaused(false);
        clearInterval(recordingIntervalRef.current);

        if (cancelRecordingRef.current) {
          // Recording was cancelled, discard the audio
          audioChunksRef.current = [];
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
        
        const formData = new FormData();
        formData.append('file', audioFile);

        try {
          const res = await api.post('/chat/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          socket.emit('send_message', {
            consultation_id: activeChatId,
            sender_id: user.id,
            message: 'Voice message',
            attachment_url: res.data.fileUrl,
            chat_type: activeChatType
          });
        } catch (err) {
          console.error(err);
          toast.error('Voice message upload failed.');
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsRecordingPaused(false);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast.error('Microphone access denied or not available.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isRecordingPaused) {
      mediaRecorderRef.current.pause();
      setIsRecordingPaused(true);
      clearInterval(recordingIntervalRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isRecordingPaused) {
      mediaRecorderRef.current.resume();
      setIsRecordingPaused(false);
      recordingIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      cancelRecordingRef.current = true;
      mediaRecorderRef.current.stop();
    }
  };

  const sendRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      cancelRecordingRef.current = false;
      mediaRecorderRef.current.stop();
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId) return;

    socket.emit('send_message', {
      consultation_id: activeChatId,
      sender_id: user.id,
      message: newMessage,
      chat_type: activeChatType
    });

    setNewMessage('');
  };

  const handleToggleSelection = (msgId) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(msgId)) {
        newSet.delete(msgId);
      } else {
        newSet.add(msgId);
      }
      return newSet;
    });
  };

  const handleDeleteMessages = (modeToUse) => {
    if (selectedMessages.size === 0 || !activeChatId) return;

    const mode = modeToUse || deleteMode;

    socket.emit('delete_messages', {
      consultation_id: activeChatId,
      message_ids: Array.from(selectedMessages),
      mode: mode,
      requester_id: user.id,
      requester_role: user.role
    });

    setShowDeleteModal(false);
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
        attachment_url: res.data.fileUrl,
        chat_type: activeChatType
      });

      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      toast.error('File upload failed.');
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

      toast.success('Consultation requested successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to request consultation.');
    }
  };

  const handleServiceRequestSubmit = async (e) => {
    e.preventDefault();
    if (!activeChatId) return;
    try {
      await api.post('/service-requests', {
        consultation_id: activeChatId,
        service_item_id: serviceRequestForm.service_item_id,
        instructions: serviceRequestForm.instructions
      });
      toast.success('Service requested successfully!');
      setShowServiceForm(false);
      setServiceRequestForm({ service_item_id: '', instructions: '' });
      // Refresh
      const res = await api.get(`/service-requests/consultation/${activeChatId}`);
      setServiceReqs(res.data);

      const item = availableServices.find(s => s.id === serviceRequestForm.service_item_id);
      const chatType = item?.Category?.department_type === 'radiology' ? 'radiologist' : 'laboratorist';

      socket.emit('send_message', {
        consultation_id: activeChatId,
        sender_id: user.id,
        message: `Medical Service Requested: ${item?.name}\nInstructions: ${serviceRequestForm.instructions || 'None'}`,
        chat_type: 'patient'
      });

      socket.emit('send_message', {
        consultation_id: activeChatId,
        sender_id: user.id,
        message: `Medical Service Requested: ${item?.name}\nInstructions: ${serviceRequestForm.instructions || 'None'}`,
        chat_type: chatType
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to request service.');
    }
  };

  const handleUpdateServiceRequest = async () => {
    try {
      await api.put(`/service-requests/${selectedService.id}`, editServiceForm);
      setEditingConfig(false);
      setSelectedService({ ...selectedService, ...editServiceForm });
      api.get(`/service-requests/consultation/${activeChatId}`).then(res => setServiceReqs(res.data)); // refresh list
      toast.success("Request updated safely.");
    } catch (err) { console.error(err); toast.error("Failed to update request."); }
  };

  const handleMarkAsCured = async () => {
    if (!activeChatId) return;
    setIsMarkingCured(true);
    try {
      await api.put(`/treatments/${activeChatId}/mark-cured`);
      toast.success('Patient marked as cured!');
      fetchConsultations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark as cured. Ensure a treatment plan exists first.');
    } finally {
      setIsMarkingCured(false);
    }
  };

  const handleSubmitConsultFeedback = async () => {
    if (consultFeedback.rating === 0) return toast.error('Please select a rating');
    setConsultFeedback(prev => ({ ...prev, submitting: true }));
    try {
      await api.post('/testimonials', {
        service_id: activeChatId,
        service_type: 'consultation',
        rating: consultFeedback.rating,
        comment: consultFeedback.comment
      });
      toast.success('Feedback submitted!');
      setConsultFeedback({ isOpen: false, rating: 0, comment: '', submitting: false });
      fetchConsultations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
      setConsultFeedback(prev => ({ ...prev, submitting: false }));
    }
  };

  const confirmDelete = (reqId) => {
    setModalConfig({ isOpen: true, reqId });
  };

  const executeDelete = async () => {
    try {
      await api.delete(`/service-requests/${modalConfig.reqId}`);
      setSelectedService(null);
      setServiceReqs(serviceReqs.filter(t => t.id !== modalConfig.reqId));
      toast.success("Service request successfully cancelled and deleted.");
      setModalConfig({ isOpen: false, reqId: null });
    } catch (err) { console.error(err); toast.error("Failed to delete service request."); }
  };

  const handleChapaPayment = async () => {
    if (!activeChatId) return;
    try {
      setIsSubmittingPayment(true);
      const res = await api.post('/chapa/initialize/consultation', {
        payment_id: activeConsultation.Payment.id
      });
      if (res.data && res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to initialize Chapa payment.');
      setIsSubmittingPayment(false);
    }
  };

  const handleCheckPaymentStatus = async () => {
    if (!activeConsultation?.Payment?.chapa_tx_ref) return;
    try {
      setIsSubmittingPayment(true);
      await api.get(`/chapa/verify/${activeConsultation.Payment.chapa_tx_ref}`);
      toast.success('Payment verified successfully!');
      fetchConsultations();
    } catch (err) {
      console.error(err);
      toast.error('Payment has not been completed or verified yet.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };
  const activeConsultation = consultations.find(c => c.id === activeChatId);

  const handleSearchDrugs = async (query) => {
    setDrugSearchQuery(query);
    if (!query.trim()) {
      setDrugSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/drugs/search?q=${query}`);
      setDrugSearchResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectDrug = (drug) => {
    if (!selectedDrugs.find(d => d.id === drug.id)) {
      setSelectedDrugs([...selectedDrugs, { ...drug, instructions: '' }]);
    }
    setDrugSearchQuery('');
    setDrugSearchResults([]);
  };

  const handleRemoveDrug = (drugId) => {
    setSelectedDrugs(selectedDrugs.filter(d => d.id !== drugId));
  };

  const handleUpdateDrugInstructions = (drugId, instructions) => {
    setSelectedDrugs(selectedDrugs.map(d => d.id === drugId ? { ...d, instructions } : d));
  };

  const handlePrescribeSubmit = async (e) => {
    e.preventDefault();
    if (selectedDrugs.length === 0 || !activeChatId) return;
    setIsPrescribing(true);
    try {
      await api.post('/prescriptions', {
        consultation_id: activeChatId,
        patient_id: activeConsultation.patient_id,
        drugs: selectedDrugs.map(d => ({ drug_id: d.id, instructions: d.instructions }))
      });
      toast.success('Prescription created successfully!');
      setShowPrescribeModal(false);
      setSelectedDrugs([]);
      // Refresh prescriptions
      const res = await api.get(`/prescriptions/consultation/${activeChatId}`);
      setPrescriptions(res.data);

      socket.emit('send_message', {
        consultation_id: activeChatId,
        sender_id: user.id,
        message: `Prescribed ${selectedDrugs.length} medication(s). Please check your prescription details.`,
        chat_type: 'patient'
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to create prescription.');
    } finally {
      setIsPrescribing(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

      {/* Sidebar - Chat List */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
          <h2 className="font-bold text-slate-800 text-lg">{t('consultations.title')}</h2>
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
              placeholder={t('consultations.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hidden-scrollbar">
          {loading ? (
            <div className="p-4 space-y-4 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-200 rounded-lg"></div>)}
            </div>
          ) : consultations.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p>{t('consultations.noActive')}</p>
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
                      ? (c.Doctor ? `Dr. ${c.Doctor.name}` : t('consultations.docAwaiting'))
                      : (c.Patient?.name || t('consultations.patientUnknown'))}
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
                    {c.status === 'completed' ? 'Completed' : (c.status === 'in_progress' ? 'Pending' : c.status.replace('_', ' '))}
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
              <h2 className="text-2xl font-bold text-slate-800">{t('consultations.reqConsultation')}</h2>
              <p className="text-slate-500 mt-2">{t('consultations.reqDesc')}</p>
            </div>

            <form onSubmit={handleSubmitConsultation} className="space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('consultations.primaryReason')}</label>
                <select
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  value={newConsultation.reason}
                  onChange={e => setNewConsultation({ ...newConsultation, reason: e.target.value })}
                >
                  <option value="" disabled>---</option>
                  <option value={t('findDoctor.diseases.general')}>{t('findDoctor.diseases.general')}</option>
                  <option value={t('findDoctor.diseases.fever')}>{t('findDoctor.diseases.fever')}</option>
                  <option value={t('findDoctor.diseases.headache')}>{t('findDoctor.diseases.headache')}</option>
                  <option value={t('findDoctor.diseases.stomach')}>{t('findDoctor.diseases.stomach')}</option>
                  <option value={t('findDoctor.diseases.skin')}>{t('findDoctor.diseases.skin')}</option>
                  <option value={t('findDoctor.diseases.joint')}>{t('findDoctor.diseases.joint')}</option>
                  <option value={t('findDoctor.diseases.breathing')}>{t('findDoctor.diseases.breathing')}</option>
                  <option value={t('findDoctor.diseases.dental')}>{t('findDoctor.diseases.dental')}</option>
                  <option value={t('findDoctor.diseases.eye')}>{t('findDoctor.diseases.eye')}</option>
                  <option value={t('findDoctor.diseases.other')}>{t('findDoctor.diseases.other')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('consultations.symptomsDesc')}</label>
                <textarea
                  required rows="4"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white resize-none"
                  placeholder={t('consultations.symptomsPlaceholder')}
                  value={newConsultation.symptoms_description}
                  onChange={e => setNewConsultation({ ...newConsultation, symptoms_description: e.target.value })}
                ></textarea>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg mr-4 font-medium transition"
                >
                  {t('consultations.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm transition"
                >
                  {t('consultations.submitReq')}
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
            <h3 className="text-lg font-medium text-slate-600 mb-2">{t('consultations.noChatTitle')}</h3>
            <p className="text-sm">{t('consultations.noChatDesc')}</p>
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
                      ? (activeConsultation.Doctor ? `Dr. ${activeConsultation.Doctor.name}` : t('consultations.docAwaitingRole'))
                      : (activeConsultation.Patient?.name || t('consultations.patientRole'))}
                  </h3>
                  <div className="flex items-center text-xs text-slate-500">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 flex-shrink-0"></span>
                    {t('consultations.online')}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {(!activeConsultation.Payment || activeConsultation.Payment.status === 'verified') && user.role === 'doctor' && (
                  <>
                    <button
                      onClick={() => setShowPrescribeModal(true)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-full font-bold text-xs transition shadow-sm"
                    >
                      <PlusCircle size={16} /> <span>Prescribe</span>
                    </button>
                    <button
                      onClick={() => setShowServiceForm(true)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-full font-bold text-xs transition shadow-sm"
                    >
                      <Activity size={16} /> <span>Request Service</span>
                    </button>
                    {activeConsultation.status !== 'completed' && (
                      <button
                        onClick={handleMarkAsCured}
                        disabled={isMarkingCured}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-full font-bold text-xs transition shadow-sm disabled:opacity-60"
                      >
                        <CheckCircle size={16} /> <span>{isMarkingCured ? 'Saving...' : 'Mark as Cured'}</span>
                      </button>
                    )}
                    {activeConsultation.status === 'completed' && (
                      <span className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-xs">
                        <CheckCircle size={14} /> <span>Cured</span>
                      </span>
                    )}
                  </>
                )}
                {(!activeConsultation.Payment || activeConsultation.Payment.status === 'verified') && (
                  <button
                    onClick={handleStartVideoCall}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-full font-bold text-xs transition shadow-sm"
                  >
                    <Video size={16} /> <span>{t('consultations.videoCall')}</span>
                  </button>
                )}
                <button className="text-slate-400 hover:text-primary-600 p-2 rounded-full hover:bg-slate-100 transition" title="Consultation Details">
                  <Info size={20} />
                </button>
              </div>
            </div>

            {/* Chat Tabs */}
            {(!activeConsultation.Payment || activeConsultation.Payment.status === 'verified') && user.role === 'doctor' && (
              <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
                <button
                  onClick={() => setActiveChatType('patient')}
                  className={`flex-1 py-3 text-sm font-bold text-center transition flex items-center justify-center
                    ${activeChatType === 'patient' ? 'text-primary-600 border-b-2 border-primary-600 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                >
                  <User size={16} className="mr-2" />
                  Patient Chat
                  {messages.filter(m => m.chat_type === 'patient').length > 0 && (
                    <span className="ml-2 bg-slate-200 text-slate-700 py-0.5 px-2 rounded-full text-[10px]">
                      {messages.filter(m => m.chat_type === 'patient').length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveChatType('laboratorist')}
                  className={`flex-1 py-3 text-sm font-bold text-center transition flex items-center justify-center
                    ${activeChatType === 'laboratorist' ? 'text-primary-600 border-b-2 border-primary-600 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                >
                  <Activity size={16} className="mr-2" />
                  Specialist Chat(Laboratorist/Radiologist)
                  {(messages.filter(m => m.chat_type === 'laboratorist' || m.chat_type === 'radiologist').length > 0) && (
                    <span className="ml-2 bg-slate-200 text-slate-700 py-0.5 px-2 rounded-full text-[10px]">
                      {messages.filter(m => m.chat_type === 'laboratorist' || m.chat_type === 'radiologist').length}
                    </span>
                  )}
                </button>
              </div>
            )}

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

                    {activeConsultation.Payment?.status === 'pending' && activeConsultation.Payment?.chapa_tx_ref ? (
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Payment In Progress</h3>
                        <p className="text-slate-600 border border-amber-200 bg-amber-50 p-3 rounded-lg mb-5 text-sm leading-relaxed text-amber-800">
                          We are waiting for Chapa to confirm your payment. If you have already paid, click the button below to refresh the status.
                        </p>

                        <div className="flex space-x-3 mt-5 w-full">
                          <button
                            onClick={handleCheckPaymentStatus}
                            disabled={isSubmittingPayment}
                            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-bold transition shadow-sm disabled:opacity-50"
                          >
                            {isSubmittingPayment ? 'Checking...' : 'Refresh Payment Status'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">
                          {activeConsultation.Payment?.status === 'failed' ? t('consultations.paymentFailed') :
                            activeConsultation.Payment?.status === 'expired' ? t('consultations.accessExpired') : t('consultations.paymentRequired')}
                        </h3>
                        <p className="text-slate-600 text-sm text-center mb-6">
                          {activeConsultation.Payment?.status === 'failed'
                            ? t('consultations.paymentFailedDesc')
                            : activeConsultation.Payment?.status === 'expired'
                              ? t('consultations.accessExpiredDesc')
                              : "You need an active subscription to chat with doctors. Pay once and get full access for 1 week."}
                        </p>

                        {activeConsultation.Payment?.status === 'failed' && activeConsultation.Payment?.admin_notes && (
                          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm border border-red-100 text-center">
                            <strong>{t('consultations.reason')}</strong> {activeConsultation.Payment.admin_notes}
                          </div>
                        )}

                        <div className="space-y-5 mt-4">
                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-between items-center">
                            <span className="font-bold text-slate-900 text-lg">Subscription Fee</span>
                            <span className="font-bold text-primary-600 text-xl">{globalConsultationFee} Birr</span>
                          </div>
                          
                          <button 
                            onClick={handleChapaPayment}
                            disabled={isSubmittingPayment} 
                            className="w-full py-3 px-4 rounded-lg bg-[#00A859] text-white font-bold tracking-wide hover:bg-[#00904d] transition disabled:opacity-50 shadow-md flex items-center justify-center space-x-2"
                          >
                            <CreditCard size={20} />
                            <span>{isSubmittingPayment ? 'Connecting to Chapa...' : 'Pay with Chapa'}</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="max-w-md w-full text-center">
                    <div className="mx-auto bg-amber-100 text-amber-600 w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-sm">
                      <AlertCircle size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-3">{t('consultations.awaitingPayment')}</h3>
                    <p className="text-slate-600 leading-relaxed text-lg">{t('consultations.awaitingPaymentDesc')}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
                {/* Incoming Call Banner */}
                {incomingCall && !isVideoActive && (
                  <div className="absolute top-0 left-0 w-full bg-emerald-600 text-white p-4 flex justify-between items-center shadow-md drop-shadow-lg z-50">
                    <div className="flex items-center">
                      <div className="bg-white/20 p-2 rounded-full mr-3 animate-pulse"><Video size={24} /></div>
                      <div>
                        <p className="font-bold text-lg">{incomingCall.initiator_name} {t('consultations.incomingCall')}</p>
                        <p className="text-emerald-100 text-sm">{t('consultations.joinFaceToFace')}</p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button onClick={() => setIncomingCall(null)} className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 rounded-lg font-bold transition">{t('consultations.decline')}</button>
                      <button onClick={() => { setIsVideoActive(true); setIncomingCall(null); }} className="px-6 py-2 bg-white text-emerald-600 rounded-lg font-bold shadow-lg hover:shadow-xl hover:scale-105 transition">{t('consultations.acceptJoin')}</button>
                    </div>
                  </div>
                )}

                {isVideoActive ? (
                  <div className="flex-1 w-full relative bg-[#474747] z-40 flex flex-col">
                    <div className="bg-slate-900 text-white p-3 flex justify-between items-center z-50 shadow-md">
                      <div className="flex items-center font-bold">
                        <Video size={18} className="text-emerald-500 mr-2" /> {t('consultations.liveConsultation')}
                      </div>
                      <button
                        onClick={handleEndVideoCall}
                        className="bg-rose-600 text-white px-4 py-1.5 rounded-lg font-bold shadow-md hover:bg-rose-700 flex items-center transition"
                      >
                        <X size={16} className="mr-1.5" /> {t('consultations.leaveCall')}
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
                        <h4 className="font-semibold text-slate-700 mb-1 border-b border-slate-100 pb-2">{t('consultations.consultDetails')}</h4>
                        <p className="text-slate-600 mt-2 font-medium">{t('consultations.reason')} {activeConsultation.reason}</p>
                        <p className="text-slate-500 mt-1 italic">"{activeConsultation.symptoms_description}"</p>
                        <div className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-50 flex justify-center items-center">
                          <Clock size={12} className="mr-1" /> {t('consultations.requestedOn')} {new Date(activeConsultation.created_at).toLocaleString()}
                        </div>
                      </div>

                      {/* Display Services if any */}
                      {serviceReqs.length > 0 && (
                        <div className="mx-auto bg-white border border-slate-200 rounded-lg p-4 max-w-md shadow-sm text-sm mb-4 w-full">
                          <h4 className="font-semibold text-slate-700 mb-2 border-b border-slate-100 pb-2">Requested Services</h4>
                          <div className="space-y-3">
                            {serviceReqs.map(req => (
                              <div key={req.id} className="bg-slate-50 p-3 rounded border border-slate-200">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-slate-800">{req.ServiceItem?.name || 'Service'}</span>
                                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block ${req.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{req.status === 'completed' ? 'Completed' : (req.status === 'in_progress' ? 'Pending' : req.status.replace('_', ' '))}</span>
                                </div>

                                {req.status === 'completed' && req.result_file_url && user.role === 'doctor' && (
                                  <div className="mt-2 pt-2 border-t border-slate-200">
                                    <p className="text-xs text-slate-600 font-medium mb-1">Result Notes:</p>
                                    <p className="text-xs text-slate-500 mb-2">{req.result_notes || 'No additional notes'}</p>
                                    <a href={`${api.defaults.baseURL?.replace(/\/api$/, '') || 'http://localhost:5000'}${req.result_file_url}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline">Download / View Report</a>
                                  </div>
                                )}
                                <div className="mt-3 flex justify-end gap-2">
                                  {req.status === 'pending' && user.role === 'doctor' && (
                                    <button
                                      onClick={() => confirmDelete(req.id)}
                                      className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold rounded hover:bg-rose-100 transition"
                                    >Cancel Service</button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setSelectedService(req);
                                      setEditServiceForm({ instructions: req.instructions });
                                    }}
                                    className="px-3 py-1 bg-primary-100 text-primary-700 text-[10px] font-bold rounded hover:bg-primary-200 transition"
                                  >View Details & Discuss</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Display Prescriptions if any */}
                      {user.role === 'patient' && prescriptions.length > 0 && (
                        <div className="mx-auto bg-white border border-slate-200 rounded-lg p-4 max-w-md shadow-sm text-sm mb-4 w-full">
                          <h4 className="font-semibold text-slate-700 mb-2 border-b border-slate-100 pb-2">Prescribed Medication</h4>
                          <div className="space-y-3">
                            {prescriptions.map(p => (
                              <div key={p.id} className="bg-purple-50 p-3 rounded border border-purple-100">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-bold text-slate-800">{p.Drug?.name}</span>
                                  <span className="text-[10px] text-slate-500">{new Date(p.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs text-slate-700 mb-1 font-medium">Dosage: <span className="font-normal">{p.Drug?.dosage}</span></p>
                                <p className="text-xs text-slate-600 mb-2">{p.Drug?.description}</p>
                                {p.instructions && <p className="text-xs text-slate-500 mb-2 italic">Note: "{p.instructions}"</p>}
                                <div className="mt-2 pt-2 border-t border-purple-200 text-xs text-slate-500">
                                  <span className="font-medium text-slate-600">Side effects:</span> {p.Drug?.side_effects}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Feedback prompt for completed consultations (patient only) */}
                      {user.role === 'patient' && activeConsultation.status === 'completed' && (
                        myTestimonials.find(t => t.service_id === activeChatId) ? (
                          <div className="mx-auto bg-emerald-50 border border-emerald-200 rounded-lg p-3 max-w-md w-full text-center text-sm text-emerald-700 font-medium flex items-center justify-center gap-2">
                            <Star size={14} className="fill-emerald-600 text-emerald-600" /> You have reviewed this consultation
                          </div>
                        ) : (
                          <div className="mx-auto bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md w-full text-center">
                            <p className="text-sm font-semibold text-amber-800 mb-2">Consultation completed — how was your experience?</p>
                            <button
                              onClick={() => setConsultFeedback({ isOpen: true, rating: 0, comment: '', submitting: false })}
                              className="text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-4 py-1.5 rounded-lg shadow-sm transition flex items-center mx-auto"
                            >
                              <MessageSquare size={13} className="mr-1.5" /> Leave Feedback
                            </button>
                          </div>
                        )
                      )}

                      {/* Delete Toolbar */}
                      {selectedMessages.size > 0 && (
                        <div className="sticky top-0 bg-primary-100 border border-primary-200 p-3 rounded-lg flex justify-between items-center z-20 shadow-md">
                          <span className="text-primary-800 font-semibold text-sm">{selectedMessages.size} selected</span>
                          <div className="flex space-x-3">
                            <button onClick={() => setSelectedMessages(new Set())} className="text-slate-500 hover:text-slate-700 text-sm font-medium">Cancel</button>
                            <button onClick={() => setShowDeleteModal(true)} className="flex items-center text-rose-600 hover:text-rose-700 text-sm font-bold bg-white px-3 py-1.5 rounded shadow-sm border border-rose-100 transition"><Trash2 size={16} className="mr-1.5" /> Delete</button>
                          </div>
                        </div>
                      )}

                      {messages.filter(m => m.chat_type === activeChatType).map((msg, index) => {
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
                          <div key={index} className={`flex items-center ${isSentByMe ? 'justify-end' : 'justify-start'} group mb-1`}
                            onMouseDown={() => { longPressTimerRef.current = setTimeout(() => handleToggleSelection(msg.id), 600); }}
                            onMouseUp={() => clearTimeout(longPressTimerRef.current)}
                            onMouseLeave={() => clearTimeout(longPressTimerRef.current)}
                            onTouchStart={() => { longPressTimerRef.current = setTimeout(() => handleToggleSelection(msg.id), 600); }}
                            onTouchEnd={() => clearTimeout(longPressTimerRef.current)}>

                            {/* Selection Checkbox (always visible if selecting, visible on hover otherwise) */}
                            {(!isSentByMe) && (selectedMessages.size > 0 || msg.id) && (
                              <div className={`mr-3 ${selectedMessages.size > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                <input type="checkbox" checked={selectedMessages.has(msg.id)} onChange={() => handleToggleSelection(msg.id)} className="w-5 h-5 accent-primary-600 cursor-pointer" />
                              </div>
                            )}

                            {!isSentByMe && (
                              <div className="h-8 w-8 bg-slate-300 rounded-full mr-2 flex-shrink-0 self-end"></div>
                            )}
                            <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm relative group cursor-pointer transition 
                          ${isSentByMe
                                ? 'bg-primary-600 text-white rounded-br-sm'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}
                          ${selectedMessages.has(msg.id) ? 'ring-2 ring-rose-400 ring-offset-2 opacity-90' : ''}
                        `} onClick={() => selectedMessages.size > 0 && handleToggleSelection(msg.id)}>
                              <p className="text-[15px] leading-relaxed break-words">{msg.text}</p>

                              {msg.attachment_url && (
                                (() => {
                                  const fullUrl = msg.attachment_url.startsWith('http') ? msg.attachment_url : `${SOCKET_URL}${msg.attachment_url}`;
                                  const isAudio = fullUrl.match(/\.(webm|mp3|wav|ogg)$/i) != null;
                                  
                                  return fullUrl.match(/\.(jpeg|jpg|gif|png)$/i) != null ? (
                                    <img src={fullUrl} alt="attachment" className="mt-2 rounded-lg max-w-full max-h-48 object-contain" />
                                  ) : isAudio ? (
                                    <audio controls className="mt-2 w-full max-w-[250px] h-10">
                                      <source src={fullUrl} />
                                      Your browser does not support the audio element.
                                    </audio>
                                  ) : (
                                    <a href={fullUrl} target="_blank" rel="noopener noreferrer" className={`inline-block mt-2 px-3 py-1 rounded text-sm underline break-all ${isSentByMe ? 'bg-white/20' : 'bg-slate-100 text-primary-600'}`}>
                                      {t('consultations.viewAttachment')}
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

                            {/* Selection Checkbox for My messages */}
                            {(isSentByMe) && (selectedMessages.size > 0 || msg.id) && (
                              <div className={`ml-3 ${selectedMessages.size > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                <input type="checkbox" checked={selectedMessages.has(msg.id)} onChange={() => handleToggleSelection(msg.id)} className="w-5 h-5 accent-primary-600 cursor-pointer" />
                              </div>
                            )}
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
                        className="text-slate-400 hover:text-slate-600 p-2 mr-1 transition disabled:opacity-50 disabled:hover:text-slate-400"
                      >
                        <Paperclip size={22} />
                      </button>

                      {isRecording ? (
                        <div className="flex-1 flex items-center justify-between bg-rose-50 border border-rose-200 rounded-full px-4 py-2">
                          <div className="flex items-center text-rose-600 font-bold w-20">
                            <div className={`w-2 h-2 rounded-full bg-rose-600 mr-2 ${!isRecordingPaused ? 'animate-pulse' : 'opacity-50'}`}></div>
                            {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={cancelRecording}
                              className="text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-100 p-1.5 rounded-full transition flex items-center justify-center h-8 w-8 shadow-sm border border-slate-200"
                              title="Cancel Recording"
                            >
                              <Trash2 size={16} />
                            </button>
                            
                            <button
                              type="button"
                              onClick={isRecordingPaused ? resumeRecording : pauseRecording}
                              className="text-slate-500 hover:text-amber-600 bg-white hover:bg-amber-100 p-1.5 rounded-full transition flex items-center justify-center h-8 w-8 shadow-sm border border-slate-200"
                              title={isRecordingPaused ? "Resume Recording" : "Pause Recording"}
                            >
                              {isRecordingPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
                            </button>

                            <button
                              type="button"
                              onClick={sendRecording}
                              className="bg-primary-600 hover:bg-primary-700 text-white p-1.5 rounded-full transition flex items-center justify-center h-8 w-8 shadow-sm"
                              title="Send Voice Message"
                            >
                              <Send size={14} className="ml-0.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={startRecording}
                            disabled={activeConsultation.status === 'completed'}
                            className="text-slate-400 hover:text-blue-600 p-2 mr-2 transition disabled:opacity-50 disabled:hover:text-slate-400"
                          >
                            <Mic size={22} />
                          </button>
                          
                          <form onSubmit={handleSendMessage} className="flex-1 flex items-center relative">
                            <input
                              type="text"
                              autoComplete="off"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder={activeConsultation.status === 'completed' ? t('consultations.chatClosed') : t('consultations.typeMessage')}
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
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fadeIn p-6">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                <Trash2 size={24} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Delete Messages?</h3>
            <p className="text-slate-600 text-sm text-center mb-6">Are you sure you want to delete {selectedMessages.size} selected message(s)?</p>

            <div className="space-y-3">
              <button
                onClick={() => { setDeleteMode('me'); handleDeleteMessages('me'); }}
                className="w-full py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg font-bold transition shadow-sm"
              >
                Delete for Me
              </button>

              {/* Delete for Everyone is only visible if all selected messages were sent by user AND within last 10 minutes.
                   We'll do a simple heuristic here: if any selected msg is not yours, disable it. */}
              {Array.from(selectedMessages).every(id => {
                const msg = messages.find(m => m.id === id);
                if (!msg) return false;
                if (msg.sender !== user.role) return false; // Must be sent by me
                // Check 10 min window (crudely using timestamp string comparison or roughly, here we just assume the API enforces it strictly)
                return true;
              }) && (
                  <button
                    onClick={() => { setDeleteMode('everyone'); handleDeleteMessages('everyone'); }}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition shadow-sm"
                  >
                    Delete for Everyone
                  </button>
                )}

              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Request Details Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Service Request Details</h3>
                <p className="text-xs text-slate-500 flex items-center">
                  Routed to: <User size={12} className="ml-1 mr-0.5" />
                  <span className="font-semibold text-slate-700">{selectedService.Specialist?.name || 'Unassigned Specialist'}</span>
                </p>
              </div>
              <button onClick={() => setSelectedService(null)} className="text-slate-400 hover:text-slate-800 transition"><X size={20} /></button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 flex flex-col">
              {/* Metadata & Edit capabilities */}
              <div className="bg-primary-50 p-4 border border-primary-100 rounded-xl mb-4 shrink-0">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-primary-800 uppercase text-lg">{selectedService.ServiceItem?.name}</h4>
                  </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Service Request Form Modal */}
      {showServiceForm && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800 flex items-center"><Activity className="mr-2 text-primary-600" size={20} /> Request Medical Service</h3>
              <button onClick={() => setShowServiceForm(false)} className="text-slate-500 hover:text-slate-800 font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleServiceRequestSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Service</label>
                <select
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  value={serviceRequestForm.service_item_id}
                  onChange={e => setServiceRequestForm({ ...serviceRequestForm, service_item_id: e.target.value })}
                >
                  <option value="" disabled>Select a service...</option>
                  {Array.from(new Set(availableServices.map(s => s.Category?.name))).map(catName => (
                    <optgroup key={catName} label={catName}>
                      {availableServices.filter(s => s.Category?.name === catName).map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.price} Birr)</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowServiceForm(false)} className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-bold shadow-sm">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prescribe Modal */}
      {showPrescribeModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-slate-800 flex items-center"><PlusCircle className="mr-2 text-purple-600" size={20} /> Prescribe Medication</h3>
              <button onClick={() => setShowPrescribeModal(false)} className="text-slate-500 hover:text-slate-800 font-bold text-xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 flex flex-col space-y-6">
              {/* Search Section */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Search Drug Database</label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    placeholder="Type to search (e.g., Amoxicillin)..."
                    value={drugSearchQuery}
                    onChange={e => handleSearchDrugs(e.target.value)}
                  />
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                </div>
                {drugSearchResults.length > 0 && (
                  <div className="mt-2 border border-slate-200 rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto absolute z-50 w-full max-w-xl">
                    {drugSearchResults.map(drug => (
                      <div key={drug.id} onClick={() => handleSelectDrug(drug)} className="p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition">
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-800">{drug.name}</span>
                          <span className="text-xs text-slate-500">{drug.dosage}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{drug.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Drugs */}
              <div>
                <h4 className="font-medium text-slate-700 mb-3 border-b border-slate-200 pb-2">Selected Medications</h4>
                {selectedDrugs.length === 0 ? (
                  <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
                    <p>No medications selected.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDrugs.map(drug => (
                      <div key={drug.id} className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex flex-col relative">
                        <button onClick={() => handleRemoveDrug(drug.id)} className="absolute top-2 right-2 text-rose-500 hover:bg-rose-100 p-1 rounded transition"><X size={16} /></button>
                        <h5 className="font-bold text-slate-800 mb-1 pr-6">{drug.name} <span className="font-normal text-slate-600 text-sm ml-2">({drug.dosage})</span></h5>
                        <p className="text-xs text-slate-600 mb-3 line-clamp-2">{drug.description}</p>
                        <textarea
                          rows="2"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                          placeholder="Optional: Custom instructions for the patient..."
                          value={drug.instructions}
                          onChange={e => handleUpdateDrugInstructions(drug.id, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3 shrink-0">
              <button type="button" onClick={() => setShowPrescribeModal(false)} className="px-5 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition font-medium">Cancel</button>
              <button type="button" onClick={handlePrescribeSubmit} disabled={selectedDrugs.length === 0 || isPrescribing} className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-bold shadow-sm disabled:opacity-50">
                {isPrescribing ? 'Prescribing...' : 'Confirm Prescription'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ isOpen: false, reqId: null })}
        onConfirm={executeDelete}
        title="Cancel Service Request"
        message="Are you sure you want to completely cancel and delete this service request? This action cannot be undone."
        confirmText="Delete"
        isDanger={true}
      />

      {/* Consultation Feedback Modal */}
      {consultFeedback.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-slate-800 mb-1">Rate Your Consultation</h3>
            <p className="text-sm text-slate-500 mb-6">
              How was your experience with Dr. {activeConsultation?.Doctor?.name || 'your doctor'}?
            </p>
            <div className="flex justify-center space-x-2 mb-6">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setConsultFeedback(prev => ({ ...prev, rating: star }))}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star size={36} className={consultFeedback.rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                </button>
              ))}
            </div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Comment (Optional)</label>
            <textarea
              value={consultFeedback.comment}
              onChange={e => setConsultFeedback(prev => ({ ...prev, comment: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg p-3 mb-6 min-h-[90px] resize-none focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="Share details of your experience..."
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConsultFeedback({ isOpen: false, rating: 0, comment: '', submitting: false })}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition"
              >Cancel</button>
              <button
                onClick={handleSubmitConsultFeedback}
                disabled={consultFeedback.submitting || consultFeedback.rating === 0}
                className="px-6 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition"
              >
                {consultFeedback.submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Consultations;
