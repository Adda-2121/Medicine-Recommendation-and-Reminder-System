import re

filepath = 'c:/Users/HP/Documents/Medicine-Recommendation-and-Reminder-System/Medicine_recommender_system/frontend/src/pages/DoctorDashboard.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add states
state_addition = """  const [currentStatus, setCurrentStatus] = useState('offline');
"""
content = re.sub(
    r'(const \[modalConfig, setModalConfig\] = useState\(\{ isOpen: false, slotId: null \}\);)',
    r'\1\n' + state_addition,
    content
)

# Add fetchStatus in useEffect
use_effect_addition = """    fetchStatus();"""
content = re.sub(
    r'(fetchReviews\(\);\n  \}, \[\]\);)',
    r'\1\n  const fetchStatus = async () => {\n    try {\n      const res = await api.get(\'/users/availability\');\n      setCurrentStatus(res.data.availability_status || \'offline\');\n    } catch (err) {\n      console.error(\'Failed to fetch status\', err);\n    }\n  };\n',
    content
)
# Wait, let's fix that substitution to ensure fetchStatus runs inside useEffect.
# The original code has:
#   useEffect(() => {
#     fetchConsultations();
#     fetchAvailabilities();
#     fetchReviews();
#   }, []);

content = content.replace(
    "fetchReviews();",
    "fetchReviews();\n    fetchStatus();"
)

# Add handleStatusChange
handler_addition = """
  const handleStatusChange = async (newStatus) => {
    const pendingCount = consultations.filter(c => c.status === 'assigned').length;
    if ((newStatus === 'offline' || newStatus === 'busy') && pendingCount > 0) {
      const confirm = window.confirm(`You have ${pendingCount} pending patient(s). Changing your status to ${newStatus} will reassign them to other doctors. Continue?`);
      if (!confirm) return;
    }
    
    try {
      const res = await api.put('/users/availability', { status: newStatus });
      setCurrentStatus(res.data.availability_status);
      toast.success(`Status updated to ${newStatus}`);
      fetchConsultations();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };
"""
content = content.replace(
    "const handleAddSlot = async (e) => {",
    handler_addition + "\n  const handleAddSlot = async (e) => {"
)

# Add UI toggle
# Replace: <div className="flex items-center space-x-4">
ui_addition = """<div className="flex items-center space-x-4">
          {/* Status Toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button 
              onClick={() => handleStatusChange('available')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${currentStatus === 'available' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Available
            </button>
            <button 
              onClick={() => handleStatusChange('busy')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${currentStatus === 'busy' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Busy
            </button>
            <button 
              onClick={() => handleStatusChange('offline')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${currentStatus === 'offline' ? 'bg-slate-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Offline
            </button>
          </div>
"""
content = content.replace(
    '<div className="flex items-center space-x-4">',
    ui_addition
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("DoctorDashboard patched successfully")
