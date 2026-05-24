import React, { useState, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { KeyRound } from 'lucide-react';
import { resetPasswordSchema, formatZodErrors } from '../utils/validationSchemas';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useContext(AuthContext);
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setFieldErrors({});

    const result = resetPasswordSchema.safeParse({ newPassword: password, confirmPassword });
    if (!result.success) {
      setFieldErrors(formatZodErrors(result.error));
      return;
    }

    setLoading(true);
    try {
      const data = await resetPassword(token, password);
      setMessage(data.message || 'Password reset successful!');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-full mt-10">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border-t-4 border-primary-500 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary-50 to-primary-100 -z-0 rounded-t-lg"></div>
        
        <div className="relative z-10 text-center mb-6">
          <div className="bg-primary-500 text-white p-3 rounded-full inline-block mb-3 shadow-md">
            <KeyRound size={28} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">Reset Password</h2>
          <p className="text-slate-500 text-sm mt-1">Enter your new password below</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm font-medium border border-red-200">{error}</div>}
        {message && <div className="bg-green-50 text-green-600 p-3 rounded mb-4 text-sm font-medium border border-green-200">{message}</div>}
        
        <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <input 
              type="password" 
              className={`w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition ${fieldErrors.newPassword ? 'border-red-500' : 'border-slate-300'}`} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
            />
            {fieldErrors.newPassword && <p className="text-red-500 text-xs mt-1">{fieldErrors.newPassword}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
            <input 
              type="password" 
              className={`w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-slate-300'}`} 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder="••••••••"
            />
            {fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
          </div>
          <button 
            type="submit" 
            disabled={loading || !!message}
            className="w-full bg-primary-600 text-white font-medium p-3 rounded-md hover:bg-primary-700 transition duration-200 shadow-md transform hover:-translate-y-0.5 mt-2 disabled:bg-primary-400 disabled:transform-none"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-slate-600 relative z-10">
          <Link to="/login" className="text-primary-600 font-semibold hover:underline">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
