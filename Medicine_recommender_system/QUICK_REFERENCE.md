# Validation System - Quick Reference Guide

## 🚀 Quick Start

### Frontend - Add Validation to a Form

```javascript
// 1. Import utilities
import { yourSchema, formatZodErrors } from '../utils/validationSchemas';
import { validateFieldRealTime, debounce } from '../utils/realTimeValidation';

// 2. Add state
const [fieldErrors, setFieldErrors] = useState({});
const [realTimeErrors, setRealTimeErrors] = useState({});

// 3. Add real-time validation
const handleFieldChange = debounce((value) => {
  const result = validateFieldRealTime(value);
  setRealTimeErrors(prev => ({ ...prev, fieldName: result.message }));
}, 300);

// 4. Validate on submit
const handleSubmit = async (e) => {
  e.preventDefault();
  setFieldErrors({});
  
  const result = yourSchema.safeParse(formData);
  if (!result.success) {
    setFieldErrors(formatZodErrors(result.error));
    toast.error('Please complete all required fields');
    return;
  }
  
  // Submit form
};

// 5. Show errors in UI
<input
  className={fieldErrors.fieldName ? 'border-red-500' : ''}
  onChange={(e) => handleFieldChange(e.target.value)}
/>
{fieldErrors.fieldName && <p className="text-red-500">{fieldErrors.fieldName}</p>}
```

### Backend - Add Validation to Route

```javascript
// 1. Import middleware
const { 
  yourValidation, 
  handleValidationErrors,
  sanitizeInput 
} = require('../middlewares/validationMiddleware');

// 2. Apply to route
router.post('/your-route',
  sanitizeInput,
  yourValidation(),
  handleValidationErrors,
  yourController
);
```

---

## 📋 Common Validation Functions

### Frontend

```javascript
// Name
validateNameRealTime(name)

// Email
validateEmailRealTime(email)
checkEmailUnique(email, api)

// Password
validatePasswordRealTime(password)
calculatePasswordStrength(password)

// Phone
validatePhoneRealTime(phone)
formatPhoneNumber(phone)
checkPhoneUnique(phone, api)

// Age
validateAgeRealTime(age)

// Confirm Password
validateConfirmPasswordRealTime(password, confirmPassword)

// File
validateFileUpload(file, maxSize, allowedTypes)

// Sanitize
sanitizeInput(input)
```

### Backend

```javascript
// Individual validations
nameValidation()
emailValidation()
passwordValidation()
phoneValidation()
ageValidation()
genderValidation()
roleValidation()

// Combined validations
registrationValidation()
loginValidation()
profileUpdateValidation()
passwordUpdateValidation()
consultationValidation()
referralValidation()
reminderValidation()
feedbackValidation()

// Utilities
handleValidationErrors
sanitizeInput
checkRateLimit(identifier, maxAttempts, windowMs)
```

---

## 🎨 UI Components

### EnhancedInput

```javascript
<EnhancedInput
  label="Email Address"
  name="email"
  type="email"
  value={formData.email}
  onChange={handleEmailChange}
  placeholder="john@example.com"
  required
  error={fieldErrors.email}
  realTimeError={realTimeErrors.email}
  isValidating={validationStates.email.isValidating}
  isValid={validationStates.email.isValid}
/>
```

### PasswordStrengthIndicator

```javascript
<PasswordStrengthIndicator 
  password={formData.password}
  showRequirements={true}
/>
```

---

## 🔒 Security Checklist

- [ ] Frontend validation (Zod)
- [ ] Backend validation (express-validator)
- [ ] Input sanitization (XSS prevention)
- [ ] Rate limiting (brute force protection)
- [ ] Duplicate checking (email, phone)
- [ ] File upload validation
- [ ] Password hashing (bcrypt)
- [ ] SQL injection prevention (Sequelize ORM)

---

## 📊 Validation Messages

### Required Fields
```
"Please fill in your full name"
"Please fill in your email address"
"Please fill in your password"
"Please select your gender"
```

### Format Validation
```
"Please enter a valid email address"
"Please enter a valid Ethiopian phone number (e.g., +251911234567)"
"Password must contain at least one lowercase letter"
"Password must contain at least one uppercase letter"
"Password must contain at least one number"
```

