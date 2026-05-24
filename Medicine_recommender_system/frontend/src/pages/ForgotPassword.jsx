import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { KeyRound, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { forgotPasswordSchema, formatZodErrors } from '../utils/validationSchemas';

const ForgotPassword = () => {
  const [method, setMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setDevResetUrl('');
    setFieldErrors({});
    
    let identifier = '';

    if (method === 'email') {
      const result = forgotPasswordSchema.safeParse({ email });
      if (!result.success) {
        setFieldErrors(formatZodErrors(result.error));
        return;
      }
      identifier = email;
    } else {
      if (!phoneNumber || phoneNumber.length < 7) {
        setFieldErrors({ phoneNumber: 'Please enter a valid phone number' });
        return;
      }
      identifier = phoneNumber;
    }

    setLoading(true);
    try {
      const data = await forgotPassword(method, identifier);
      if (data.requireOtp) {
        // We'll redirect to a new verification page with the phone number
        window.location.href = `/verify-otp?method=sms&identifier=${encodeURIComponent(identifier)}`;
      } else {
        setMessage(data.message || 'Password reset email sent. Please check your inbox.');
        if (data.devResetUrl) {
          setDevResetUrl(data.devResetUrl);
        }
      }
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
          <h2 className="text-3xl font-bold text-slate-800">Forgot Password</h2>
          <p className="text-slate-500 text-sm mt-1">Enter your email to receive a reset link</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm font-medium border border-red-200">{error}</div>}
        {message && !devResetUrl && <div className="bg-green-50 text-green-600 p-3 rounded mb-4 text-sm font-medium border border-green-200">{message}</div>}
        {devResetUrl && (
          <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-4 text-sm text-amber-800">
            <p className="font-bold mb-2">Dev Mode Fallback: Use this link to reset your password:</p>
            <div className="flex items-center bg-white border border-amber-300 rounded p-2">
              <input type="text" readOnly value={devResetUrl} className="flex-1 bg-transparent outline-none text-slate-600 font-mono text-xs truncate" />
              <button 
                type="button" 
                onClick={() => {
                  navigator.clipboard.writeText(devResetUrl);
                  toast.success('Link copied to clipboard!');
                }}
                className="ml-2 p-1 text-amber-600 hover:bg-amber-100 rounded transition"
                title="Copy link"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
          <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${method === 'email' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setMethod('email')}
            >
              Email Reset
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${method === 'sms' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setMethod('sms')}
            >
              SMS Recovery
            </button>
          </div>

          {method === 'email' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input 
                type="email" 
                className={`w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition ${fieldErrors.email ? 'border-red-500' : 'border-slate-300'}`} 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Enter your email"
              />
              {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input 
                type="tel" 
                className={`w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition ${fieldErrors.phoneNumber ? 'border-red-500' : 'border-slate-300'}`} 
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(e.target.value)} 
                placeholder="+1234567890"
              />
              {fieldErrors.phoneNumber && <p className="text-red-500 text-xs mt-1">{fieldErrors.phoneNumber}</p>}
            </div>
          )}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary-600 text-white font-medium p-3 rounded-md hover:bg-primary-700 transition duration-200 shadow-md transform hover:-translate-y-0.5 mt-2 disabled:bg-primary-400 disabled:transform-none"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-slate-600 relative z-10">
          Remember your password? <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
