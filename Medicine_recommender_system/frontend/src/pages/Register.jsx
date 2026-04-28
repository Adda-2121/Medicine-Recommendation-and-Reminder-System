import React, { useState, useContext, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { UserPlus, Camera, Image as ImageIcon, X, Eye, EyeOff } from 'lucide-react';
import Webcam from 'react-webcam';
import { useTranslation } from 'react-i18next';

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

  const webcamRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setPhotoPreview(imageSrc);
      setIsCameraOpen(false);

      // Convert base64 to File object
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
        if (file.size > 5 * 1024 * 1024) {
          setError('File size must be less than 5MB');
          return;
        }
        setFormData({ ...formData, document: file });
        setDocumentName(file.name);
        setDocumentType(file.type);
        if (file.type.startsWith('image/')) {
          setDocumentPreview(URL.createObjectURL(file));
        } else {
          setDocumentPreview(null);
        }
      }
    } else if (e.target.name === 'selfie') {
      setFormData({ ...formData, [e.target.name]: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const removeDocument = () => {
    setFormData({ ...formData, document: null });
    setDocumentPreview(null);
    setDocumentName('');
    setDocumentType('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (/\d/.test(formData.name)) {
      setError('Name cannot contain numbers.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (formData.role === 'doctor' && !formData.selfie) {
      setError('Please capture a live photo for identity verification.');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      // Auto login after register
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.nameLabel')}</label>
            <input
              type="text" name="name"
              className="w-full border-slate-300 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              value={formData.name} onChange={handleChange} required placeholder={t('auth.register.namePlaceholder')}
            />
          </div>
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.ageLabel')}</label>
              <input
                type="number" name="age"
                className="w-full border-slate-300 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                value={formData.age} onChange={handleChange} required min="0" placeholder="e.g. 25"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.sexLabel')}</label>
              <select
                name="sex"
                className="w-full border-slate-300 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white"
                value={formData.sex} onChange={handleChange} required
              >
                <option value="" disabled></option>
                <option value="Male">{t('auth.register.male')}</option>
                <option value="Female">{t('auth.register.female')}</option>
                {/* <option value="Other">Other</option> */}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.login.emailLabel')}</label>
            <input
              type="email" name="email"
              className="w-full border-slate-300 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              value={formData.email} onChange={handleChange} required placeholder={t('auth.register.emailPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.phoneLabel')} <span className="text-slate-400 font-normal">{t('auth.register.phoneOptional')}</span></label>
            <input
              type="tel" name="phone_number"
              className="w-full border-slate-300 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              value={formData.phone_number} onChange={handleChange} placeholder="+1234567890"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.login.passwordLabel')}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} name="password"
                className="w-full border-slate-300 border rounded-md p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                value={formData.password} onChange={handleChange} required placeholder={t('auth.login.passwordPlaceholder')}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.amA')}</label>
            <select
              name="role"
              className="w-full border-slate-300 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="patient">{t('auth.register.patient')}</option>
              <option value="doctor">{t('auth.register.doctor')}</option>
            </select>
          </div>

          {formData.role === 'doctor' && (
            <div className="space-y-4 bg-slate-50 p-4 rounded-md border border-slate-200 mt-4">
              <h3 className="font-semibold text-slate-700 text-sm pb-2 border-b border-slate-200">{t('auth.register.docVerifyDetails')}</h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.licenseNumber')}</label>
                <input
                  type="text" name="license_number"
                  className="w-full border-slate-300 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                  value={formData.license_number} onChange={handleChange} required placeholder="e.g. MED12345XYZ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.licenseAuth')}</label>
                <input
                  type="text" name="license_issuing_authority"
                  className="w-full border-slate-300 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                  value={formData.license_issuing_authority} onChange={handleChange} required placeholder="e.g. Ministry of Health"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.licenseExpiry')}</label>
                <input
                  type="date" name="license_expiry_date"
                  className="w-full border-slate-300 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                  value={formData.license_expiry_date} onChange={handleChange} required min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.licenseDoc')}</label>
                {!formData.document ? (
                  <>
                    <input
                      type="file" name="document"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="w-full border-slate-300 border text-sm rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white"
                      onChange={handleChange} required
                    />
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
                      <button
                        type="button"
                        onClick={removeDocument}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove Document"
                      >
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
                      <div className="bg-slate-100 p-3 rounded-full text-slate-400 mb-3">
                        <Camera size={32} />
                      </div>
                      <p className="text-sm font-medium text-slate-700 mb-1">{t('auth.register.liveIdentityCheck')}</p>
                      <p className="text-xs text-slate-500 mb-4 max-w-[250px]">{t('auth.register.selfieDesc')}</p>
                      <button
                        type="button"
                        onClick={() => setIsCameraOpen(true)}
                        className="bg-primary-50 text-primary-600 font-semibold px-4 py-2 rounded border border-primary-200 hover:bg-primary-100 transition flex items-center text-sm"
                      >
                        <Camera size={16} className="mr-2" /> {t('auth.register.openCamera')}
                      </button>
                    </div>
                  )}

                  {isCameraOpen && (
                    <div className="relative bg-black flex flex-col">
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ width: 400, height: 300, facingMode: "user" }}
                        className="w-full h-auto"
                      />
                      <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none">
                        <div className="flex justify-end pointer-events-auto">
                          <button type="button" onClick={() => setIsCameraOpen(false)} className="bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70">
                            <X size={20} />
                          </button>
                        </div>
                        <div className="flex justify-center pointer-events-auto pb-2">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="bg-white text-slate-900 rounded-full w-14 h-14 flex flex-col items-center justify-center border-4 border-slate-300 hover:scale-105 transition"
                          ></button>
                        </div>
                      </div>
                    </div>
                  )}

                  {photoPreview && (
                    <div className="relative group bg-slate-100">
                      <img src={photoPreview} alt="Selfie Preview" className="w-full h-auto object-cover max-h-[300px]" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <button
                          type="button" onClick={retakePhoto}
                          className="bg-white/90 text-slate-800 font-bold px-4 py-2 rounded shadow flex items-center hover:bg-white"
                        >
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

          <button
            type="submit" disabled={loading}
            className="w-full bg-primary-600 text-white font-medium p-3 rounded-md hover:bg-primary-700 transition duration-200 shadow-md transform hover:-translate-y-0.5 mt-4 disabled:bg-primary-400"
          >
            {loading ? t('auth.register.submitButtonLoading') : t('auth.register.submitButton')}
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
