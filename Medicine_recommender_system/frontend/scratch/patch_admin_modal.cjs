const fs = require('fs');
const filepath = 'c:/Users/HP/Documents/Medicine-Recommendation-and-Reminder-System/Medicine_recommender_system/frontend/src/pages/AdminDashboard.jsx';
let content = fs.readFileSync(filepath, 'utf8');

const modalStartIdx = content.indexOf('{/* Review Modal */}');
const modalEndIdx = content.indexOf('<ConfirmationModal');

if (modalStartIdx === -1 || modalEndIdx === -1) {
    console.log('Could not find modal tags');
    process.exit(1);
}

const newModal = `{/* Review Modal */}
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
                        <span className={\`font-bold \${new Date(selectedDoctor.license_expiry_date) < new Date() ? 'text-red-600' : 'text-emerald-600'}\`}>
                          {selectedDoctor.license_expiry_date ? new Date(selectedDoctor.license_expiry_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm text-center">
                    <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-xs mb-3 border-b pb-2">Status</h4>
                    <div className={\`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border 
                      \${selectedDoctor.verification_status === 'verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : selectedDoctor.verification_status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200'
                      : selectedDoctor.verification_status === 'suspended' ? 'bg-slate-50 text-slate-700 border-slate-300'
                      : 'bg-amber-50 text-amber-700 border-amber-200'}\`}>
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
                            <img src={\`\${api.defaults.baseURL.replace(/\\/api$/, '') || 'http://localhost:5000'}/\${selectedDoctor.selfie_document.replace(/\\\\/g, '/')}\`} alt="Doctor Selfie" className="w-full h-full object-cover" />
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
                                <a href={\`\${api.defaults.baseURL.replace(/\\/api$/, '') || 'http://localhost:5000'}/\${selectedDoctor.id_document.replace(/\\\\/g, '/')}\`} target="_blank" rel="noreferrer" className="text-primary-600 text-xs hover:underline bg-primary-50 px-3 py-1 rounded-full border border-primary-100">Open PDF</a>
                              </div>
                            ) : (
                              <a href={\`\${api.defaults.baseURL.replace(/\\/api$/, '') || 'http://localhost:5000'}/\${selectedDoctor.id_document.replace(/\\\\/g, '/')}\`} target="_blank" rel="noreferrer" className="w-full h-full">
                                <img src={\`\${api.defaults.baseURL.replace(/\\/api$/, '') || 'http://localhost:5000'}/\${selectedDoctor.id_document.replace(/\\\\/g, '/')}\`} alt="ID Document" className="w-full h-full object-contain" />
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
                            <a href={\`\${api.defaults.baseURL.replace(/\\/api$/, '') || 'http://localhost:5000'}/\${selectedDoctor.verification_document.replace(/\\\\/g, '/')}\`} target="_blank" rel="noreferrer" className="text-primary-600 font-semibold hover:underline bg-primary-50 px-4 py-2 rounded-full border border-primary-100">Open PDF Document</a>
                          </div>
                        ) : (
                          <a href={\`\${api.defaults.baseURL.replace(/\\/api$/, '') || 'http://localhost:5000'}/\${selectedDoctor.verification_document.replace(/\\\\/g, '/')}\`} target="_blank" rel="noreferrer" className="w-full h-full">
                              <img src={\`\${api.defaults.baseURL.replace(/\\/api$/, '') || 'http://localhost:5000'}/\${selectedDoctor.verification_document.replace(/\\\\/g, '/')}\`} alt="License Document" className="w-full h-full object-contain" />
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
                            <a href={\`\${api.defaults.baseURL.replace(/\\/api$/, '') || 'http://localhost:5000'}/\${selectedDoctor.degree_document.replace(/\\\\/g, '/')}\`} target="_blank" rel="noreferrer" className="text-primary-600 font-semibold hover:underline bg-primary-50 px-4 py-2 rounded-full border border-primary-100">Open PDF Document</a>
                          </div>
                        ) : (
                          <a href={\`\${api.defaults.baseURL.replace(/\\/api$/, '') || 'http://localhost:5000'}/\${selectedDoctor.degree_document.replace(/\\\\/g, '/')}\`} target="_blank" rel="noreferrer" className="w-full h-full">
                              <img src={\`\${api.defaults.baseURL.replace(/\\/api$/, '') || 'http://localhost:5000'}/\${selectedDoctor.degree_document.replace(/\\\\/g, '/')}\`} alt="Degree Document" className="w-full h-full object-contain" />
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
                            <a href={\`\${api.defaults.baseURL.replace(/\\/api$/, '') || 'http://localhost:5000'}/\${selectedDoctor.experience_document.replace(/\\\\/g, '/')}\`} target="_blank" rel="noreferrer" className="text-primary-600 font-semibold hover:underline bg-primary-50 px-4 py-2 rounded-full border border-primary-100">Open PDF Document</a>
                          </div>
                        ) : (
                          <a href={\`\${api.defaults.baseURL.replace(/\\/api$/, '') || 'http://localhost:5000'}/\${selectedDoctor.experience_document.replace(/\\\\/g, '/')}\`} target="_blank" rel="noreferrer" className="w-full h-full">
                              <img src={\`\${api.defaults.baseURL.replace(/\\/api$/, '') || 'http://localhost:5000'}/\${selectedDoctor.experience_document.replace(/\\\\/g, '/')}\`} alt="Experience Document" className="w-full h-full object-contain" />
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
                 <button onClick={() => {
                     const reason = window.prompt("Reason for rejection:");
                     if (reason !== null) handleVerify(selectedDoctor.id, 'rejected', reason);
                 }} className="px-4 py-2 border border-red-300 bg-red-50 text-red-700 rounded-md font-medium hover:bg-red-100 transition shadow-sm text-sm">
                     Reject Application
                 </button>
                 {selectedDoctor.verification_status === 'verified' && (
                     <button onClick={() => {
                         const reason = window.prompt("Reason for suspension:");
                         if (reason !== null) handleVerify(selectedDoctor.id, 'suspended', reason);
                     }} className="px-4 py-2 border border-slate-300 bg-slate-100 text-slate-700 rounded-md font-medium hover:bg-slate-200 transition shadow-sm text-sm">
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

      `;

const newContent = content.substring(0, modalStartIdx) + newModal + content.substring(modalEndIdx);
fs.writeFileSync(filepath, newContent, 'utf8');
console.log('Successfully patched AdminDashboard.jsx modal');
