/**
 * Real-time Form Validation Utilities
 * Provides instant feedback as users type
 */

// Debounce function for real-time validation
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Real-time name validation
export const validateNameRealTime = (name) => {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: 'please wright your full name' };
  }
  if (name.trim().length < 2) {
    return { valid: false, message: 'please wright your full name' };
  }
  if (name.trim().length > 50) {
    return { valid: false, message: 'Name is too long (max 50 characters)' };
  }
  if (!/^[a-zA-Z\s\u1200-\u137F]+$/.test(name)) {
    return { valid: false, message: 'Name can only contain letters and spaces' };
  }
  return { valid: true, message: '' };
};

// Real-time email validation
export const validateEmailRealTime = (email) => {
  if (!email || email.trim().length === 0) {
    return { valid: false, message: 'Please fill in your email address' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email.toLowerCase().trim())) {
    return { valid: false, message: 'Please enter a valid email address' };
  }
  return { valid: true, message: '' };
};

// Real-time password validation with strength indicator
export const validatePasswordRealTime = (password) => {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    noSpaces: !/\s/.test(password)
  };

  const strength = Object.values(checks).filter(Boolean).length;
  
  if (!password || password.length === 0) {
    return { 
      valid: false, 
      message: 'Please fill in your password',
      strength: 0,
      checks
    };
  }
  
  if (!checks.length) {
    return { 
      valid: false, 
      message: 'Password must be at least 8 characters long',
      strength,
      checks
    };
  }
  
  if (!checks.lowercase) {
    return { 
      valid: false, 
      message: 'Password must contain at least one lowercase letter',
      strength,
      checks
    };
  }
  
  if (!checks.uppercase) {
    return { 
      valid: false, 
      message: 'Password must contain at least one uppercase letter',
      strength,
      checks
    };
  }
  
  if (!checks.number) {
    return { 
      valid: false, 
      message: 'Password must contain at least one number',
      strength,
      checks
    };
  }
  
  if (!checks.noSpaces) {
    return { 
      valid: false, 
      message: 'Password cannot contain spaces',
      strength,
      checks
    };
  }
  
  return { 
    valid: true, 
    message: 'Strong password!',
    strength: 5,
    checks
  };
};

// Real-time phone validation (Ethiopian format)
export const validatePhoneRealTime = (phone) => {
  if (!phone || phone.trim().length === 0) {
    return { valid: true, message: '' }; // Optional field
  }
  
  const phoneRegex = /^\+251[79]\d{8}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return { 
      valid: false, 
      message: 'Please enter a valid Ethiopian phone number (e.g., +251911234567)' 
    };
  }
  
  return { valid: true, message: '' };
};

// Auto-format phone number as user types
export const formatPhoneNumber = (value) => {
  // Remove all non-digit characters except +
  let cleaned = value.replace(/[^\d+]/g, '');
  
  // If user starts typing without +251, add it
  if (cleaned.length > 0 && !cleaned.startsWith('+')) {
    if (cleaned.startsWith('251')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
      cleaned = '+251' + cleaned.substring(1);
    } else if (/^[79]/.test(cleaned)) {
      cleaned = '+251' + cleaned;
    }
  }
  
  // Ensure it starts with +251
  if (cleaned.length > 0 && !cleaned.startsWith('+251')) {
    cleaned = '+251';
  }
  
  // Limit to +251 + 9 digits
  if (cleaned.length > 13) {
    cleaned = cleaned.substring(0, 13);
  }
  
  return cleaned;
};

// Real-time age validation
export const validateAgeRealTime = (age) => {
  if (!age || age.toString().trim().length === 0) {
    return { valid: false, message: 'Please fill in your age' };
  }
  
  const ageNum = parseInt(age);
  if (isNaN(ageNum)) {
    return { valid: false, message: 'Age must be a number' };
  }
  
  if (ageNum < 1) {
    return { valid: false, message: 'Age must be at least 1' };
  }
  
  if (ageNum > 150) {
    return { valid: false, message: 'Please enter a valid age' };
  }
  
  return { valid: true, message: '' };
};

