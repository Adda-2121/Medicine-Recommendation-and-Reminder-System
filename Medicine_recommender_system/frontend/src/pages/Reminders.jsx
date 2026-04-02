import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { Bell, Plus, Clock, Pill, Trash2 } from 'lucide-react';

const Reminders = () => {
  const { user } = useContext(AuthContext);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // For Patient adding their own or Admin adding for any patient
  const [newReminder, setNewReminder] = useState({
    patient_id: user.role === 'patient' ? user.id : '',
    reminder_type: 'medicine',
    scheduled_time: '',
    medicine_name: '',
    medicine_type: 'Pill',
    dose: '',
    frequency: '',
  });

  const fetchReminders = async () => {
    try {
      setLoading(true);
      // For doctors/admins, get all or assigned (backend handles logic)
      // For patients, backend filters their own automatically
      const res = await api.get('/reminders');
      setReminders(res.data);
    } catch (err) {
      console.error('Failed to fetch reminders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleAddReminder = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reminders', newReminder);
      setShowForm(false);
      setNewReminder({
        patient_id: user.role === 'patient' ? user.id : '',
        reminder_type: 'medicine',
        scheduled_time: '',
        medicine_name: '',
        medicine_type: 'Pill',
        dose: '',
        frequency: '',
      });
      fetchReminders();
    } catch (err) {
      console.error(err);
      alert('Failed to add reminder');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      alert('Mock Delete functionality for reminder ' + id);
      // await api.delete(`/reminders/${id}`);
      // fetchReminders();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Reminders</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">
            {user.role === 'patient' ? 'Manage your medication schedule and appointments.' : 'Manage patient reminders and schedules.'}
          </p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-5 py-2.5 rounded-lg flex items-center hover:bg-primary-700 transition shadow-sm font-medium"
        >
          {showForm ? 'Cancel' : <><Plus size={20} className="mr-2" /> Add Reminder</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 max-w-2xl">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <Bell className="mr-2 text-primary-500" size={20} /> Create New Reminder
          </h3>
          <form onSubmit={handleAddReminder} className="space-y-4">
            {user.role !== 'patient' && (
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Patient ID</label>
                 <input 
                   type="number" required
                   className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                   value={newReminder.patient_id} onChange={(e) => setNewReminder({...newReminder, patient_id: e.target.value})}
                 />
              </div>
            )}
            {user.role !== 'patient' && (
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Treatment Plan ID (Optional)</label>
                 <input 
                   type="number" 
                   className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                   value={newReminder.treatment_plan_id || ''} onChange={(e) => setNewReminder({...newReminder, treatment_plan_id: e.target.value})}
                 />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Reminder Type</label>
                 <select 
                   className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                   value={newReminder.reminder_type} onChange={e => setNewReminder({...newReminder, reminder_type: e.target.value})}
                 >
                   <option value="medicine">Medicine Intake</option>
                   <option value="follow_up">Follow Up Consultation</option>
                   <option value="general">General Note</option>
                 </select>
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time</label>
                 <input 
                   type="datetime-local" required
                   className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                   value={newReminder.scheduled_time} onChange={(e) => setNewReminder({...newReminder, scheduled_time: e.target.value})}
                 />
              </div>
            </div>
            
            {newReminder.reminder_type === 'medicine' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200 mt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Medicine Name</label>
                  <input
                    type="text" placeholder="e.g. Amoxicillin" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    value={newReminder.medicine_name} onChange={(e) => setNewReminder({...newReminder, medicine_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Medicine Type</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    value={newReminder.medicine_type} onChange={(e) => setNewReminder({...newReminder, medicine_type: e.target.value})}
                  >
                    <option value="Pill">Pill / Tablet</option>
                    <option value="Syrup">Syrup / Liquid</option>
                    <option value="Injection">Injection</option>
                    <option value="Drops">Drops</option>
                    <option value="Inhaler">Inhaler</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dose</label>
                  <input
                    type="text" placeholder="e.g. 500mg or 2 puffs"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    value={newReminder.dose} onChange={(e) => setNewReminder({...newReminder, dose: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Frequency Details</label>
                  <input
                    type="text" placeholder="e.g. After meals, twice a day"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    value={newReminder.frequency} onChange={(e) => setNewReminder({...newReminder, frequency: e.target.value})}
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end pt-4 mt-2">
              <button type="submit" className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 font-medium">Save Schedule</button>
            </div>
          </form>
        </div>
      )}

      {/* Main List Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
           {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-slate-100 rounded-xl"></div>)}
        </div>
      ) : reminders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4">
             <Bell size={48} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-medium text-slate-700 mb-2">No Reminders Set</h3>
          <p className="text-slate-500 max-w-sm">
            {user.role === 'patient' 
              ? "You don't have any upcoming reminders. Use the button above to schedule your medicine intake." 
              : "No active reminders found in the system."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reminders.map(r => {
            const isMedicine = r.reminder_type === 'medicine';
            const pastDue = new Date(r.scheduled_time) < new Date() && r.status !== 'sent';
            
            return (
              <div 
                key={r.id} 
                className={`bg-white rounded-xl border p-5 relative group transition-shadow hover:shadow-md
                  ${r.status === 'sent' ? 'border-slate-200 opacity-75' : pastDue ? 'border-red-300 bg-red-50/30' : 'border-slate-200 border-l-4 border-l-primary-500'}`}
              >
                <button 
                  onClick={() => handleDelete(r.id)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 size={18} />
                </button>
                
                <div className="flex items-start mb-4">
                  <div className={`p-3 rounded-lg mr-4
                     ${isMedicine ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}
                  >
                     {isMedicine ? <Pill size={24} /> : <Clock size={24} />}
                  </div>
                  <div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mb-1 inline-block
                       ${r.status === 'sent' ? 'bg-slate-100 text-slate-500' : pastDue ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                    >
                      {r.status === 'sent' ? 'Sent' : pastDue ? 'Overdue' : 'Active'}
                    </span>
                    <h3 className="font-bold text-slate-800 text-lg capitalize">
                      {isMedicine && r.medicine_name ? r.medicine_name : r.reminder_type.replace('_', ' ')}
                    </h3>
                    {isMedicine && (r.dose || r.medicine_type || r.frequency) && (
                      <p className="text-sm font-medium text-slate-600 mt-1 flex flex-wrap gap-2">
                        {r.medicine_type && <span className="bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">{r.medicine_type}</span>}
                        {r.dose && <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs border border-emerald-200">{r.dose}</span>}
                        {r.frequency && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs border border-blue-200">{r.frequency}</span>}
                      </p>
                    )}
                    {user.role !== 'patient' && (
                      <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">Patient: {r.Patient?.name || 'Unknown'}</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-lg flex items-center justify-between">
                   <div className="flex items-center text-slate-600 font-medium text-sm">
                     <Clock size={16} className="mr-2 text-slate-400" />
                     {new Date(r.scheduled_time).toLocaleDateString()}
                   </div>
                   <span className="text-primary-700 font-bold">
                     {new Date(r.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Reminders;
