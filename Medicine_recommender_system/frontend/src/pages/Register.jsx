import React, { useState, useContext, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { UserPlus, Camera, X, Eye, EyeOff, Mail, Phone, ShieldCheck, RefreshCw } from 'lucide-react';
import Webcam from 'react-webcam';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const Register = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'patient',
    phone_number: '', age: '', sex: '',
    document: null, selfie: null,
    license_number: '', license_issuing_authority: '', license_expiry_date: ''
  });
  const [documentPreview, setDocumentPreview] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Verification state
  // verifyMethod: 'email' | 'sms'
  // step: 'idle' | 'otp' | 'verified'
  const [verifyMethod, setVerifyMethod] = useState('email');
  const [verifyStep, setVerifyStep] = useState('idle');
  const [smsPhone, setSmsPhone] = useState('');       // phone used for SMS OTP
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  const webcamRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setPhotoPreview(imageSrc);
      setIsCameraOpen(false);
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
          setFormData(prev => ({ ...prev, selfie: file }));
        });
    }
  }, [webcamRef]);

  const retakePhoto = () => {
    setPhotoPreview(null);
    setFormData(prev => ({ ...prev, selfie: null }));
    setIsCameraOpen(true);
  };

  const handleChange = (e) => {
    if (e.target.name === 'document') {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) { setError('File size must be less than 5MB'); return; }
        setFormData({ ...formData, document: file });
        setDocumentName(file.name);
        setDocumentType(file.type);
        setDocumentPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
      }
    } else if (e.target.name === 'selfie') {
      setFormData({ ...formData, [e.target.name]: e.target.files[0] });
    } else {
      // Reset verification if email changes after verification started
      if (e.target.name === 'email' && verifyStep !== 'idle') {
        setVerifyStep('idle');
        setOtpValue('');
        setOtpError('');
      }
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
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

  // ── Send OTP (email or SMS) ───────────────────────────────────────────────
  const handleSendOtp = async () => {
    setOtpError('');
    setSendingOtp(true);
    try {
      if (verifyMethod === 'email') {
        if (!formData.email) { setOtpError('Please enter your email address first.'); return; }
        await api.post('/auth/send-verification', { email: formData.email });
      } else {
        if (!smsPhone) { setOtpError('Please enter your phone number first.'); return; }
        await api.post('/auth/send-verification-sms', { phone: smsPhone });
        // Sync verified phone into formData so it gets saved on the account
        setFormData(prev => ({ ...prev, phone_number: smsPhone }));
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
      const identifier = verifyMethod === 'email' ? formData.email : smsPhone;
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

    setLoading(true);
    try {
      await register(formData);
      await login(formData.email, formData.password);
      if (formData.role === 'doctor') navigate('/doctor');
      else navigate('/patient');
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
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.nameLabel')}</label>
            <input type="text" name="name"
              className="w-full border-slate-300 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              value={formData.name} onChange={handleChange} required placeholder={t('auth.register.namePlaceholder')} />
          </div>

          {/* Age + Sex */}
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

          {/* ── Identity Verification ─────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Identity Verification</label>

            {/* Method toggle — only shown before verified */}
            {verifyStep !== 'verified' && (
              <div className="flex rounded-lg border border-slate-300 overflow-hidden mb-3">
                <button type="button"
                  onClick={() => { setVerifyMethod('email'); resetVerification(); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition
                    ${verifyMethod === 'email' ? 'bg-primary-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                  <Mail size={15} /> Via Email
                </button>
                <button type="button"
                  onClick={() => { setVerifyMethod('sms'); resetVerification(); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition border-l border-slate-300
                    ${verifyMethod === 'sms' ? 'bg-primary-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                  <Phone size={15} /> Via SMS
                </button>
              </div>
            )}

            {/* Email method */}
            {verifyMethod === 'email' && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">{t('auth.login.emailLabel')}</label>
                <div className="flex gap-2">
                  <input type="email" name="email"
                    className={`flex-1 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition text-sm
                      ${verifyStep === 'verified' ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300'}`}
                    value={formData.email} onChange={handleChange} required
                    placeholder={t('auth.register.emailPlaceholder')}
                    disabled={verifyStep === 'otp' || verifyStep === 'verified'} />
                  {verifyStep === 'idle' && (
                    <button type="button" onClick={handleSendOtp}
                      disabled={sendingOtp || !formData.email}
                      className="shrink-0 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-3 py-2 rounded-md transition disabled:opacity-50 flex items-center gap-1">
                      {sendingOtp ? <RefreshCw size={13} className="animate-spin" /> : <Mail size={13} />}
                      {sendingOtp ? 'Sending…' : 'Send Code'}
                    </button>
                  )}
                  {verifyStep === 'verified' && (
                    <span className="shrink-0 flex items-center gap-1 text-emerald-600 font-bold text-sm px-2">
                      <ShieldCheck size={18} /> Verified
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* SMS method */}
            {verifyMethod === 'sms' && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">Phone Number (with country code)</label>
                <div className="flex gap-2">
                  <input type="tel"
                    className={`flex-1 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition text-sm
                      ${verifyStep === 'verified' ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300'}`}
                    value={smsPhone}
                    onChange={e => { setSmsPhone(e.target.value); if (verifyStep !== 'idle') resetVerification(); }}
                    placeholder="+251911234567"
                    disabled={verifyStep === 'otp' || verifyStep === 'verified'} />
                  {verifyStep === 'idle' && (
                    <button type="button" onClick={handleSendOtp}
                      disabled={sendingOtp || !smsPhone}
                      className="shrink-0 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-3 py-2 rounded-md transition disabled:opacity-50 flex items-center gap-1">
                      {sendingOtp ? <RefreshCw size={13} className="animate-spin" /> : <Phone size={13} />}
                      {sendingOtp ? 'Sending…' : 'Send Code'}
                    </button>
                  )}
                  {verifyStep === 'verified' && (
                    <span className="shrink-0 flex items-center gap-1 text-emerald-600 font-bold text-sm px-2">
                      <ShieldCheck size={18} /> Verified
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* OTP input panel — shown for both methods */}
            {verifyStep === 'otp' && (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium mb-1 flex items-center gap-1.5">
                  {verifyMethod === 'email'
                    ? <><Mail size={14} /> Code sent to <span className="font-bold">{formData.email}</span></>
                    : <><Phone size={14} /> Code sent to <span className="font-bold">{smsPhone}</span></>}
                </p>
                <p className="text-xs text-blue-600 mb-3">
                  {verifyMethod === 'email'
                    ? 'Enter the 6-digit code from your inbox (check spam too).'
                    : 'Enter the 6-digit code from your SMS messages.'}
                </p>
                <div className="flex gap-2">
                  <input type="text" inputMode="numeric" maxLength={6}
                    className="flex-1 border border-blue-300 rounded-md p-2.5 text-center text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="000000"
                    value={otpValue}
                    onChange={e => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoFocus />
                  <button type="button" onClick={handleVerifyOtp}
                    disabled={verifyingOtp || otpValue.length !== 6}
                    className="shrink-0 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold px-4 rounded-md transition disabled:opacity-50">
                    {verifyingOtp ? 'Checking…' : 'Confirm'}
                  </button>
                </div>
                {otpError && <p className="text-red-600 text-xs mt-2 font-medium">{otpError}</p>}
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <button type="button" onClick={handleSendOtp}
                    disabled={otpCooldown > 0 || sendingOtp}
                    className="text-xs text-primary-600 hover:underline disabled:text-slate-400 disabled:no-underline flex items-center gap-1">
                    <RefreshCw size={12} /> Resend code
                  </button>
                  {otpCooldown > 0 && <span className="text-xs text-slate-400">({otpCooldown}s)</span>}
                  <button type="button" onClick={resetVerification}
                    className="text-xs text-slate-500 hover:underline ml-auto">
                    Change {verifyMethod === 'email' ? 'email' : 'phone'}
                  </button>
                </div>
              </div>
            )}

            {otpError && verifyStep === 'idle' && (
              <p className="text-red-600 text-xs mt-1 font-medium">{otpError}</p>
            )}
          </div>

          {/* Email field (shown separately only when SMS method is chosen, so email is still collected) */}
          {verifyMethod === 'sms' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.login.emailLabel')}</label>
              <input type="email" name="email"
                className="w-full border-slate-300 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                value={formData.email} onChange={handleChange} required
                placeholder={t('auth.register.emailPlaceholder')} />
            </div>
          )}

          {/* Phone — only show when email method is chosen (SMS method already collected phone above) */}
          {verifyMethod === 'email' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('auth.register.phoneLabel')} <span className="text-slate-400 font-normal">{t('auth.register.phoneOptional')}</span>
              </label>
              <input type="tel" name="phone_number"
                className="w-full border-slate-300 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                value={formData.phone_number} onChange={handleChange} placeholder="+1234567890" />
            </div>
          )}

          {/* Password */}
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

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.amA')}</label>
            <select name="role"
              className="w-full border-slate-300 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white"
              value={formData.role} onChange={handleChange}>
              <option value="patient">{t('auth.register.patient')}</option>
              <option value="doctor">{t('auth.register.doctor')}</option>
            </select>
          </div>

          {/* Doctor-only fields */}
          {formData.role === 'doctor' && (
            <div className="space-y-4 bg-slate-50 p-4 rounded-md border border-slate-200 mt-4">
              <h3 className="font-semibold text-slate-700 text-sm pb-2 border-b border-slate-200">{t('auth.register.docVerifyDetails')}</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.licenseNumber')}</label>
                <input type="text" name="license_number"
                  className="w-full border-slate-300 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                  value={formData.license_number} onChange={handleChange} required placeholder="e.g. MED12345XYZ" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.licenseAuth')}</label>
                <input type="text" name="license_issuing_authority"
                  className="w-full border-slate-300 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                  value={formData.license_issuing_authority} onChange={handleChange} required placeholder="e.g. Ministry of Health" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.licenseExpiry')}</label>
                <input type="date" name="license_expiry_date"
                  className="w-full border-slate-300 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                  value={formData.license_expiry_date} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.licenseDoc')}</label>
                {!formData.document ? (
                  <>
                    <input type="file" name="document" accept=".pdf,.jpg,.jpeg,.png"
                      className="w-full border-slate-300 border text-sm rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white"
                      onChange={handleChange} required />
                    <p className="text-xs text-slate-500 mt-1">{t('auth.register.licenseDocHint')}</p>
                  </>
                ) : (
                  <div className="border border-slate-300 rounded-md p-3 bg-slate-50 relative group">
                    {documentPreview ? (
                      <div className="flex justify-center bg-slate-200 rounded-md overflow-hidden h-32 mb-2">
                        <img src={documentPreview} alt="License Preview" className="h-full object-contain" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center bg-slate-200 rounded-md h-20 mb-2">
                        <span className="text-slate-600 font-medium">{t('auth.register.pdfSelected')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <span className="truncate w-4/5 font-medium text-slate-700" title={documentName}>{documentName}</span>
                      <button type="button" onClick={removeDocument} className="text-red-500 hover:text-red-700 p-1" title="Remove Document">
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.liveSelfie')}</label>
                <div className="border border-slate-300 rounded-md bg-white overflow-hidden">
                  {!isCameraOpen && !photoPreview && (
                    <div className="p-6 flex flex-col items-center justify-center text-center">
                      <div className="bg-slate-100 p-3 rounded-full text-slate-400 mb-3"><Camera size={32} /></div>
                      <p className="text-sm font-medium text-slate-700 mb-1">{t('auth.register.liveIdentityCheck')}</p>
                      <p className="text-xs text-slate-500 mb-4 max-w-[250px]">{t('auth.register.selfieDesc')}</p>
                      <button type="button" onClick={() => setIsCameraOpen(true)}
                        className="bg-primary-50 text-primary-600 font-semibold px-4 py-2 rounded border border-primary-200 hover:bg-primary-100 transition flex items-center text-sm">
                        <Camera size={16} className="mr-2" /> {t('auth.register.openCamera')}
                      </button>
                    </div>
                  )}
                  {isCameraOpen && (
                    <div className="relative bg-black flex flex-col">
                      <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg"
                        videoConstraints={{ width: 400, height: 300, facingMode: "user" }} className="w-full h-auto" />
                      <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none">
                        <div className="flex justify-end pointer-events-auto">
                          <button type="button" onClick={() => setIsCameraOpen(false)} className="bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70"><X size={20} /></button>
                        </div>
                        <div className="flex justify-center pointer-events-auto pb-2">
                          <button type="button" onClick={capturePhoto}
                            className="bg-white text-slate-900 rounded-full w-14 h-14 flex flex-col items-center justify-center border-4 border-slate-300 hover:scale-105 transition"></button>
                        </div>
                      </div>
                    </div>
                  )}
                  {photoPreview && (
                    <div className="relative group bg-slate-100">
                      <img src={photoPreview} alt="Selfie Preview" className="w-full h-auto object-cover max-h-[300px]" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <button type="button" onClick={retakePhoto}
                          className="bg-white/90 text-slate-800 font-bold px-4 py-2 rounded shadow flex items-center hover:bg-white">
                          <Camera size={18} className="mr-2" /> {t('auth.register.retakePhoto')}
                        </button>
                      </div>
                      <div className="absolute top-2 left-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded shadow flex items-center">
                        ✓ {t('auth.register.photoCaptured')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading || verifyStep !== 'verified'}
            className="w-full bg-primary-600 text-white font-medium p-3 rounded-md hover:bg-primary-700 transition duration-200 shadow-md transform hover:-translate-y-0.5 mt-4 disabled:bg-primary-400 disabled:cursor-not-allowed">
            {loading
              ? t('auth.register.submitButtonLoading')
              : verifyStep !== 'verified'
                ? 'Verify your identity to continue'
                : t('auth.register.submitButton')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600 relative z-10">
          {t('auth.register.haveAccount')} <Link to="/login" className="text-primary-600 font-semibold hover:underline">{t('auth.register.loginLink')}</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