// Real-time confirm password validation
export const validateConfirmPasswordRealTime = (password, confirmPassword) => {
  if (!confirmPassword || confirmPassword.length === 0) {
    return { valid: false, message: 'Please confirm your password' };
  }
  
  if (password !== confirmPassword) {
    return { valid: false, message: 'Passwords do not match' };
  }
  
  return { valid: true, message: 'Passwords match!' };
};

// Check for duplicate email (requires API call)
export const checkEmailUnique = async (email, api) => {
  try {
    const response = await api.post('/auth/check-email', { email });
    return { unique: !response.data.exists, message: response.data.message };
  } catch (error) {
    return { unique: true, message: '' }; // Assume unique if check fails
  }
};

// Check for duplicate phone (requires API call)
export const checkPhoneUnique = async (phone, api) => {
  try {
    const response = await api.post('/auth/check-phone', { phone });
    return { unique: !response.data.exists, message: response.data.message };
  } catch (error) {
    return { unique: true, message: '' }; // Assume unique if check fails
  }
};

// Password strength calculator
export const calculatePasswordStrength = (password) => {
  let strength = 0;
  const checks = {
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false
  };
  
  if (password.length >= 8) {
    strength += 20;
    checks.length = true;
  }
  if (password.length >= 12) {
    strength += 10;
  }
  if (/[a-z]/.test(password)) {
    strength += 20;
    checks.lowercase = true;
  }
  if (/[A-Z]/.test(password)) {
    strength += 20;
    checks.uppercase = true;
  }
  if (/[0-9]/.test(password)) {
    strength += 20;
    checks.number = true;
  }
  if (/[^a-zA-Z0-9]/.test(password)) {
    strength += 10;
    checks.special = true;
  }
  
  let label = 'Weak';
  let color = 'red';
  
  if (strength >= 80) {
    label = 'Strong';
    color = 'green';
  } else if (strength >= 60) {
    label = 'Good';
    color = 'yellow';
  } else if (strength >= 40) {
    label = 'Fair';
    color = 'orange';
  }
  
  return { strength, label, color, checks };
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};

// Validate file upload
export const validateFileUpload = (file, maxSize = 10 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']) => {
  if (!file) {
    return { valid: false, message: 'Please select a file' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, message: `File size must be less than ${maxSize / (1024 * 1024)}MB` };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, message: 'Invalid file type. Only images (JPEG, PNG, WEBP) and PDF files are allowed' };
  }
  
  return { valid: true, message: '' };
};

// Real-time validation for text fields with min/max length
export const validateTextFieldRealTime = (value, fieldName, minLength = 1, maxLength = 200) => {
  if (!value || value.trim().length === 0) {
    return { valid: false, message: `Please fill in ${fieldName}` };
  }
  
  if (value.trim().length < minLength) {
    return { valid: false, message: `${fieldName} must be at least ${minLength} characters` };
  }
  
  if (value.trim().length > maxLength) {
    return { valid: false, message: `${fieldName} must not exceed ${maxLength} characters` };
  }
  
  return { valid: true, message: '' };
};

// Validate date is in the future
export const validateFutureDate = (date, fieldName = 'Date') => {
  if (!date) {
    return { valid: false, message: `Please fill in ${fieldName}` };
  }
  
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate <= today) {
    return { valid: false, message: `${fieldName} must be in the future` };
  }
  
  return { valid: true, message: '' };
};

// Validate year range
export const validateYearRange = (year, minYear = 1950, maxYear = new Date().getFullYear()) => {
  if (!year) {
    return { valid: false, message: 'Please fill in year' };
  }
  
  const yearNum = parseInt(year);
  if (isNaN(yearNum)) {
    return { valid: false, message: 'Year must be a number' };
  }
  
  if (yearNum < minYear || yearNum > maxYear) {
    return { valid: false, message: `Year must be between ${minYear} and ${maxYear}` };
  }
  
  return { valid: true, message: '' };
};

export default {
  debounce,
  validateNameRealTime,
  validateEmailRealTime,
  validatePasswordRealTime,
  validatePhoneRealTime,
  formatPhoneNumber,
  validateAgeRealTime,
  validateConfirmPasswordRealTime,
  checkEmailUnique,
  checkPhoneUnique,
  calculatePasswordStrength,
  sanitizeInput,
  validateFileUpload,
  validateTextFieldRealTime,
  validateFutureDate,
  validateYearRange
};
