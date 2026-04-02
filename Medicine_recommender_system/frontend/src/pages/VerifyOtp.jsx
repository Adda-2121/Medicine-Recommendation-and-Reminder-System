import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { KeyRound, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const VerifyOtp = () => {
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const identifier = queryParams.get('identifier');

  useEffect(() => {
    if (!identifier) {
      navigate('/forgot-password');
    }
  }, [identifier, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      // We pass the OTP as the resetToken to the backend endpoint
      const data = await resetPassword(otp, password);
      setMessage(data.message || 'Password reset successfully');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
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
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">Verify OTP</h2>
          <p className="text-slate-500 text-sm mt-1">Enter the 6-digit code sent to <br/><strong className="text-slate-700">{identifier}</strong></p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm font-medium border border-red-200">{error}</div>}
        {message && <div className="bg-green-50 text-green-600 p-3 rounded mb-4 text-sm font-medium border border-green-200">{message}</div>}
        
        <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
              <span>6-Digit Code</span>
            </label>
            <input 
              type="text" 
              className="w-full border-slate-300 border rounded-md p-3 text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
              placeholder="123456"
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                className="w-full border-slate-300 border rounded-md p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                required 
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading || otp.length < 6 || password.length < 8}
            className="w-full bg-primary-600 text-white font-medium p-3 rounded-md hover:bg-primary-700 transition duration-200 shadow-md transform hover:-translate-y-0.5 mt-2 disabled:bg-primary-400 disabled:transform-none"
          >
            {loading ? 'Verifying...' : 'Reset Password'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-slate-600 relative z-10">
          Didn't receive code? <Link to="/forgot-password" className="text-primary-600 font-semibold hover:underline">Try again</Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
