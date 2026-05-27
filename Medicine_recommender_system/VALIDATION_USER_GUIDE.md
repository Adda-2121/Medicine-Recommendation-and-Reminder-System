# User Guide: Form Validation

## How Form Validation Works

When you try to submit or proceed to the next step without filling required fields, the system will guide you with clear messages.

---

## 📋 Example: Registration Form

### Step 1: User tries to click "Next" without filling anything

**What you see:**

```
┌────────────────────────────────────────────────────────────┐
│ ⚠️ Please complete all required fields with valid         │
│    information before proceeding.                          │
└────────────────────────────────────────────────────────────┘

Full Name *
┌─────────────────────────────────────┐
│                                     │ ← Red border
└─────────────────────────────────────┘
⚠️ Please fill in your full name

Email Address *
┌─────────────────────────────────────┐
│                                     │ ← Red border
└─────────────────────────────────────┘
⚠️ Please fill in your email address

Password *
┌─────────────────────────────────────┐
│                                     │ ← Red border
└─────────────────────────────────────┘
⚠️ Please fill in your password

Age *
┌─────────────────────────────────────┐
│                                     │ ← Red border
└─────────────────────────────────────┘
⚠️ Please fill in your age

Gender *
┌─────────────────────────────────────┐
│ Select...                      ▼   │ ← Red border
└─────────────────────────────────────┘
⚠️ Please select your gender
```

---

### Step 2: User starts filling the name field

**What you see:**

```
Full Name *
┌─────────────────────────────────────┐
│ John                                │ ← Normal border (error cleared!)
└─────────────────────────────────────┘

Email Address *
┌─────────────────────────────────────┐
│                                     │ ← Still red
└─────────────────────────────────────┘
⚠️ Please fill in your email address
```

**✅ The error for "Full Name" disappeared automatically!**

---

### Step 3: User fills all fields correctly

**What you see:**

```
Full Name *
┌─────────────────────────────────────┐
│ John Doe                            │ ← Normal border ✓
└─────────────────────────────────────┘

Email Address *
┌─────────────────────────────────────┐
│ john@example.com                    │ ← Normal border ✓
└─────────────────────────────────────┘

Password *
┌─────────────────────────────────────┐
│ ••••••••                            │ ← Normal border ✓
└─────────────────────────────────────┘

Age *
┌─────────────────────────────────────┐
│ 25                                  │ ← Normal border ✓
└─────────────────────────────────────┘

Gender *
┌─────────────────────────────────────┐
│ Male                           ▼   │ ← Normal border ✓
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│              Next Step              │ ← Button is active!
└─────────────────────────────────────┘
```

**✅ All errors cleared! You can now proceed to the next step!**

---

## 🎯 Common Validation Messages You'll See

### Required Fields
- "Please fill in your full name"
- "Please fill in your email address"
- "Please fill in your password"
- "Please select your gender"
- "Please select your role"

### Format Validation
- "Please enter a valid email address"
- "Please enter a valid Ethiopian phone number (e.g., +251911234567)"
- "Password must contain at least one lowercase letter"
- "Password must contain at least one uppercase letter"
- "Password must contain at least one number"

### Length Validation
- "please wright your full name"
- "Password must be at least 8 characters long"
- "Please provide at least 10 characters describing your symptoms"

### Special Validations
- "Passwords don't match"
- "License expiry date must be in the future"
- "End time must be after start time"
- "Graduation year cannot be in the future"

---

## 💡 Tips for Filling Forms

### 1. **Look for the red asterisk (*)**
   - Fields marked with * are required
   - You must fill these before proceeding

### 2. **Watch for red borders**
   - Red border = field needs attention
   - Normal border = field is okay

### 3. **Read the error messages**
   - Each message tells you exactly what to do
   - "Please fill in..." = field is empty
   - "Please select..." = you need to choose an option
   - Other messages = format or validation issue

### 4. **Errors clear automatically**
   - Start typing in a field
   - The error disappears immediately
   - No need to click anything else

### 5. **Top banner message**
   - If you see a red banner at the top
   - It means some fields still need attention
   - Scroll down to find red-bordered fields

---

## 📱 Step-by-Step Forms (Like Registration)

### Multi-Step Process