### Duplicate Checks
```
"An account with this email already exists"
"An account with this phone number already exists"
```

---

## 🧪 Testing Commands

```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

---

## 📞 API Endpoints

```http
# Check email uniqueness
POST /api/auth/check-email
Body: { "email": "test@example.com" }

# Check phone uniqueness
POST /api/auth/check-phone
Body: { "phone": "+251911234567" }

# Register with validation
POST /api/auth/register
Body: { name, email, password, age, sex, role, phone_number }

# Login with validation
POST /api/auth/login
Body: { email, password }
```

---

## 🎯 Common Patterns

### Debounced Real-Time Validation

```javascript
const handleEmailChange = debounce(async (email) => {
  // 1. Validate format
  const validation = validateEmailRealTime(email);
  
  // 2. Check uniqueness if valid
  if (validation.valid) {
    setIsValidating(true);
    const uniqueCheck = await checkEmailUnique(email, api);
    setIsValidating(false);
    setError(uniqueCheck.unique ? '' : uniqueCheck.message);
  } else {
    setError(validation.message);
  }
}, 500);
```

### Form Submission with Validation

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setFieldErrors({});
  
  // 1. Validate with Zod
  const result = schema.safeParse(formData);
  if (!result.success) {
    setFieldErrors(formatZodErrors(result.error));
    toast.error('Please complete all required fields');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  
  // 2. Submit to API
  try {
    await api.post('/endpoint', formData);
    toast.success('Success!');
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed');
  }
};
```

### Backend Route with Validation

```javascript
router.post('/endpoint',
  checkRateLimit('endpoint', 5, 15 * 60 * 1000),
  sanitizeInput,
  yourValidation(),
  handleValidationErrors,
  yourController
);
```

---

## 💡 Tips & Best Practices

### Frontend
1. Always debounce real-time validation (300-500ms)
2. Show loading states during async validation
3. Clear errors when user starts typing
4. Scroll to first error on submit
5. Use visual indicators (colors, icons)

### Backend
1. Always validate on backend (never trust frontend)
2. Sanitize all inputs (XSS prevention)
3. Use rate limiting on sensitive endpoints
4. Return clear, specific error messages
5. Log validation failures for monitoring

### Security
1. Never trust user input
2. Validate on both frontend and backend
3. Sanitize all inputs
4. Use parameterized queries (Sequelize)
5. Implement rate limiting
6. Hash passwords (bcrypt)
7. Validate file uploads

---

## 📚 Documentation Files

1. **COMPLETE_VALIDATION_SYSTEM.md** - Full system overview
2. **VALIDATION_IMPLEMENTATION_SUMMARY.md** - Implementation details
3. **ENHANCED_VALIDATION_MESSAGES.md** - All validation messages
4. **VALIDATION_USER_GUIDE.md** - User-friendly guide
5. **VALIDATION_TESTING_GUIDE.md** - Testing procedures
6. **IMPLEMENTATION_COMPLETE.md** - Implementation summary
7. **QUICK_REFERENCE.md** - This file

---

## 🆘 Troubleshooting

### Issue: Validation not working
- Check if schema is imported correctly
- Verify field names match schema
- Check console for errors

### Issue: Real-time validation too slow
- Increase debounce delay
- Check network requests
- Optimize validation logic

### Issue: Backend validation failing
- Check middleware order
- Verify validation rules
- Check error handling

### Issue: Duplicate check not working
- Verify API endpoint is correct
- Check network tab for requests
- Verify database connection

---

## ✅ Quick Checklist

Before deploying:
- [ ] All forms have frontend validation
- [ ] All forms have backend validation
- [ ] Real-time validation working
- [ ] Duplicate checks working
- [ ] Error messages clear and helpful
- [ ] Loading states implemented
- [ ] Success states implemented
- [ ] Rate limiting configured
- [ ] Input sanitization enabled
- [ ] File upload validation working
- [ ] Tests passing
- [ ] Documentation updated

---

## 🎉 You're Ready!

This quick reference covers the most common validation tasks. For detailed information, refer to the comprehensive documentation files.

**Happy Coding! 🚀**
