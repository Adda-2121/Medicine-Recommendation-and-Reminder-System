/**
 * Enhanced Registration Form Example
 * Demonstrates complete validation system with real-time feedback
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import EnhancedInput from '../components/EnhancedInput';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import { registerStep1Schema, formatZodErrors } from '../utils/validationSchemas';
import {
  validateNameRealTime,
  validateEmailRealTime,
  validatePasswordRealTime,
  validatePhoneRealTime,
  validateAgeRealTime,
  validateConfirmPasswordRealTime,
  formatPhoneNumber,
  checkEmailUnique,
  checkPhoneUnique,
  debounce,
  sanitizeInput
} from '../utils/realTimeValidation';

const EnhancedRegistration = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone_number: '',
    age: '',
    sex: '',
    role: 'patient'
  });

  // Validation states
  const [fieldErrors, setFieldErrors] = useState({});
  const [realTimeErrors, setRealTimeErrors] = useState({});
  const [validationStates, setValidationStates] = useState({
    name: { isValid: false, isValidating: false },
    email: { isValid: false, isValidating: false },
    password: { isValid: false, isValidating: false },
    confirmPassword: { isValid: false, isValidating: false },
    phone_number: { isValid: false, isValidating: false },
    age: { isValid: false, isValidating: false }
  });

  // Real-time validation handlers
  const handleNameChange = useCallback((e) => {
    const value = sanitizeInput(e.target.value);
    setFormData(prev => ({ ...prev, name: value }));
    
    const validation = validateNameRealTime(value);
    setRealTimeErrors(prev => ({ ...prev, name: validation.message }));
    setValidationStates(prev => ({
      ...prev,
      name: { isValid: validation.valid, isValidating: false }
    }));
    
    // Clear field error
    if (validation.valid) {
      setFieldErrors(prev => ({ ...prev, name: undefined }));
    }
  }, []);

  const handleEmailChange = useCallback(
    debounce(async (value) => {
      const validation = validateEmailRealTime(value);
      
      if (validation.valid) {
        // Check uniqueness
        setValidationStates(prev => ({
          ...prev,
          email: { isValid: false, isValidating: true }
        }));
        
        const uniqueCheck = await checkEmailUnique(value, api);
        
        setValidationStates(prev => ({
          ...prev,
          email: { isValid: uniqueCheck.unique, isValidating: false }
        }));
        
        setRealTimeErrors(prev => ({
          ...prev,
          email: uniqueCheck.unique ? '' : uniqueCheck.message
        }));
        
        if (uniqueCheck.unique) {
          setFieldErrors(prev => ({ ...prev, email: undefined }));
        }
      } else {
        setRealTimeErrors(prev => ({ ...prev, email: validation.message }));
        setValidationStates(prev => ({
          ...prev,
          email: { isValid: false, isValidating: false }
        }));
      }
    }, 500),
    []
  );

  const handlePasswordChange = useCallback((e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, password: value }));
    
    const validation = validatePasswordRealTime(value);
    setRealTimeErrors(prev => ({ ...prev, password: validation.message }));
    setValidationStates(prev => ({
      ...prev,
      password: { isValid: validation.valid, isValidating: false }
    }));
    
    // Re-validate confirm password if it has a value
    if (formData.confirmPassword) {
      const confirmValidation = validateConfirmPasswordRealTime(value, formData.confirmPassword);
      setRealTimeErrors(prev => ({ ...prev, confirmPassword: confirmValidation.message }));
      setValidationStates(prev => ({
        ...prev,
        confirmPassword: { isValid: confirmValidation.valid, isValidating: false }
      }));
    }
    
    if (validation.valid) {
      setFieldErrors(prev => ({ ...prev, password: undefined }));
    }
  }, [formData.confirmPassword]);

  const handleConfirmPasswordChange = useCallback((e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, confirmPassword: value }));
    
    const validation = validateConfirmPasswordRealTime(formData.password, value);
    setRealTimeErrors(prev => ({ ...prev, confirmPassword: validation.message }));
    setValidationStates(prev => ({
      ...prev,
      confirmPassword: { isValid: validation.valid, isValidating: false }
    }));
    
    if (validation.valid) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  }, [formData.password]);

  const handlePhoneChange = useCallback(
    debounce(async (value) => {
      const formatted = formatPhoneNumber(value);
      const validation = validatePhoneRealTime(formatted);
      
      if (formatted && validation.valid) {
        // Check uniqueness
        setValidationStates(prev => ({
          ...prev,
          phone_number: { isValid: false, isValidating: true }
        }));
        
        const uniqueCheck = await checkPhoneUnique(formatted, api);
        
        setValidationStates(prev => ({
          ...prev,
          phone_number: { isValid: uniqueCheck.unique, isValidating: false }
        }));
        
        setRealTimeErrors(prev => ({
          ...prev,
          phone_number: uniqueCheck.unique ? '' : uniqueCheck.message
        }));
      } else if (formatted) {
        setRealTimeErrors(prev => ({ ...prev, phone_number: validation.message }));
        setValidationStates(prev => ({
          ...prev,
          phone_number: { isValid: false, isValidating: false }
        }));
      } else {
        setRealTimeErrors(prev => ({ ...prev, phone_number: '' }));
        setValidationStates(prev => ({
          ...prev,
          phone_number: { isValid: true, isValidating: false }
        }));
      }
    }, 500),
    []
  );

  const handleAgeChange = useCallback((e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, age: value }));
    
    const validation = validateAgeRealTime(value);
    setRealTimeErrors(prev => ({ ...prev, age: validation.message }));
    setValidationStates(prev => ({
      ...prev,
      age: { isValid: validation.valid, isValidating: false }
    }));
    
    if (validation.valid) {
      setFieldErrors(prev => ({ ...prev, age: undefined }));
    }
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    // Validate with Zod
    const result = registerStep1Schema.safeParse(formData);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      setFieldErrors(errors);
      toast.error('Please complete all required fields with valid information');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Check if all real-time validations passed
    const hasRealTimeErrors = Object.values(realTimeErrors).some(error => error);
    if (hasRealTimeErrors) {
      toast.error('Please fix all validation errors before submitting');
      return;
    }

    // Submit form
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/register', formData);
      toast.success('Registration successful!');
      navigate('/login');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      toast.error(errorMessage);
      
      // Handle backend validation errors
      if (error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          backendErrors[err.field] = err.message;
        });
        setFieldErrors(backendErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Create Account</h1>
        <p className="text-slate-500 mb-6">Join our healthcare platform today</p>

        {/* Error Banner */}
        {Object.keys(fieldErrors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm font-medium">
              ⚠️ Please complete all required fields with valid information
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <EnhancedInput
            label="Full Name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleNameChange}
            placeholder="John Doe"
            required
            error={fieldErrors.name}
            realTimeError={realTimeErrors.name}
            isValid={validationStates.name.isValid}
            maxLength={50}
            autoComplete="name"
          />

          {/* Email Field */}
          <EnhancedInput
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => {
              const value = sanitizeInput(e.target.value.toLowerCase().trim());
              setFormData(prev => ({ ...prev, email: value }));
              handleEmailChange(value);
            }}
            placeholder="john@example.com"
            required
            error={fieldErrors.email}
            realTimeError={realTimeErrors.email}
            isValidating={validationStates.email.isValidating}
            isValid={validationStates.email.isValid}
            autoComplete="email"
          />

          {/* Password Field */}
          <div>
            <EnhancedInput
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handlePasswordChange}
              placeholder="••••••••"
              required
              error={fieldErrors.password}
              realTimeError={realTimeErrors.password}
              isValid={validationStates.password.isValid}
              showPasswordToggle
              autoComplete="new-password"
            />
            <PasswordStrengthIndicator password={formData.password} />
          </div>

          {/* Confirm Password Field */}
          <EnhancedInput
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleConfirmPasswordChange}
            placeholder="••••••••"
            required
            error={fieldErrors.confirmPassword}
            realTimeError={realTimeErrors.confirmPassword}
            isValid={validationStates.confirmPassword.isValid}
            showPasswordToggle
            autoComplete="new-password"
          />

          {/* Phone Number Field */}
          <EnhancedInput
            label="Phone Number"
            name="phone_number"
            type="tel"
            value={formData.phone_number}
            onChange={(e) => {
              const formatted = formatPhoneNumber(e.target.value);
              setFormData(prev => ({ ...prev, phone_number: formatted }));
              handlePhoneChange(formatted);
            }}
            placeholder="+251911234567"
            error={fieldErrors.phone_number}
            realTimeError={realTimeErrors.phone_number}
            isValidating={validationStates.phone_number.isValidating}
            isValid={validationStates.phone_number.isValid}
            helperText="Ethiopian format: +251XXXXXXXXX"
            autoComplete="tel"
          />

          {/* Age Field */}
          <EnhancedInput
            label="Age"
            name="age"
            type="number"
            value={formData.age}
            onChange={handleAgeChange}
            placeholder="25"
            required
            error={fieldErrors.age}
            realTimeError={realTimeErrors.age}
            isValid={validationStates.age.isValid}
            autoComplete="off"
          />

          {/* Gender Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              name="sex"
              value={formData.sex}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, sex: e.target.value }));
                setFieldErrors(prev => ({ ...prev, sex: undefined }));
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 ${
                fieldErrors.sex ? 'border-red-500 bg-red-50' : 'border-slate-300'
              }`}
              required
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            {fieldErrors.sex && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.sex}</p>
            )}
          </div>

          {/* Role Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Register as <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, role: e.target.value }));
                setFieldErrors(prev => ({ ...prev, role: undefined }));
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 ${
                fieldErrors.role ? 'border-red-500 bg-red-50' : 'border-slate-300'
              }`}
              required
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
            {fieldErrors.role && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.role}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-sm text-slate-600 mt-6">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-primary-600 hover:text-primary-700 font-semibold"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default EnhancedRegistration;
