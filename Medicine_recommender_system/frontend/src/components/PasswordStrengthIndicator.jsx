import React from 'react';
import { Check, X } from 'lucide-react';
import { calculatePasswordStrength } from '../utils/realTimeValidation';

/**
 * Password Strength Indicator Component
 * Shows visual strength meter and requirement checklist
 */

const PasswordStrengthIndicator = ({ password, showRequirements = true }) => {
  const { strength, label, color, checks } = calculatePasswordStrength(password);

  // Color mapping
  const colorClasses = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500'
  };

  const textColorClasses = {
    red: 'text-red-600',
    orange: 'text-orange-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600'
  };

  if (!password || password.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Strength Meter */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-slate-600">Password Strength:</span>
          <span className={`text-xs font-bold ${textColorClasses[color]}`}>
            {label} ({strength}%)
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${colorClasses[color]}`}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
          <p className="text-xs font-semibold text-slate-700 mb-2">Requirements:</p>
          
          <RequirementItem
            met={checks.length}
            text="At least 8 characters"
          />
          
          <RequirementItem
            met={checks.lowercase}
            text="One lowercase letter (a-z)"
          />
          
          <RequirementItem
            met={checks.uppercase}
            text="One uppercase letter (A-Z)"
          />
          
          <RequirementItem
            met={checks.number}
            text="One number (0-9)"
          />
          
          <RequirementItem
            met={checks.special}
            text="One special character (optional)"
            optional
          />
        </div>
      )}
    </div>
  );
};

const RequirementItem = ({ met, text, optional = false }) => {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <Check size={14} className="text-green-500 shrink-0" />
      ) : (
        <X size={14} className="text-slate-300 shrink-0" />
      )}
      <span className={`text-xs ${met ? 'text-green-700 font-medium' : 'text-slate-500'}`}>
        {text}
        {optional && <span className="text-slate-400 ml-1">(optional)</span>}
      </span>
    </div>
  );
};

export default PasswordStrengthIndicator;
