import React, { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { User, Mail, Lock, Shield, Calendar, Edit3, Save, X, Eye, EyeOff, UploadCloud, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { profileUpdateSchema, passwordUpdateSchema, formatZodErrors } from '../utils/validationSchemas';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [profileLoading, setProfileLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone_number || '',
    address: ''
  });

  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileFieldErrors, setProfileFieldErrors] = useState({});
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [modalConfig, setModalConfig] = useState({ isOpen: false });

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    // Reset form if canceling
    if (isEditing) {
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone_number || '',
        address: ''
      });
      setProfileFieldErrors({});
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setProfileFieldErrors({});

    // Validate name
    if (!formData.name || formData.name.trim().length < 2) {
      setProfileFieldErrors({ name: 'please wright your full name' });
      return;
    }
    
    // Validate email format
    if (!formData.email || !formData.email.includes('@')) {
      setProfileFieldErrors({ email: 'Please enter a valid email address' });
      return;
    }
    
    // Validate phone if provided
    if (formData.phone && formData.phone.length > 0) {
      const phoneRegex = /^\+251[79]\d{8}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        setProfileFieldErrors({ phone_number: 'Please enter a valid Ethiopian phone number (e.g., +251911234567)' });
        return;
      }
    }

    try {
      const res = await api.put('/users/profile', { 
        name: formData.name, 
        email: formData.email, 
        phone: formData.phone 
      });
      toast.success(res.data.message || 'Profile updated successfully.');
      setIsEditing(false);
      // Reload to update user context
      window.location.reload();
    } catch (err) {
       toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append('profile_picture', file);

    try {
      setProfileLoading(true);
      await api.put('/users/profile', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile picture');
      setProfileLoading(false);
    }
  };

  const confirmRemoveProfilePic = () => {
    setModalConfig({ isOpen: true });
  };

  const executeRemoveProfilePic = async () => {
    try {
      setProfileLoading(true);
      await api.put('/users/profile', { remove_picture: true });
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove profile picture');
      setProfileLoading(false);
    }
    setModalConfig({ isOpen: false });
  };


  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPasswordFieldErrors({});

    // Validate current password
    if (!passwordData.currentPassword || passwordData.currentPassword.length === 0) {
      setPasswordFieldErrors({ currentPassword: 'Current password is required' });
      return;
    }

    // Validate new password
    if (!passwordData.newPassword || passwordData.newPassword.length < 8) {
      setPasswordFieldErrors({ newPassword: 'New password must be at least 8 characters long' });
      return;
    }
    
    // Check password strength
    if (!/[a-z]/.test(passwordData.newPassword)) {
      setPasswordFieldErrors({ newPassword: 'Password must contain at least one lowercase letter' });
      return;
    }
    if (!/[A-Z]/.test(passwordData.newPassword)) {
      setPasswordFieldErrors({ newPassword: 'Password must contain at least one uppercase letter' });
      return;
    }
    if (!/\d/.test(passwordData.newPassword)) {
      setPasswordFieldErrors({ newPassword: 'Password must contain at least one number' });
      return;
    }

    // Validate password confirmation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordFieldErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    try {
      const res = await api.put('/users/profile', { 
        currentPassword: passwordData.currentPassword, 
        newPassword: passwordData.newPassword 
      });
      toast.success(res.data.message || 'Password updated successfully.');
      setIsEditingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordFieldErrors({});
    } catch (err) {
       toast.error(err.response?.data?.message || err.message || 'Failed to update password');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{t('profile.title')}</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">{t('profile.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-800"></div>
            <div className="relative px-6 pb-6 pt-0 text-center">
              <div className="w-24 h-24 bg-white border-4 border-white rounded-full mx-auto -mt-12 flex items-center justify-center text-4xl font-bold text-primary-600 shadow-md relative group overflow-hidden bg-slate-100">
                {profileLoading ? (
                  <Loader2 className="animate-spin text-primary-500" size={32} />
                ) : user?.profile_picture ? (
                  <img src={`${api.defaults.baseURL?.replace(/\/api$/, '') || 'http://localhost:5000'}${user.profile_picture}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0) || 'U'
                )}
                {!profileLoading && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer" onClick={() => document.getElementById('profile-upload').click()}>
                    <UploadCloud size={24} className="text-white drop-shadow-md" />
                  </div>
                )}
                <input id="profile-upload" type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleProfilePicChange} />
              </div>
              {user?.profile_picture && !profileLoading && (
                <button onClick={confirmRemoveProfilePic} className="text-xs font-semibold text-rose-500 hover:text-rose-700 mt-3 hover:underline">{t('profile.removePicture')}</button>
              )}
              <h2 className={`text-2xl font-bold text-slate-800 ${!user?.profile_picture ? 'mt-4' : 'mt-2'}`}>{user?.name}</h2>
              <div className="flex items-center justify-center mt-2 group">
                 <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full uppercase
                   ${user?.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                     user?.role === 'doctor' ? 'bg-emerald-100 text-emerald-800' : 
                     'bg-blue-100 text-blue-800'}`}
                 >
                   <Shield size={14} className="mr-1.5" />
                   {user?.role}
                 </span>
              </div>
              
              <div className="mt-8 border-t border-slate-100 pt-6 space-y-4 text-left">
                 <div className="flex items-center text-slate-600">
                    <Mail size={18} className="text-slate-400 mr-3" />
                    <span className="text-sm font-medium">{user?.email}</span>
                 </div>
                 <div className="flex items-center text-slate-600">
                    <Calendar size={18} className="text-slate-400 mr-3" />
                    <span className="text-sm font-medium">{t('profile.joined', { date: new Date(user?.createdAt || Date.now()).toLocaleDateString() })}</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Details Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 flex items-center">
                <User size={20} className="mr-2 text-primary-500" />
                {t('profile.personalInfo')}
              </h3>
              {!isEditing ? (
                <button 
                  onClick={handleEditToggle}
                  className="text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-lg transition font-medium text-sm flex items-center border border-primary-200"
                >
                  <Edit3 size={16} className="mr-2" /> {t('profile.editProfile')}
                </button>
              ) : (
                <button 
                  onClick={handleEditToggle}
                  className="text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-lg transition font-medium text-sm flex items-center border border-slate-200"
                >
                  <X size={16} className="mr-2" /> {t('common.cancel')}
                </button>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.fullName')}</label>
                  <input 
                    type="text" disabled={!isEditing}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-500 transition-colors ${profileFieldErrors.name ? 'border-red-500' : 'border-slate-300'}`}
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                  {profileFieldErrors.name && <p className="text-red-500 text-xs mt-1">{profileFieldErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.emailAddress')}</label>
                  <input 
                    type="email" disabled={!isEditing}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-500 transition-colors ${profileFieldErrors.email ? 'border-red-500' : 'border-slate-300'}`}
                    value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                  {profileFieldErrors.email && <p className="text-red-500 text-xs mt-1">{profileFieldErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.phoneNumber')}</label>
                  <input 
                    type="tel" disabled={!isEditing} placeholder={t('profile.phonePlaceholder')}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-500 transition-colors ${profileFieldErrors.phone_number ? 'border-red-500' : 'border-slate-300'}`}
                    value={formData.phone} 
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^\d+]/g, '');
                      if (value && !value.startsWith('+')) {
                        value = '+251' + value;
                      }
                      setFormData({...formData, phone: value});
                    }}
                  />
                  {profileFieldErrors.phone_number && <p className="text-red-500 text-xs mt-1">{profileFieldErrors.phone_number}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.timezone')}</label>
                  <select disabled={!isEditing} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-500 transition-colors appearance-none">
                     <option>UTC (GMT+0)</option>
                     <option>EST (GMT-5)</option>
                     <option>PST (GMT-8)</option>
                     <option>IST (GMT+5:30)</option>
                  </select>
                </div>
                
                {user?.role === 'doctor' && user?.specialty && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.specialty')}</label>
                    <input 
                      type="text" disabled={true}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                      value={user?.specialty || t('profile.noneAssigned')}
                    />
                    <p className="text-xs text-slate-400 mt-1">{t('profile.contactAdmin')}</p>
                  </div>
                )}
                
                {(user?.role === 'laboratorist' || user?.role === 'radiologist') && (
                  <>
                    {user?.specialty && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.specialty')}</label>
                        <input 
                          type="text" disabled={true}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                          value={user?.specialty || t('profile.noneAssigned')}
                        />
                        <p className="text-xs text-slate-400 mt-1">{t('profile.contactAdmin')}</p>
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.capabilities')}</label>
                      <input 
                        type="text" disabled={true}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                        value={user?.specializations?.join(', ') || t('profile.noneAssigned')}
                      />
                      <p className="text-xs text-slate-400 mt-1">{t('profile.contactAdmin')}</p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                {isEditing && (
                  <button 
                    type="submit" 
                    className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition font-medium shadow-sm flex items-center"
                  >
                    <Save size={18} className="mr-2" /> {t('common.saveChanges')}
                  </button>
                )}
              </div>
            </form>
          </div>
          
          {/* Security Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mt-8">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 flex items-center">
                <Lock size={20} className="mr-2 text-red-500" />
                {t('profile.security')}
              </h3>
            </div>
            <div className="flex flex-col gap-4 mt-4">
              {!isEditingPassword ? (
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <h4 className="font-medium text-slate-800 mb-1">{t('profile.password')}</h4>
                      <p className="text-sm text-slate-500">{t('profile.passwordDesc')}</p>
                    </div>
                    <button 
                      onClick={() => setIsEditingPassword(true)}
                      className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 transition font-medium text-sm"
                    >
                      {t('profile.updatePassword')}
                    </button>
                 </div>
              ) : (
                 <form onSubmit={handlePasswordSave} className="p-5 bg-slate-50 rounded-lg border border-slate-200">
                   <div className="space-y-4">
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.currentPassword')}</label>
                       <div className="relative">
                         <input 
                            type={showPassword ? "text" : "password"} 
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10 ${passwordFieldErrors.currentPassword ? 'border-red-500' : 'border-slate-300'}`}
                            value={passwordData.currentPassword} onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                         />
                         <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                           {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                         </button>
                       </div>
                       {passwordFieldErrors.currentPassword && <p className="text-red-500 text-xs mt-1">{passwordFieldErrors.currentPassword}</p>}
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.newPassword')}</label>
                       <div className="relative">
                         <input 
                            type={showPassword ? "text" : "password"} 
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10 ${passwordFieldErrors.newPassword ? 'border-red-500' : 'border-slate-300'}`}
                            value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                         />
                         <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                           {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                         </button>
                       </div>
                       {passwordFieldErrors.newPassword && <p className="text-red-500 text-xs mt-1">{passwordFieldErrors.newPassword}</p>}
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.confirmNewPassword')}</label>
                       <div className="relative">
                         <input 
                            type={showPassword ? "text" : "password"} 
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10 ${passwordFieldErrors.confirmPassword ? 'border-red-500' : 'border-slate-300'}`}
                            value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                         />
                         <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                           {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                         </button>
                       </div>
                       {passwordFieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{passwordFieldErrors.confirmPassword}</p>}
                     </div>
                   </div>
                   <div className="mt-4 flex justify-end space-x-2">
                     <button type="button" onClick={() => { setIsEditingPassword(false); setPasswordData({currentPassword:'', newPassword:'', confirmPassword:''}); setShowPassword(false); setPasswordFieldErrors({}); }} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 text-sm font-medium">{t('common.cancel')}</button>
                     <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium shadow-sm flex items-center">
                        <Save size={16} className="mr-2" /> {t('profile.savePassword')}
                     </button>
                   </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ isOpen: false })}
        onConfirm={executeRemoveProfilePic}
        title={t('profile.removePictureTitle', 'Remove Profile Picture')}
        message={t('profile.removePictureMsg', 'Are you sure you want to remove your profile picture?')}
        confirmText={t('profile.removePicture')}
        isDanger={true}
      />
    </div>
  );
};

export default Profile;
