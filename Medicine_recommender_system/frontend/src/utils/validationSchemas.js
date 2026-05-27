import { z } from 'zod';

// Shared base schemas
const passwordSchema = z.string()
  .min(1, 'Please fill in your password')
  .min(8, 'Password must be at least 8 characters long')
  .max(100, 'Password is too long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const nameSchema = z.string()
  .min(1, 'please wright your full name')
  .min(2, 'please wright your full name')
  .max(50, 'Name is too long')
  .regex(/^[a-zA-Z\s\u1200-\u137F]+$/, 'Name can only contain letters and spaces');

const namePartSchema = (label) => z.string()
  .min(1, `Please fill in your ${label}`)
  .min(2, `${label} must be at least 2 characters`)
  .max(50, `${label} is too long`)
  .regex(/^[a-zA-Z\s\u1200-\u137F]+$/, `${label} can only contain letters and spaces`);

const emailSchema = z.string()
  .min(1, 'Please fill in your email address')
  .email('Please enter a valid email address')
  .toLowerCase()
  .trim();

const phoneSchema = z.string()
  .refine(
    (val) => !val || val === '' || /^\+251[79]\d{8}$/.test(val),
    { message: 'Please enter a valid Ethiopian phone number (e.g., +251911234567)' }
  );

// Login Schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Please fill in your password'),
});

// Register Step 1 Schema
export const registerStep1Schema = z.object({
  first_name: namePartSchema('first name'),
  last_name: namePartSchema('last name'),
  email: emailSchema,
  phone_number: phoneSchema,
  age: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const n = Number(val);
      return Number.isNaN(n) ? undefined : n;
    },
    z.number({
      required_error: 'Please fill in your age',
      invalid_type_error: 'Please enter a valid age',
    }).min(1, 'Age must be at least 1').max(150, 'Invalid age')
  ),
  sex: z.enum(['Male', 'Female'], { required_error: 'Please select your gender' }),
  password: passwordSchema,
  role: z.enum(['patient', 'doctor'], { required_error: 'Please select your role' }),
});

// Register Doctor Step 3 Schema
export const registerDoctorStep3Schema = z.object({
  specialty: z.string().min(1, 'Please fill in your specialty'),
  license_number: z.string().min(1, 'Please fill in your license number').min(3, 'License number must be at least 3 characters'),
  license_expiry_date: z.string()
    .min(1, 'Please fill in license expiry date')
    .refine(date => new Date(date) > new Date(), {
      message: 'License expiry date must be in the future',
    }),
  license_issuing_authority: z.string().min(1, 'Please fill in issuing authority').min(2, 'Issuing authority must be at least 2 characters'),
  degree: z.string().min(1, 'Please fill in your degree').min(2, 'Degree must be at least 2 characters'),
  university_name: z.string().min(1, 'Please fill in your university name').min(2, 'University name must be at least 2 characters'),
  graduation_year: z.coerce.number()
    .min(1950, 'Invalid graduation year')
    .max(new Date().getFullYear(), 'Graduation year cannot be in the future'),
  current_workplace: z.string().optional(),
  experience_years: z.coerce.number().min(0, 'Experience years cannot be negative').optional(),
});

// Profile Update Schema
export const profileUpdateSchema = z.object({
  name: nameSchema,
  age: z.coerce.number()
    .min(1, 'Please fill in your age')
    .max(150, 'Invalid age'),
  sex: z.enum(['Male', 'Female'], { required_error: 'Please select your gender' }),
  phone_number: phoneSchema,
  current_workplace: z.string().optional(),
});

// Password Update Schema
export const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, 'Please fill in your current password'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Forgot Password Schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Reset Password Schema
export const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Add Reminder Schema
export const reminderSchema = z.object({
  patient_id: z.coerce.string().min(1, 'Please fill in patient ID'),
  reminder_type: z.enum(['medicine', 'follow_up', 'general'], { required_error: 'Please select reminder type' }),
  scheduled_time: z.string().min(1, 'Please fill in scheduled time'),
  medicine_name: z.string().optional(),
  medicine_type: z.string().optional(),
  dose: z.string().optional(),
  frequency: z.string().optional(),
}).refine(data => {
  if (data.reminder_type === 'medicine' && !data.medicine_name) {
    return false;
  }
  return true;
}, {
  message: "Please fill in medicine name",
  path: ["medicine_name"],
});

// Prescription Schema
export const prescriptionSchema = z.object({
  medication: z.string().min(1, 'Please fill in medication name'),
  dosage: z.string().min(1, 'Please fill in dosage'),
  frequency: z.string().min(1, 'Please fill in frequency'),
  duration: z.string().min(1, 'Please fill in duration'),
  instructions: z.string().optional(),
});

