import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { UserPlus, Eye, EyeOff, Mail, Phone, ShieldCheck, RefreshCw, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import LiveSelfie from '../components/LiveSelfie';

const Register = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'patient',
    phone_number: '', age: '', sex: '',
    document: null, selfie: null, id_document: null, degree_document: null, experience_document: null,
    license_number: '', license_issuing_authority: '', license_expiry_date: '',
    specialty: '',
    degree: '', university_name: '', graduation_year: '', current_workplace: '', experience_years: ''
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [idDocumentName, setIdDocumentName] = useState('');
  const [degreeDocumentName, setDegreeDocumentName] = useState('');
  const [experienceDocumentName, setExperienceDocumentName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Verification state
  // verifyMethod: 'email' | 'sms'
  // verifyStep: 'idle' | 'otp' | 'verified'
  const [verifyMethod, setVerifyMethod] = useState('email');
  const [smsPhone, setSmsPhone] = useState('');
  const [verifyStep, setVerifyStep] = useState('idle');
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);


  const handleChange = (e) => {
    if (e.target.name === 'document' || e.target.name === 'id_document' || e.target.name === 'degree_document' || e.target.name === 'experience_document') {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) { setError('File size must be less than 5MB'); return; }
        setFormData({ ...formData, [e.target.name]: file });
        
        if (e.target.name === 'document') {
            setDocumentName(file.name);
            setDocumentType(file.type);
            setDocumentPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
        } else if (e.target.name === 'id_document') {
            setIdDocumentName(file.name);
        } else if (e.target.name === 'degree_document') {
            setDegreeDocumentName(file.name);
        } else if (e.target.name === 'experience_document') {
            setExperienceDocumentName(file.name);
        }
      }
    } else if (e.target.name === 'selfie') {
      // selfie is now captured via LiveSelfie component — ignore file input path
    } else {
      // Reset verification if the verified identifier changes
      if (e.target.name === 'email' && verifyStep !== 'idle' && verifyMethod === 'email') {
        setVerifyStep('idle');
        setOtpValue('');
        setOtpError('');
      }
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
    if (e.target.name === 'role') {
        setCurrentStep(1); // Reset step if role changes
    }
  };

  const nextStep = () => {
    setError('');
    if (currentStep === 1) {
        if (!formData.name || !formData.age || !formData.sex || !formData.password || formData.password.length < 8) {
            setError('Please fill all required basic fields correctly.');
            return;
        }
    }
    if (currentStep === 2 && formData.role === 'doctor') {
        if (verifyStep !== 'verified') {
            setError('Doctors must verify identity before proceeding.');
            return;
        }
        if (!formData.id_document || !formData.selfie) {
            setError('National ID and live selfie are required.');
            return;
        }
    }
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const removeDocument = () => {
    setFormData({ ...formData, document: null });
    setDocumentPreview(null);
    setDocumentName('');
    setDocumentType('');
  };

  // ── Start cooldown timer ──────────────────────────────────────────────────
  const startCooldown = () => {
    setOtpCooldown(60);
    const timer = setInterval(() => {
      setOtpCooldown(prev => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; });
    }, 1000);
  };

  // ── Switch verification method ────────────────────────────────────────────
  const switchMethod = (method) => {
    setVerifyMethod(method);
    setVerifyStep('idle');
    setOtpValue('');
    setOtpError('');
    setSmsPhone('');
  };

  // ── Send OTP (email or SMS) ───────────────────────────────────────────────
  const handleSendOtp = async () => {
    setOtpError('');
    setSendingOtp(true);
    try {
      if (verifyMethod === 'email') {
        if (!formData.email) { setOtpError('Please enter your email address first.'); setSendingOtp(false); return; }
        await api.post('/auth/send-verification', { email: formData.email });
      } else {
        if (!smsPhone) { setOtpError('Please enter your phone number first.'); setSendingOtp(false); return; }
        const phoneRegex = /^\+[1-9]\d{6,14}$/;
        if (!phoneRegex.test(smsPhone.replace(/\s/g, ''))) {
          setOtpError('Enter a valid phone number with country code, e.g. +251911234567');
          setSendingOtp(false);
          return;
        }
        await api.post('/auth/send-verification-sms', { phone: smsPhone });
        // Sync the verified phone into formData
        setFormData(prev => ({ ...prev, phone_number: smsPhone.replace(/\s/g, '') }));
      }
      setVerifyStep('otp');
      setOtpValue('');
      startCooldown();
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setSendingOtp(false);
    }
  };

  // ── Verify OTP ────────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    setOtpError('');
    if (!otpValue || otpValue.length !== 6) { setOtpError('Please enter the 6-digit code.'); return; }
    setVerifyingOtp(true);
    try {
      const identifier = verifyMethod === 'email' ? formData.email : smsPhone.replace(/\s/g, '');
      await api.post('/auth/verify-otp', { identifier, otp: otpValue });
      setVerifyStep('verified');
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ── Reset verification ────────────────────────────────────────────────────
  const resetVerification = () => {
    setVerifyStep('idle');
    setOtpValue('');
    setOtpError('');
  };

  // ── Final Submit ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (/\d/.test(formData.name)) { setError('Name cannot contain numbers.'); return; }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters long.'); return; }
    if (verifyStep !== 'verified') { setError('Please verify your identity before registering.'); return; }
    if (formData.role === 'doctor' && !formData.selfie) { setError('Please capture a live photo for identity verification.'); return; }
    if (formData.role === 'doctor' && !formData.specialty) { setError('Please select your medical specialty.'); return; }

    setLoading(true);
    try {
      await register(formData);
      if (formData.role === 'doctor') {
        // Doctors are pending admin review — show them a holding page
        navigate('/pending-verification');
      } else {
        await login(formData.email, formData.password);
        navigate('/patient');
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-full mt-10 mb-10">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border-t-4 border-primary-500 relative overflow-hidden">

        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary-50 to-primary-100 -z-0 rounded-t-lg"></div>

        <div className="relative z-10 text-center mb-6 mt-4">
          <div className="bg-primary-500 text-white p-3 rounded-full inline-block mb-3 shadow-md">
            <UserPlus size={28} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">{t('auth.register.title')}</h2>
          <p className="text-slate-500 text-sm mt-1">{t('auth.register.subtitle')}</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm font-medium border border-red-200">{error}</div>}

        <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
          {/* Progress Indicator for Doctors */}
          {formData.role === 'doctor' && (
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-200">
              <div className={`text-xs font-semibold px-2 py-1 rounded-full ${currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1. Basic</div>
              <div className={`h-0.5 flex-1 mx-1 ${currentStep >= 2 ? 'bg-primary-600' : 'bg-slate-200'}`}></div>
              <div className={`text-xs font-semibold px-2 py-1 rounded-full ${currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2. Identity</div>
              <div className={`h-0.5 flex-1 mx-1 ${currentStep >= 3 ? 'bg-primary-600' : 'bg-slate-200'}`}></div>
              <div className={`text-xs font-semibold px-2 py-1 rounded-full ${currentStep >= 3 ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3. Professional</div>
            </div>
          )}

          {/* STEP 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.nameLabel')}</label>
                <input type="text" name="name"
                  className="w-full border-slate-300 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                  value={formData.name} onChange={handleChange} required placeholder={t('auth.register.namePlaceholder')} />
              </div>
              <div className="flex space-x-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.ageLabel')}</label>
                  <input type="number" name="age"
                    className="w-full border-slate-300 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                    value={formData.age} onChange={handleChange} required min="0" placeholder="e.g. 25" />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.sexLabel')}</label>
                  <select name="sex"
                    className="w-full border-slate-300 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white"
                    value={formData.sex} onChange={handleChange} required>
                    <option value="" disabled></option>
                    <option value="Male">{t('auth.register.male')}</option>
                    <option value="Female">{t('auth.register.female')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.login.passwordLabel')}</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} name="password"
                    className="w-full border-slate-300 border rounded-md p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                    value={formData.password} onChange={handleChange} required placeholder={t('auth.login.passwordPlaceholder')} />
                  <button type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                    onClick={() => setShowPassword(!showPassword)} tabIndex="-1">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.amA')}</label>
                <select name="role"
                  className="w-full border-slate-300 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white"
                  value={formData.role} onChange={handleChange}>
                  <option value="patient">{t('auth.register.patient')}</option>
                  <option value="doctor">{t('auth.register.doctor')}</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: Identity & Contact (For Doctors) or Patient Default */}
          {((currentStep === 2 && formData.role === 'doctor') || (currentStep === 1 && formData.role === 'patient')) && (
            <div className={`space-y-4 ${currentStep === 2 ? 'animate-fadeIn' : ''}`}>
              {formData.role === 'doctor' && <h3 className="font-semibold text-slate-700 text-sm pb-2 border-b border-slate-200">Identity Verification</h3>}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Contact Verification</label>

                {/* Method toggle — only shown before verification is complete */}
                {verifyStep !== 'verified' && (
                  <div className="flex rounded-lg border border-slate-200 overflow-hidden mb-3 text-sm font-semibold">
                    <button
                      type="button"
                      onClick={() => switchMethod('email')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 transition ${verifyMethod === 'email' ? 'bg-primary-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                    >
                      <Mail size={14} /> Email
                    </button>
                    <button
                      type="button"
                      onClick={() => switchMethod('sms')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 transition ${verifyMethod === 'sms' ? 'bg-primary-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                    >
                      <Phone size={14} /> SMS
                    </button>
                  </div>
                )}

                {/* Email method */}
                {verifyMethod === 'email' && verifyStep !== 'verified' && (
                  <div className="flex gap-2 mb-2">
                    <input
                      type="email" name="email"
                      className={`flex-1 border rounded-md p-3 focus:outline-none text-sm ${verifyStep === 'otp' ? 'border-blue-300 bg-blue-50' : 'border-slate-300'}`}
                      value={formData.email} onChange={handleChange} required
                      placeholder={t('auth.register.emailPlaceholder')}
                      disabled={verifyStep === 'otp'}
                    />
                    {verifyStep === 'idle' && (
                      <button type="button" onClick={handleSendOtp} disabled={sendingOtp || !formData.email}
                        className="shrink-0 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-3 py-2 rounded-md transition disabled:opacity-50 flex items-center gap-1">
                        {sendingOtp ? <RefreshCw size={13} className="animate-spin" /> : <Mail size={13} />}
                        {sendingOtp ? 'Sending…' : 'Send Code'}
                      </button>
                    )}
                  </div>
                )}

                {/* SMS method */}
                {verifyMethod === 'sms' && verifyStep !== 'verified' && (
                  <div className="flex gap-2 mb-2">
                    <input
                      type="tel"
                      className={`flex-1 border rounded-md p-3 focus:outline-none text-sm ${verifyStep === 'otp' ? 'border-blue-300 bg-blue-50' : 'border-slate-300'}`}
                      value={smsPhone}
                      onChange={e => setSmsPhone(e.target.value)}
                      placeholder="+251911234567"
                      disabled={verifyStep === 'otp'}
                    />
                    {verifyStep === 'idle' && (
                      <button type="button" onClick={handleSendOtp} disabled={sendingOtp || !smsPhone}
                        className="shrink-0 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-3 py-2 rounded-md transition disabled:opacity-50 flex items-center gap-1">
                        {sendingOtp ? <RefreshCw size={13} className="animate-spin" /> : <Phone size={13} />}
                        {sendingOtp ? 'Sending…' : 'Send Code'}
                      </button>
                    )}
                  </div>
                )}

                {/* Verified badge */}
                {verifyStep === 'verified' && (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 mb-2">
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                      <ShieldCheck size={18} />
                      {verifyMethod === 'email' ? formData.email : smsPhone} verified
                    </div>
                    <button type="button" onClick={resetVerification} className="text-xs text-slate-400 hover:text-slate-600 underline">Change</button>
                  </div>
                )}

                {/* OTP entry box */}
                {verifyStep === 'otp' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-700 mb-2 font-medium flex items-center gap-1">
                      {verifyMethod === 'email' ? <Mail size={12} /> : <Phone size={12} />}
                      Code sent to <strong>{verifyMethod === 'email' ? formData.email : smsPhone}</strong>
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text" inputMode="numeric" maxLength={6}
                        className="flex-1 border border-blue-300 rounded-md p-2.5 text-center text-lg font-bold tracking-widest focus:outline-none"
                        placeholder="000000" value={otpValue}
                        onChange={e => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        autoFocus
                      />
                      <button type="button" onClick={handleVerifyOtp} disabled={verifyingOtp || otpValue.length !== 6}
                        className="shrink-0 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold px-4 rounded-md transition disabled:opacity-50">
                        {verifyingOtp ? 'Checking…' : 'Confirm'}
                      </button>
                    </div>
                    {otpError && <p className="text-red-600 text-xs mt-2 font-medium">{otpError}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <button type="button" onClick={resetVerification} className="text-xs text-slate-500 hover:underline">
                        Change {verifyMethod === 'email' ? 'email' : 'phone'}
                      </button>
                      {otpCooldown > 0 ? (
                        <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={11} /> Resend in {otpCooldown}s</span>
                      ) : (
                        <button type="button" onClick={handleSendOtp} disabled={sendingOtp} className="text-xs text-primary-600 hover:underline font-medium">
                          Resend code
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {otpError && verifyStep === 'idle' && <p className="text-red-600 text-xs mt-1 font-medium">{otpError}</p>}

                {/* Optional phone field when using email method (so they can still save a phone number) */}
                {verifyMethod === 'email' && verifyStep === 'verified' && (
                  <input type="tel" name="phone_number"
                    className="w-full border-slate-300 border rounded-md p-3 focus:outline-none text-sm transition mt-2"
                    value={formData.phone_number} onChange={handleChange}
                    placeholder="Phone Number (Optional)" />
                )}

                {/* Email field shown as read-only info when SMS was used */}
                {verifyMethod === 'sms' && verifyStep === 'verified' && (
                  <input type="email" name="email"
                    className="w-full border-slate-300 border rounded-md p-3 focus:outline-none text-sm transition mt-2"
                    value={formData.email} onChange={handleChange} required
                    placeholder={t('auth.register.emailPlaceholder')} />
                )}
              </div>

              {formData.role === 'doctor' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Government ID (National ID/Passport)</label>
                    <input type="file" name="id_document" accept=".pdf,.jpg,.jpeg,.png"
                      className="w-full border-slate-300 border text-sm rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white"
                      onChange={handleChange} required />
                      {idDocumentName && <p className="text-xs text-emerald-600 mt-1">✓ {idDocumentName}</p>}
                  </div>
                  <LiveSelfie
                    captured={!!formData.selfie}
                    onCapture={file => setFormData(prev => ({ ...prev, selfie: file }))}
                    onClear={() => setFormData(prev => ({ ...prev, selfie: null }))}
                  />
                </>
              )}
            </div>
          )}

          {/* STEP 3: Professional Credentials (Doctors Only) */}
          {currentStep === 3 && formData.role === 'doctor' && (
            <div className="space-y-4 animate-fadeIn bg-slate-50 p-4 rounded-md border border-slate-200">

              {/* Specialty selection — top of step 3 */}
              <h3 className="font-semibold text-slate-700 text-sm pb-2 border-b border-slate-200">Specialization</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Medical Specialty <span className="text-red-500">*</span>
                </label>
                <select
                  name="specialty"
                  required
                  value={formData.specialty}
                  onChange={handleChange}
                  className="w-full border-slate-300 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white"
                >
                  <option value="" disabled>Select your specialty…</option>
                  <option value="General Practitioner">General Practitioner (GP)</option>
                  <optgroup label="Specialists">
                    <option value="Psychiatrist">Psychiatrist</option>
                    <option value="Dermatologist">Dermatologist</option>
                    <option value="Cardiologist">Cardiologist</option>
                    <option value="Internal Medicine">Internal Medicine</option>
                    <option value="Pediatrician">Pediatrician</option>
                    <option value="Gynecologist">Gynecologist</option>
                    <option value="Pulmonologist">Pulmonologist</option>
                    <option value="Neurologist">Neurologist</option>
                    <option value="Orthopedic">Orthopedic</option>
                  </optgroup>
                </select>
                {formData.specialty && (
                  <p className="text-xs text-emerald-600 mt-1 font-medium">
                    ✓ {formData.specialty === 'General Practitioner' ? 'You will handle initial patient consultations and referrals.' : `You will receive direct and GP-referred ${formData.specialty} consultations.`}
                  </p>
                )}
              </div>

              <h3 className="font-semibold text-slate-700 text-sm pb-2 border-b border-slate-200">Medical License</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.licenseNumber')}</label>
                  <input type="text" name="license_number" className="w-full border-slate-300 border rounded-md p-2 focus:outline-none transition" value={formData.license_number} onChange={handleChange} required placeholder="MED12345XYZ" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.licenseExpiry')}</label>
                  <input type="date" name="license_expiry_date" className="w-full border-slate-300 border rounded-md p-2 focus:outline-none transition" value={formData.license_expiry_date} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.licenseAuth')}</label>
                <input type="text" name="license_issuing_authority" className="w-full border-slate-300 border rounded-md p-2 focus:outline-none transition" value={formData.license_issuing_authority} onChange={handleChange} required placeholder="e.g. Ministry of Health" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.licenseDoc')}</label>
                <input type="file" name="document" accept=".pdf,.jpg,.jpeg,.png" className="w-full border-slate-300 border text-sm rounded-md p-2 focus:outline-none transition bg-white" onChange={handleChange} required />
                {documentName && <p className="text-xs text-emerald-600 mt-1">✓ {documentName}</p>}
              </div>

              <h3 className="font-semibold text-slate-700 text-sm pb-2 pt-2 border-b border-slate-200">Education & Experience</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Degree</label>
                  <input type="text" name="degree" className="w-full border-slate-300 border rounded-md p-2 focus:outline-none transition" value={formData.degree} onChange={handleChange} required placeholder="e.g. MD, MBBS" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Graduation Year</label>
                  <input type="number" name="graduation_year" className="w-full border-slate-300 border rounded-md p-2 focus:outline-none transition" value={formData.graduation_year} onChange={handleChange} required placeholder="YYYY" min="1950" max={new Date().getFullYear()} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">University Name</label>
                <input type="text" name="university_name" className="w-full border-slate-300 border rounded-md p-2 focus:outline-none transition" value={formData.university_name} onChange={handleChange} required placeholder="e.g. Addis Ababa University" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Degree Certificate</label>
                <input type="file" name="degree_document" accept=".pdf,.jpg,.jpeg,.png" className="w-full border-slate-300 border text-sm rounded-md p-2 focus:outline-none transition bg-white" onChange={handleChange} required />
                {degreeDocumentName && <p className="text-xs text-emerald-600 mt-1">✓ {degreeDocumentName}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Workplace</label>
                  <input type="text" name="current_workplace" className="w-full border-slate-300 border rounded-md p-2 focus:outline-none transition" value={formData.current_workplace} onChange={handleChange} placeholder="Hospital/Clinic Name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Experience (Years)</label>
                  <input type="number" name="experience_years" className="w-full border-slate-300 border rounded-md p-2 focus:outline-none transition" value={formData.experience_years} onChange={handleChange} min="0" placeholder="e.g. 5" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Experience Document (Optional)</label>
                <input type="file" name="experience_document" accept=".pdf,.jpg,.jpeg,.png" className="w-full border-slate-300 border text-sm rounded-md p-2 focus:outline-none transition bg-white" onChange={handleChange} />
                {experienceDocumentName && <p className="text-xs text-emerald-600 mt-1">✓ {experienceDocumentName}</p>}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {formData.role === 'doctor' && currentStep > 1 && (
              <button type="button" onClick={prevStep} className="flex-1 bg-slate-200 text-slate-700 font-medium p-3 rounded-md hover:bg-slate-300 transition duration-200">
                Back
              </button>
            )}
            
            {formData.role === 'doctor' && currentStep < 3 ? (
              <button type="button" onClick={nextStep} className="flex-[2] bg-primary-600 text-white font-medium p-3 rounded-md hover:bg-primary-700 transition duration-200 shadow-md">
                Next Step
              </button>
            ) : (
              <button type="submit" disabled={loading || verifyStep !== 'verified'}
                className="flex-[2] bg-primary-600 text-white font-medium p-3 rounded-md hover:bg-primary-700 transition duration-200 shadow-md transform hover:-translate-y-0.5 disabled:bg-primary-400 disabled:cursor-not-allowed">
                {loading ? t('auth.register.submitButtonLoading') : (formData.role === 'doctor' ? 'Submit Application' : t('auth.register.submitButton'))}
              </button>
            )}
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600 relative z-10">
          {t('auth.register.haveAccount')} <Link to="/login" className="text-primary-600 font-semibold hover:underline">{t('auth.register.loginLink')}</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
