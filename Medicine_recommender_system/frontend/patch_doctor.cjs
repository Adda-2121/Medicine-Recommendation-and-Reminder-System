const fs = require('fs');

const path = 'c:/Users/HP/Documents/Medicine-Recommendation-and-Reminder-System/Medicine_recommender_system/frontend/src/pages/DoctorDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add handleResumeConsultation
const resumeFunc = `
  const handleResumeConsultation = async (id) => {
    try {
      await api.put(\`/consultations/\${id}/resume\`);
      toast.success('Case resumed! You can now continue the consultation.');
      fetchConsultations();
      navigate(\`/consultations?id=\${id}\`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resume consultation');
    }
  };

  const handleCompleteConsultation`;
content = content.replace(/const handleCompleteConsultation/g, resumeFunc);

// 2. Update stats and summaryCards
const statsPatch = `  const stats = {
    pending: consultations.filter(c => c.status === 'assigned').length,
    activeChats: consultations.filter(c => c.status === 'in_progress').length,
    pendingResults: consultations.filter(c => c.status === 'waiting_for_results').length,
    resultsReady: consultations.filter(c => c.status === 'result_ready').length,
    completed: consultations.filter(c => c.status === 'completed').length,
  };

  const summaryCards = [
    { title: 'Pending Patients', value: stats.pending, icon: Users, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'Active Chats', value: stats.activeChats, icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Pending Results', value: stats.pendingResults, icon: Clock, color: 'text-slate-600', bg: 'bg-slate-100' },
    { title: 'Results Ready', value: stats.resultsReady, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  ];`;

content = content.replace(
    /const stats = \{[\s\S]*?\];/m,
    statsPatch
);

// 3. Update status span in table
const statusSpanPatch = `<span className={\`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize
                                \${c.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                  c.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                                  c.status === 'result_ready' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse' :
                                  c.status === 'waiting_for_results' ? 'bg-slate-100 text-slate-800' :
                                  'bg-amber-100 text-amber-800'}\`}>
                                {c.status === 'completed' ? 'Completed' : (c.status === 'in_progress' ? 'Active' : c.status.replace(/_/g, ' '))}
                              </span>`;

content = content.replace(
    /<span className=\{\`px-2\.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize[\s\S]*?<\/span>/m,
    statusSpanPatch
);

// 4. Update action buttons
const actionsPatch = `                              <div className="flex items-center justify-end gap-2">
                                {c.status === 'result_ready' && (
                                  <button
                                    onClick={() => handleResumeConsultation(c.id)}
                                    className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-all shadow-sm text-xs font-bold flex items-center"
                                  >
                                    <Activity size={13} className="mr-1" /> Resume Case
                                  </button>
                                )}
                                {c.status === 'in_progress' && (
                                  <button
                                    onClick={() => handleCompleteConsultation(c.id)}
                                    className="bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-md transition-all shadow-sm text-xs font-bold flex items-center"
                                  >
                                    <CheckCircle size={13} className="mr-1" /> Complete
                                  </button>
                                )}
                                {(c.status === 'in_progress' || c.status === 'assigned') && (
                                  <button 
                                    onClick={() => navigate(\`/consultations?id=\${c.id}\`)}
                                    className="bg-white border border-slate-200 text-primary-600 hover:bg-primary-50 hover:border-primary-200 px-3 py-1.5 rounded-md transition-all shadow-sm text-xs font-bold flex items-center"
                                  >
                                    <MessageSquare size={13} className="mr-1" /> Chat
                                  </button>
                                )}
                                {c.status === 'waiting_for_results' && (
                                   <span className="text-xs text-slate-500 font-medium">Waiting on Lab...</span>
                                )}
                              </div>`;

content = content.replace(
    /<div className="flex items-center justify-end gap-2">[\s\S]*?<\/div>/m,
    actionsPatch
);

fs.writeFileSync(path, content, 'utf8');
console.log('DoctorDashboard patched');
