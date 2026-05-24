import { z } from 'zod';

// Shared base schemas
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .max(100, 'Password is too long')
  // We can add more strict rules here if needed, but keeping it simple for now to avoid breaking existing users.
  // .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  // .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  // .regex(/[0-9]/, 'Password must contain at least one number');

const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name is too long')
  .regex(/^[a-zA-Z\s]+$/, 'Name cannot contain numbers or special characters');

const emailSchema = z.string().email('Invalid email address');

// Login Schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Register Step 1 Schema
export const registerStep1Schema = z.object({
  name: nameSchema,
  age: z.coerce.number().min(0, 'Age must be positive').max(150, 'Invalid age'),
  sex: z.enum(['Male', 'Female'], { required_error: 'Please select a gender' }),
  password: passwordSchema,
  role: z.enum(['patient', 'doctor']),
});

// Register Doctor Step 3 Schema
export const registerDoctorStep3Schema = z.object({
  specialty: z.string().min(1, 'Specialty is required'),
  license_number: z.string().min(3, 'License number is required'),
  license_expiry_date: z.string().refine(date => new Date(date) > new Date(), {
    message: 'License expiry date must be in the future',
  }),
  license_issuing_authority: z.string().min(2, 'Issuing authority is required'),
  degree: z.string().min(2, 'Degree is required'),
  university_name: z.string().min(2, 'University name is required'),
  graduation_year: z.coerce.number().min(1950, 'Invalid graduation year').max(new Date().getFullYear(), 'Cannot be in the future'),
  current_workplace: z.string().optional(),
  experience_years: z.coerce.number().min(0, 'Cannot be negative').optional(),
});

// Profile Update Schema
export const profileUpdateSchema = z.object({
  name: nameSchema,
  age: z.coerce.number().min(0).max(150),
  sex: z.enum(['Male', 'Female']),
  phone_number: z.string().optional(),
  current_workplace: z.string().optional(),
});

// Password Update Schema
export const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
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
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Add Reminder Schema
export const reminderSchema = z.object({
  patient_id: z.coerce.string().min(1, 'Patient ID is required'),
  reminder_type: z.enum(['medicine', 'follow_up', 'general']),
  scheduled_time: z.string().min(1, 'Scheduled time is required'),
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
  message: "Medicine name is required",
  path: ["medicine_name"],
});

// Prescription Schema
export const prescriptionSchema = z.object({
  medication: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().min(1, 'Duration is required'),
  instructions: z.string().optional(),
});

// Lab Request Schema
export const labRequestSchema = z.object({
  test_type: z.string().min(1, 'Test type is required'),
  notes: z.string().optional(),
});

// Service Request Item Schema
export const addServiceItemSchema = z.object({
  name: z.string().min(2, 'Service name must be at least 2 characters'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  category_id: z.coerce.number().min(1, 'Category is required'),
});

export const addCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  description: z.string().optional(),
  department_type: z.enum(['laboratory', 'radiology']).optional(),
});

// Admin Dashboard - Add/Edit Doctor Schema
export const adminDoctorSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  specialty: z.string().min(1, 'Specialty is required'),
  license_number: z.string().min(1, 'License number is required'),
  experience_years: z.coerce.number().min(0, 'Experience years cannot be negative'),
});

export const adminEditDoctorSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  specialty: z.string().min(1, 'Specialty is required'),
  license_number: z.string().min(1, 'License number is required'),
  experience_years: z.coerce.number().min(0, 'Experience years cannot be negative'),
  current_workplace: z.string().optional(),
});

// Admin Dashboard - Add/Edit Specialist Schema
export const adminSpecialistSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  work_location: z.string().min(1, 'Work location is required'),
  role: z.enum(['laboratorist', 'radiologist']),
  specializations: z.array(z.string()).min(1, 'Select at least one specialization'),
});

export const adminEditSpecialistSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  work_location: z.string().min(1, 'Work location is required'),
  specializations: z.array(z.string()).min(1, 'Select at least one specialization'),
});

// Availability Slot Schema
export const availabilitySlotSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
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
  target_specialty: z.string().min(1, 'Specialist type is required'),
  referral_notes: z.string().min(1, 'Referral notes are required'),
  urgency: z.enum(['routine', 'urgent', 'emergency'], { required_error: 'Urgency is required' }),
});

// Upload Result Schema
export const uploadResultSchema = z.object({
  result_notes: z.string().optional(),
  result_file: z.any().refine(file => file !== null && file !== undefined, "Result file is required")
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
