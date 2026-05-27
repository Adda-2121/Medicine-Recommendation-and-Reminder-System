# Validation System Testing Guide

## 🧪 Complete Testing Strategy

This guide provides comprehensive testing procedures for the validation system.

---

## 1. Frontend Validation Testing

### A. Real-Time Validation Tests

#### Name Validation
```javascript
// Test Cases
✅ Empty name → "please wright your full name"
✅ Single character → "please wright your full name"
✅ Name with numbers → "Name can only contain letters and spaces"
✅ Name with special chars → "Name can only contain letters and spaces"
✅ Valid English name → No error, green checkmark
✅ Valid Amharic name → No error, green checkmark
✅ Name > 50 chars → "Name is too long (max 50 characters)"

// Manual Test Steps
1. Open registration form
2. Click in name field
3. Type "J" → Should show "please wright your full name"
4. Type "John123" → Should show "Name can only contain letters and spaces"
5. Type "John Doe" → Should show green checkmark
6. Type "አበበ በቀለ" → Should show green checkmark
```

#### Email Validation
```javascript
// Test Cases
✅ Empty email → "Please fill in your email address"
✅ Invalid format → "Please enter a valid email address"
✅ Valid format → Check uniqueness (loading spinner)
✅ Duplicate email → "An account with this email already exists"
✅ Unique email → Green checkmark

// Manual Test Steps
1. Open registration form
2. Type "invalid" → Should show "Please enter a valid email address"
3. Type "test@" → Should show "Please enter a valid email address"
4. Type "test@example.com" → Should show loading spinner
5. If email exists → Should show "An account with this email already exists"
6. If email unique → Should show green checkmark
```

#### Password Validation
```javascript
// Test Cases
✅ Empty password → "Please fill in your password"
✅ < 8 chars → "Password must be at least 8 characters long"
✅ No lowercase → "Password must contain at least one lowercase letter"
✅ No uppercase → "Password must contain at least one uppercase letter"
✅ No number → "Password must contain at least one number"
✅ With spaces → "Password cannot contain spaces"
✅ Valid password → Green checkmark + strength indicator

// Manual Test Steps
1. Open registration form
2. Type "pass" → Should show "Password must be at least 8 characters long"
3. Type "password" → Should show "Password must contain at least one uppercase letter"
4. Type "Password" → Should show "Password must contain at least one number"
5. Type "Password123" → Should show green checkmark
6. Check strength indicator shows "Strong" or "Good"
```

#### Phone Validation
```javascript
// Test Cases
✅ Empty phone → No error (optional field)
✅ Invalid format → "Please enter a valid Ethiopian phone number"
✅ Auto-format "911234567" → "+251911234567"
✅ Auto-format "0911234567" → "+251911234567"
✅ Valid format → Check uniqueness
✅ Duplicate phone → "An account with this phone number already exists"
✅ Unique phone → Green checkmark

// Manual Test Steps
1. Open registration form
2. Type "911234567" → Should auto-format to "+251911234567"
3. Type "0911234567" → Should auto-format to "+251911234567"
4. Should show loading spinner while checking uniqueness
5. If phone exists → Should show error
6. If phone unique → Should show green checkmark
```

#### Confirm Password Validation
```javascript
// Test Cases
✅ Empty confirm → "Please confirm your password"
✅ Doesn't match → "Passwords do not match"
✅ Matches → "Passwords match!" + green checkmark

// Manual Test Steps
1. Type password "Password123"
2. Type confirm password "Password12" → Should show "Passwords do not match"
3. Type confirm password "Password123" → Should show "Passwords match!"
```

### B. Form Submission Tests

```javascript
// Test Cases
✅ Submit empty form → Show all field errors
✅ Submit with one invalid field → Show specific error
✅ Submit with valid data → Success
✅ Submit with duplicate email → Backend error shown
✅ Submit with duplicate phone → Backend error shown

// Manual Test Steps
1. Open registration form
2. Click "Create Account" without filling → Should show error banner
3. All empty fields should have red borders
4. Fill all fields correctly
5. Click "Create Account" → Should show loading state
6. On success → Should redirect to login
7. On error → Should show error message
```