```
Step 1: Basic Information
├─ Fill all required fields
├─ Click "Next"
└─ ✓ Validation passes → Move to Step 2

Step 2: Identity Documents (Doctors only)
├─ Upload required documents
├─ Click "Next"
└─ ✓ Validation passes → Move to Step 3

Step 3: Professional Credentials (Doctors only)
├─ Fill all professional details
├─ Click "Register"
└─ ✓ Validation passes → Account created!
```

**Important:** You cannot skip steps! Each step must be completed before moving to the next.

---

## 🔐 Password Requirements

When creating a password, make sure it has:

✅ At least 8 characters
✅ At least one lowercase letter (a-z)
✅ At least one uppercase letter (A-Z)
✅ At least one number (0-9)

**Example of valid passwords:**
- `MyPass123`
- `SecureP@ss1`
- `Doctor2024!`

**Example of invalid passwords:**
- `password` ❌ (no uppercase, no number)
- `PASSWORD` ❌ (no lowercase, no number)
- `Pass123` ❌ (less than 8 characters)

---

## 📞 Phone Number Format

Ethiopian phone numbers must be in this format:

**Format:** `+251XXXXXXXXX`

**Examples:**
- `+251911234567` ✅
- `+251712345678` ✅

**Invalid formats:**
- `0911234567` ❌ (missing +251)
- `911234567` ❌ (missing +251)
- `+251 911 234 567` ❌ (no spaces allowed)

**Tip:** The system will automatically add +251 when you start typing!

---

## 👤 Name Requirements

Your name should:
- Be at least 2 characters long
- Contain only letters and spaces
- Support both English and Amharic characters

**Valid names:**
- `John Doe` ✅
- `አበበ በቀለ` ✅
- `Sara Ahmed` ✅

**Invalid names:**
- `J` ❌ (too short)
- `John123` ❌ (contains numbers)
- `John@Doe` ❌ (contains special characters)

---

## 📧 Email Requirements

Your email must:
- Be a valid email format
- Contain @ symbol
- Have a domain (like .com, .et, etc.)

**Valid emails:**
- `john@example.com` ✅
- `doctor@hospital.et` ✅
- `user.name@domain.co.uk` ✅

**Invalid emails:**
- `john@` ❌ (no domain)
- `john.com` ❌ (no @ symbol)
- `@example.com` ❌ (no username)

---

## 🎓 Doctor Registration Special Fields

### License Number
- Must be at least 3 characters
- Example: `MD12345`

### License Expiry Date
- Must be a future date
- Cannot be today or in the past

### Graduation Year
- Must be between 1950 and current year
- Cannot be in the future

### University Name
- Must be at least 2 characters
- Example: `Addis Ababa University`

---

## ✨ What Makes This Validation Professional?

1. **Clear Messages**: You always know what's wrong
2. **Instant Feedback**: Errors clear as you type
3. **Visual Indicators**: Red borders show problem fields
4. **Helpful Guidance**: Messages tell you exactly what to do
5. **No Surprises**: Validation happens before submission
6. **User-Friendly**: Polite language with "please"
7. **Consistent**: Same pattern across all forms

---

## 🆘 Troubleshooting

### "I filled everything but still see errors"

**Check for:**
1. Red-bordered fields you might have missed
2. Dropdown menus that need selection
3. Password requirements (8+ chars, uppercase, lowercase, number)
4. Phone number format (+251XXXXXXXXX)
5. Email format (must have @ and domain)

### "Error message won't go away"

**Try:**
1. Clear the field completely
2. Type the correct information
3. Make sure you meet all requirements
4. Check the specific error message for guidance

### "I can't click Next/Submit"

**This means:**
1. Some required fields are still empty
2. Some fields have validation errors
3. Look for red borders and error messages
4. Fill/fix those fields first

---

## 🎉 Success!

When all validations pass, you'll see:
- ✅ No red borders
- ✅ No error messages
- ✅ Active Next/Submit button
- ✅ Success message after submission

**Congratulations! Your form is complete!**

---

## 📞 Need Help?

If you're stuck:
1. Read the error messages carefully
2. Check this guide for requirements
3. Make sure all required fields (*) are filled
4. Verify your information matches the format requirements
5. Contact support if issues persist

---

**Remember: The validation is here to help you! It ensures all information is correct before submission, saving you time and preventing errors.** 🎯
