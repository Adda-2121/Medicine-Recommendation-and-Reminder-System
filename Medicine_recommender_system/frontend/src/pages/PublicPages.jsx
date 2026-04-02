import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Activity } from 'lucide-react';

export const PublicLayout = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden">
    <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2 text-primary-600">
          <Activity size={24} strokeWidth={2.5} />
          <span className="font-bold text-xl tracking-tight text-slate-800">HealthConnect</span>
        </Link>
        <nav className="hidden md:flex space-x-8">
          <Link to="/" className="text-slate-600 hover:text-primary-600 font-medium transition">Home</Link>
          <Link to="/features" className="text-slate-600 hover:text-primary-600 font-medium transition">Features</Link>
          <Link to="/about" className="text-slate-600 hover:text-primary-600 font-medium transition">About Us</Link>
          <Link to="/contact" className="text-slate-600 hover:text-primary-600 font-medium transition">Contact</Link>
        </nav>
        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-slate-600 hover:text-primary-600 font-medium transition">Login</Link>
          <Link to="/register" className="bg-primary-600 text-white px-4 py-2 text-sm font-medium rounded-md hover:bg-primary-700 shadow-sm transition">Register</Link>
        </div>
      </div>
    </header>
    <main className="flex-1 flex flex-col">
      <Outlet />
    </main>
    <footer className="bg-slate-900 text-slate-400 py-8 text-center mt-auto">
      <p>&copy; {new Date().getFullYear()} HealthConnect. All rights reserved.</p>
    </footer>
  </div>
);

export const Landing = () => (
  <section className="min-h-[85vh] bg-slate-50 flex items-center justify-center py-20 overflow-hidden">
    <div className="container mx-auto px-4 max-w-7xl">
      <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
        {/* Left Content */}
        <div className="flex-1 text-center lg:text-left max-w-2xl lg:max-w-none mx-auto z-10">
          <div className="inline-flex items-center space-x-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full mb-8 border border-primary-100 shadow-sm">
            <Activity size={20} className="text-primary-600" />
            <span className="font-semibold text-sm">Your Trusted Healthcare Partner</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-800 mb-6 tracking-tight leading-[1.15]">
            Modern Healthcare, <br className="hidden lg:block" />
            <span className="text-primary-600 relative">
              Simplified.
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="transparent" />
              </svg>
            </span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
            Connect with top doctors instantly, manage your medical history, and never miss a dose with our intelligent recommendation platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link to="/register" className="w-full sm:w-auto bg-primary-600 text-white px-8 py-4 rounded-xl shadow-lg shadow-primary-500/30 hover:bg-primary-700 hover:shadow-primary-500/40 transition-all font-medium text-lg flex items-center justify-center group">
              Get Started Free
              <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
            <Link to="/login" className="w-full sm:w-auto bg-white text-slate-700 px-8 py-4 rounded-xl shadow-md border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all font-medium text-lg text-center">
              Sign In
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center lg:justify-start gap-6 text-slate-500">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-50 bg-slate-200 flex items-center justify-center overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-slate-50 bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold font-mono">
                +1k
              </div>
            </div>
            <div className="text-sm font-medium">
              <span className="text-slate-800 font-bold block sm:inline">1000+</span> Happy Patients
            </div>
          </div>
        </div>

        {/* Right Content - Hero Image */}
        <div className="flex-1 relative w-full max-w-lg lg:max-w-none mx-auto">
          {/* Decorative background blob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary-200/40 via-blue-200/40 to-teal-100/40 rounded-full blur-3xl -z-10"></div>

          <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-primary-900/10 border-4 border-white bg-slate-100 transform transition-transform hover:scale-[1.01] duration-500">
            {/* Using standard img for faster loading, fallback grey bg */}
            <img
              src="/hero-doctor.png"
              alt="Medical Professional"
              className="w-full object-cover lg:h-[500px] md:h-[400px] h-[4100px] object-top"
            />

            {/* Floating Card 1 */}
            <div className="absolute top-10 -left-4 lg:-left-8 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl flex items-center gap-4 border border-slate-100">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <div className="pr-2">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Verified</p>
                <p className="text-slate-800 font-bold">Top Specialists</p>
              </div>
            </div>

            {/* Floating Card 2 */}
            <div className="absolute bottom-10 -right-4 lg:-right-8 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl flex gap-4 border border-slate-100">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center shadow-inner">
                <Activity size={24} strokeWidth={2.5} />
              </div>
              <div className="pr-4">
                <p className="text-slate-800 font-extrabold text-lg">24/7</p>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Online Care</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </section>
);

export const Features = () => (
  <section className="py-24 bg-white flex-1 flex flex-col justify-center">
    <div className="container mx-auto px-4 max-w-5xl">
      <h2 className="text-4xl font-bold text-center text-slate-800 mb-12">Core Features</h2>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="p-8 bg-slate-50 rounded-2xl text-center shadow-sm border border-slate-100 hover:shadow-md transition">
          <div className="w-16 h-16 bg-primary-100 text-primary-600 flex items-center justify-center rounded-full mx-auto mb-6 text-2xl font-bold">1</div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">Find Doctors</h3>
          <p className="text-slate-600">Easily search and connect with qualified specialists near you.</p>
        </div>
        <div className="p-8 bg-slate-50 rounded-2xl text-center shadow-sm border border-slate-100 hover:shadow-md transition">
          <div className="w-16 h-16 bg-primary-100 text-primary-600 flex items-center justify-center rounded-full mx-auto mb-6 text-2xl font-bold">2</div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">Live Consultations</h3>
          <p className="text-slate-600">Chat and consult with your doctors safely and securely.</p>
        </div>
        <div className="p-8 bg-slate-50 rounded-2xl text-center shadow-sm border border-slate-100 hover:shadow-md transition">
          <div className="w-16 h-16 bg-primary-100 text-primary-600 flex items-center justify-center rounded-full mx-auto mb-6 text-2xl font-bold">3</div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">Smart Reminders</h3>
          <p className="text-slate-600">Never miss a dose with our intelligent medication tracking.</p>
        </div>
      </div>
    </div>
  </section>
);

export const About = () => (
  <section className="py-24 bg-slate-50 flex-1 flex flex-col justify-center">
    <div className="container mx-auto px-4 max-w-3xl text-center">
      <h2 className="text-4xl font-bold text-slate-800 mb-6">About Us</h2>
      <p className="text-lg text-slate-600 leading-relaxed mb-6">
        HealthConnect was founded with a simple mission: to make healthcare accessible, modern, and patient-centric. We bridge the gap between patients and healthcare providers by combining world-class technology with compassionate care.
      </p>
      <p className="text-lg text-slate-600 leading-relaxed">
        Our platform empowers you to take control of your medical history, seamlessly schedule consultations, and simplify your medication management.
      </p>
    </div>
  </section>
);

export const Contact = () => (
  <section className="py-24 bg-white flex-1 flex flex-col justify-center">
    <div className="container mx-auto px-4 max-w-3xl text-center">
      <h2 className="text-4xl font-bold text-slate-800 mb-6">Contact Support</h2>
      <p className="text-lg text-slate-600 mb-8">Have questions or need assistance with your account? We're here to help.</p>
      <a href="mailto:support@healthconnect.com" className="inline-block bg-primary-600 text-white px-8 py-3 rounded-md shadow-md hover:bg-primary-700 transition font-medium text-lg">
        Email Support
      </a>
    </div>
  </section>
);
