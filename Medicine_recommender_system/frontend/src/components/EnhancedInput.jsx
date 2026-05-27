import React, { useState, useEffect } from 'react';
import { Check, X, Loader2, Eye, EyeOff } from 'lucide-react';

/**
 * Enhanced Input Component with Real-Time Validation
 * Provides instant feedback, loading states, and visual indicators
 */

const EnhancedInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  error,
  realTimeError,
  isValidating = false,
  isValid = false,
  disabled = false,
  maxLength,
  autoComplete,
  helperText,
  showPasswordToggle = false,
  className = ''
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const hasError = error || realTimeError;
  const inputType = showPasswordToggle && showPassword ? 'text' : type;

  // Determine border color based on state
  const getBorderColor = () => {
    if (hasError) return 'border-red-500 bg-red-50';
    if (isValid && value && !isValidating) return 'border-green-500 bg-green-50';
    if (isFocused) return 'border-primary-500 ring-2 ring-primary-200';
    return 'border-slate-300';
  };

  // Determine icon to show
  const getStatusIcon = () => {
    if (isValidating) {
      return <Loader2 size={18} className="text-slate-400 animate-spin" />;
    }
    if (hasError) {
      return <X size={18} className="text-red-500" />;
    }
    if (isValid && value && !isValidating) {
      return <Check size={18} className="text-green-500" />;
    }
    return null;
  };

  return (
    <div className={`mb-4 ${className}`}>
      {/* Label */}
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input Container */}
      <div className="relative">
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur && onBlur(e);
          }}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          autoComplete={autoComplete}
          className={`
            w-full px-3 py-2 pr-10 rounded-lg transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-primary-200
            disabled:bg-slate-100 disabled:cursor-not-allowed
            ${getBorderColor()}
          `}
        />

        {/* Status Icon or Password Toggle */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-400 hover:text-slate-600 transition"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
          {!showPasswordToggle && getStatusIcon()}
        </div>
      </div>

      {/* Helper Text */}
      {helperText && !hasError && (
        <p className="text-xs text-slate-500 mt-1">{helperText}</p>
      )}

      {/* Error Message */}
      {hasError && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <X size={12} />
          {error || realTimeError}
        </p>
      )}

      {/* Validation Status Text */}
      {isValidating && (
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
          <Loader2 size={12} className="animate-spin" />
          Checking availability...
        </p>
      )}

      {/* Character Count */}
      {maxLength && value && (
        <p className={`text-xs mt-1 text-right ${
          value.length > maxLength * 0.9 ? 'text-amber-600' : 'text-slate-400'
        }`}>
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
};

export default EnhancedInput;
