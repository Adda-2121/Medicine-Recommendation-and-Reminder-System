import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LiveSelfie from '../components/LiveSelfie';
import { registerStep1Schema, registerDoctorStep3Schema, formatZodErrors } from '../utils/validationSchemas';
import FieldTooltip from '../components/common/FieldTooltip';

const Register = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', password: '', role: 'patient',
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register, login } = useContext(AuthContext);

  // Helper for inline name validation
  const validateNameField = (field, value) => {
    const trimmed = value.trim();
    if (!trimmed) return `${field.replace('_', ' ')} is required`;
    if (trimmed.length < 2) return `${field.replace('_', ' ')} must be at least 2 characters`;
    if (/\d/.test(trimmed)) return `${field.replace('_', ' ')} cannot contain numbers`;
    if (!/^[a-zA-Z\s\u1200-\u137F]+$/.test(trimmed)) return `${field.replace('_', ' ')} can only contain letters and spaces`;
    return null;
  };
  const navigate = useNavigate();

  useEffect(() => {
    if (formData.role === 'patient' && currentStep > 1) {
      setCurrentStep(1);
    }
  }, [formData.role, currentStep]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'document' || name === 'id_document' || name === 'degree_document' || name === 'experience_document') {
      const file = files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) { setError('File size must be less than 5MB'); return; }
        setFormData(prev => ({ ...prev, [name]: file }));
        if (name === 'document') {
            setDocumentName(file.name);
            setDocumentType(file.type);
            setDocumentPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
        } else if (name === 'id_document') {
            setIdDocumentName(file.name);
        } else if (name === 'degree_document') {
            setDegreeDocumentName(file.name);
        } else if (name === 'experience_document') {
            setExperienceDocumentName(file.name);
        }
      }
    } else if (name === 'phone_number') {
      let phoneVal = value.replace(/[^\d+]/g, '');
      if (phoneVal && !phoneVal.startsWith('+')) {
        phoneVal = '+251' + phoneVal;
      }
      setFormData(prev => ({ ...prev, phone_number: phoneVal }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      // Inline validation for name fields
      if (name === 'first_name' || name === 'last_name') {
        const errMsg = validateNameField(name, value);
        setFieldErrors(prev => ({ ...prev, [name]: errMsg }));
      }
    }
    if (name === 'role') {
      setCurrentStep(1);
      setError('');
      setFieldErrors({});
    }
  };

  const validateStep1 = () => {
    const result = registerStep1Schema.safeParse(formData);
    if (!result.success) {
      setFieldErrors(formatZodErrors(result.error));
      setError('Please complete all required fields with valid information before proceeding.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const nextStep = () => {
    setError('');
    setFieldErrors({});

    // Patients register in a single step — do not advance to empty step 2
    if (formData.role === 'patient') {
      return;
    }
    
    if (currentStep === 1) {
      if (!validateStep1()) return;
    }
    
    if (currentStep === 2 && formData.role === 'doctor') {
      // Validate Step 2: Identity Documents
      if (!formData.id_document) {
        setError('Please upload your Government ID (National ID or Passport) to proceed.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!formData.selfie) {
        setError('Please capture a live selfie for identity verification to proceed.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
    
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
    setFieldErrors({});
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
    setFieldErrors({});

    if (!validateStep1()) return;
    
    if (formData.role === 'doctor') {
      // Validate identity documents
      if (!formData.selfie) { 
        setError('Please capture a live photo for identity verification.'); 
        return; 
      }
      if (!formData.id_document) {
        setError('Please upload your Government ID document.');
        return;
      }
      
      // Validate Step 3: Professional Details
      const result = registerDoctorStep3Schema.safeParse(formData);
      if (!result.success) {
        setFieldErrors(formatZodErrors(result.error));
        setError('Please complete all required professional details with valid information.');
        
        // Scroll to top to show error
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      // Validate required documents
      if (!formData.document) {
        setError('Please upload your Medical License document.');
        return;
      }
      if (!formData.degree_document) {
        setError('Please upload your Degree document.');
        return;
      }
    }

    setLoading(true);
    try {
      await register({
        ...formData,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
      });
      if (formData.role === 'doctor') {
        navigate('/pending-verification');
      } else {
        await login(formData.email, formData.password);
        navigate('/patient');
      }
    } catch (err) {
      const serverResponse = err?.response?.data;
      const serverMsg = serverResponse?.message || err?.message || 'Registration failed';
      setError(serverMsg);

      const parseErrors = (errors) => {
        if (!errors) return {};
        if (Array.isArray(errors)) {
          return errors.reduce((acc, errorItem) => {
            if (!errorItem) return acc;
            if (typeof errorItem === 'string') {
              acc.general = errorItem;
            } else if (errorItem.field) {
              acc[errorItem.field] = errorItem.message || errorItem.msg || '';
            } else if (errorItem.param) {
              acc[errorItem.param] = errorItem.msg || errorItem.message || '';
            }
            return acc;
          }, {});
        }
        if (typeof errors === 'object') {
          return errors;
        }
        return {};
      };

      if (serverResponse?.errors) {
        setFieldErrors(parseErrors(serverResponse.errors));
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
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
          {formData.role === 'patient' && (
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-600 text-white">1</span>
              <span className="text-sm text-slate-600">{t('auth.register.patientStepLabel') || 'Your account details'}</span>
            </div>
          )}

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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.firstNameLabel')}</label>
                  <input
                    type="text"
                    name="first_name"
                    className={`w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition ${fieldErrors.first_name ? 'border-red-500' : 'border-slate-300'}`}
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder={t('auth.register.firstNamePlaceholder')}
                    required
                  />
                  {fieldErrors.first_name && <FieldTooltip message={fieldErrors.first_name} />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.lastNameLabel')}</label>
                  <input
                    type="text"
                    name="last_name"
                    className={`w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition ${fieldErrors.last_name ? 'border-red-500' : 'border-slate-300'}`}
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder={t('auth.register.lastNamePlaceholder')}
                    required
                  />
                  {fieldErrors.last_name && <FieldTooltip message={fieldErrors.last_name} />}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.emailLabel')}</label>
                <input type="email" name="email"
                  className={`w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition ${fieldErrors.email ? 'border-red-500' : 'border-slate-300'}`}
                  value={formData.email} onChange={handleChange} placeholder={t('auth.register.emailPlaceholder')} required />
                {fieldErrors.email && <FieldTooltip message={fieldErrors.email} />}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.phoneLabel')}</label>
                <input type="tel" name="phone_number"
                  className={`w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition ${fieldErrors.phone_number ? 'border-red-500' : 'border-slate-300'}`}
                  value={formData.phone_number} onChange={handleChange} placeholder="+251911234567" />
                {fieldErrors.phone_number && <FieldTooltip message={fieldErrors.phone_number} />}
              </div>

              <div className="flex space-x-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.ageLabel')}</label>
                  <input type="number" name="age"
                    className={`w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition ${fieldErrors.age ? 'border-red-500' : 'border-slate-300'}`}
                    value={formData.age} onChange={handleChange} min="0" placeholder="e.g. 25" required />
                  {fieldErrors.age && <FieldTooltip message={fieldErrors.age} />}
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.sexLabel')}</label>
                  <select name="sex"
                    className={`w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white ${fieldErrors.sex ? 'border-red-500' : 'border-slate-300'}`}
                    value={formData.sex} onChange={handleChange} required>
                    <option value="" disabled>Select...</option>
                    <option value="Male">{t('auth.register.male')}</option>
                    <option value="Female">{t('auth.register.female')}</option>
                  </select>
                  {fieldErrors.sex && <FieldTooltip message={fieldErrors.sex} />}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.login.passwordLabel')}</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} name="password"
                    className={`w-full border rounded-md p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 transition ${fieldErrors.password ? 'border-red-500' : 'border-slate-300'}`}
                    value={formData.password} onChange={handleChange} placeholder={t('auth.login.passwordPlaceholder')} required />
                  <button type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                    onClick={() => setShowPassword(!showPassword)} tabIndex="-1">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {fieldErrors.password && <FieldTooltip message={fieldErrors.password} />}
                <p className="text-xs text-slate-500 mt-1">Must contain uppercase, lowercase, and number (min 8 characters)</p>
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

          {/* STEP 2: Identity Documents (For Doctors Only) */}
          {currentStep === 2 && formData.role === 'doctor' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="font-semibold text-slate-700 text-sm pb-2 border-b border-slate-200">Identity Verification</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Government ID (National ID/Passport) <span className="text-red-500">*</span></label>
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
            </div>
          )}

          {/* STEP 3: Professional Credentials (Doctors Only) */}
          {currentStep === 3 && formData.role === 'doctor' && (
            <div className="space-y-4 animate-fadeIn bg-slate-50 p-4 rounded-md border border-slate-200">

              <h3 className="font-semibold text-slate-700 text-sm pb-2 border-b border-slate-200">Specialization</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Medical Specialty <span className="text-red-500">*</span>
                </label>
                <select
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white ${fieldErrors.specialty ? 'border-red-500' : 'border-slate-300'}`}
                  required>
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
                {fieldErrors.specialty && <FieldTooltip message={fieldErrors.specialty} />}
              </div>

              <h3 className="font-semibold text-slate-700 text-sm pb-2 border-b border-slate-200">Medical License</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.licenseNumber')}</label>
                  <input type="text" name="license_number" className={`w-full border rounded-md p-2 focus:outline-none transition ${fieldErrors.license_number ? 'border-red-500' : 'border-slate-300'}`} value={formData.license_number} onChange={handleChange} placeholder="MED12345XYZ" required />
                  {fieldErrors.license_number && <FieldTooltip message={fieldErrors.license_number} />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.licenseExpiry')}</label>
                  <input type="date" name="license_expiry_date" className={`w-full border rounded-md p-2 focus:outline-none transition ${fieldErrors.license_expiry_date ? 'border-red-500' : 'border-slate-300'}`} value={formData.license_expiry_date} onChange={handleChange} min={new Date().toISOString().split('T')[0]} required />
                  {fieldErrors.license_expiry_date && <FieldTooltip message={fieldErrors.license_expiry_date} />}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.licenseAuth')}</label>
                <input type="text" name="license_issuing_authority" className={`w-full border rounded-md p-2 focus:outline-none transition ${fieldErrors.license_issuing_authority ? 'border-red-500' : 'border-slate-300'}`} value={formData.license_issuing_authority} onChange={handleChange} placeholder="e.g. Ministry of Health" required />
                {fieldErrors.license_issuing_authority && <FieldTooltip message={fieldErrors.license_issuing_authority} />}
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
                  <input type="text" name="degree" className={`w-full border rounded-md p-2 focus:outline-none transition ${fieldErrors.degree ? 'border-red-500' : 'border-slate-300'}`} value={formData.degree} onChange={handleChange} placeholder="e.g. MD, MBBS" required />
                  {fieldErrors.degree && <FieldTooltip message={fieldErrors.degree} />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Graduation Year</label>
                  <input type="number" name="graduation_year" className={`w-full border rounded-md p-2 focus:outline-none transition ${fieldErrors.graduation_year ? 'border-red-500' : 'border-slate-300'}`} value={formData.graduation_year} onChange={handleChange} min="1950" max={new Date().getFullYear()} placeholder="e.g. 2015" required />
                  {fieldErrors.graduation_year && <FieldTooltip message={fieldErrors.graduation_year} />}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">University Name</label>
                <input type="text" name="university_name" className={`w-full border rounded-md p-2 focus:outline-none transition ${fieldErrors.university_name ? 'border-red-500' : 'border-slate-300'}`} value={formData.university_name} onChange={handleChange} placeholder="e.g. Addis Ababa University" required />
                {fieldErrors.university_name && <FieldTooltip message={fieldErrors.university_name} />}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Degree Document</label>
                <input type="file" name="degree_document" accept=".pdf,.jpg,.jpeg,.png" className="w-full border-slate-300 border text-sm rounded-md p-2 focus:outline-none transition bg-white" onChange={handleChange} required />
                {degreeDocumentName && <p className="text-xs text-emerald-600 mt-1">✓ {degreeDocumentName}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Experience (Years)</label>
                  <input type="number" name="experience_years" className="w-full border-slate-300 border rounded-md p-2 focus:outline-none transition" value={formData.experience_years} onChange={handleChange} min="0" placeholder="e.g. 5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Workplace</label>
                  <input type="text" name="current_workplace" className="w-full border-slate-300 border rounded-md p-2 focus:outline-none transition" value={formData.current_workplace} onChange={handleChange} placeholder="e.g. City Hospital" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Experience Document (Optional)</label>
                <input type="file" name="experience_document" accept=".pdf,.jpg,.jpeg,.png" className="w-full border-slate-300 border text-sm rounded-md p-2 focus:outline-none transition bg-white" onChange={handleChange} />
                {experienceDocumentName && <p className="text-xs text-emerald-600 mt-1">✓ {experienceDocumentName}</p>}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 gap-3">
            {currentStep > 1 && formData.role === 'doctor' && (
              <button type="button" onClick={prevStep}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition font-medium">
                {t('common.back')}
              </button>
            )}

            {formData.role === 'patient' ? (
              <button
                type="submit"
                disabled={loading}
                className="ml-auto w-full sm:w-auto px-8 py-2.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('common.submitting') : t('auth.register.registerButton')}
              </button>
            ) : currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="ml-auto px-6 py-2.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition font-semibold shadow-sm"
              >
                {t('common.next')}
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="ml-auto px-8 py-2.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('common.submitting') : t('auth.register.registerButton')}
              </button>
            )}
          </div>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6 relative z-10">
          {t('auth.register.haveAccount')} <Link to="/login" className="text-primary-600 hover:underline font-medium">{t('auth.register.loginLink')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