---

## 2. Backend Validation Testing

### A. API Endpoint Tests

#### Check Email Uniqueness
```bash
# Test: Email doesn't exist
curl -X POST http://localhost:5000/api/auth/check-email \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com"}'

# Expected Response:
{
  "exists": false,
  "message": "Email is available"
}

# Test: Email exists
curl -X POST http://localhost:5000/api/auth/check-email \
  -H "Content-Type: application/json" \
  -d '{"email":"existing@example.com"}'

# Expected Response:
{
  "exists": true,
  "message": "An account with this email already exists"
}
```

#### Check Phone Uniqueness
```bash
# Test: Phone doesn't exist
curl -X POST http://localhost:5000/api/auth/check-phone \
  -H "Content-Type: application/json" \
  -d '{"phone":"+251911234567"}'

# Expected Response:
{
  "exists": false,
  "message": "Phone number is available"
}
```

#### Registration with Validation
```bash
# Test: Invalid email format
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "invalid-email",
    "password": "Password123",
    "age": 25,
    "sex": "Male",
    "role": "patient"
  }'

# Expected Response:
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please enter a valid email address"
    }
  ]
}

# Test: Weak password
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "weak",
    "age": 25,
    "sex": "Male",
    "role": "patient"
  }'

# Expected Response:
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    }
  ]
}
```

### B. Rate Limiting Tests

```bash
# Test: Exceed rate limit
# Run this command 6 times quickly:
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
done

# Expected: 6th request should return:
{
  "success": false,
  "message": "Too many attempts. Please try again later."
}
```

### C. XSS Prevention Tests

```bash
# Test: HTML injection
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<script>alert(\"XSS\")</script>John",
    "email": "john@example.com",
    "password": "Password123",
    "age": 25,
    "sex": "Male",
    "role": "patient"
  }'

# Expected: Name should be sanitized to "John" (script tags removed)
```

### D. File Upload Tests

```bash
# Test: Invalid file type
curl -X POST http://localhost:5000/api/auth/register \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "password=Password123" \
  -F "document=@malicious.exe"

# Expected Response:
{
  "success": false,
  "message": "Only images (JPEG, PNG, WEBP) and PDF files are allowed"
}

# Test: File too large (> 10MB)
curl -X POST http://localhost:5000/api/auth/register \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "password=Password123" \
  -F "document=@large_file.pdf"

# Expected Response:
{
  "success": false,
  "message": "File size must be less than 10MB"
}
```

---

## 3. Integration Testing

### A. Complete Registration Flow

```javascript
// Test Scenario: New patient registration
describe('Patient Registration Flow', () => {
  test('should complete full registration successfully', async () => {
    // 1. Open registration page
    await page.goto('http://localhost:3000/register');
    
    // 2. Fill name field
    await page.fill('input[name="name"]', 'John Doe');
    await expect(page.locator('.text-green-500')).toBeVisible(); // Green checkmark
    
    // 3. Fill email field
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.waitForSelector('.animate-spin'); // Loading spinner
    await expect(page.locator('.text-green-500')).toBeVisible(); // Green checkmark
    
    // 4. Fill password field
    await page.fill('input[name="password"]', 'Password123');
    await expect(page.locator('text=Strong')).toBeVisible(); // Strength indicator
    
    // 5. Fill confirm password
    await page.fill('input[name="confirmPassword"]', 'Password123');
    await expect(page.locator('text=Passwords match!')).toBeVisible();
    
    // 6. Fill phone number
    await page.fill('input[name="phone_number"]', '911234567');
    await expect(page.locator('input[name="phone_number"]')).toHaveValue('+251911234567');
    
    // 7. Fill age
    await page.fill('input[name="age"]', '25');
    
    // 8. Select gender
    await page.selectOption('select[name="sex"]', 'Male');
    
    // 9. Submit form
    await page.click('button[type="submit"]');
    
    // 10. Wait for success
    await expect(page).toHaveURL('http://localhost:3000/login');
    await expect(page.locator('text=Registration successful!')).toBeVisible();
  });
});
```

