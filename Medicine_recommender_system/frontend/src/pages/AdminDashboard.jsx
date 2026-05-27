import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, Activity, FileText, PieChart, ShieldPlus, Calendar, Stethoscope, Settings, FlaskConical, CheckCircle2, Clock, CreditCard, UserX, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

import ConfirmationModal from '../components/common/ConfirmationModal';
import RowMenu from '../components/common/RowMenu';
import ReasonModal from '../components/common/ReasonModal';
import FieldTooltip from '../components/common/FieldTooltip';
import { 
  adminDoctorSchema, 
  adminEditDoctorSchema, 
  adminSpecialistSchema, 
  adminEditSpecialistSchema, 
  addCategorySchema, 
  addServiceItemSchema, 
  formatZodErrors 
} from '../utils/validationSchemas';

// Sub-components for tabs
const OverviewTab = ({ stats }) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center text-center hover:shadow-md transition">
        <div className="bg-blue-100 text-blue-600 p-3 rounded-full mx-auto mb-3"><Users size={24} /></div>
        <p className="text-slate-500 font-medium text-sm uppercase tracking-wide">Total Patients</p>
        <h2 className="text-3xl font-bold text-slate-800">{stats.patients || stats.users}</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center text-center hover:shadow-md transition">
        <div className="bg-green-100 text-green-600 p-3 rounded-full mx-auto mb-3"><Stethoscope size={24} /></div>
        <p className="text-slate-500 font-medium text-sm uppercase tracking-wide">Total Doctors</p>
        <h2 className="text-3xl font-bold text-slate-800">{stats.doctors || 0}</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center text-center hover:shadow-md transition">
        <div className="bg-purple-100 text-purple-600 p-3 rounded-full mx-auto mb-3"><Activity size={24} /></div>
        <p className="text-slate-500 font-medium text-sm uppercase tracking-wide">Active Consultations</p>
        <h2 className="text-3xl font-bold text-slate-800">{stats.activeConsultations || stats.consultations}</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center text-center hover:shadow-md transition">
        <div className="bg-amber-100 text-amber-600 p-3 rounded-full mx-auto mb-3"><Calendar size={24} /></div>
        <p className="text-slate-500 font-medium text-sm uppercase tracking-wide">Today's Reminders</p>
        <h2 className="text-3xl font-bold text-slate-800">{stats.reminders || 0}</h2>
      </div>
    </div>

    {/* Analytics Charts (Placeholders) */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-slate-800">Consultations per Day</h3>
          <select className="text-sm border-slate-200 rounded-md text-slate-500 bg-slate-50 px-2 py-1 outline-none">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
        </div>
        <div className="h-64 bg-slate-50 border border-slate-100 rounded-lg flex items-end px-4 pt-10 pb-4 space-x-2 justify-between">
          {/* Mock Bar Chart */}
          {[40, 60, 45, 80, 50, 90, 75].map((height, i) => (
            <div key={i} className="w-full flex flex-col items-center group">
              <div className="w-full bg-blue-100 rounded-t-sm group-hover:bg-blue-200 transition-colors relative" style={{ height: `${height}%` }}>
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-500 opacity-0 group-hover:opacity-100">{height}</span>
              </div>
              <span className="text-xs text-slate-400 mt-2">D{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-slate-800">Doctor Workload</h3>
          <PieChart className="text-slate-400" size={20} />
        </div>
        <div className="h-64 flex flex-col justify-center items-center">
          {/* Mock Pie/Donut Chart visual */}
          <div className="relative w-40 h-40 rounded-full border-[16px] border-slate-100" style={{ backgroundImage: 'conic-gradient(from 0deg, #3b82f6 0% 40%, #10b981 40% 75%, #f59e0b 75% 100%)' }}>
            <div className="absolute inset-0 bg-white m-4 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-slate-800">{stats.doctors || 3}</span>
            </div>
          </div>
          <div className="flex space-x-4 mt-8 text-sm">
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>Dr. Smith</div>
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span>Dr. Lee</div>
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span>Dr. Patel</div>
          </div>
        </div>
      </div>
    </div>
  </>
);

const DoctorsTab = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '',
    specialty: '', license_number: '', experience_years: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [modalConfig, setModalConfig] = useState({ isOpen: false, doctorId: null });

  // Edit state
  const [editDoctor, setEditDoctor] = useState(null); // doctor being edited
  const [editForm, setEditForm] = useState({ name: '', email: '', specialty: '', license_number: '', experience_years: '', current_workplace: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editFieldErrors, setEditFieldErrors] = useState({});

  // Reason modal state (reject / suspend)
  const [reasonModal, setReasonModal] = useState({ isOpen: false, action: null }); // action: 'rejected' | 'suspended'

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users?role=doctor');
      setDoctors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    
    // Validate all required fields
    if (!formData.name || formData.name.trim().length < 2) {
      setFieldErrors({ name: 'please wright your full name' });
      setError('Please complete all required fields with valid information.');
      return;
    }
    
    if (!formData.email || !formData.email.includes('@')) {
      setFieldErrors({ email: 'Please enter a valid email address' });
      setError('Please enter a valid email address.');
      return;
    }
    
    if (!formData.password || formData.password.length < 8) {
      setFieldErrors({ password: 'Password must be at least 8 characters long' });
      setError('Password must be at least 8 characters and contain uppercase, lowercase, and number.');
      return;
    }
    
    if (!formData.specialty) {
      setFieldErrors({ specialty: 'Please select a medical specialty' });
      setError('Please select a medical specialty.');
      return;
    }
    
    if (!formData.license_number || formData.license_number.trim().length === 0) {
      setFieldErrors({ license_number: 'License number is required' });
      setError('Please enter the medical license number.');
      return;
    }
    
    const result = adminDoctorSchema.safeParse(formData);
    if (!result.success) {
      setFieldErrors(formatZodErrors(result.error));
      setError('Please complete all required fields with valid information.');
      return;
    }

    setFormLoading(true);
    try {
      await api.post('/users', { ...formData, role: 'doctor' });
      setFormData({
        name: '', email: '', password: '',
        specialty: '', license_number: '', experience_years: ''
      });
      setFieldErrors({});
      setShowForm(false);
      fetchDoctors();
      toast.success('Doctor registered successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register doctor');
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = (id) => {
    setModalConfig({ isOpen: true, doctorId: id });
  };

  const executeDelete = async () => {
    try {
      await api.delete(`/users/${modalConfig.doctorId}`);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove doctor. Ensure they have no dependent records.');
    }
  };

  const handleVerify = async (id, status, reason = null) => {
    try {
      await api.put(`/users/${id}/verify`, { status, rejection_reason: reason });
      fetchDoctors();
      if (selectedDoctor && selectedDoctor.id === id) {
        setSelectedDoctor({ ...selectedDoctor, verification_status: status, is_verified: status === 'verified', rejection_reason: reason });
      }
      toast.success(`Doctor marked as ${status}`);
    } catch (err) {
      toast.error('Failed to update verification status');
    }
  };

  const openEdit = (doctor) => {
    setEditDoctor(doctor);
    setEditForm({
      name: doctor.name || '',
      email: doctor.email || '',
      specialty: doctor.specialty || '',
      license_number: doctor.license_number || '',
      experience_years: doctor.experience_years || '',
      current_workplace: doctor.current_workplace || '',
    });
    setEditFieldErrors({});
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditFieldErrors({});

    // Validate all required fields
    if (!editForm.name || editForm.name.trim().length < 2) {
      setEditFieldErrors({ name: 'please wright your full name' });
      toast.error('Please complete all required fields with valid information.');
      return;
    }
    
    if (!editForm.email || !editForm.email.includes('@')) {
      setEditFieldErrors({ email: 'Please enter a valid email address' });
      toast.error('Please enter a valid email address.');
      return;
    }
    
    if (!editForm.specialty) {
      setEditFieldErrors({ specialty: 'Please select a medical specialty' });
      toast.error('Please select a medical specialty.');
      return;
    }
    
    if (!editForm.license_number || editForm.license_number.trim().length === 0) {
      setEditFieldErrors({ license_number: 'License number is required' });
      toast.error('Please enter the medical license number.');
      return;
    }

    const result = adminEditDoctorSchema.safeParse(editForm);
    if (!result.success) {
      setEditFieldErrors(formatZodErrors(result.error));
      toast.error('Please complete all required fields with valid information.');
      return;
    }

    setEditLoading(true);
    try {
      await api.put(`/users/${editDoctor.id}`, editForm);
      toast.success('Doctor updated successfully');
      setEditDoctor(null);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update doctor');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-semibold text-xl text-slate-800">Doctor Management & Verification</h3>
          <p className="text-slate-500 text-sm mt-1">Register new doctors and verify their professional credentials.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition font-medium text-sm flex items-center shadow-sm"
        >
          {showForm ? 'Cancel' : '+ Register Doctor'}
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'all', label: 'All Doctors' },
          { key: 'pending', label: 'Pending Review', color: 'amber' },
          { key: 'verified', label: 'Verified', color: 'emerald' },
          { key: 'rejected', label: 'Rejected', color: 'red' },
          { key: 'suspended', label: 'Suspended', color: 'slate' },
        ].map(({ key, label, color }) => {
          const count = key === 'all' ? doctors.length : doctors.filter(d => (d.verification_status || 'pending') === key).length;
          const isActive = statusFilter === key;
          const colorMap = {
            amber: isActive ? 'bg-amber-600 text-white border-amber-600' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
            emerald: isActive ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
            red: isActive ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
            slate: isActive ? 'bg-slate-600 text-white border-slate-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
          };
          const cls = color ? colorMap[color] : (isActive ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50');
          return (
            <button key={key} onClick={() => setStatusFilter(key)} className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition ${cls}`}>
              {label} <span className="ml-1 opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {showForm && (
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8 max-w-3xl">
          <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Medical Professional Registration</h4>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4 border border-red-200">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text" placeholder="Dr. Memar Alemneh"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white ${fieldErrors.name ? 'border-red-500' : 'border-slate-300'}`}
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email" placeholder="memar.alemneh@hospital.com"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white ${fieldErrors.email ? 'border-red-500' : 'border-slate-300'}`}
                  value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Specialty</label>
                <select
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white ${fieldErrors.specialty ? 'border-red-500' : 'border-slate-300'}`}
                  value={formData.specialty} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                >
                  <option value="" disabled>Select specialty…</option>
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
                {fieldErrors.specialty && <p className="text-red-500 text-xs mt-1">{fieldErrors.specialty}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Medical License Number</label>
                <input
                  type="text" placeholder="e.g. MED-12345678"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white ${fieldErrors.license_number ? 'border-red-500' : 'border-slate-300'}`}
                  value={formData.license_number} onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                />
                {fieldErrors.license_number && <p className="text-red-500 text-xs mt-1">{fieldErrors.license_number}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Years of Experience</label>
                <input
                  type="number" min="0" placeholder="e.g. 10"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white ${fieldErrors.experience_years ? 'border-red-500' : 'border-slate-300'}`}
                  value={formData.experience_years} onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                />
                {fieldErrors.experience_years && <p className="text-red-500 text-xs mt-1">{fieldErrors.experience_years}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white ${fieldErrors.password ? 'border-red-500' : 'border-slate-300'}`}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
                  <span className="absolute right-2 top-2 cursor-pointer text-slate-400" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-md text-sm flex items-start mt-2">
              <ShieldPlus className="mr-2 flex-shrink-0 mt-0.5" size={16} />
              <p>Note: Newly registered doctors are created as <strong>Unverified</strong> by default. You must verify their credentials below before they can conduct consultations.</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit" disabled={formLoading}
                className="bg-primary-600 text-white px-6 py-2.5 rounded-md hover:bg-primary-700 transition font-bold shadow-sm disabled:opacity-70"
              >
                {formLoading ? 'Registering...' : 'Complete Registration'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-slate-200 rounded w-full mb-2"></div>
          <div className="h-16 bg-slate-100 rounded w-full"></div>
          <div className="h-16 bg-slate-100 rounded w-full"></div>
        </div>
      ) : doctors.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Doctor Details</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Specialty / License</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {doctors
                .filter(d => statusFilter === 'all' || (d.verification_status || 'pending') === statusFilter)
                .map((doctor) => (
                <tr key={doctor.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold overflow-hidden border border-slate-200
                        ${doctor.is_verified ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-400'}`}>
                        {doctor.profile_picture ? (
                          <img src={`${api.defaults.baseURL?.replace(/\/api$/, '') || 'http://localhost:5000'}${doctor.profile_picture}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                          doctor.name.charAt(0)
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-slate-900">Dr. {doctor.name}</div>
                        <div className="text-sm text-slate-500">{doctor.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900 font-medium">{doctor.specialty || 'General Practice'}</div>
                    <div className="text-xs text-slate-500">{doctor.license_number || 'No License Provided'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border
                      ${doctor.verification_status === 'verified'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : doctor.verification_status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200'
                        : doctor.verification_status === 'suspended' ? 'bg-slate-50 text-slate-700 border-slate-300'
                        : 'bg-amber-50 text-amber-700 border-amber-200'}`}
                    >
                      {doctor.verification_status ? doctor.verification_status.charAt(0).toUpperCase() + doctor.verification_status.slice(1) : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedDoctor(doctor)}
                      className="mr-3 px-3 py-1.5 rounded text-xs font-bold transition text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                    >
                      Review Details
                    </button>
                    <RowMenu
                      onEdit={() => openEdit(doctor)}
                      onDelete={() => confirmDelete(doctor.id)}
                      deleteLabel="Remove"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center p-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <div className="bg-white p-4 rounded-full inline-block mb-4 shadow-sm border border-slate-100">
            <Stethoscope className="text-primary-400" size={32} />
          </div>
          <p className="text-xl text-slate-700 font-bold mb-1">No doctors registered yet</p>
          <p className="text-slate-500 max-w-sm mx-auto">Register medical professionals here to allow them to conduct consultations with patients.</p>
        </div>
      )}

      {/* Review Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-2xl font-bold text-slate-800 flex items-center">
                <ShieldPlus className="mr-2 text-primary-600" /> Verify Credentials: Dr. {selectedDoctor.name}
              </h3>
              <button onClick={() => setSelectedDoctor(null)} className="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none">&times;</button>
            </div>

            <div className="p-6 flex-1 text-sm bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Details Section */}
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                    <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-xs mb-3 border-b pb-2">Professional Profile</h4>
                    <ul className="space-y-3">
                      <li className="flex justify-between"><span className="text-slate-500">Email:</span> <span className="font-medium text-slate-800">{selectedDoctor.email}</span></li>
                      <li className="flex justify-between"><span className="text-slate-500">Specialty:</span> <span className="font-medium text-slate-800">{selectedDoctor.specialty || 'General'}</span></li>
                      <li className="flex justify-between"><span className="text-slate-500">Experience:</span> <span className="font-medium text-slate-800">{selectedDoctor.experience_years} Years</span></li>
                      <li className="flex justify-between"><span className="text-slate-500">Workplace:</span> <span className="font-medium text-slate-800">{selectedDoctor.current_workplace || 'N/A'}</span></li>
                    </ul>
                  </div>
                  
                  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                    <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-xs mb-3 border-b pb-2">Education Verification</h4>
                    <ul className="space-y-3">
                      <li className="flex justify-between"><span className="text-slate-500">Degree:</span> <span className="font-medium text-slate-800">{selectedDoctor.degree || 'N/A'}</span></li>
                      <li className="flex justify-between"><span className="text-slate-500">University:</span> <span className="font-medium text-slate-800">{selectedDoctor.university_name || 'N/A'}</span></li>
                      <li className="flex justify-between"><span className="text-slate-500">Graduation Year:</span> <span className="font-medium text-slate-800">{selectedDoctor.graduation_year || 'N/A'}</span></li>
                    </ul>
                  </div>

                  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                    <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-xs mb-3 border-b pb-2">License Verification</h4>
                    <ul className="space-y-3">
                      <li className="flex justify-between"><span className="text-slate-500">License No:</span> <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-bold">{selectedDoctor.license_number || 'N/A'}</span></li>
                      <li className="flex justify-between"><span className="text-slate-500">Authority:</span> <span className="font-medium text-slate-800 text-right">{selectedDoctor.license_issuing_authority || 'N/A'}</span></li>
                      <li className="flex justify-between"><span className="text-slate-500">Expiry Date:</span>
                        <span className={`font-bold ${new Date(selectedDoctor.license_expiry_date) < new Date() ? 'text-red-600' : 'text-emerald-600'}`}>
                          {selectedDoctor.license_expiry_date ? new Date(selectedDoctor.license_expiry_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm text-center">
                    <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-xs mb-3 border-b pb-2">Status</h4>
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border 
                      ${selectedDoctor.verification_status === 'verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : selectedDoctor.verification_status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200'
                      : selectedDoctor.verification_status === 'suspended' ? 'bg-slate-50 text-slate-700 border-slate-300'
                      : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {selectedDoctor.verification_status === 'verified' ? '✓ Verified Professional' 
                      : selectedDoctor.verification_status === 'rejected' ? '✕ Application Rejected'
                      : selectedDoctor.verification_status === 'suspended' ? '⚠ Account Suspended'
                      : '⚠ Pending Verification'}
                    </div>
                    {selectedDoctor.rejection_reason && (
                        <p className="mt-3 text-red-600 text-xs italic border border-red-200 bg-red-50 p-2 rounded text-left">
                            <strong>Reason:</strong> {selectedDoctor.rejection_reason}
                        </p>
                    )}
                  </div>
                </div>

                {/* Documents Section */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                        <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-xs mb-3 border-b pb-2">Live Selfie</h4>
                        <div className="aspect-square bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center overflow-hidden">
                          {selectedDoctor.selfie_document ? (
                            <img src={`${api.defaults.baseURL.replace(/\/api$/, '') || 'http://localhost:5000'}/${selectedDoctor.selfie_document.replace(/\\/g, '/')}`} alt="Doctor Selfie" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-slate-400 italic">No selfie</span>
                          )}
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                        <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-xs mb-3 border-b pb-2">National ID</h4>
                        <div className="aspect-square bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center overflow-hidden relative">
                          {selectedDoctor.id_document ? (
                            selectedDoctor.id_document.endsWith('.pdf') ? (
                              <div className="flex flex-col items-center justify-center space-y-3 h-full">
                                <FileText size={32} className="text-red-400" />
                                <a href={`${api.defaults.baseURL.replace(/\/api$/, '') || 'http://localhost:5000'}/${selectedDoctor.id_document.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" className="text-primary-600 text-xs hover:underline bg-primary-50 px-3 py-1 rounded-full border border-primary-100">Open PDF</a>
                              </div>
                            ) : (
                              <a href={`${api.defaults.baseURL.replace(/\/api$/, '') || 'http://localhost:5000'}/${selectedDoctor.id_document.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" className="w-full h-full">
                                <img src={`${api.defaults.baseURL.replace(/\/api$/, '') || 'http://localhost:5000'}/${selectedDoctor.id_document.replace(/\\/g, '/')}`} alt="ID Document" className="w-full h-full object-contain" />
                              </a>
                            )
                          ) : (
                            <span className="text-slate-400 italic">No ID uploaded</span>
                          )}
                        </div>
                      </div>
                  </div>

                  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                    <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-xs mb-3 border-b pb-2">Medical License Document</h4>
                    <div className="h-48 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center overflow-hidden relative">
                      {selectedDoctor.verification_document ? (
                        selectedDoctor.verification_document.endsWith('.pdf') ? (
                          <div className="flex flex-col items-center justify-center space-y-3 h-full">
                            <FileText size={48} className="text-red-400" />
                            <a href={`${api.defaults.baseURL.replace(/\/api$/, '') || 'http://localhost:5000'}/${selectedDoctor.verification_document.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" className="text-primary-600 font-semibold hover:underline bg-primary-50 px-4 py-2 rounded-full border border-primary-100">Open PDF Document</a>
                          </div>
                        ) : (
                          <a href={`${api.defaults.baseURL.replace(/\/api$/, '') || 'http://localhost:5000'}/${selectedDoctor.verification_document.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" className="w-full h-full">
                              <img src={`${api.defaults.baseURL.replace(/\/api$/, '') || 'http://localhost:5000'}/${selectedDoctor.verification_document.replace(/\\/g, '/')}`} alt="License Document" className="w-full h-full object-contain" />
                          </a>
                        )
                      ) : (
                        <span className="text-slate-400 italic">No document uploaded</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                    <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-xs mb-3 border-b pb-2">Degree Document</h4>
                    <div className="h-48 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center overflow-hidden relative">
                      {selectedDoctor.degree_document ? (
                        selectedDoctor.degree_document.endsWith('.pdf') ? (
                          <div className="flex flex-col items-center justify-center space-y-3 h-full">
                            <FileText size={48} className="text-red-400" />
                            <a href={`${api.defaults.baseURL.replace(/\/api$/, '') || 'http://localhost:5000'}/${selectedDoctor.degree_document.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" className="text-primary-600 font-semibold hover:underline bg-primary-50 px-4 py-2 rounded-full border border-primary-100">Open PDF Document</a>
                          </div>
                        ) : (
                          <a href={`${api.defaults.baseURL.replace(/\/api$/, '') || 'http://localhost:5000'}/${selectedDoctor.degree_document.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" className="w-full h-full">
                              <img src={`${api.defaults.baseURL.replace(/\/api$/, '') || 'http://localhost:5000'}/${selectedDoctor.degree_document.replace(/\\/g, '/')}`} alt="Degree Document" className="w-full h-full object-contain" />
                          </a>
                        )
                      ) : (
                        <span className="text-slate-400 italic">No document uploaded</span>
                      )}
                    </div>
                  </div>
                  
                  {selectedDoctor.experience_document && (
                  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                    <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-xs mb-3 border-b pb-2">Experience Document</h4>
                    <div className="h-48 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center overflow-hidden relative">
                        {selectedDoctor.experience_document.endsWith('.pdf') ? (
                          <div className="flex flex-col items-center justify-center space-y-3 h-full">
                            <FileText size={48} className="text-red-400" />
                            <a href={`${api.defaults.baseURL.replace(/\/api$/, '') || 'http://localhost:5000'}/${selectedDoctor.experience_document.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" className="text-primary-600 font-semibold hover:underline bg-primary-50 px-4 py-2 rounded-full border border-primary-100">Open PDF Document</a>
                          </div>
                        ) : (
                          <a href={`${api.defaults.baseURL.replace(/\/api$/, '') || 'http://localhost:5000'}/${selectedDoctor.experience_document.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" className="w-full h-full">
                              <img src={`${api.defaults.baseURL.replace(/\/api$/, '') || 'http://localhost:5000'}/${selectedDoctor.experience_document.replace(/\\/g, '/')}`} alt="Experience Document" className="w-full h-full object-contain" />
                          </a>
                        )}
                    </div>
                  </div>
                  )}

                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-white sticky bottom-0 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                 <button
                   onClick={() => setReasonModal({ isOpen: true, action: 'rejected' })}
                   className="px-4 py-2 border border-red-300 bg-red-50 text-red-700 rounded-md font-medium hover:bg-red-100 transition shadow-sm text-sm">
                     Reject Application
                 </button>
                 {selectedDoctor.verification_status !== 'pending' && (
                     <button onClick={() => handleVerify(selectedDoctor.id, 'pending')} className="px-4 py-2 border border-amber-300 bg-amber-50 text-amber-700 rounded-md font-medium hover:bg-amber-100 transition shadow-sm text-sm">
                         Set Pending
                     </button>
                 )}
                 {selectedDoctor.verification_status === 'verified' && (
                     <button
                       onClick={() => setReasonModal({ isOpen: true, action: 'suspended' })}
                       className="px-4 py-2 border border-slate-300 bg-slate-100 text-slate-700 rounded-md font-medium hover:bg-slate-200 transition shadow-sm text-sm">
                         Suspend Account
                     </button>
                 )}
              </div>
              <div className="flex space-x-4">
                  <button onClick={() => setSelectedDoctor(null)} className="px-6 py-2 border border-slate-300 rounded-md text-slate-700 font-medium hover:bg-slate-50 transition">Close</button>
                  {selectedDoctor.verification_status !== 'verified' && (
                    <button onClick={() => handleVerify(selectedDoctor.id, 'verified')} className="px-6 py-2 bg-emerald-600 text-white rounded-md font-bold hover:bg-emerald-700 shadow-sm transition">Verify & Approve</button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reason Modal — Reject / Suspend */}
      {selectedDoctor && (
        <ReasonModal
          isOpen={reasonModal.isOpen}
          onClose={() => setReasonModal({ isOpen: false, action: null })}
          onConfirm={(reason) => {
            handleVerify(selectedDoctor.id, reasonModal.action, reason);
            setReasonModal({ isOpen: false, action: null });
          }}
          title={reasonModal.action === 'rejected' ? 'Reject Application' : 'Suspend Account'}
          description={
            reasonModal.action === 'rejected'
              ? `You are about to reject Dr. ${selectedDoctor.name}'s application. Please provide a clear reason — this will be sent to the doctor by email.`
              : `You are about to suspend Dr. ${selectedDoctor.name}'s account. Please provide a reason — this will be communicated to the doctor.`
          }
          placeholder={
            reasonModal.action === 'rejected'
              ? 'e.g. Incomplete or unverifiable license documentation…'
              : 'e.g. Violation of platform terms of service…'
          }
          confirmText={reasonModal.action === 'rejected' ? 'Reject Application' : 'Suspend Account'}
          variant={reasonModal.action === 'rejected' ? 'danger' : 'warning'}
        />
      )}

      {/* Edit Doctor Modal */}
      {editDoctor && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Edit Dr. {editDoctor.name}</h3>
              <button onClick={() => setEditDoctor(null)} className="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${editFieldErrors.name ? 'border-red-500' : 'border-slate-300'}`} />
                  {editFieldErrors.name && <p className="text-red-500 text-xs mt-1">{editFieldErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                  <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${editFieldErrors.email ? 'border-red-500' : 'border-slate-300'}`} />
                  {editFieldErrors.email && <p className="text-red-500 text-xs mt-1">{editFieldErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Specialty</label>
                  <select value={editForm.specialty} onChange={e => setEditForm({...editForm, specialty: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white ${editFieldErrors.specialty ? 'border-red-500' : 'border-slate-300'}`}>
                    <option value="" disabled>Select specialty…</option>
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
                  {editFieldErrors.specialty && <p className="text-red-500 text-xs mt-1">{editFieldErrors.specialty}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">License Number</label>
                  <input type="text" value={editForm.license_number} onChange={e => setEditForm({...editForm, license_number: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${editFieldErrors.license_number ? 'border-red-500' : 'border-slate-300'}`} />
                  {editFieldErrors.license_number && <p className="text-red-500 text-xs mt-1">{editFieldErrors.license_number}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Experience (Years)</label>
                  <input type="number" min="0" value={editForm.experience_years} onChange={e => setEditForm({...editForm, experience_years: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${editFieldErrors.experience_years ? 'border-red-500' : 'border-slate-300'}`} />
                  {editFieldErrors.experience_years && <p className="text-red-500 text-xs mt-1">{editFieldErrors.experience_years}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Current Workplace</label>
                  <input type="text" value={editForm.current_workplace} onChange={e => setEditForm({...editForm, current_workplace: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${editFieldErrors.current_workplace ? 'border-red-500' : 'border-slate-300'}`} />
                  {editFieldErrors.current_workplace && <p className="text-red-500 text-xs mt-1">{editFieldErrors.current_workplace}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditDoctor(null)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-sm text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" disabled={editLoading}
                  className="px-5 py-2 bg-primary-600 text-white rounded-md text-sm font-bold hover:bg-primary-700 transition disabled:opacity-70">
                  {editLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ isOpen: false, doctorId: null })}
        onConfirm={executeDelete}
        title="Remove Doctor"
        message="Are you sure you want to remove this doctor from the system? This action cannot be undone."
        confirmText="Remove"
        isDanger={true}
      />
    </div>
  );
};

const STATUS_CATEGORIES = [
  {
    key: 'in_consultation',
    label: 'Currently in Consultation',
    icon: Stethoscope,
    color: 'blue',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    description: 'Appointment booked, consultation ongoing or not yet completed',
  },
  {
    key: 'completed_cured',
    label: 'Completed / Cured',
    icon: CheckCircle2,
    color: 'emerald',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    description: 'Finished consultation, completed treatment, marked as cured by doctor',
  },
  {
    key: 'paid_not_started',
    label: 'Paid but Not Started Treatment',
    icon: CreditCard,
    color: 'amber',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    description: 'Payment verified but treatment has not started yet',
  },
  {
    key: 'under_lab_process',
    label: 'Under Lab Process',
    icon: FlaskConical,
    color: 'purple',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
    description: 'Has a lab/radiology request with status pending or in progress',
  },
  {
    key: 'inactive',
    label: 'Inactive / Out of System',
    icon: UserX,
    color: 'slate',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-500',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-600',
    description: 'Registered but no activity for 30+ days',
  },
];

const PatientStatusRow = ({ patient, categoryKey }) => {
  const extra = () => {
    if (categoryKey === 'in_consultation')
      return (
        <div className="flex gap-3 text-xs text-slate-500 mt-1">
          <span>Status: <span className="font-medium text-slate-700 capitalize">{patient.consultation_status}</span></span>
          <span>Severity: <span className={`font-medium capitalize ${patient.severity === 'high' ? 'text-red-600' : patient.severity === 'medium' ? 'text-amber-600' : 'text-green-600'}`}>{patient.severity}</span></span>
          <span>Payment: <span className="font-medium text-slate-700 capitalize">{patient.payment_status}</span></span>
        </div>
      );
    if (categoryKey === 'completed_cured')
      return (
        <div className="flex gap-3 text-xs text-slate-500 mt-1">
          <span>Completed: <span className="font-medium text-slate-700">{new Date(patient.completed_at).toLocaleDateString()}</span></span>
          {patient.cured_at && <span>· Cured: <span className="font-medium text-emerald-700">{new Date(patient.cured_at).toLocaleDateString()}</span></span>}
          {patient.had_treatment_plan
            ? <span className="text-emerald-600 font-medium">· Treatment plan issued</span>
            : <span className="text-slate-400">· No treatment plan</span>}
        </div>
      );
    if (categoryKey === 'paid_not_started')
      return <p className="text-xs text-slate-500 mt-1">Payment verified · Consultation: <span className="capitalize">{patient.consultation_status}</span></p>;
    if (categoryKey === 'under_lab_process')
      return <p className="text-xs text-slate-500 mt-1">Pending lab requests: <span className="font-medium text-purple-700">{patient.pending_lab_requests}</span></p>;
    if (categoryKey === 'inactive')
      return <p className="text-xs text-slate-500 mt-1">Inactive for <span className="font-medium text-slate-700">{patient.days_inactive} days</span></p>;
    return null;
  };

  return (
    <div className="flex items-start justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm flex-shrink-0">
          {patient.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">{patient.name}</p>
          <p className="text-xs text-slate-400">{patient.email}</p>
          {extra()}
        </div>
      </div>
      <p className="text-xs text-slate-400 whitespace-nowrap ml-4 mt-1">
        Joined {new Date(patient.joined).toLocaleDateString()}
      </p>
    </div>
  );
};

const PatientsTab = () => {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('in_consultation');
  const [inactiveDays, setInactiveDays] = useState(30);

  const fetchStatuses = async (days = inactiveDays) => {
    setLoading(true);
    try {
      const res = await api.get(`/consultations/patient-statuses?inactive_days=${days}`);
      setStatusData(res.data);
    } catch (err) {
      console.error('Failed to fetch patient statuses', err);
      toast.error('Failed to load patient status data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatuses(); }, []);

  const summary = statusData?.summary || {};
  const patients = statusData?.data?.[activeCategory] || [];
  const activeCat = STATUS_CATEGORIES.find(c => c.key === activeCategory);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {STATUS_CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const count = summary[cat.key] ?? 0;
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${isActive ? `${cat.border} ${cat.bg} shadow-md` : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <div className={`${cat.iconBg} ${cat.iconColor} p-2 rounded-lg inline-flex mb-3`}>
                <Icon size={18} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{loading ? '—' : count}</p>
              <p className="text-xs font-medium text-slate-500 mt-1 leading-tight">{cat.label}</p>
            </button>
          );
        })}
      </div>

      {/* Detail Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {activeCat && (
              <div className={`${activeCat.iconBg} ${activeCat.iconColor} p-2 rounded-lg`}>
                <activeCat.icon size={18} />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-slate-800">{activeCat?.label}</h3>
              <p className="text-xs text-slate-500">{activeCat?.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeCategory === 'inactive' && (
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} className="text-slate-400" />
                <label className="text-slate-500">Threshold:</label>
                <select
                  value={inactiveDays}
                  onChange={e => { setInactiveDays(Number(e.target.value)); fetchStatuses(Number(e.target.value)); }}
                  className="border border-slate-200 rounded-md px-2 py-1 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                >
                  {[7, 14, 30, 60, 90].map(d => <option key={d} value={d}>{d} days</option>)}
                </select>
              </div>
            )}
            <span className={`${activeCat?.badgeBg} ${activeCat?.badgeText} text-xs font-bold px-3 py-1 rounded-full`}>
              {patients.length} patient{patients.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-lg" />)}
            </div>
          ) : patients.length > 0 ? (
            <div>
              {patients.map(p => (
                <PatientStatusRow key={p.id} patient={p} categoryKey={activeCategory} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              {activeCat && (
                <div className={`${activeCat.iconBg} ${activeCat.iconColor} p-4 rounded-full inline-flex mb-3`}>
                  <activeCat.icon size={28} />
                </div>
              )}
              <p className="text-slate-500 font-medium">No patients in this category</p>
            </div>
          )}
        </div>
      </div>

      {/* Total footer */}
      {statusData && (
        <p className="text-xs text-slate-400 text-right">
          Total registered patients: <span className="font-semibold text-slate-600">{summary.total_patients}</span>
        </p>
      )}
    </div>
  );
};

const MonitoringTab = () => {
  const [consultations, setConsultations] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [consRes, remRes] = await Promise.all([
        api.get('/consultations'),
        api.get('/reminders')
      ]);
      setConsultations(consRes.data);
      setReminders(remRes.data);
    } catch (err) {
      console.error('Failed to fetch monitoring data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Consultations */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6">
          <h3 className="font-semibold text-xl text-slate-800">Monitor Consultations</h3>
          <p className="text-slate-500 text-sm mt-1">Monitor the status of all patient consultations system-wide.</p>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-10 bg-slate-200 rounded w-full"></div>
            <div className="h-10 bg-slate-200 rounded w-full"></div>
          </div>
        ) : consultations.length > 0 ? (
          <div className="overflow-x-auto text-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 uppercase">Patient</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 uppercase">Reason</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 uppercase">Date Selection</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 uppercase">Doctor</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 uppercase">Payment & Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {consultations.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 font-medium">{c.Patient?.name || 'Unknown'}</td>
                    <td className="px-4 py-4 text-slate-600"><div className="truncate w-32 md:w-48" title={c.reason}>{c.reason || 'General'}</div></td>
                    <td className="px-4 py-4 text-slate-600">{c.appointment_date ? `${c.appointment_date} @ ${c.appointment_time?.substring(0, 5)}` : 'N/A'}</td>
                    <td className="px-4 py-4 text-slate-600">
                      {c.Doctor ? (
                        <span className="font-medium font-bold text-primary-700">Dr. {c.Doctor.name}</span>
                      ) : (
                        <span className="text-amber-500 italic">No Doctor</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {c.Payment?.status === 'verified' ? (
                        <span className="text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 flex items-center inline-flex">
                          Paid & Active
                        </span>
                      ) : (
                        <span className="text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded border border-amber-200 flex items-center inline-flex">
                          Pending Payment
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-6 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            <p className="text-slate-500">No consultations found.</p>
          </div>
        )}
      </div>

      {/* Reminders */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6">
          <h3 className="font-semibold text-xl text-slate-800">System Reminders</h3>
          <p className="text-slate-500 text-sm mt-1">View all active pill and follow-up reminders.</p>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-10 bg-slate-200 rounded w-full"></div>
          </div>
        ) : reminders.length > 0 ? (
          <div className="overflow-x-auto text-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 uppercase">Patient</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 uppercase">Scheduled Time</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {reminders.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{r.Patient?.name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{r.reminder_type.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(r.scheduled_time).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${r.is_sent ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                        {r.is_sent ? 'Sent' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-6 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            <p className="text-slate-500">No active reminders found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SettingsTab = () => {
  const [fees, setFees] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // key being saved

  const FEE_CONFIG = [
    { key: 'fee_gp',                label: 'General Practitioner (GP)', icon: '🩺', group: 'GP' },
    { key: 'fee_psychiatrist',      label: 'Psychiatrist',              icon: '🧠', group: 'Specialists' },
    { key: 'fee_dermatologist',     label: 'Dermatologist',             icon: '🔬', group: 'Specialists' },
    { key: 'fee_cardiologist',      label: 'Cardiologist',              icon: '❤️', group: 'Specialists' },
    { key: 'fee_internal_medicine', label: 'Internal Medicine',         icon: '🏥', group: 'Specialists' },
    { key: 'fee_pediatrician',      label: 'Pediatrician',              icon: '👶', group: 'Specialists' },
    { key: 'fee_gynecologist',      label: 'Gynecologist',              icon: '🌸', group: 'Specialists' },
    { key: 'fee_pulmonologist',     label: 'Pulmonologist',             icon: '🫁', group: 'Specialists' },
    { key: 'fee_neurologist',       label: 'Neurologist',               icon: '🧬', group: 'Specialists' },
    { key: 'fee_orthopedic',        label: 'Orthopedic',                icon: '🦴', group: 'Specialists' },
  ];

  const DEFAULTS = {
    fee_gp: '150', fee_psychiatrist: '300', fee_dermatologist: '250',
    fee_cardiologist: '350', fee_internal_medicine: '280', fee_pediatrician: '200',
    fee_gynecologist: '250', fee_pulmonologist: '280', fee_neurologist: '320', fee_orthopedic: '300',
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        const map = {};
        res.data.forEach(s => { map[s.key] = s.value; });
        // Fill in defaults for any missing keys
        FEE_CONFIG.forEach(({ key }) => {
          if (!map[key]) map[key] = DEFAULTS[key] || '100';
        });
        setFees(map);
      } catch (err) {
        console.error('Failed to fetch settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (key) => {
    setSaving(key);
    try {
      await api.put(`/settings/${key}`, { value: fees[key] });
      toast.success('Fee updated successfully');
    } catch (err) {
      toast.error('Failed to update fee');
    } finally {
      setSaving(null);
    }
  };

  const handleSaveAll = async () => {
    setSaving('all');
    try {
      await Promise.all(
        FEE_CONFIG.map(({ key }) => api.put(`/settings/${key}`, { value: fees[key] }))
      );
      toast.success('All consultation fees saved successfully');
    } catch (err) {
      toast.error('Failed to save some fees');
    } finally {
      setSaving(null);
    }
  };

  const gpFees = FEE_CONFIG.filter(f => f.group === 'GP');
  const specialistFees = FEE_CONFIG.filter(f => f.group === 'Specialists');

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6">
          <h3 className="font-semibold text-xl text-slate-800">Platform Settings</h3>
          <p className="text-slate-500 text-sm mt-1">Configure consultation fees per doctor type. Patients pay these amounts via Chapa to unlock consultation.</p>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-12 bg-slate-100 rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-6">
            {/* GP Section */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-500 inline-block"></span>
                General Practitioner
              </h4>
              {gpFees.map(({ key, label, icon }) => (
                <div key={key} className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                  <span className="text-xl w-8 text-center">{icon}</span>
                  <span className="flex-1 text-sm font-medium text-slate-700">{label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="0" step="1"
                      value={fees[key] || ''}
                      onChange={e => setFees(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-28 px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-right"
                    />
                    <span className="text-slate-500 text-sm font-medium w-8">ETB</span>
                    <button
                      type="button"
                      onClick={() => handleSave(key)}
                      disabled={saving === key}
                      className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-60 min-w-[60px]"
                    >
                      {saving === key ? '...' : 'Save'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Specialists Section */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                Specialist Consultation Fees
              </h4>
              <div className="space-y-2">
                {specialistFees.map(({ key, label, icon }) => (
                  <div key={key} className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                    <span className="text-xl w-8 text-center">{icon}</span>
                    <span className="flex-1 text-sm font-medium text-slate-700">{label}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min="0" step="1"
                        value={fees[key] || ''}
                        onChange={e => setFees(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-28 px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-right"
                      />
                      <span className="text-slate-500 text-sm font-medium w-8">ETB</span>
                      <button
                        type="button"
                        onClick={() => handleSave(key)}
                        disabled={saving === key}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-60 min-w-[60px]"
                      >
                        {saving === key ? '...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save All */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-400">Changes take effect immediately for new consultations.</p>
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={saving === 'all'}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition shadow-sm disabled:opacity-70 text-sm"
              >
                {saving === 'all' ? 'Saving all...' : 'Save All Fees'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const splitFullName = (fullName = '') => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: '', last_name: '' };
  if (parts.length === 1) return { first_name: parts[0], last_name: '' };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
};

const buildFullName = (firstName, lastName) =>
  [firstName, lastName].map((part) => part.trim()).filter(Boolean).join(' ');

const SpecialistsTab = () => {
  const [specialists, setSpecialists] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', password: '', work_location: '', specializations: [], role: 'laboratorist',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  
  const [modalConfig, setModalConfig] = useState({ isOpen: false, specialistId: null });

  // Edit state
  const [editSpec, setEditSpec] = useState(null);
  const [editSpecForm, setEditSpecForm] = useState({
    first_name: '', last_name: '', email: '', work_location: '', specializations: [],
  });
  const [editSpecLoading, setEditSpecLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editSpecFieldErrors, setEditSpecFieldErrors] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [labsRes, radsRes, catRes] = await Promise.all([
        api.get('/users?role=laboratorist'),
        api.get('/users?role=radiologist'),
        api.get('/services/categories')
      ]);
      setSpecialists([...labsRes.data, ...radsRes.data]);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCategoryChange = (catName) => {
    setFormData(prev => {
      const isSelected = prev.specializations.includes(catName);
      return {
        ...prev,
        specializations: isSelected 
          ? prev.specializations.filter(c => c !== catName)
          : [...prev.specializations, catName]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    
    const result = adminSpecialistSchema.safeParse(formData);
    if (!result.success) {
      setFieldErrors(formatZodErrors(result.error));
      return;
    }

    setFormLoading(true);
    try {
      await api.post('/users', {
        ...formData,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        name: buildFullName(formData.first_name, formData.last_name),
        is_verified: true,
      });
      setFormData({
        first_name: '', last_name: '', email: '', password: '', work_location: '', specializations: [], role: 'laboratorist',
      });
      setFieldErrors({});
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register laboratorist/radiologist');
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = (id) => {
    setModalConfig({ isOpen: true, specialistId: id });
  };

  const executeDelete = async () => {
    try {
      await api.delete(`/users/${modalConfig.specialistId}`);
      fetchData();
      setModalConfig({ isOpen: false, specialistId: null });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove laboratorist/radiologist. Ensure they have no dependent records.');
    }
  };

  const openEditSpec = (spec) => {
    setEditSpec(spec);
    const { first_name, last_name } = splitFullName(spec.name || '');
    setEditSpecForm({
      first_name,
      last_name,
      email: spec.email || '',
      work_location: spec.work_location || '',
      specializations: spec.specializations || [],
    });
    setEditSpecFieldErrors({});
  };

  const handleEditSpecSubmit = async (e) => {
    e.preventDefault();
    setEditSpecFieldErrors({});

    const result = adminEditSpecialistSchema.safeParse({ ...editSpecForm, role: editSpec.role });
    if (!result.success) {
      setEditSpecFieldErrors(formatZodErrors(result.error));
      return;
    }

    setEditSpecLoading(true);
    try {
      await api.put(`/users/${editSpec.id}`, {
        ...editSpecForm,
        first_name: editSpecForm.first_name.trim(),
        last_name: editSpecForm.last_name.trim(),
        name: buildFullName(editSpecForm.first_name, editSpecForm.last_name),
      });
      toast.success('Laboratorist/Radiologist updated successfully');
      setEditSpec(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update laboratorist/radiologist');
    } finally {
      setEditSpecLoading(false);
    }
  };

  const handleSpecCategoryChange = (catName) => {
    setEditSpecForm(prev => {
      const has = prev.specializations.includes(catName);
      return { ...prev, specializations: has ? prev.specializations.filter(c => c !== catName) : [...prev.specializations, catName] };
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-semibold text-xl text-slate-800">Laboratorists / Radiologists Management</h3>
          <p className="text-slate-500 text-sm mt-1">Register new laboratory technicians and radiologists.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition font-medium text-sm flex items-center shadow-sm"
        >
          {showForm ? 'Cancel' : '+ Register Laboratorists / Radiologists'}
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8 max-w-3xl">
          <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Laboratorists / Radiologists Registration</h4>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4 border border-red-200">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  placeholder="Addisu"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white ${fieldErrors.first_name ? 'border-red-500' : 'border-slate-300'}`}
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
                {fieldErrors.first_name && <FieldTooltip message={fieldErrors.first_name} />}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  placeholder="Gebeyehu"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white ${fieldErrors.last_name ? 'border-red-500' : 'border-slate-300'}`}
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
                {fieldErrors.last_name && <FieldTooltip message={fieldErrors.last_name} />}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white ${fieldErrors.role ? 'border-red-500' : 'border-slate-300'}`}
                  value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="laboratorist">Laboratorist</option>
                  <option value="radiologist">Radiologist</option>
                </select>
                {fieldErrors.role && <FieldTooltip message={fieldErrors.role} />}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email" placeholder="addisu.gebeyehu@hospital.com"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white ${fieldErrors.email ? 'border-red-500' : 'border-slate-300'}`}
                  value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {fieldErrors.email && <FieldTooltip message={fieldErrors.email} />}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Work Location / Room</label>
                <input
                  type="text" placeholder="e.g. Room 101, Radiology Unit"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white ${fieldErrors.work_location ? 'border-red-500' : 'border-slate-300'}`}
                  value={formData.work_location} onChange={(e) => setFormData({ ...formData, work_location: e.target.value })}
                />
                {fieldErrors.work_location && <FieldTooltip message={fieldErrors.work_location} />}
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white ${fieldErrors.password ? 'border-red-500' : 'border-slate-300'}`}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} className="text-slate-500" /> : <Eye size={20} className="text-slate-500" />}
                </span>
                {fieldErrors.password && <FieldTooltip message={fieldErrors.password} />}
              </div>
            </div>
            
            <div className="pt-2 border-t border-slate-200 mt-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">Capabilities / Specializations</label>
              <div className="flex flex-wrap gap-2">
                {categories.filter(c => c.department_type === (formData.role === 'laboratorist' ? 'laboratory' : 'radiology')).map(cat => (
                  <label key={cat.id} className={`cursor-pointer px-4 py-2 rounded-full border text-sm font-semibold transition ${formData.specializations.includes(cat.name) ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      onChange={() => handleCategoryChange(cat.name)}
                      checked={formData.specializations.includes(cat.name)}
                    />
                    {cat.name}
                  </label>
                ))}
                {categories.length === 0 && <span className="text-slate-500 text-sm">Please configure service categories first.</span>}
                {fieldErrors.specializations && <p className="text-red-500 text-xs w-full mt-1">{fieldErrors.specializations}</p>}
              </div>
            </div>

            <div className="pt-2 flex justify-end mt-4">
              <button
                type="submit" disabled={formLoading}
                className="bg-primary-600 text-white px-6 py-2.5 rounded-md hover:bg-primary-700 transition font-bold shadow-sm disabled:opacity-70"
              >
                {formLoading ? 'Registering...' : 'Complete Registration'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-slate-200 rounded w-full mb-2"></div>
          <div className="h-16 bg-slate-100 rounded w-full"></div>
        </div>
      ) : specialists.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Staff Details</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role & Capabilities</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {specialists.map((spec) => (
                <tr key={spec.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold overflow-hidden border border-slate-200 bg-primary-100 text-primary-700">
                        {spec.profile_picture ? (
                          <img src={`${api.defaults.baseURL?.replace(/\/api$/, '') || 'http://localhost:5000'}${spec.profile_picture}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                          spec.name.charAt(0)
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-slate-900">{spec.name}</div>
                        <div className="text-sm text-slate-500">{spec.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-700 uppercase">{spec.role}</div>
                    <div className="text-xs text-slate-500 max-w-xs truncate" title={spec.specializations?.join(', ')}>{spec.specializations?.join(', ') || 'None'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <RowMenu
                      onEdit={() => openEditSpec(spec)}
                      onDelete={() => confirmDelete(spec.id)}
                      deleteLabel="Remove"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center p-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <div className="bg-white p-4 rounded-full inline-block mb-4 shadow-sm border border-slate-100">
            <Activity className="text-primary-400" size={32} />
          </div>
          <p className="text-xl text-slate-700 font-bold mb-1">No laboratorists or radiologists registered yet</p>
          <p className="text-slate-500 max-w-sm mx-auto">Register lab technicians and radiologists here.</p>
        </div>
      )}

      {/* Edit Laboratorists / Radiologists Modal */}
      {editSpec && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Edit {editSpec.name}</h3>
              <button onClick={() => setEditSpec(null)} className="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none">&times;</button>
            </div>
            <form onSubmit={handleEditSpecSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editSpecForm.first_name}
                    onChange={(e) => setEditSpecForm({ ...editSpecForm, first_name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${editSpecFieldErrors.first_name ? 'border-red-500' : 'border-slate-300'}`}
                  />
                  {editSpecFieldErrors.first_name && <FieldTooltip message={editSpecFieldErrors.first_name} />}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editSpecForm.last_name}
                    onChange={(e) => setEditSpecForm({ ...editSpecForm, last_name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${editSpecFieldErrors.last_name ? 'border-red-500' : 'border-slate-300'}`}
                  />
                  {editSpecFieldErrors.last_name && <FieldTooltip message={editSpecFieldErrors.last_name} />}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                  <input type="email" value={editSpecForm.email} onChange={e => setEditSpecForm({...editSpecForm, email: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${editSpecFieldErrors.email ? 'border-red-500' : 'border-slate-300'}`} />
                  {editSpecFieldErrors.email && <FieldTooltip message={editSpecFieldErrors.email} />}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Work Location / Room</label>
                  <input type="text" value={editSpecForm.work_location} onChange={e => setEditSpecForm({...editSpecForm, work_location: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${editSpecFieldErrors.work_location ? 'border-red-500' : 'border-slate-300'}`} />
                  {editSpecFieldErrors.work_location && <FieldTooltip message={editSpecFieldErrors.work_location} />}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Capabilities / Specializations</label>
                <div className="flex flex-wrap gap-2">
                  {categories.filter(c => c.department_type === (editSpec.role === 'laboratorist' ? 'laboratory' : 'radiology')).map(cat => (
                    <label key={cat.id} className={`cursor-pointer px-3 py-1.5 rounded-full border text-xs font-semibold transition ${editSpecForm.specializations.includes(cat.name) ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>
                      <input type="checkbox" className="hidden" onChange={() => handleSpecCategoryChange(cat.name)} checked={editSpecForm.specializations.includes(cat.name)} />
                      {cat.name}
                    </label>
                  ))}
                  {editSpecFieldErrors.specializations && <FieldTooltip message={editSpecFieldErrors.specializations} />}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditSpec(null)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-sm text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" disabled={editSpecLoading}
                  className="px-5 py-2 bg-primary-600 text-white rounded-md text-sm font-bold hover:bg-primary-700 transition disabled:opacity-70">
                  {editSpecLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ isOpen: false, specialistId: null })}
        onConfirm={executeDelete}
        title="Remove Laboratorist / Radiologist"
        message="Are you sure you want to remove this laboratorist/radiologist from the system? This action cannot be undone."
        confirmText="Remove"
        isDanger={true}
      />
    </div>
  );
};

const ServicesTab = () => {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState({ id: null, name: '', department_type: 'laboratory', isEditing: false });
  const [catFieldErrors, setCatFieldErrors] = useState({});
  
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState({ id: null, name: '', category_id: '', price: 0, is_active: true, isEditing: false });
  const [itemFieldErrors, setItemFieldErrors] = useState({});

  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, id: null });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, itemRes] = await Promise.all([
        api.get('/services/categories'),
        api.get('/services/items')
      ]);
      setCategories(catRes.data);
      setItems(itemRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    setCatFieldErrors({});

    const result = addCategorySchema.safeParse(catForm);
    if (!result.success) {
      setCatFieldErrors(formatZodErrors(result.error));
      return;
    }

    try {
      if (catForm.isEditing) {
        await api.put(`/services/categories/${catForm.id}`, catForm);
        toast.success('Category updated successfully');
      } else {
        await api.post('/services/categories', catForm);
        toast.success('Category created successfully');
      }
      setCatForm({ id: null, name: '', department_type: 'laboratory', isEditing: false });
      setCatFieldErrors({});
      setShowCatForm(false);
      fetchData();
    } catch (err) { toast.error('Failed to save category'); }
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    setItemFieldErrors({});

    const result = addServiceItemSchema.safeParse(itemForm);
    if (!result.success) {
      setItemFieldErrors(formatZodErrors(result.error));
      return;
    }

    try {
      if (itemForm.isEditing) {
        await api.put(`/services/items/${itemForm.id}`, itemForm);
        toast.success('Service item updated successfully');
      } else {
        await api.post('/services/items', itemForm);
        toast.success('Service item created successfully');
      }
      setItemForm({ id: null, name: '', category_id: '', price: 0, is_active: true, isEditing: false });
      setItemFieldErrors({});
      setShowItemForm(false);
      fetchData();
    } catch (err) { toast.error('Failed to save service item'); }
  };

  const confirmDelete = (type, id) => {
    setModalConfig({ isOpen: true, type, id });
  };

  const executeDelete = async () => {
    try {
      if (modalConfig.type === 'item') {
        await api.delete(`/services/items/${modalConfig.id}`);
      } else if (modalConfig.type === 'category') {
        await api.delete(`/services/categories/${modalConfig.id}`);
      }
      fetchData();
      setModalConfig({ isOpen: false, type: null, id: null });
    } catch (err) {
      if (modalConfig.type === 'item') {
        toast.error(err.response?.data?.message || 'Failed to delete service item. It may be linked to existing service requests.'); 
      } else {
        toast.error(err.response?.data?.message || 'Failed to delete category. Make sure no service items are linked to it.'); 
      }
    }
  };

  const handleEditCategory = (cat) => {
    setCatFieldErrors({});
    setCatForm({ id: cat.id, name: cat.name, department_type: cat.department_type, isEditing: true });
    setShowCatForm(true);
  };

  const handleEditItem = (item) => {
    setItemFieldErrors({});
    setItemForm({ id: item.id, name: item.name, category_id: item.category_id, price: item.price, is_active: item.is_active, isEditing: true });
    setShowItemForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-semibold text-xl text-slate-800">Service Categories</h3>
            <p className="text-slate-500 text-sm mt-1">Manage Lab and Radiology categories.</p>
          </div>
          <button onClick={() => {
            setCatFieldErrors({});
            setCatForm({ id: null, name: '', department_type: 'laboratory', isEditing: false });
            setShowCatForm(!showCatForm);
          }} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition text-sm">
            {showCatForm && !catForm.isEditing ? 'Cancel' : '+ Add Category'}
          </button>
        </div>
        
        {showCatForm && (
          <form onSubmit={handleCatSubmit} className="mb-6 bg-slate-50 p-4 rounded-lg flex space-x-4 items-end">
            <div className="flex-1 relative">
              <label className="block text-sm font-medium mb-1">Category Name</label>
              <input type="text" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} className={`w-full px-3 py-2 border rounded focus:ring-primary-500 outline-none ${catFieldErrors.name ? 'border-red-500' : 'border-slate-300'}`} />
              {catFieldErrors.name && <p className="text-red-500 text-xs absolute -bottom-4">{catFieldErrors.name}</p>}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Department</label>
              <select value={catForm.department_type} onChange={e => setCatForm({...catForm, department_type: e.target.value})} className="w-full px-3 py-2 border rounded outline-none">
                <option value="laboratory">Laboratory</option>
                <option value="radiology">Radiology</option>
              </select>
            </div>
            <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700 transition">
              {catForm.isEditing ? 'Update' : 'Save'}
            </button>
          </form>
        )}

        <div className="grid grid-cols-2 gap-4">
          {categories.map(c => (
            <div key={c.id} className="p-3 border rounded-lg flex justify-between items-center bg-white shadow-sm hover:border-primary-300 transition">
              <div>
                <span className="font-bold block text-slate-800">{c.name}</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase mt-1 inline-block">{c.department_type}</span>
              </div>
              <div className="space-x-2">
                <RowMenu
                  onEdit={() => handleEditCategory(c)}
                  onDelete={() => confirmDelete('category', c.id)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-semibold text-xl text-slate-800">Service Items & Pricing</h3>
            <p className="text-slate-500 text-sm mt-1">Manage individual tests/services and their costs.</p>
          </div>
          <button onClick={() => {
            setItemFieldErrors({});
            setItemForm({ id: null, name: '', category_id: '', price: 0, is_active: true, isEditing: false });
            setShowItemForm(!showItemForm);
          }} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition text-sm">
            {showItemForm && !itemForm.isEditing ? 'Cancel' : '+ Add Service Item'}
          </button>
        </div>

        {showItemForm && (
          <form onSubmit={handleItemSubmit} className="mb-6 bg-slate-50 p-4 rounded-lg flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px] relative pb-2">
              <label className="block text-sm font-medium mb-1">Service Name</label>
              <input type="text" value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} className={`w-full px-3 py-2 border rounded focus:ring-primary-500 outline-none ${itemFieldErrors.name ? 'border-red-500' : 'border-slate-300'}`} placeholder="e.g. Chest X-Ray" />
              {itemFieldErrors.name && <p className="text-red-500 text-xs absolute bottom-0 left-0">{itemFieldErrors.name}</p>}
            </div>
            <div className="flex-1 min-w-[200px] relative pb-2">
              <label className="block text-sm font-medium mb-1">Category</label>
              <select value={itemForm.category_id} onChange={e => setItemForm({...itemForm, category_id: e.target.value})} className={`w-full px-3 py-2 border rounded outline-none ${itemFieldErrors.category_id ? 'border-red-500' : 'border-slate-300'}`}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.department_type})</option>)}
              </select>
              {itemFieldErrors.category_id && <p className="text-red-500 text-xs absolute bottom-0 left-0">{itemFieldErrors.category_id}</p>}
            </div>
            <div className="w-32 relative pb-2">
              <label className="block text-sm font-medium mb-1">Price (Birr)</label>
              <input type="number" min="0" value={itemForm.price} onChange={e => setItemForm({...itemForm, price: e.target.value})} className={`w-full px-3 py-2 border rounded outline-none ${itemFieldErrors.price ? 'border-red-500' : 'border-slate-300'}`} />
              {itemFieldErrors.price && <p className="text-red-500 text-xs absolute bottom-0 left-0">{itemFieldErrors.price}</p>}
            </div>
            <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700 transition mb-2">
              {itemForm.isEditing ? 'Update' : 'Save'}
            </button>
          </form>
        )}

        {loading ? <div className="animate-pulse h-10 bg-slate-100 rounded"></div> : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Service Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Price</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {items.map(item => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{item.Category?.name}</td>
                  <td className="px-4 py-3 text-emerald-600 font-bold">{item.price} Birr</td>
                  <td className="px-4 py-3 text-right text-sm space-x-3">
                    <RowMenu
                      onEdit={() => handleEditItem(item)}
                      onDelete={() => confirmDelete('item', item.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ isOpen: false, type: null, id: null })}
        onConfirm={executeDelete}
        title={modalConfig.type === 'category' ? "Delete Category" : "Delete Service Item"}
        message={
          modalConfig.type === 'category' 
            ? "Are you sure you want to delete this category? All service items under it must be deleted first." 
            : "Are you sure you want to delete this service item? This action cannot be undone."
        }
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, consultations: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersRes = await api.get('/users');
        const consRes = await api.get('/consultations');
        setStats({ users: usersRes.data.length, consultations: consRes.data.length });
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-center mt-20"><div className="animate-pulse">Loading dashboard...</div></div>;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab stats={stats} />;
      case 'doctors': return <DoctorsTab />;
      case 'patients': return <PatientsTab />;
      case 'specialists': return <SpecialistsTab />;
      case 'services': return <ServicesTab />;
      case 'monitoring': return <MonitoringTab />;
      case 'settings': return <SettingsTab />;
      default: return <OverviewTab stats={stats} />;
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-6 flex items-center">
        <ShieldPlus className="mr-3 text-primary-600" /> Company Setup & Admin
      </h1>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: PieChart },
          { id: 'doctors', label: 'Doctors', icon: Stethoscope },
          { id: 'patients', label: 'Patients', icon: Users },
          { id: 'specialists', label: 'Laboratorists / Radiologists', icon: Activity },
          { id: 'services', label: 'Services Config', icon: FileText },
          { id: 'monitoring', label: 'Monitoring', icon: Activity },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
          >
            <tab.icon size={18} className="mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fadeIn">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
