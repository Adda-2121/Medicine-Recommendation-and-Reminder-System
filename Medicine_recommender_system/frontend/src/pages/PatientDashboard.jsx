import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { 
  PlusCircle, 
  MessageSquare, 
  Bell, 
  History,
  UserCircle
} from 'lucide-react';

const PatientDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  // We'll keep these for potential quick views, but the main UI is action cards now
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading basic data if needed, or just remove if cards are purely navigation
    setTimeout(() => setLoading(false), 500);
  }, []);

  const actionCards = [
    {
      title: 'Start Consultation',
      description: 'Request a new consultation with a doctor.',
      icon: PlusCircle,
      color: 'bg-primary-50 text-primary-600',
      onClick: () => navigate('/consultations?action=new')
    },
    {
      title: 'Active Chats',
      description: 'Continue your ongoing conversations.',
      icon: MessageSquare,
      color: 'bg-blue-50 text-blue-600',
      onClick: () => navigate('/consultations')
    },
    {
      title: 'Upcoming Reminders',
      description: 'View and manage your medicine schedule.',
      icon: Bell,
      color: 'bg-amber-50 text-amber-600',
      onClick: () => navigate('/reminders')
    },
    {
      title: 'Medical History',
      description: 'Review your past consultations and reports.',
      icon: History,
      color: 'bg-emerald-50 text-emerald-600',
      onClick: () => navigate('/history')
    }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Top Navbar / Header Area (Specific to the dashboard content area) */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Welcome, {user?.name || 'Patient'}</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">Here is your health overview for today.</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 text-slate-400 hover:text-primary-600 bg-white rounded-full border border-slate-200 shadow-sm relative transition-colors">
            <Bell size={20} />
            <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50 transition">
            <UserCircle size={24} className="text-slate-400" />
            <span className="font-medium text-sm text-slate-700 hidden sm:block">My Profile</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-slate-100 h-40 rounded-xl"></div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {actionCards.map((card, idx) => (
              <div 
                key={idx} 
                onClick={card.onClick}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center text-center hover:shadow-md transition cursor-pointer hover:-translate-y-1"
              >
                <div className={`${card.color} p-4 rounded-full mx-auto mb-4`}>
                  <card.icon size={32} />
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">{card.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>

          {/* Quick Overview Section (Optional but good for UX) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <MessageSquare className="mr-2 text-slate-400" size={20} /> Recent Activity
              </h2>
              <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                <p className="text-slate-500 mb-4 text-sm">No recent activity detected.</p>
                <button 
                  onClick={() => navigate('/consultations?action=new')}
                  className="text-primary-600 font-medium hover:underline text-sm"
                >
                  Start a new consultation
                </button>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl shadow-md text-white p-6 relative overflow-hidden flex flex-col justify-center items-center text-center">
               <Bell size={100} className="absolute -right-6 -bottom-6 opacity-10" />
               <div className="bg-white/20 p-4 rounded-full mb-4 backdrop-blur-sm">
                 <Bell size={32} className="text-white" />
               </div>
               <h3 className="text-lg font-bold mb-2 z-10">Stay on Track</h3>
               <p className="text-primary-100 text-sm z-10 mb-6">Check your reminders to ensure you don't miss any medication.</p>
               <button 
                  onClick={() => navigate('/reminders')}
                  className="bg-white text-primary-700 px-6 py-2 rounded-full font-medium text-sm shadow-sm hover:bg-slate-50 transition z-10"
                >
                 View Schedule
               </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PatientDashboard;