### B. Error Handling Flow

```javascript
// Test Scenario: Registration with duplicate email
describe('Duplicate Email Handling', () => {
  test('should show error for duplicate email', async () => {
    // 1. Open registration page
    await page.goto('http://localhost:3000/register');
    
    // 2. Fill with existing email
    await page.fill('input[name="email"]', 'existing@example.com');
    
    // 3. Wait for uniqueness check
    await page.waitForSelector('.animate-spin');
    
    // 4. Should show error
    await expect(page.locator('text=An account with this email already exists')).toBeVisible();
    
    // 5. Submit button should be disabled or show error on submit
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Please fix all validation errors')).toBeVisible();
  });
});
```

---

## 4. Security Testing

### A. SQL Injection Tests

```javascript
// Test: SQL injection in email field
const maliciousInputs = [
  "admin'--",
  "admin' OR '1'='1",
  "'; DROP TABLE users; --",
  "1' UNION SELECT * FROM users--"
];

maliciousInputs.forEach(input => {
  test(`should prevent SQL injection: ${input}`, async () => {
    const response = await api.post('/auth/register', {
      email: input,
      password: 'Password123',
      name: 'Test User',
      age: 25,
      sex: 'Male',
      role: 'patient'
    });
    
    // Should return validation error, not execute SQL
    expect(response.status).toBe(400);
    expect(response.data.message).toContain('valid email');
  });
});
```

### B. XSS Tests

```javascript
// Test: XSS in name field
const xssPayloads = [
  "<script>alert('XSS')</script>",
  "<img src=x onerror=alert('XSS')>",
  "javascript:alert('XSS')",
  "<svg onload=alert('XSS')>"
];

xssPayloads.forEach(payload => {
  test(`should sanitize XSS payload: ${payload}`, async () => {
    const response = await api.post('/auth/register', {
      name: payload,
      email: 'test@example.com',
      password: 'Password123',
      age: 25,
      sex: 'Male',
      role: 'patient'
    });
    
    // Name should be sanitized (HTML tags removed)
    expect(response.data.user.name).not.toContain('<');
    expect(response.data.user.name).not.toContain('>');
  });
});
```

### C. Rate Limiting Tests

```javascript
// Test: Brute force protection
test('should block after 5 failed login attempts', async () => {
  const attempts = [];
  
  // Make 6 login attempts
  for (let i = 0; i < 6; i++) {
    attempts.push(
      api.post('/auth/login', {
        email: 'test@example.com',
        password: 'WrongPassword'
      })
    );
  }
  
  const responses = await Promise.all(attempts);
  
  // First 5 should return 401 (unauthorized)
  responses.slice(0, 5).forEach(res => {
    expect(res.status).toBe(401);
  });
  
  // 6th should return 429 (too many requests)
  expect(responses[5].status).toBe(429);
  expect(responses[5].data.message).toContain('Too many attempts');
});
```

---

## 5. Performance Testing

### A. Real-Time Validation Performance

```javascript
// Test: Debouncing effectiveness
test('should debounce email validation', async () => {
  const startTime = Date.now();
  const apiCallCount = { count: 0 };
  
  // Mock API to count calls
  const mockCheckEmail = jest.fn(() => {
    apiCallCount.count++;
    return Promise.resolve({ exists: false });
  });
  
  // Type email quickly (simulate fast typing)
  const email = 'test@example.com';
  for (let i = 0; i < email.length; i++) {
    await handleEmailChange(email.substring(0, i + 1));
    await new Promise(resolve => setTimeout(resolve, 50)); // 50ms between keystrokes
  }
  
  // Wait for debounce
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // Should only make 1 API call (debounced)
  expect(apiCallCount.count).toBe(1);
});
```

