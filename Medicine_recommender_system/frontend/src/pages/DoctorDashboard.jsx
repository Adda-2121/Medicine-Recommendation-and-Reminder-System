import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { 
  Users, 
  MessageSquare, 
  Clock, 
  CheckCircle,
  UserCircle,
  Bell,
  Calendar,
  Plus,
  Trash2
} from 'lucide-react';

const DoctorDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Overview State
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Availability State
  const [availabilities, setAvailabilities] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [newSlot, setNewSlot] = useState({ date: '', start_time: '', end_time: '' });
  const [isAddingSlot, setIsAddingSlot] = useState(false);

  useEffect(() => {
    fetchConsultations();
    fetchAvailabilities();
  }, []);

  const fetchConsultations = async () => {
    try {
      const res = await api.get('/consultations');
      setConsultations(res.data);
    } catch (err) {
      console.error('Failed to fetch consultations', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailabilities = async () => {
    try {
      setLoadingSlots(true);
      const res = await api.get('/availability', {
        params: { doctor_id: user.id }
      });
      setAvailabilities(res.data);
    } catch (err) {
      console.error('Failed to fetch availabilities', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!newSlot.date || !newSlot.start_time || !newSlot.end_time) return;
    
    try {
      setIsAddingSlot(true);
      await api.post('/availability', newSlot);
      setNewSlot({ date: '', start_time: '', end_time: '' });
      fetchAvailabilities();
    } catch (err) {
      console.error(err);
      alert('Failed to add slot');
    } finally {
      setIsAddingSlot(false);
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!window.confirm('Are you sure you want to delete this available slot?')) return;
    try {
      await api.delete(`/availability/${id}`);
      fetchAvailabilities();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete slot');
    }
  };

  const stats = {
    pending: consultations.filter(c => c.status === 'assigned').length,
    activeChats: consultations.filter(c => c.status === 'in_progress').length,
    todayFollowUps: 0,
    completed: consultations.filter(c => c.status === 'completed').length,
  };

  const summaryCards = [
    { title: 'Pending Consultations', value: stats.pending, icon: Users, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'Active Chats', value: stats.activeChats, icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Today\'s Follow-ups', value: stats.todayFollowUps, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Completed Cases', value: stats.completed, icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dr. {user?.name || 'Doctor'}</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">Your clinical overview and active cases.</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 text-slate-400 hover:text-primary-600 bg-white rounded-full border border-slate-200 shadow-sm relative transition-colors">
            <Bell size={20} />
          </button>
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50 transition">
            <UserCircle size={24} className="text-slate-400" />
            <span className="font-medium text-sm text-slate-700 hidden sm:block">Profile</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-slate-200 pb-0 shrink-0">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          Overview & Patients
        </button>
        <button 
          onClick={() => setActiveTab('availability')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'availability' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          My Availability Schedule
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {loading ? (
            <div className="animate-pulse space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>)}
              </div>
              <div className="h-64 bg-slate-200 rounded-xl w-full"></div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {summaryCards.map((card, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center hover:shadow-md transition">
                    <div className={`${card.bg} ${card.color} p-4 rounded-full mr-4`}>
                      <card.icon size={24} />
                    </div>
                    <div>
                      <p className="text-slate-500 text-sm font-medium">{card.title}</p>
                      <h3 className="text-2xl font-bold text-slate-800">{card.value}</h3>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <h2 className="font-semibold text-slate-800 text-lg">Assigned Patients</h2>
                </div>
                
                {consultations.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <Users size={48} className="mx-auto text-slate-300 mb-4" />
                    <p>No patients currently assigned to you.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient Name</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Symptoms / Reason</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Appointment</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {consultations.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                                  {c.Patient?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-slate-900">{c.Patient?.name || 'Unknown Patient'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-slate-900 line-clamp-1 w-48" title={c.symptoms_description}>
                                {c.symptoms_description || c.reason}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                              {c.appointment_date ? (
                                <div>
                                  <div className="font-medium text-slate-700">{new Date(c.appointment_date).toLocaleDateString()}</div>
                                  <div className="text-xs">{c.appointment_time}</div>
                                </div>
                              ) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize
                                ${c.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                  c.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                                  'bg-amber-100 text-amber-800'}`}>
                                {c.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button 
                                onClick={() => navigate(`/consultations?id=${c.id}`)}
                                className="bg-white border border-slate-200 text-primary-600 hover:bg-primary-50 hover:border-primary-200 px-4 py-2 rounded-md transition-all shadow-sm flex items-center justify-center ml-auto"
                              >
                                <MessageSquare size={16} className="mr-2" /> Open Chat
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'availability' && (
        <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
          {/* Add Slot Form */}
          <div className="w-full md:w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 p-6 self-start shrink-0">
            <div className="flex items-center mb-6">
              <div className="bg-primary-100 text-primary-600 p-2 rounded-lg mr-3"><Calendar size={20} /></div>
              <h2 className="font-bold text-slate-800 text-lg">Add New Slot</h2>
            </div>
            <form onSubmit={handleAddSlot} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input 
                  type="date" required min={new Date().toISOString().split('T')[0]}
                  value={newSlot.date} onChange={e => setNewSlot({...newSlot, date: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                  <input 
                    type="time" required
                    value={newSlot.start_time} onChange={e => setNewSlot({...newSlot, start_time: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                  <input 
                    type="time" required
                    value={newSlot.end_time} onChange={e => setNewSlot({...newSlot, end_time: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isAddingSlot}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition disabled:opacity-50 flex justify-center items-center mt-6"
              >
                <Plus size={18} className="mr-1" /> {isAddingSlot ? 'Adding...' : 'Add Availability Slot'}
              </button>
            </form>
          </div>

          {/* Slots List */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="font-semibold text-slate-800 text-lg">Your Schedule</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 hidden-scrollbar">
              {loadingSlots ? (
                <div className="text-center text-slate-400 p-8">Loading schedule...</div>
              ) : availabilities.length === 0 ? (
                <div className="text-center text-slate-500 p-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <Clock size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="font-medium text-slate-700">No availability slots set</p>
                  <p className="text-sm mt-1">Add slots on the left to allow patients to book appointments with you.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availabilities.map(slot => (
                    <div key={slot.id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-center bg-white shadow-sm hover:border-primary-200 transition">
                      <div>
                        <p className="font-bold text-slate-800 flex items-center">
                          {new Date(slot.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-sm text-slate-500 mt-1 font-medium bg-slate-100 px-2 py-0.5 rounded inline-block">
                          {slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}
                        </p>
                        <div className="mt-2">
                          {slot.is_booked ? (
                            <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full flex inline-flex items-center">
                              <Users size={12} className="mr-1" /> Booked
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full flex inline-flex items-center">
                              <CheckCircle size={12} className="mr-1" /> Open
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {!slot.is_booked && (
                        <button 
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete slot"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
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

export default DoctorDashboard;
