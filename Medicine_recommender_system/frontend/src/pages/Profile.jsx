import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { User, Mail, Lock, Shield, Calendar, Edit3, Save, X, Eye, EyeOff, UploadCloud, Loader2 } from 'lucide-react';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '', // Placeholder for future expansion
    address: '' // Placeholder for future expansion
  });

  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    // Reset form if canceling
    if (isEditing) {
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        address: ''
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/users/profile', { 
        name: formData.name, 
        email: formData.email, 
        phone: formData.phone 
      });
      alert(res.data.message || 'Profile updated successfully.');
      setIsEditing(false);
      // Optional: Update user in AuthContext if needed
    } catch (err) {
       alert(err.response?.data?.message || 'Failed to update profile');
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
      alert(err.response?.data?.message || 'Failed to update profile picture');
      setProfileLoading(false);
    }
  };

  const handleRemoveProfilePic = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;
    try {
      setProfileLoading(true);
      await api.put('/users/profile', { remove_picture: true });
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove profile picture');
      setProfileLoading(false);
    }
  };


  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return alert('Passwords do not match');
    }
    if (passwordData.newPassword.length < 8) {
      return alert('Password must be at least 8 characters long');
    }
    if (!passwordData.currentPassword) {
      return alert('Please enter your current password');
    }
    try {
      const res = await api.put('/users/profile', { 
        currentPassword: passwordData.currentPassword, 
        newPassword: passwordData.newPassword 
      });
      alert(res.data.message || 'Password updated successfully.');
      setIsEditingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
       alert(err.response?.data?.message || err.message || 'Failed to update password');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">My Profile</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">Manage your personal information and account settings.</p>
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
                <button onClick={handleRemoveProfilePic} className="text-xs font-semibold text-rose-500 hover:text-rose-700 mt-3 hover:underline">Remove Picture</button>
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
                    <span className="text-sm font-medium">Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
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
                Personal Information
              </h3>
              {!isEditing ? (
                <button 
                  onClick={handleEditToggle}
                  className="text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-lg transition font-medium text-sm flex items-center border border-primary-200"
                >
                  <Edit3 size={16} className="mr-2" /> Edit Profile
                </button>
              ) : (
                <button 
                  onClick={handleEditToggle}
                  className="text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-lg transition font-medium text-sm flex items-center border border-slate-200"
                >
                  <X size={16} className="mr-2" /> Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                  <input 
                    type="text" required disabled={!isEditing}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-500 transition-colors"
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                  <input 
                    type="email" required disabled={!isEditing}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-500 transition-colors"
                    value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                  <input 
                    type="tel" disabled={!isEditing} placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-500 transition-colors"
                    value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Timezone</label>
                  <select disabled={!isEditing} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-500 transition-colors appearance-none">
                     <option>UTC (GMT+0)</option>
                     <option>EST (GMT-5)</option>
                     <option>PST (GMT-8)</option>
                     <option>IST (GMT+5:30)</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                {isEditing && (
                  <button 
                    type="submit" 
                    className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition font-medium shadow-sm flex items-center"
                  >
                    <Save size={18} className="mr-2" /> Save Changes
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
                Security
              </h3>
            </div>
            <div className="flex flex-col gap-4 mt-4">
              {!isEditingPassword ? (
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <h4 className="font-medium text-slate-800 mb-1">Password</h4>
                      <p className="text-sm text-slate-500">Keep your account secure by using a strong password</p>
                    </div>
                    <button 
                      onClick={() => setIsEditingPassword(true)}
                      className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 transition font-medium text-sm"
                    >
                      Update Password
                    </button>
                 </div>
              ) : (
                 <form onSubmit={handlePasswordSave} className="p-5 bg-slate-50 rounded-lg border border-slate-200">
                   <div className="space-y-4">
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                       <div className="relative">
                         <input 
                            type={showPassword ? "text" : "password"} required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                            value={passwordData.currentPassword} onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                         />
                         <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                           {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                         </button>
                       </div>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                       <div className="relative">
                         <input 
                            type={showPassword ? "text" : "password"} required minLength={8}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                            value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                         />
                         <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                           {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                         </button>
                       </div>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                       <div className="relative">
                         <input 
                            type={showPassword ? "text" : "password"} required minLength={8}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                            value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                         />
                         <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                           {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                         </button>
                       </div>
                     </div>
                   </div>
                   <div className="mt-4 flex justify-end space-x-2">
                     <button type="button" onClick={() => { setIsEditingPassword(false); setPasswordData({currentPassword:'', newPassword:'', confirmPassword:''}); setShowPassword(false); }} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 text-sm font-medium">Cancel</button>
                     <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium shadow-sm flex items-center">
                        <Save size={16} className="mr-2" /> Save Password
                     </button>
                   </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
