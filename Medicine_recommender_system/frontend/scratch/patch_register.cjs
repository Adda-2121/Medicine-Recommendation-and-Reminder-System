const fs = require('fs');
const filepath = 'c:/Users/HP/Documents/Medicine-Recommendation-and-Reminder-System/Medicine_recommender_system/frontend/src/pages/Register.jsx';
let content = fs.readFileSync(filepath, 'utf8');

const formStartIdx = content.indexOf('<form onSubmit={handleSubmit}');
const formEndIdx = content.lastIndexOf('</form>') + '</form>'.length;

if (formStartIdx === -1 || formEndIdx === -1) {
    console.log('Could not find form tags');
    process.exit(1);
}

const newForm = `<form onSubmit={handleSubmit} className="relative z-10 space-y-4">
          {/* Progress Indicator for Doctors */}
          {formData.role === 'doctor' && (
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-200">
              <div className={\`text-xs font-semibold px-2 py-1 rounded-full \${currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500'}\`}>1. Basic</div>
              <div className={\`h-0.5 flex-1 mx-1 \${currentStep >= 2 ? 'bg-primary-600' : 'bg-slate-200'}\`}></div>
              <div className={\`text-xs font-semibold px-2 py-1 rounded-full \${currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500'}\`}>2. Identity</div>
              <div className={\`h-0.5 flex-1 mx-1 \${currentStep >= 3 ? 'bg-primary-600' : 'bg-slate-200'}\`}></div>
              <div className={\`text-xs font-semibold px-2 py-1 rounded-full \${currentStep >= 3 ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500'}\`}>3. Professional</div>
            </div>
          )}

          {/* STEP 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.nameLabel')}</label>
                <input type="text" name="name"
                  className="w-full border-slate-300 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                  value={formData.name} onChange={handleChange} required placeholder={t('auth.register.namePlaceholder')} />
              </div>
              <div className="flex space-x-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.ageLabel')}</label>
                  <input type="number" name="age"
                    className="w-full border-slate-300 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                    value={formData.age} onChange={handleChange} required min="0" placeholder="e.g. 25" />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.sexLabel')}</label>
                  <select name="sex"
                    className="w-full border-slate-300 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white"
                    value={formData.sex} onChange={handleChange} required>
                    <option value="" disabled></option>
                    <option value="Male">{t('auth.register.male')}</option>
                    <option value="Female">{t('auth.register.female')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.login.passwordLabel')}</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} name="password"
                    className="w-full border-slate-300 border rounded-md p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                    value={formData.password} onChange={handleChange} required placeholder={t('auth.login.passwordPlaceholder')} />
                  <button type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                    onClick={() => setShowPassword(!showPassword)} tabIndex="-1">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.amA')}</label>
                <select name="role"
                  className="w-full border-slate-300 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white"
                  value={formData.role} onChange={handleChange}>
                  <option value="patient">{t('auth.register.patient')}</option>
                  <option value="doctor">{t('auth.register.doctor')}</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: Identity & Contact (For Doctors) or Patient Default */}
          {((currentStep === 2 && formData.role === 'doctor') || (currentStep === 1 && formData.role === 'patient')) && (
            <div className={\`space-y-4 \${currentStep === 2 ? 'animate-fadeIn' : ''}\`}>
              {formData.role === 'doctor' && <h3 className="font-semibold text-slate-700 text-sm pb-2 border-b border-slate-200">Identity Verification</h3>}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Contact Verification</label>
                {verifyStep !== 'verified' && (
                  <div className="flex rounded-lg border border-slate-300 overflow-hidden mb-3">
                    <button type="button" onClick={() => { setVerifyMethod('email'); resetVerification(); }}
                      className={\`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition \${verifyMethod === 'email' ? 'bg-primary-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}\`}>
                      <Mail size={15} /> Via Email
                    </button>
                    <button type="button" onClick={() => { setVerifyMethod('sms'); resetVerification(); }}
                      className={\`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition border-l border-slate-300 \${verifyMethod === 'sms' ? 'bg-primary-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}\`}>
                      <Phone size={15} /> Via SMS
                    </button>
                  </div>
                )}
                {verifyMethod === 'email' && (
                  <div>
                    <div className="flex gap-2 mb-2">
                      <input type="email" name="email" className={\`flex-1 border rounded-md p-3 focus:outline-none text-sm \${verifyStep === 'verified' ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300'}\`} value={formData.email} onChange={handleChange} required placeholder={t('auth.register.emailPlaceholder')} disabled={verifyStep === 'otp' || verifyStep === 'verified'} />
                      {verifyStep === 'idle' && (
                        <button type="button" onClick={handleSendOtp} disabled={sendingOtp || !formData.email} className="shrink-0 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-3 py-2 rounded-md transition disabled:opacity-50 flex items-center gap-1">
                          {sendingOtp ? <RefreshCw size={13} className="animate-spin" /> : <Mail size={13} />} {sendingOtp ? 'Sending…' : 'Send Code'}
                        </button>
                      )}
                      {verifyStep === 'verified' && <span className="shrink-0 flex items-center gap-1 text-emerald-600 font-bold text-sm px-2"><ShieldCheck size={18} /> Verified</span>}
                    </div>
                    {/* Ask for phone optionally if email is verified */}
                    <input type="tel" name="phone_number" className="w-full border-slate-300 border rounded-md p-3 focus:outline-none text-sm transition" value={formData.phone_number} onChange={handleChange} placeholder="Phone Number (Optional)" />
                  </div>
                )}
                {verifyMethod === 'sms' && (
                  <div>
                    <div className="flex gap-2 mb-2">
                      <input type="tel" className={\`flex-1 border rounded-md p-3 focus:outline-none text-sm \${verifyStep === 'verified' ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300'}\`} value={smsPhone} onChange={e => { setSmsPhone(e.target.value); if (verifyStep !== 'idle') resetVerification(); }} placeholder="+251911234567" disabled={verifyStep === 'otp' || verifyStep === 'verified'} />
                      {verifyStep === 'idle' && (
                        <button type="button" onClick={handleSendOtp} disabled={sendingOtp || !smsPhone} className="shrink-0 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-3 py-2 rounded-md transition disabled:opacity-50 flex items-center gap-1">
                          {sendingOtp ? <RefreshCw size={13} className="animate-spin" /> : <Phone size={13} />} {sendingOtp ? 'Sending…' : 'Send Code'}
                        </button>
                      )}
                      {verifyStep === 'verified' && <span className="shrink-0 flex items-center gap-1 text-emerald-600 font-bold text-sm px-2"><ShieldCheck size={18} /> Verified</span>}
                    </div>
                    {/* Ask for email mandatorily if SMS is verified */}
                    <input type="email" name="email" className="w-full border-slate-300 border rounded-md p-3 focus:outline-none text-sm transition" value={formData.email} onChange={handleChange} required placeholder="Email Address" />
                  </div>
                )}
                {verifyStep === 'otp' && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex gap-2">
                      <input type="text" inputMode="numeric" maxLength={6} className="flex-1 border border-blue-300 rounded-md p-2.5 text-center text-lg font-bold tracking-widest focus:outline-none" placeholder="000000" value={otpValue} onChange={e => setOtpValue(e.target.value.replace(/\\D/g, '').slice(0, 6))} autoFocus />
                      <button type="button" onClick={handleVerifyOtp} disabled={verifyingOtp || otpValue.length !== 6} className="shrink-0 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold px-4 rounded-md transition disabled:opacity-50">{verifyingOtp ? 'Checking…' : 'Confirm'}</button>
                    </div>
                    {otpError && <p className="text-red-600 text-xs mt-2 font-medium">{otpError}</p>}
                    <button type="button" onClick={resetVerification} className="text-xs text-slate-500 hover:underline mt-2">Change {verifyMethod === 'email' ? 'email' : 'phone'}</button>
                  </div>
                )}
                {otpError && verifyStep === 'idle' && <p className="text-red-600 text-xs mt-1 font-medium">{otpError}</p>}
              </div>

              {formData.role === 'doctor' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Government ID (National ID/Passport)</label>
                    <input type="file" name="id_document" accept=".pdf,.jpg,.jpeg,.png"
                      className="w-full border-slate-300 border text-sm rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white"
                      onChange={handleChange} required />
                      {idDocumentName && <p className="text-xs text-emerald-600 mt-1">✓ {idDocumentName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.liveSelfie')}</label>
                    <div className="border border-slate-300 rounded-md bg-white overflow-hidden">
                      {!isCameraOpen && !photoPreview && (
                        <div className="p-6 flex flex-col items-center justify-center text-center">
                          <div className="bg-slate-100 p-3 rounded-full text-slate-400 mb-3"><Camera size={32} /></div>
                          <button type="button" onClick={() => setIsCameraOpen(true)} className="bg-primary-50 text-primary-600 font-semibold px-4 py-2 rounded border border-primary-200 hover:bg-primary-100 transition flex items-center text-sm"><Camera size={16} className="mr-2" /> {t('auth.register.openCamera')}</button>
                        </div>
                      )}
                      {isCameraOpen && (
                        <div className="relative bg-black flex flex-col">
                          <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ width: 400, height: 300, facingMode: "user" }} className="w-full h-auto" />
                          <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none">
                            <div className="flex justify-end pointer-events-auto">
                              <button type="button" onClick={() => setIsCameraOpen(false)} className="bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70"><X size={20} /></button>
                            </div>
                            <div className="flex justify-center pointer-events-auto pb-2">
                              <button type="button" onClick={capturePhoto} className="bg-white text-slate-900 rounded-full w-14 h-14 border-4 border-slate-300 hover:scale-105 transition"></button>
                            </div>
                          </div>
                        </div>
                      )}
                      {photoPreview && (
                        <div className="relative group bg-slate-100">
                          <img src={photoPreview} alt="Selfie Preview" className="w-full h-auto object-cover max-h-[300px]" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <button type="button" onClick={retakePhoto} className="bg-white/90 text-slate-800 font-bold px-4 py-2 rounded shadow flex items-center hover:bg-white"><Camera size={18} className="mr-2" /> {t('auth.register.retakePhoto')}</button>
                          </div>
                          <div className="absolute top-2 left-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded shadow flex items-center">✓ {t('auth.register.photoCaptured')}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 3: Professional Credentials (Doctors Only) */}
          {currentStep === 3 && formData.role === 'doctor' && (
            <div className="space-y-4 animate-fadeIn bg-slate-50 p-4 rounded-md border border-slate-200">
              <h3 className="font-semibold text-slate-700 text-sm pb-2 border-b border-slate-200">Medical License</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.licenseNumber')}</label>
                  <input type="text" name="license_number" className="w-full border-slate-300 border rounded-md p-2 focus:outline-none transition" value={formData.license_number} onChange={handleChange} required placeholder="MED12345XYZ" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.licenseExpiry')}</label>
                  <input type="date" name="license_expiry_date" className="w-full border-slate-300 border rounded-md p-2 focus:outline-none transition" value={formData.license_expiry_date} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.licenseAuth')}</label>
                <input type="text" name="license_issuing_authority" className="w-full border-slate-300 border rounded-md p-2 focus:outline-none transition" value={formData.license_issuing_authority} onChange={handleChange} required placeholder="e.g. Ministry of Health" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.register.licenseDoc')}</label>
                <input type="file" name="document" accept=".pdf,.jpg,.jpeg,.png" className="w-full border-slate-300 border text-sm rounded-md p-2 focus:outline-none transition bg-white" onChange={handleChange} required />
                {documentName && <p className="text-xs text-emerald-600 mt-1">✓ {documentName}</p>}
              </div>

              <h3 className="font-semibold text-slate-700 text-sm pb-2 pt-2 border-b border-slate-200">Education & Experience</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Degree</label>
                  <input type="text" name="degree" className="w-full border-slate-300 border rounded-md p-2 focus:outline-none transition" value={formData.degree} onChange={handleChange} required placeholder="e.g. MD, MBBS" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Graduation Year</label>
                  <input type="number" name="graduation_year" className="w-full border-slate-300 border rounded-md p-2 focus:outline-none transition" value={formData.graduation_year} onChange={handleChange} required placeholder="YYYY" min="1950" max={new Date().getFullYear()} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">University Name</label>
                <input type="text" name="university_name" className="w-full border-slate-300 border rounded-md p-2 focus:outline-none transition" value={formData.university_name} onChange={handleChange} required placeholder="e.g. Addis Ababa University" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Degree Certificate</label>
                <input type="file" name="degree_document" accept=".pdf,.jpg,.jpeg,.png" className="w-full border-slate-300 border text-sm rounded-md p-2 focus:outline-none transition bg-white" onChange={handleChange} required />
                {degreeDocumentName && <p className="text-xs text-emerald-600 mt-1">✓ {degreeDocumentName}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Workplace</label>
                  <input type="text" name="current_workplace" className="w-full border-slate-300 border rounded-md p-2 focus:outline-none transition" value={formData.current_workplace} onChange={handleChange} placeholder="Hospital/Clinic Name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Experience (Years)</label>
                  <input type="number" name="experience_years" className="w-full border-slate-300 border rounded-md p-2 focus:outline-none transition" value={formData.experience_years} onChange={handleChange} min="0" placeholder="e.g. 5" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Experience Document (Optional)</label>
                <input type="file" name="experience_document" accept=".pdf,.jpg,.jpeg,.png" className="w-full border-slate-300 border text-sm rounded-md p-2 focus:outline-none transition bg-white" onChange={handleChange} />
                {experienceDocumentName && <p className="text-xs text-emerald-600 mt-1">✓ {experienceDocumentName}</p>}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {formData.role === 'doctor' && currentStep > 1 && (
              <button type="button" onClick={prevStep} className="flex-1 bg-slate-200 text-slate-700 font-medium p-3 rounded-md hover:bg-slate-300 transition duration-200">
                Back
              </button>
            )}
            
            {formData.role === 'doctor' && currentStep < 3 ? (
              <button type="button" onClick={nextStep} className="flex-[2] bg-primary-600 text-white font-medium p-3 rounded-md hover:bg-primary-700 transition duration-200 shadow-md">
                Next Step
              </button>
            ) : (
              <button type="submit" disabled={loading || verifyStep !== 'verified'}
                className="flex-[2] bg-primary-600 text-white font-medium p-3 rounded-md hover:bg-primary-700 transition duration-200 shadow-md transform hover:-translate-y-0.5 disabled:bg-primary-400 disabled:cursor-not-allowed">
                {loading ? t('auth.register.submitButtonLoading') : (formData.role === 'doctor' ? 'Submit Application' : t('auth.register.submitButton'))}
              </button>
            )}
          </div>
        </form>`;

const newContent = content.substring(0, formStartIdx) + newForm + content.substring(formEndIdx);
fs.writeFileSync(filepath, newContent, 'utf8');
console.log('Successfully patched Register.jsx');