### B. Form Submission Performance

```javascript
// Test: Form submission time
test('should submit form within 2 seconds', async () => {
  const startTime = Date.now();
  
  await api.post('/auth/register', validFormData);
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  expect(duration).toBeLessThan(2000); // Should complete in < 2 seconds
});
```

---

## 6. Accessibility Testing

### A. Screen Reader Tests

```javascript
// Test: Error messages are announced
test('should announce validation errors to screen readers', async () => {
  await page.goto('http://localhost:3000/register');
  
  // Submit empty form
  await page.click('button[type="submit"]');
  
  // Check for aria-live regions
  const errorRegion = await page.locator('[role="alert"]');
  await expect(errorRegion).toBeVisible();
  
  // Check for aria-invalid on fields
  const invalidFields = await page.locator('[aria-invalid="true"]');
  expect(await invalidFields.count()).toBeGreaterThan(0);
});
```

### B. Keyboard Navigation Tests

```javascript
// Test: Form can be completed with keyboard only
test('should allow keyboard-only navigation', async () => {
  await page.goto('http://localhost:3000/register');
  
  // Tab through all fields
  await page.keyboard.press('Tab'); // Name field
  await page.keyboard.type('John Doe');
  
  await page.keyboard.press('Tab'); // Email field
  await page.keyboard.type('john@example.com');
  
  await page.keyboard.press('Tab'); // Password field
  await page.keyboard.type('Password123');
  
  // Continue through all fields...
  
  // Submit with Enter key
  await page.keyboard.press('Enter');
  
  // Should submit successfully
  await expect(page).toHaveURL('http://localhost:3000/login');
});
```

---

## 7. Test Checklist

### Frontend Tests
- [ ] Real-time name validation
- [ ] Real-time email validation
- [ ] Email uniqueness check
- [ ] Real-time password validation
- [ ] Password strength indicator
- [ ] Confirm password matching
- [ ] Real-time phone validation
- [ ] Phone auto-formatting
- [ ] Phone uniqueness check
- [ ] Real-time age validation
- [ ] Form submission validation
- [ ] Error message display
- [ ] Success message display
- [ ] Loading states
- [ ] Disabled states

### Backend Tests
- [ ] Email format validation
- [ ] Email uniqueness validation
- [ ] Password strength validation
- [ ] Phone format validation
- [ ] Phone uniqueness validation
- [ ] Age range validation
- [ ] Required field validation
- [ ] XSS prevention
- [ ] SQL injection prevention
- [ ] Rate limiting
- [ ] File upload validation
- [ ] File type validation
- [ ] File size validation

### Integration Tests
- [ ] Complete registration flow
- [ ] Error handling flow
- [ ] Duplicate prevention flow
- [ ] File upload flow
- [ ] Multi-step form flow

### Security Tests
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Password hashing
- [ ] Secure file upload

### Performance Tests
- [ ] Debouncing effectiveness
- [ ] API response time
- [ ] Form submission time
- [ ] Real-time validation speed

### Accessibility Tests
- [ ] Screen reader compatibility
- [ ] Keyboard navigation
- [ ] ARIA labels
- [ ] Error announcements
- [ ] Focus management

---

## 8. Automated Testing Scripts

### Run All Tests
```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Continuous Integration
```yaml
# .github/workflows/validation-tests.yml
name: Validation Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend && npm install
          cd ../backend && npm install
      
      - name: Run frontend tests
        run: cd frontend && npm test
      
      - name: Run backend tests
        run: cd backend && npm test
      
      - name: Run integration tests
        run: npm run test:integration
```

---

## ✅ Testing Complete

All validation features should be thoroughly tested using this guide. Regular testing ensures the validation system remains secure, performant, and user-friendly.

**Happy Testing! 🧪**
