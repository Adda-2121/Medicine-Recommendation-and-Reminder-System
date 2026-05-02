const fs = require('fs');

const filepath = 'c:/Users/HP/Documents/Medicine-Recommendation-and-Reminder-System/Medicine_recommender_system/frontend/src/pages/DoctorDashboard.jsx';
let content = fs.readFileSync(filepath, 'utf-8');

// Add isStatusDropdownOpen state
const stateAddition = `  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);\n`;
content = content.replace(
    "const [currentStatus, setCurrentStatus] = useState('offline');",
    `const [currentStatus, setCurrentStatus] = useState('offline');\n${stateAddition}`
);

// We need to make sure the dropdown closes when clicking outside, or just simple toggling.
// Actually, simple toggling via onClick is fine, or onMouseLeave. Let's use simple toggling.
// Replace the old UI toggle with the new one
const oldToggleRegex = /\{\/\* Status Toggle \*\/\}.*?<\/div>/s;
const newToggle = `{/* Professional Status Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm hover:bg-slate-50 transition"
            >
              <span className={\`w-2.5 h-2.5 rounded-full \${currentStatus === 'available' ? 'bg-emerald-500' : currentStatus === 'busy' ? 'bg-amber-500' : 'bg-slate-400'}\`}></span>
              <span className="text-sm font-medium text-slate-700 capitalize">{currentStatus}</span>
              <svg className={\`w-4 h-4 text-slate-400 transition-transform \${isStatusDropdownOpen ? 'rotate-180' : ''}\`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            
            {isStatusDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50">
                <div className="p-1">
                  <button 
                    onClick={() => { handleStatusChange('available'); setIsStatusDropdownOpen(false); }}
                    className={\`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center space-x-2 transition-colors \${currentStatus === 'available' ? 'bg-slate-50 font-semibold' : 'hover:bg-slate-50'}\`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-700">Available</span>
                  </button>
                  <button 
                    onClick={() => { handleStatusChange('busy'); setIsStatusDropdownOpen(false); }}
                    className={\`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center space-x-2 transition-colors \${currentStatus === 'busy' ? 'bg-slate-50 font-semibold' : 'hover:bg-slate-50'}\`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span className="text-slate-700">Busy</span>
                  </button>
                  <button 
                    onClick={() => { handleStatusChange('offline'); setIsStatusDropdownOpen(false); }}
                    className={\`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center space-x-2 transition-colors \${currentStatus === 'offline' ? 'bg-slate-50 font-semibold' : 'hover:bg-slate-50'}\`}
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span className="text-slate-700">Offline</span>
                  </button>
                </div>
              </div>
            )}
          </div>`;

content = content.replace(oldToggleRegex, newToggle);

fs.writeFileSync(filepath, content, 'utf-8');
console.log("DoctorDashboard UI patched to professional dropdown successfully");
