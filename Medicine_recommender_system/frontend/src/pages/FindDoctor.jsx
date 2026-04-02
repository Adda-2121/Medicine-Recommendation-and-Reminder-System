import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Search, User, Clock, Calendar, CheckCircle, Activity, ChevronRight } from 'lucide-react';

const FindDoctor = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  // Booking Modal State
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availabilities, setAvailabilities] = useState([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingForm, setBookingForm] = useState({ reason: '', symptoms_description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialty]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/doctors', {
        params: { specialty: selectedSpecialty }
      });
      setDoctors(res.data);
    } catch (err) {
      console.error('Failed to fetch doctors', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoctor = async (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedSlot(null);
    setBookingForm({ reason: '', symptoms_description: '' });
    
    try {
      setFetchingSlots(true);
      const res = await api.get(`/availability`, {
        params: { doctor_id: doctor.id, is_booked: false }
      });
      setAvailabilities(res.data);
    } catch (err) {
      console.error('Failed to fetch availability', err);
    } finally {
      setFetchingSlots(false);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedSlot || !selectedDoctor) return;

    try {
      setIsSubmitting(true);
      const payload = {
        doctor_id: selectedDoctor.id,
        appointment_date: selectedSlot.date,
        appointment_time: selectedSlot.start_time,
        reason: bookingForm.reason,
        symptoms_description: bookingForm.symptoms_description
      };

      await api.post('/consultations', payload);
      alert('Consultation requested. Please complete payment to confirm.');
      setSelectedDoctor(null);
      navigate('/consultations');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to book appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDoctors = doctors.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (d.specialty && d.specialty.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const specialties = [...new Set(doctors.map(d => d.specialty).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Find a Doctor</h2>
          <p className="text-slate-500 mt-1">Browse our verified professionals and book a consultation.</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Search by name or specialty..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        </div>
        <select 
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
        >
          <option value="">All Specialties</option>
          {specialties.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-slate-200 rounded-xl"></div>)}
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
          <Activity size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-medium text-slate-700">No doctors found</h3>
          <p>Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map(doctor => (
            <div key={doctor.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition group">
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-xl uppercase shadow-inner">
                    {doctor.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Dr. {doctor.name}</h3>
                    <p className="text-sm font-medium text-primary-600">{doctor.specialty || 'General Practitioner'}</p>
                    <div className="flex items-center text-xs text-slate-500 mt-1">
                      <Clock size={12} className="mr-1" /> {doctor.experience_years ? `${doctor.experience_years} Years Exp.` : 'New Professional'}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleSelectDoctor(doctor)}
                  className="w-full mt-4 flex items-center justify-center py-2.5 bg-slate-50 hover:bg-primary-50 text-slate-700 hover:text-primary-700 font-medium rounded-lg border border-slate-200 hover:border-primary-200 transition"
                >
                  View Availability <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-lg mr-3">
                  {selectedDoctor.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Book Appointment</h3>
                  <p className="text-xs font-medium text-primary-600">Dr. {selectedDoctor.name} &bull; {selectedDoctor.specialty}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDoctor(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col md:flex-row gap-8">
              {/* Left Column: Slots */}
              <div className="w-full md:w-1/2 flex flex-col">
                <h4 className="font-semibold text-slate-800 mb-4 flex items-center"><Calendar size={18} className="mr-2 text-primary-500" /> Select an available slot</h4>
                
                {fetchingSlots ? (
                  <div className="flex-1 flex items-center justify-center text-slate-400 p-8">Loading availability...</div>
                ) : availabilities.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-center">
                    <Calendar size={32} className="text-slate-300 mb-2" />
                    <p className="font-medium">No available slots</p>
                    <p className="text-xs mt-1">Please check back later or choose another doctor.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[300px] pr-2 hidden-scrollbar">
                    {availabilities.map(slot => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden
                          ${selectedSlot?.id === slot.id 
                            ? 'bg-primary-50 border-primary-500 shadow-sm' 
                            : 'bg-white border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                          }
                        `}
                      >
                        {selectedSlot?.id === slot.id && <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-t-primary-500 border-l-[20px] border-l-transparent"></div>}
                        <p className={`font-semibold text-sm ${selectedSlot?.id === slot.id ? 'text-primary-800' : 'text-slate-800'}`}>
                          {new Date(slot.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <p className={`text-xs mt-0.5 ${selectedSlot?.id === slot.id ? 'text-primary-600 font-medium' : 'text-slate-500'}`}>
                          {slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Form */}
              <div className="w-full md:w-1/2 flex flex-col">
                <h4 className="font-semibold text-slate-800 mb-4 flex items-center"><Activity size={18} className="mr-2 text-primary-500" /> Consultation Details</h4>
                
                {!selectedSlot ? (
                  <div className="flex-1 flex items-center justify-center text-slate-400 p-8 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-center text-sm">Please select a time slot first to proceed with booking.</p>
                  </div>
                ) : (
                  <form id="booking-form" onSubmit={handleBookAppointment} className="flex flex-col flex-1 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Reason for Visit</label>
                      <input 
                        type="text" required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g. Headache"
                        value={bookingForm.reason}
                        onChange={e => setBookingForm({...bookingForm, reason: e.target.value})}
                      />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Symptoms Description</label>
                      <textarea 
                        required 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 flex-1 resize-none"
                        placeholder="Detail your symptoms..."
                        value={bookingForm.symptoms_description}
                        onChange={e => setBookingForm({...bookingForm, symptoms_description: e.target.value})}
                      ></textarea>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end shrink-0">
              <button 
                type="button" 
                onClick={() => setSelectedDoctor(null)}
                className="px-5 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-lg mr-3 transition"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="booking-form"
                disabled={!selectedSlot || isSubmitting}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:hover:bg-primary-600 flex items-center"
              >
                {isSubmitting ? 'Booking...' : 'Confirm Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindDoctor;
