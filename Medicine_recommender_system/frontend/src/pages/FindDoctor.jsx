import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Search, User, Clock, Calendar, CheckCircle, Activity, ChevronRight, Star, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const FindDoctor = () => {
  const { t } = useTranslation();
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
  const [bookingForm, setBookingForm] = useState({ reason: '', symptoms_description: '', commonReason: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reviews Modal State
  const [reviewsModal, setReviewsModal] = useState({ isOpen: false, doctor: null, reviews: [], loading: false });

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
    setBookingForm({ reason: '', symptoms_description: '', commonReason: '' });
    
    
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    try {
      setIsSubmitting(true);
      const payload = {
        doctor_id: selectedDoctor.id,
        
        reason: bookingForm.reason,
        symptoms_description: bookingForm.symptoms_description
      };

      await api.post('/consultations', payload);
      toast.success('Consultation requested. Please complete payment to confirm.');
      setSelectedDoctor(null);
      navigate('/consultations');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to book appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewReviews = async (e, doctor) => {
    e.stopPropagation();
    setReviewsModal({ isOpen: true, doctor, reviews: [], loading: true });
    try {
      const res = await api.get(`/testimonials/provider/${doctor.id}`);
      setReviewsModal({ isOpen: true, doctor, reviews: res.data.testimonials || [], loading: false });
    } catch (err) {
      console.error(err);
      setReviewsModal(prev => ({ ...prev, loading: false }));
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
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{t('findDoctor.title')}</h2>
          <p className="text-slate-500 mt-1">{t('findDoctor.subtitle')}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder={t('findDoctor.searchPlaceholder')} 
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
          <option value="">{t('findDoctor.allSpecialties')}</option>
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
          <h3 className="text-xl font-medium text-slate-700">{t('findDoctor.noDoctors')}</h3>
          <p>{t('findDoctor.adjustSearch')}</p>
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
                    <p className="text-sm font-medium text-primary-600">{doctor.specialty || t('findDoctor.generalPractitioner')}</p>
                    <div className="flex items-center space-x-3 mt-1">
                      <div className="flex items-center text-xs text-slate-500">
                        <Clock size={12} className="mr-1" /> {doctor.experience_years ? `${doctor.experience_years} ${t('findDoctor.yearsExp')}` : t('findDoctor.newProfessional')}
                      </div>
                      <div 
                        className="flex items-center text-xs cursor-pointer hover:underline text-slate-600"
                        onClick={(e) => handleViewReviews(e, doctor)}
                      >
                        <Star size={12} className={`${doctor.averageRating > 0 ? 'text-amber-400 fill-amber-400' : 'text-slate-300'} mr-1`} />
                        <span className="font-bold mr-1">{doctor.averageRating > 0 ? doctor.averageRating : 'New'}</span>
                        <span className="text-slate-400">({doctor.totalReviews || 0})</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2 mb-2">
                  {doctor.availability_status === 'available' ? (
                    <span className="inline-flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                      <span className="relative flex h-2 w-2 mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Available Now
                    </span>
                  ) : doctor.availability_status === 'busy' ? (
                    <span className="inline-flex items-center text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 mr-2"></span>
                      Busy
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full text-xs font-medium">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400 mr-2"></span>
                      Offline
                    </span>
                  )}
                </div>
                
                <button 
                  onClick={() => handleSelectDoctor(doctor)}
                  className="w-full mt-4 flex items-center justify-center py-2.5 bg-slate-50 hover:bg-primary-50 text-slate-700 hover:text-primary-700 font-medium rounded-lg border border-slate-200 hover:border-primary-200 transition"
                >
                  Contact The Doctor <ChevronRight size={16} className="ml-1" />
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
                  <h3 className="font-bold text-slate-800">{t('findDoctor.bookAppointment')}</h3>
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
              {/* Right Column: Form */}
              <div className="w-full flex flex-col">
                <h4 className="font-semibold text-slate-800 mb-4 flex items-center"><Activity size={18} className="mr-2 text-primary-500" /> {t('findDoctor.details')}</h4>
                
                <>
                  <form id="booking-form" onSubmit={handleBookAppointment} className="flex flex-col flex-1 space-y-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{t('findDoctor.reason')}</label>
                        <select 
                          required
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                          value={bookingForm.commonReason}
                          onChange={e => {
                            const val = e.target.value;
                            setBookingForm({
                              ...bookingForm, 
                              commonReason: val, 
                              reason: val === 'Other' ? '' : val
                            });
                          }}
                        >
                          <option value="" disabled>{t('findDoctor.selectReason')}</option>
                          <option value="General Checkup">{t('findDoctor.diseases.general')}</option>
                          <option value="Fever / Cold / Flu">{t('findDoctor.diseases.fever')}</option>
                          <option value="Headache / Migraine">{t('findDoctor.diseases.headache')}</option>
                          <option value="Stomach Ache / Digestion">{t('findDoctor.diseases.stomach')}</option>
                          <option value="Skin Infection / Allergy">{t('findDoctor.diseases.skin')}</option>
                          <option value="Joint / Muscle Pain">{t('findDoctor.diseases.joint')}</option>
                          <option value="Breathing Issue / Cough">{t('findDoctor.diseases.breathing')}</option>
                          <option value="Dental Issue">{t('findDoctor.diseases.dental')}</option>
                          <option value="Eye / Vision Problem">{t('findDoctor.diseases.eye')}</option>
                          <option value="Other">{t('findDoctor.diseases.other')}</option>
                        </select>
                      </div>
                      
                      {bookingForm.commonReason === 'Other' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                          <input 
                            type="text" required autoFocus
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            placeholder={t('findDoctor.specifyReason')}
                            value={bookingForm.reason}
                            onChange={e => setBookingForm({...bookingForm, reason: e.target.value})}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{t('findDoctor.symptoms')}</label>
                      <textarea 
                        required 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 flex-1 resize-none"
                        placeholder={t('findDoctor.detailSymptoms')}
                        value={bookingForm.symptoms_description}
                        onChange={e => setBookingForm({...bookingForm, symptoms_description: e.target.value})}
                      ></textarea>
                    </div>
                  </form>
                </>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end shrink-0">
              <button 
                type="button" 
                onClick={() => setSelectedDoctor(null)}
                className="px-5 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-lg mr-3 transition"
              >
                {t('findDoctor.cancel')}
              </button>
              <button 
                type="submit" 
                form="booking-form"
                disabled={isSubmitting}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:hover:bg-primary-600 flex items-center"
              >
                {isSubmitting ? t('findDoctor.booking') : t('findDoctor.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Modal */}
      {reviewsModal.isOpen && reviewsModal.doctor && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center">
                  <Star size={18} className="text-amber-400 fill-amber-400 mr-2" />
                  Reviews for Dr. {reviewsModal.doctor.name}
                </h3>
              </div>
              <button 
                onClick={() => setReviewsModal({ isOpen: false, doctor: null, reviews: [], loading: false })}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition"
              >
                &times;
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              {reviewsModal.loading ? (
                <div className="flex justify-center p-8"><Activity className="animate-spin text-primary-500" /></div>
              ) : reviewsModal.reviews.length === 0 ? (
                <div className="text-center p-8 text-slate-500">
                  <MessageSquare size={32} className="mx-auto mb-2 text-slate-300" />
                  <p>No reviews yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewsModal.reviews.map(review => (
                    <div key={review.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-sm text-slate-800">{review.Patient?.name || 'Anonymous'}</div>
                        <div className="flex">
                          {[1,2,3,4,5].map(star => (
                            <Star key={star} size={12} className={star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                          ))}
                        </div>
                      </div>
                      {review.comment && <p className="text-sm text-slate-600 mt-1">{review.comment}</p>}
                      <div className="text-[10px] text-slate-400 mt-3 uppercase font-medium">
                        {new Date(review.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FindDoctor;
