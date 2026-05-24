import React, { useState, useEffect, useContext, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import io from 'socket.io-client';
import { TRIAGE_REASONS, triageRoute, SPECIALTY_FEE_KEYS } from '../utils/triageRules';

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

  // Referral flow state
  const [referralInfo, setReferralInfo] = useState(null);
  const [loadingReferral, setLoadingReferral] = useState(false);

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
  const [allFees, setAllFees] = useState({});
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // New consultation form state
  const [newConsultation, setNewConsultation] = useState({
    reason: '',
    symptoms_description: '',
    consultation_type: 'gp',
    target_specialty: '',
  });
  // Triage state
  const [triageStep, setTriageStep] = useState('reason'); // 'reason' | 'confirm'
  const [triageReasonKey, setTriageReasonKey] = useState('');
  const [triageResult, setTriageResult] = useState(null); // { doctorType, specialty, routingNote }
  const [triageOverrideGP, setTriageOverrideGP] = useState(false);

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
  const [counselingNotes, setCounselingNotes] = useState(['']);
  const [isPrescribing, setIsPrescribing] = useState(false);
  
  const [modalConfig, setModalConfig] = useState({ isOpen: false, reqId: null });

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
      // Build a map of all fee settings for the new consultation form preview
      const feeMap = {};
      settingsRes.data.forEach(s => { feeMap[s.key] = s.value; });
      setAllFees(feeMap);
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
      setLoadingReferral(true);
      api.get(`/consultations/${activeChatId}/referral`)
        .then(res => {
          setReferralInfo(res.data);
        })
        .catch(err => {
          setReferralInfo(null);
        })
        .finally(() => {
          setLoadingReferral(false);
        });
    } else {
      setReferralInfo(null);
    }
  }, [activeChatId]);

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
      setNewConsultation({ reason: '', symptoms_description: '', consultation_type: 'gp', target_specialty: '' });
      setTriageStep('reason');
      setTriageReasonKey('');
      setTriageResult(null);
      setTriageOverrideGP(false);
      fetchConsultations();

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

      // Notify patient chat once
      socket.emit('send_message', {
        consultation_id: activeChatId,
        sender_id: user.id,
        message: `Medical Service Requested: ${item?.name}\nInstructions: ${serviceRequestForm.instructions || 'None'}`,
        chat_type: 'patient'
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
    const filledNotes = counselingNotes.filter(n => n.trim());
    if (selectedDrugs.length === 0 && filledNotes.length === 0 || !activeChatId) return;
    setIsPrescribing(true);
    try {
      await api.post('/prescriptions', {
        consultation_id: activeChatId,
        patient_id: activeConsultation.patient_id,
        drugs: selectedDrugs.map(d => ({ drug_id: d.id, instructions: d.instructions })),
        counseling_notes: filledNotes,
      });
      toast.success('Prescription created successfully!');
      setShowPrescribeModal(false);
      setSelectedDrugs([]);
      setCounselingNotes(['']);
      // Refresh prescriptions
      const res = await api.get(`/prescriptions/consultation/${activeChatId}`);
      setPrescriptions(res.data);

      const parts = [];
      if (selectedDrugs.length > 0) parts.push(`${selectedDrugs.length} medication(s)`);
      if (filledNotes.length > 0) parts.push(`${filledNotes.length} counseling note(s)`);
      socket.emit('send_message', {
        consultation_id: activeChatId,
        sender_id: user.id,
        message: `Prescribed ${parts.join(' and ')}. Please check your prescription details.`,
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

        {/* NEW CONSULTATION FORM — Triage System */}
        {showNewForm ? (
          <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
            <div className="mb-6 text-center">
              <div className="mx-auto bg-primary-100 text-primary-600 w-14 h-14 rounded-full flex items-center justify-center mb-3">
                <Activity size={28} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">New Consultation</h2>
              <p className="text-slate-500 text-sm mt-1">Tell us your reason for visiting so we can route you to the right doctor.</p>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${triageStep === 'reason' ? 'bg-primary-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                {triageStep !== 'reason' ? '✓' : '1'} Reason for Visit
              </div>
              <div className="flex-1 h-px bg-slate-200" />
              <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${triageStep === 'confirm' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                2 Confirm &amp; Submit
              </div>
            </div>

            {triageStep === 'reason' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <label className="block text-sm font-bold text-slate-700 mb-3">Reason for Visit <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-1 gap-2">
                    {TRIAGE_REASONS.map(reason => (
                      <button key={reason.key} type="button" onClick={() => setTriageReasonKey(reason.key)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-all ${triageReasonKey === reason.key ? 'border-primary-500 bg-primary-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}>
                        <span className="text-2xl w-8 text-center shrink-0">{reason.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${triageReasonKey === reason.key ? 'text-primary-700' : 'text-slate-800'}`}>{reason.label}</p>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{reason.description}</p>
                        </div>
                        {triageReasonKey === reason.key && (
                          <span className="shrink-0 w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="button" disabled={!triageReasonKey}
                    onClick={() => {
                      const result = triageRoute(triageReasonKey);
                      setTriageResult(result);
                      setTriageOverrideGP(false);
                      const selectedReason = TRIAGE_REASONS.find(r => r.key === triageReasonKey);
                      setNewConsultation(prev => ({ ...prev, reason: selectedReason?.label || '', consultation_type: result.doctorType, target_specialty: result.specialty || '' }));
                      setTriageStep('confirm');
                    }}
                    className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {triageStep === 'confirm' && triageResult && (
              <form onSubmit={handleSubmitConsultation} className="space-y-4">
                {/* Recommendation card */}
                {(() => {
                  const selectedReason = TRIAGE_REASONS.find(r => r.key === triageReasonKey);
                  const isGP = triageOverrideGP || triageResult.doctorType === 'gp';
                  const displaySpecialty = isGP ? 'General Practitioner' : triageResult.specialty;
                  const isSpecialist = !isGP && triageResult.doctorType === 'specialist';
                  return (
                    <div className={`rounded-xl border-2 p-5 ${isSpecialist ? 'border-indigo-300 bg-indigo-50' : 'border-primary-300 bg-primary-50'}`}>
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{selectedReason?.emoji}</span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Reason for Visit</p>
                          <p className="font-bold text-slate-800 text-sm">{selectedReason?.label}</p>
                        </div>
                      </div>
                      <div className={`mt-4 pt-4 border-t ${isSpecialist ? 'border-indigo-200' : 'border-primary-200'}`}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Recommended Doctor</p>
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-full ${isSpecialist ? 'bg-indigo-100' : 'bg-primary-100'}`}>
                            <span className="text-xl">{isSpecialist ? '👨‍⚕️' : '🩺'}</span>
                          </div>
                          <div>
                            <p className={`font-bold text-base ${isSpecialist ? 'text-indigo-700' : 'text-primary-700'}`}>{displaySpecialty}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{triageOverrideGP ? 'You chose to see a General Practitioner instead.' : triageResult.routingNote}</p>
                          </div>
                        </div>
                      </div>
                      {triageResult.doctorType === 'specialist' && (
                        <div className="mt-4 pt-3 border-t border-dashed border-slate-300">
                          {!triageOverrideGP ? (
                            <button type="button"
                              onClick={() => { setTriageOverrideGP(true); setNewConsultation(prev => ({ ...prev, consultation_type: 'gp', target_specialty: '' })); }}
                              className="text-xs text-slate-500 hover:text-primary-600 font-medium underline underline-offset-2 transition">
                              I'd prefer to see a General Practitioner instead
                            </button>
                          ) : (
                            <button type="button"
                              onClick={() => { setTriageOverrideGP(false); setNewConsultation(prev => ({ ...prev, consultation_type: triageResult.doctorType, target_specialty: triageResult.specialty || '' })); }}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2 transition">
                              ↩ Go back to recommended {triageResult.specialty}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Symptoms textarea */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Describe your symptoms <span className="ml-1 text-xs font-normal text-slate-400">(optional)</span>
                  </label>
                  <p className="text-xs text-slate-400 mb-3">This helps the doctor prepare. It is not used for routing.</p>
                  <textarea rows={4}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50 resize-none text-sm"
                    placeholder="e.g. I've had a persistent headache for 3 days, mild fever, and fatigue…"
                    value={newConsultation.symptoms_description}
                    onChange={e => setNewConsultation(prev => ({ ...prev, symptoms_description: e.target.value }))} />
                </div>

                {/* Fee preview */}
                {(() => {
                  const isGP = triageOverrideGP || triageResult.doctorType === 'gp';
                  const specialty = isGP ? 'General Practitioner' : triageResult.specialty;
                  const feeKey = SPECIALTY_FEE_KEYS[specialty] || 'fee_gp';
                  const feeAmount = allFees[feeKey] || allFees['consultation_fee'] || '100';
                  return (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Consultation Fee</p>
                        <p className="text-xs text-emerald-600 mt-0.5">{specialty} · per consultation</p>
                      </div>
                      <span className="text-2xl font-bold text-emerald-700">{Number(feeAmount).toLocaleString()} <span className="text-base font-semibold">ETB</span></span>
                    </div>
                  );
                })()}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <button type="button"
                    onClick={() => { setTriageStep('reason'); setTriageResult(null); setTriageOverrideGP(false); }}
                    className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 transition">
                    ← Change reason
                  </button>
                  <div className="flex gap-3">
                    <button type="button"
                      onClick={() => { setShowNewForm(false); setTriageStep('reason'); setTriageReasonKey(''); setTriageResult(null); setTriageOverrideGP(false); setNewConsultation({ reason: '', symptoms_description: '', consultation_type: 'gp', target_specialty: '' }); }}
                      className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition">
                      Cancel
                    </button>
                    <button type="submit"
                      className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm shadow-sm transition">
                      Request Consultation
                    </button>
                  </div>
                </div>
              </form>
            )}
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
                {(!activeConsultation.Payment || activeConsultation.Payment.status === 'verified') && (
                  <button
                    onClick={handleStartVideoCall}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-full font-bold text-xs transition shadow-sm"
                  >
                    <Video size={16} /> <span>{t('consultations.videoCall')}</span>
                  </button>
                )}
                {(!activeConsultation.Payment || activeConsultation.Payment.status === 'verified') && user.role === 'doctor' && (
                  <>
                    <button
                      onClick={() => setShowServiceForm(true)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-full font-bold text-xs transition shadow-sm"
                    >
                      <Activity size={16} /> <span>Request Service</span>
                    </button>
                    <button
                      onClick={() => setShowPrescribeModal(true)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-full font-bold text-xs transition shadow-sm"
                    >
                      <PlusCircle size={16} /> <span>Prescribe</span>
                    </button>
                  </>
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
                  referralInfo ? (
                    <div className="max-w-xl w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-100 flex flex-col gap-6">
                      {/* Header */}
                      <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                        <div>
                          <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-full inline-block
                            ${referralInfo.referral?.urgency === 'emergency' ? 'bg-red-50 text-red-600 border border-red-200' :
                              referralInfo.referral?.urgency === 'urgent' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                              'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                            {referralInfo.referral?.urgency || 'routine'} Urgency
                          </span>
                          <h3 className="text-xl font-extrabold text-slate-800 mt-2">Specialist Referral</h3>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400">Date</span>
                          <p className="text-sm font-semibold text-slate-700">{referralInfo.referral?.created_at ? new Date(referralInfo.referral.created_at).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>

                      {/* Doctor Card */}
                      <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-md shrink-0">
                          {referralInfo.referral?.Specialist?.name?.charAt(0) || 'S'}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Assigned Specialist</p>
                          <p className="font-bold text-slate-800">Dr. {referralInfo.referral?.Specialist?.name || 'TBD'}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{referralInfo.referral?.specialty} Specialty</p>
                        </div>
                        {referralInfo.referral?.Specialist && (
                          <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-center shadow-sm">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Room</p>
                            <p className="font-extrabold text-slate-800 text-sm">
                              {referralInfo.referral?.Specialist?.room_number || referralInfo.referral?.Specialist?.work_location || 'N/A'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* GP Summary */}
                      <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl">
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">GP Referral Summary</p>
                        <p className="text-sm text-slate-700 italic">"{referralInfo.referral?.referral_note}"</p>
                      </div>

                      {/* Pricing Details */}
                      <div className="border border-slate-100 rounded-xl p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Standard Specialist Fee</span>
                          <span className="font-semibold text-slate-700">
                            {Number(referralInfo.referral?.remaining_payment || 0) + Number(referralInfo.referral?.discount_amount || 0)} ETB
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-emerald-600 font-medium">
                          <span>Referral Discount (20%)</span>
                          <span>-{referralInfo.referral?.discount_amount || 0} ETB</span>
                        </div>
                        <div className="h-px bg-slate-100 my-1" />
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800">Remaining Payment</span>
                          <span className="text-2xl font-black text-primary-600">{referralInfo.referral?.remaining_payment || 0} ETB</span>
                        </div>
                      </div>

                      {/* Stepper Timeline */}
                      <div className="flex items-center gap-1.5 py-2">
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">✓</div>
                          <span className="text-xs font-semibold text-slate-600">GP Consult</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-emerald-500" />
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">✓</div>
                          <span className="text-xs font-semibold text-slate-600">Referral</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-slate-200" />
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">3</div>
                          <span className="text-xs font-semibold text-indigo-600">Pay</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-slate-200" />
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold flex items-center justify-center">4</div>
                          <span className="text-xs font-semibold text-slate-400">Unlock</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 mt-2">
                        {activeConsultation.Payment?.status === 'pending' && activeConsultation.Payment?.chapa_tx_ref ? (
                          <button
                            onClick={handleCheckPaymentStatus}
                            disabled={isSubmittingPayment}
                            className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl transition text-sm flex items-center justify-center gap-2"
                          >
                            <Clock size={16} className="text-amber-500" />
                            {isSubmittingPayment ? 'Verifying...' : 'Check Payment Status'}
                          </button>
                        ) : (
                          <button
                            onClick={handleChapaPayment}
                            disabled={isSubmittingPayment}
                            className="flex-1 py-3 bg-[#00A859] text-white hover:bg-[#00904d] font-extrabold rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-md"
                          >
                            <CreditCard size={16} />
                            {isSubmittingPayment ? 'Connecting...' : 'Pay Remaining Amount'}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
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
                                : "A one-time consultation fee is required to connect with your assigned doctor. Pay to unlock the chat for this consultation."}
                          </p>

                          {activeConsultation.Payment?.status === 'failed' && activeConsultation.Payment?.admin_notes && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm border border-red-100 text-center">
                              <strong>{t('consultations.reason')}</strong> {activeConsultation.Payment.admin_notes}
                            </div>
                          )}

                          <div className="space-y-5 mt-4">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-between items-center">
                              <div>
                                <span className="font-bold text-slate-900 text-lg">Consultation Fee</span>
                                {activeConsultation.consultation_type === 'specialist' && activeConsultation.target_specialty && (
                                  <p className="text-xs text-indigo-600 font-medium mt-0.5">{activeConsultation.target_specialty} Specialist</p>
                                )}
                                {activeConsultation.consultation_type === 'gp' && (
                                  <p className="text-xs text-primary-600 font-medium mt-0.5">General Practitioner</p>
                                )}
                              </div>
                              <span className="font-bold text-primary-600 text-xl">
                                {activeConsultation.Payment?.amount
                                  ? Number(activeConsultation.Payment.amount).toLocaleString()
                                  : globalConsultationFee} Birr
                              </span>
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
                  )
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
              <div className="flex-1 flex bg-slate-50 relative overflow-hidden h-full">
                <div className="flex-1 flex flex-col h-full relative overflow-hidden">
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
                          <h4 className="font-semibold text-slate-700 mb-2 border-b border-slate-100 pb-2">Prescription</h4>
                          <div className="space-y-3">
                            {prescriptions.map(p => (
                              p.entry_type === 'counseling' ? (
                                /* Counseling note entry */
                                <div key={p.id} className="bg-teal-50 p-3 rounded border border-teal-100">
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">Psychological Counseling</span>
                                    <span className="text-[10px] text-slate-500">{new Date(p.created_at).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-sm text-slate-700 mt-2 leading-relaxed">{p.counseling_note}</p>
                                  <p className="text-xs text-slate-400 mt-2">— Dr. {p.Doctor?.name}</p>
                                </div>
                              ) : (
                                /* Medication entry */
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
                              )
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

                {/* Referral Context Sidebar (for Doctors only) */}
                {user.role === 'doctor' && referralInfo && (
                  <div className="w-80 border-l border-slate-200 bg-white flex flex-col h-full z-20 shrink-0">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                      <Info size={18} className="text-indigo-600" />
                      <h4 className="font-bold text-slate-800 text-sm">Referral Patient Context</h4>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {/* Summary */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Referral Priority</span>
                        <div>
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full capitalize
                            ${referralInfo.referral?.urgency === 'emergency' ? 'bg-red-100 text-red-700' :
                              referralInfo.referral?.urgency === 'urgent' ? 'bg-amber-100 text-amber-700' :
                              'bg-emerald-100 text-emerald-700'}`}>
                            {referralInfo.referral?.urgency || 'routine'} Urgency
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">GP Notes / Reasons</span>
                        <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-100 italic">
                          "{referralInfo.referral?.referral_note}"
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Referred By</span>
                        <p className="text-sm font-semibold text-slate-800">Dr. {referralInfo.referral?.GP?.name || 'Unknown GP'}</p>
                        <p className="text-xs text-slate-500">General Practitioner</p>
                      </div>

                      {/* Lab/Radiology results from GP consultation */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Lab & Radiology Results</span>
                        {referralInfo.serviceRequests && referralInfo.serviceRequests.length > 0 ? (
                          <div className="space-y-2">
                            {referralInfo.serviceRequests.map(req => (
                              <div key={req.id} className="bg-slate-50 border border-slate-200 p-2.5 rounded text-xs">
                                <div className="flex justify-between items-center font-bold text-slate-800 mb-1">
                                  <span>{req.ServiceItem?.name}</span>
                                  <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded-full ${req.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {req.status}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">Instructions: {req.instructions || 'None'}</p>
                                {req.status === 'completed' && req.result_file_url && (
                                  <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
                                    {req.result_notes && <p className="text-[10px] text-slate-600 italic">Notes: "{req.result_notes}"</p>}
                                    <a
                                      href={`${api.defaults.baseURL?.replace(/\/api$/, '') || 'http://localhost:5000'}${req.result_file_url}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="font-bold text-primary-600 hover:underline inline-flex items-center gap-1 mt-1 text-[11px]"
                                    >
                                      View Completed Report
                                    </a>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No lab or radiology requests ordered during GP consultation.</p>
                        )}
                      </div>
                    </div>
                  </div>
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
              <h3 className="font-bold text-lg text-slate-800 flex items-center"><PlusCircle className="mr-2 text-purple-600" size={20} /> Prescription &amp; Counseling</h3>
              <button onClick={() => { setShowPrescribeModal(false); setCounselingNotes(['']); }} className="text-slate-500 hover:text-slate-800 font-bold text-xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 flex flex-col space-y-6">

              {/* ── Medication Section ── */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">Medications</span>
                </h4>
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

                <div className="mt-4">
                  {selectedDrugs.length === 0 ? (
                    <div className="text-center p-5 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
                      No medications selected yet.
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

              {/* ── Psychological Counseling Notes Section ── */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">Psychological Counseling Notes</span>
                  <span className="text-xs text-slate-400 font-normal">Optional — for mental health guidance, therapy recommendations, or behavioral advice</span>
                </h4>
                <div className="space-y-3">
                  {counselingNotes.map((note, idx) => (
                    <div key={idx} className="relative">
                      <textarea
                        rows="3"
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 bg-teal-50 resize-none"
                        placeholder={`e.g. Recommend weekly CBT sessions, practice mindfulness exercises daily, avoid stressful environments...`}
                        value={note}
                        onChange={e => {
                          const updated = [...counselingNotes];
                          updated[idx] = e.target.value;
                          setCounselingNotes(updated);
                        }}
                      />
                      {counselingNotes.length > 1 && (
                        <button
                          onClick={() => setCounselingNotes(counselingNotes.filter((_, i) => i !== idx))}
                          className="absolute top-2 right-2 text-rose-400 hover:bg-rose-100 p-1 rounded transition"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCounselingNotes([...counselingNotes, ''])}
                    className="text-xs text-teal-600 hover:text-teal-800 font-semibold flex items-center gap-1 transition"
                  >
                    <PlusCircle size={14} /> Add another counseling note
                  </button>
                </div>
              </div>

            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3 shrink-0">
              <button type="button" onClick={() => { setShowPrescribeModal(false); setCounselingNotes(['']); }} className="px-5 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition font-medium">Cancel</button>
              <button
                type="button"
                onClick={handlePrescribeSubmit}
                disabled={(selectedDrugs.length === 0 && counselingNotes.every(n => !n.trim())) || isPrescribing}
                className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-bold shadow-sm disabled:opacity-50"
              >
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
