import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, Mail, FileText, ShieldCheck } from 'lucide-react';

const PendingVerification = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 text-center border border-slate-100">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="bg-amber-100 p-5 rounded-full">
              <Clock size={40} className="text-amber-600" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-primary-600 rounded-full p-1">
              <ShieldCheck size={16} className="text-white" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Application Submitted!</h1>
        <p className="text-slate-500 text-sm mb-6">
          Your doctor registration is under review. Our admin team will verify your credentials and documents.
        </p>

        {/* Steps */}
        <div className="bg-slate-50 rounded-xl p-5 mb-6 text-left space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-emerald-100 p-1.5 rounded-full mt-0.5 shrink-0">
              <CheckCircle size={14} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Email Verified</p>
              <p className="text-xs text-slate-500">Your email address has been confirmed.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-emerald-100 p-1.5 rounded-full mt-0.5 shrink-0">
              <CheckCircle size={14} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Documents Uploaded</p>
              <p className="text-xs text-slate-500">Your credentials and documents have been received.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-amber-100 p-1.5 rounded-full mt-0.5 shrink-0">
              <Clock size={14} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Admin Review — Pending</p>
              <p className="text-xs text-slate-500">An administrator will review your application. This typically takes 1–2 business days.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-slate-200 p-1.5 rounded-full mt-0.5 shrink-0">
              <Mail size={14} className="text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">Email Notification</p>
              <p className="text-xs text-slate-400">You'll receive an email once your account is approved or if further action is needed.</p>
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <div className="flex items-start gap-2">
            <FileText size={16} className="text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              <strong>What happens next?</strong> Once approved, you'll be able to log in and start accepting patient consultations. If your application is rejected, you'll receive an email with the reason and instructions to reapply.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            to="/login"
            className="w-full bg-primary-600 text-white font-semibold py-3 rounded-lg hover:bg-primary-700 transition text-sm"
          >
            Go to Login
          </Link>
          <Link
            to="/"
            className="w-full border border-slate-200 text-slate-600 font-medium py-3 rounded-lg hover:bg-slate-50 transition text-sm"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PendingVerification;
