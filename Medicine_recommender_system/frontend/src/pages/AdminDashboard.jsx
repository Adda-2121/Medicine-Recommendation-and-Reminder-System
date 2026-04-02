import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, Activity, FileText, PieChart, ShieldPlus, Calendar, Stethoscope } from 'lucide-react';

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
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

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
    setFormLoading(true);
    try {
      await api.post('/users', { ...formData, role: 'doctor' });
      setFormData({
        name: '', email: '', password: '',
        specialty: '', license_number: '', experience_years: ''
      });
      setShowForm(false);
      fetchDoctors();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register doctor');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this doctor?')) {
      alert('Mock Delete: Doctor ' + id + ' removed.');
    }
  };

  const handleVerify = async (id, currentStatus) => {
    try {
      await api.put(`/users/${id}/verify`, { is_verified: !currentStatus });
      fetchDoctors();
      if (selectedDoctor && selectedDoctor.id === id) {
        setSelectedDoctor({ ...selectedDoctor, is_verified: !currentStatus });
      }
    } catch (err) {
      alert('Failed to update verification status');
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

      {showForm && (
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8 max-w-3xl">
          <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Medical Professional Registration</h4>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4 border border-red-200">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text" required placeholder="Dr. Jane Doe"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email" required placeholder="jane.doe@hospital.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Specialty</label>
                <input
                  type="text" required placeholder="e.g. Cardiology, Pediatrics"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  value={formData.specialty} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Medical License Number</label>
                <input
                  type="text" required placeholder="e.g. MED-12345678"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  value={formData.license_number} onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Years of Experience</label>
                <input
                  type="number" required min="0" placeholder="e.g. 10"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  value={formData.experience_years} onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password</label>
                <input
                  type="password" required minLength={6}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
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
              {doctors.map((doctor) => (
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
                      ${doctor.is_verified
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'}`}
                    >
                      {doctor.is_verified ? 'Verified Professional' : 'Pending Verification'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedDoctor(doctor)}
                      className="mr-3 px-3 py-1.5 rounded text-xs font-bold transition text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                    >
                      Review Details
                    </button>
                    <button className="text-red-500 hover:text-red-700 font-medium" onClick={() => handleDelete(doctor.id)}>Remove</button>
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
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
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border ${selectedDoctor.is_verified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {selectedDoctor.is_verified ? '✓ Verified Professional' : '⚠ Pending Verification'}
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                    <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-xs mb-3 border-b pb-2">Live Identity Selfie</h4>
                    <div className="aspect-video bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center overflow-hidden">
                      {selectedDoctor.selfie_document ? (
                        <img src={`${api.defaults.baseURL.replace(/\/api$/, '') || 'http://localhost:5000'}/${selectedDoctor.selfie_document.replace(/\\/g, '/')}`} alt="Doctor Selfie" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-400 italic">No selfie captured</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                    <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-xs mb-3 border-b pb-2">Medical License Document</h4>
                    <div className="h-64 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center overflow-hidden">
                      {selectedDoctor.verification_document ? (
                        selectedDoctor.verification_document.endsWith('.pdf') ? (
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <FileText size={48} className="text-red-400" />
                            <a href={`${api.defaults.baseURL.replace(/\/api$/, '') || 'http://localhost:5000'}/${selectedDoctor.verification_document.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" className="text-primary-600 font-semibold hover:underline bg-primary-50 px-4 py-2 rounded-full border border-primary-100">Open PDF Document</a>
                          </div>
                        ) : (
                          <img src={`${api.defaults.baseURL.replace(/\/api$/, '') || 'http://localhost:5000'}/${selectedDoctor.verification_document.replace(/\\/g, '/')}`} alt="License Document" className="w-full h-full object-contain" />
                        )
                      ) : (
                        <span className="text-slate-400 italic">No document uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-white sticky bottom-0 flex justify-end space-x-4">
              <button onClick={() => setSelectedDoctor(null)} className="px-6 py-2 border border-slate-300 rounded-md text-slate-700 font-medium hover:bg-slate-50 transition">Close</button>
              {selectedDoctor.is_verified ? (
                <button onClick={() => { handleVerify(selectedDoctor.id, true); }} className="px-6 py-2 bg-rose-600 text-white rounded-md font-bold hover:bg-rose-700 shadow-sm transition">Revoke Verification</button>
              ) : (
                <button onClick={() => { handleVerify(selectedDoctor.id, false); }} className="px-6 py-2 bg-emerald-600 text-white rounded-md font-bold hover:bg-emerald-700 shadow-sm transition">Verify Doctor</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PatientsTab = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get('/users?role=patient');
        setPatients(res.data);
      } catch (err) {
        console.error('Failed to fetch patients', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="mb-6">
        <h3 className="font-semibold text-xl text-slate-800">Patient Accounts</h3>
        <p className="text-slate-500 text-sm mt-1">View and manage registered patient accounts.</p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-10 bg-slate-200 rounded w-full"></div>
          <div className="h-10 bg-slate-200 rounded w-full"></div>
        </div>
      ) : patients.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined Date</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {patients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold overflow-hidden border border-blue-200">
                        {patient.profile_picture ? (
                          <img src={`${api.defaults.baseURL?.replace(/\/api$/, '') || 'http://localhost:5000'}${patient.profile_picture}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                          patient.name.charAt(0)
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{patient.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{patient.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(patient.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
          <Users className="mx-auto text-slate-400 mb-2" size={32} />
          <p className="text-slate-500 font-medium">No patients found.</p>
        </div>
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

const PaymentsTab = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);

  const fetchPayments = async () => {
    try {
      const res = await api.get('/payments');
      setPayments(res.data);
    } catch (err) {
      console.error('Failed to fetch payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleVerify = async (paymentId, status) => {
    if (status === 'failed' && !adminNotes.trim()) {
      alert('You must provide a reason for rejecting the payment in the notes.');
      return;
    }

    try {
      setVerifyingId(paymentId);
      await api.put(`/payments/${paymentId}/verify`, { status, admin_notes: adminNotes || null });
      alert(`Payment ${status === 'verified' ? 'verified' : 'rejected'} successfully.`);
      fetchPayments();
      setSelectedPayment(null);
      setAdminNotes('');
    } catch (err) {
      console.error(err);
      alert('Failed to update payment status.');
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative">
      <div className="mb-6">
        <h3 className="font-semibold text-xl text-slate-800">Payment Verification</h3>
        <p className="text-slate-500 text-sm mt-1">Review and approve patient payment submissions.</p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-10 bg-slate-200 rounded w-full"></div>
        </div>
      ) : payments.length > 0 ? (
        <div className="overflow-x-auto text-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500 uppercase">Ref Code</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500 uppercase">Patient & Appt</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 font-mono font-bold text-slate-700">{p.reference_code}</td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-900">{p.Patient?.name}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[150px]">{p.Consultation?.reason}</div>
                  </td>
                  <td className="px-4 py-4 text-emerald-600 font-bold">800 Birr</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${p.status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                        p.status === 'failed' ? 'bg-red-100 text-red-800' :
                          p.status === 'expired' ? 'bg-slate-200 text-slate-800' :
                            'bg-amber-100 text-amber-800'}`}>
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => setSelectedPayment(p)}
                      className="text-primary-600 hover:text-primary-800 font-bold px-3 py-1 bg-primary-50 hover:bg-primary-100 rounded-md transition"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
          <p className="text-slate-500 font-medium">No payments found.</p>
        </div>
      )}

      {/* Payment Review Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Review Payment: {selectedPayment.reference_code}</h3>
              <button onClick={() => { setSelectedPayment(null); setAdminNotes(''); }} className="text-slate-500 hover:text-slate-800 font-bold text-xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div><span className="text-slate-500 block mb-1">Patient Name</span><span className="font-bold">{selectedPayment.Patient?.name}</span></div>
                <div><span className="text-slate-500 block mb-1">Amount Claimed</span><span className="font-bold text-emerald-600">800 Birr</span></div>
                <div><span className="text-slate-500 block mb-1">Date Submitted</span><span>{new Date(selectedPayment.created_at).toLocaleString()}</span></div>
                <div><span className="text-slate-500 block mb-1">Consultation ID</span><span className="font-mono text-xs">{selectedPayment.consultation_id}</span></div>
                {selectedPayment.expires_at && (
                  <div className="col-span-2"><span className="text-slate-500 block mb-1">Access Expiration</span><span className="font-bold text-amber-600">{new Date(selectedPayment.expires_at).toLocaleString()}</span></div>
                )}
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-700 mb-2">Screenshot Proof:</h4>
                <div className="border border-slate-200 rounded-lg bg-slate-100 h-96 flex items-center justify-center overflow-hidden relative group">
                  {selectedPayment.screenshot_url ? (
                    <a href={`${api.defaults.baseURL.replace(/\/api$/, '') || 'http://localhost:5000'}${selectedPayment.screenshot_url}`} target="_blank" rel="noreferrer" className="w-full h-full flex items-center justify-center relative">
                      <img
                        src={`${api.defaults.baseURL.replace(/\/api$/, '') || 'http://localhost:5000'}${selectedPayment.screenshot_url}`}
                        alt="Payment Proof"
                        className="max-h-full max-w-full object-contain cursor-zoom-in transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 bg-white/80 text-slate-800 font-bold px-3 py-1.5 rounded-full shadow-lg text-sm backdrop-blur-sm transform translate-y-4 group-hover:translate-y-0 transition">Click to Zoom Full Screen</span>
                      </div>
                    </a>
                  ) : (
                    <span className="text-slate-400">No Image Uploaded</span>
                  )}
                </div>
              </div>

              {selectedPayment.status === 'pending' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Admin Notes (Required if Rejecting)</label>
                  <textarea
                    className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    rows="2"
                    placeholder="e.g., Screenshot is blurry, or incorrect amount paid."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  ></textarea>
                </div>
              )}
            </div>

            {selectedPayment.status === 'pending' ? (
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3">
                <button onClick={() => handleVerify(selectedPayment.id, 'failed')} disabled={verifyingId === selectedPayment.id} className="px-5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg font-bold transition disabled:opacity-50">Reject</button>
                <button onClick={() => handleVerify(selectedPayment.id, 'verified')} disabled={verifyingId === selectedPayment.id} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition disabled:opacity-50 shadow-sm">Verify Payment</button>
              </div>
            ) : selectedPayment.status === 'verified' ? (
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                <span className="text-emerald-600 font-bold text-sm">Payment Verified</span>
                <button onClick={() => { if (window.confirm('Are you sure you want to revoke this patient\'s access early?')) handleVerify(selectedPayment.id, 'expired'); }} disabled={verifyingId === selectedPayment.id} className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold transition disabled:opacity-50 shadow-sm">Revoke Access Now</button>
              </div>
            ) : (
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                <span className="text-slate-500 italic text-sm">This payment is already {selectedPayment.status}.</span>
              </div>
            )}
          </div>
        </div>
      )}
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
      case 'monitoring': return <MonitoringTab />;
      case 'payments': return <PaymentsTab />;
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
          { id: 'monitoring', label: 'Monitoring', icon: Activity },
          { id: 'payments', label: 'Payments', icon: FileText }
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
