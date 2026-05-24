import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Activity, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { loginSchema, formatZodErrors } from '../utils/validationSchemas';

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Clear any existing session to ensure a fresh, secure login process
  useEffect(() => {
    localStorage.removeItem('token');
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setFieldErrors(formatZodErrors(result.error));
      return;
    }

    setLoading(true);
    try {
      const data = await login(email, password);
      const role = data.user.role;
      if (role === 'company_admin') navigate('/admin');
      else if (role === 'doctor') navigate('/doctor');
      else if (role === 'laboratorist') navigate('/laboratorist');
      else if (role === 'radiologist') navigate('/radiologist');
      else navigate('/patient');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-full mt-10">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border-t-4 border-primary-500 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary-50 to-primary-100 -z-0 rounded-t-lg"></div>
        
        <div className="relative z-10 text-center mb-6">
          <div className="bg-primary-500 text-white p-3 rounded-full inline-block mb-3 shadow-md">
            <Activity size={28} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">{t('auth.login.title')}</h2>
          <p className="text-slate-500 text-sm mt-1">{t('auth.login.subtitle')}</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm font-medium border border-red-200">{error}</div>}
        
        <form onSubmit={handleSubmit} autoComplete="off" className="relative z-10 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.login.emailLabel')}</label>
            <input 
              type="email" 
              name="email"
              autoComplete="off"
              className={`w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition ${fieldErrors.email ? 'border-red-500' : 'border-slate-300'}`} 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder={t('auth.login.emailPlaceholder')}
            />
            {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.login.passwordLabel')}</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                autoComplete="new-password"
                className={`w-full border rounded-md p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition ${fieldErrors.password ? 'border-red-500' : 'border-slate-300'}`} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder={t('auth.login.passwordPlaceholder')}
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
            {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
            <div className="text-right mt-1">
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-800 transition">{t('auth.login.forgotPassword')}</Link>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary-600 text-white font-medium p-3 rounded-md hover:bg-primary-700 transition duration-200 shadow-md transform hover:-translate-y-0.5 mt-2 disabled:bg-primary-400 disabled:transform-none"
          >
            {loading ? t('auth.login.submitButtonLoading') : t('auth.login.submitButton')}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-slate-600 relative z-10">
          {t('auth.login.noAccount')} <Link to="/register" className="text-primary-600 font-semibold hover:underline">{t('auth.login.registerLink')}</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