// Lab Request Schema
export const labRequestSchema = z.object({
  test_type: z.string().min(1, 'Please fill in test type'),
  notes: z.string().optional(),
});

// Service Request Item Schema
export const addServiceItemSchema = z.object({
  name: z.string().min(1, 'Please fill in service name').min(2, 'Service name must be at least 2 characters'),
  price: z.coerce.number().min(0, 'Please fill in a valid price'),
  category_id: z.coerce.number().min(1, 'Please select a category'),
});

export const addCategorySchema = z.object({
  name: z.string().min(1, 'Please fill in category name').min(2, 'Category name must be at least 2 characters'),
  description: z.string().optional(),
  department_type: z.enum(['laboratory', 'radiology']).optional(),
});

// Admin Dashboard - Add/Edit Doctor Schema
export const adminDoctorSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  specialty: z.string().min(1, 'Please fill in specialty'),
  license_number: z.string().min(1, 'Please fill in license number'),
  experience_years: z.coerce.number().min(0, 'Experience years cannot be negative'),
});

export const adminEditDoctorSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  specialty: z.string().min(1, 'Please fill in specialty'),
  license_number: z.string().min(1, 'Please fill in license number'),
  experience_years: z.coerce.number().min(0, 'Experience years cannot be negative'),
  current_workplace: z.string().optional(),
});

// Admin Dashboard - Add/Edit Specialist Schema
export const adminSpecialistSchema = z.object({
  first_name: namePartSchema('first name'),
  last_name: namePartSchema('last name'),
  email: emailSchema,
  password: passwordSchema,
  work_location: z.string().min(1, 'Please fill in work location'),
  role: z.enum(['laboratorist', 'radiologist'], { required_error: 'Please select role' }),
  specializations: z.array(z.string()).min(1, 'Please select at least one specialization'),
});

export const adminEditSpecialistSchema = z.object({
  first_name: namePartSchema('first name'),
  last_name: namePartSchema('last name'),
  email: emailSchema,
  work_location: z.string().min(1, 'Please fill in work location'),
  specializations: z.array(z.string()).min(1, 'Please select at least one specialization'),
});

// Availability Slot Schema
export const availabilitySlotSchema = z.object({
  date: z.string().min(1, 'Please fill in date'),
  start_time: z.string().min(1, 'Please fill in start time'),
  end_time: z.string().min(1, 'Please fill in end time'),
}).refine(data => {
  if (data.start_time && data.end_time) {
    const start = new Date(`1970-01-01T${data.start_time}`);
    const end = new Date(`1970-01-01T${data.end_time}`);
    return start < end;
  }
  return true;
}, {
  message: "End time must be after start time",
  path: ["end_time"]
});

// Referral Schema
export const referralSchema = z.object({
  target_specialty: z.string().min(1, 'Please select specialist type'),
  referral_reason: z.string().min(1, 'Please fill in referral reason'),
  referral_notes: z.string().min(1, 'Please fill in referral notes'),
  urgency: z.enum(['routine', 'urgent', 'emergency'], { required_error: 'Please select urgency level' }),
});

// Upload Result Schema
export const uploadResultSchema = z.object({
  result_notes: z.string().optional(),
  result_file: z.any().refine(file => file !== null && file !== undefined, "Please upload result file")
});

// Consultation Request Schema
export const consultationRequestSchema = z.object({
  symptoms: z.string().min(1, 'Please describe your symptoms').min(10, 'Please provide at least 10 characters describing your symptoms'),
  reason: z.string().min(1, 'Please select a reason for visit'),
});

// Service Request Schema
export const serviceRequestSchema = z.object({
  service_item_id: z.coerce.number().min(1, 'Please select a service'),
  notes: z.string().optional(),
});

// Specialist Update Status Schema
export const specialistUpdateStatusSchema = z.object({
  result_notes: z.string().min(1, 'Please fill in analysis notes').min(10, 'Please provide at least 10 characters in analysis notes'),
  status: z.enum(['completed', 'in_progress'], { required_error: 'Please select status' }),
});

// Feedback/Rating Schema
export const feedbackSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5, 'Rating must be between 1 and 5'),
  comment: z.string().min(5, 'Please provide at least 5 characters in your feedback').optional(),
});

// Chat Message Schema
export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Please type a message').max(5000, 'Message is too long'),
});

// Helper function to format Zod errors

export const formatZodErrors = (zodError) => {
  const errors = {};
  zodError.errors.forEach(err => {
    if (err.path.length > 0) {
      errors[err.path[0]] = err.message;
    }
  });
  return errors;
};
