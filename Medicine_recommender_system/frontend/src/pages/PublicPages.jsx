import React, { useContext } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Activity, LayoutDashboard, Linkedin, Send, Mail, Github } from 'lucide-react';
import ProfessionalLanguageSwitcher from '../components/common/ProfessionalLanguageSwitcher';
import ContactForm from '../components/common/ContactForm';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../contexts/AuthContext';

export const PublicLayout = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);

  const dashboardPath = user
    ? user.role === 'company_admin' ? '/admin'
    : user.role === 'doctor' ? '/doctor'
    : user.role === 'laboratorist' ? '/laboratorist'
    : user.role === 'radiologist' ? '/radiologist'
    : '/patient'
    : null;

  return (
  <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden">
    <header className="bg-white/98 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-3 text-primary-600 group">
          <div className="bg-primary-600 p-2 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
            <Activity size={24} strokeWidth={2.5} className="text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-800 group-hover:text-primary-600 transition-colors">HealthConnect</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-1 bg-slate-50/80 rounded-full px-2 py-1.5 border border-slate-200/60">
          <Link to="/" className="px-5 py-2 text-slate-700 hover:text-primary-600 hover:bg-white font-semibold transition-all rounded-full text-sm">{t('publicLayout.home')}</Link>
          <Link to="/features" className="px-5 py-2 text-slate-700 hover:text-primary-600 hover:bg-white font-semibold transition-all rounded-full text-sm">{t('publicLayout.features')}</Link>
          <Link to="/about" className="px-5 py-2 text-slate-700 hover:text-primary-600 hover:bg-white font-semibold transition-all rounded-full text-sm">{t('publicLayout.about')}</Link>
          <Link to="/contact" className="px-5 py-2 text-slate-700 hover:text-primary-600 hover:bg-white font-semibold transition-all rounded-full text-sm">{t('publicLayout.contact')}</Link>
        </nav>
        <div className="flex items-center space-x-3">
          <ProfessionalLanguageSwitcher />
          {user ? (
            <Link
              to={dashboardPath}
              className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-5 py-2.5 text-sm font-bold rounded-full hover:from-primary-700 hover:to-primary-800 shadow-md hover:shadow-lg transition-all"
            >
              <LayoutDashboard size={18} />
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-slate-700 hover:text-primary-600 font-semibold transition-colors px-4 py-2 text-sm">{t('publicLayout.login')}</Link>
              <Link to="/register" className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-2.5 text-sm font-bold rounded-full hover:from-primary-700 hover:to-primary-800 shadow-md hover:shadow-lg transition-all">{t('publicLayout.register')}</Link>
            </>
          )}
        </div>
      </div>
    </header>
    <main className="flex-1 flex flex-col">
      <Outlet />
    </main>
    <footer className="bg-slate-900 text-slate-400 py-10 mt-auto">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center gap-4">
          <p className="text-slate-400 uppercase tracking-[0.35em] text-xs">Contact</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="mailto:addisugebeyehu519@gmail.com" className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-slate-200 transition hover:bg-slate-700 hover:text-white">
              <Mail size={16} />
              Email
            </a>
            <a href="https://www.linkedin.com/in/addisu-gebeyehu-603656346" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-slate-200 transition hover:bg-slate-700 hover:text-white">
              <Linkedin size={16} />
              LinkedIn
            </a>
            <a href="https://t.me/Dadgeb" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-slate-200 transition hover:bg-slate-700 hover:text-white">
              <Send size={16} />
              Telegram
            </a>
            <a href="https://github.com/Adda-2121" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-slate-200 transition hover:bg-slate-700 hover:text-white">
              <Github size={16} />
              GitHub
            </a>
          </div>
          <p className="text-slate-500 text-sm">&copy; {new Date().getFullYear()} HealthConnect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
)};

export const Landing = () => {
  const { t } = useTranslation();
  return (
  <>
  <section className="min-h-[85vh] bg-slate-50 flex items-center justify-center py-20 overflow-hidden">
    <div className="container mx-auto px-4 max-w-7xl">
      <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
        {/* Left Content */}
        <div className="flex-1 text-center lg:text-left max-w-2xl lg:max-w-none mx-auto z-10">
          <div className="inline-flex items-center space-x-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full mb-8 border border-primary-100 shadow-sm">
            <Activity size={20} className="text-primary-600" />
            <span className="font-semibold text-sm">{t('publicPages.landing.trustedPartner')}</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-800 mb-6 tracking-tight leading-[1.15]">
            {t('publicPages.landing.heroTitle1')} <br className="hidden lg:block" />
            <span className="text-primary-600 relative">
              {t('publicPages.landing.heroTitle2')}
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="transparent" />
              </svg>
            </span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
            {t('publicPages.landing.heroDesc')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link to="/register" className="w-full sm:w-auto bg-primary-600 text-white px-8 py-4 rounded-xl shadow-lg shadow-primary-500/30 hover:bg-primary-700 hover:shadow-primary-500/40 transition-all font-medium text-lg flex items-center justify-center group">
              {t('publicPages.landing.getStarted')}
              <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
            <Link to="/login" className="w-full sm:w-auto bg-white text-slate-700 px-8 py-4 rounded-xl shadow-md border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all font-medium text-lg text-center">
              {t('publicPages.landing.signIn')}
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center lg:justify-start gap-6 text-slate-500">
            <div className="flex -space-x-3">
              {[
                { url: "https://images.unsplash.com/photo-1531123414708-f1f3e792e8a1?q=80&w=80&h=80&auto=format&fit=crop&crop=face", initial: "A" },
                { url: "https://images.unsplash.com/photo-1506869502758-1c46955a1334?q=80&w=80&h=80&auto=format&fit=crop&crop=face", initial: "B" },
                { url: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?q=80&w=80&h=80&auto=format&fit=crop&crop=face", initial: "C" },
                { url: "https://images.unsplash.com/photo-1544716270-3694f4797be9?q=80&w=80&h=80&auto=format&fit=crop&crop=face", initial: "D" },
              ].map((avatar, i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-50 bg-primary-100 text-primary-700 flex items-center justify-center overflow-hidden font-bold text-sm">
                  <img
                    src={avatar.url}
                    alt="Happy patient"
                    className="w-full h-full object-cover"
                    onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.textContent = avatar.initial; }}
                  />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-slate-50 bg-primary-600 text-white flex items-center justify-center text-xs font-bold">
                +1k
              </div>
            </div>
            <div className="text-sm font-medium">
              <span className="text-slate-800 font-bold block sm:inline">1000+</span> {t('publicPages.landing.happyPatients')}
            </div>
          </div>
        </div>

        {/* Right Content - Hero Image */}
        <div className="flex-1 relative w-full max-w-lg lg:max-w-none mx-auto">
          {/* Decorative background blob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary-200/40 via-blue-200/40 to-teal-100/40 rounded-full blur-3xl -z-10"></div>

          <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-primary-900/10 border-4 border-white bg-slate-100 transform transition-transform hover:scale-[1.01] duration-500">
            <img
              src="/hero-doctor-ethiopian.png"
              alt="Clinical Professional"
              className="w-full object-cover lg:h-[500px] md:h-[400px] h-[400px] object-top"
            />

            {/* Floating Card 1 */}
            <div className="absolute top-10 -left-4 lg:-left-8 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl flex items-center gap-4 border border-slate-100">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <div className="pr-2">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{t('publicPages.landing.verified')}</p>
                <p className="text-slate-800 font-bold">{t('publicPages.landing.topSpecialists')}</p>
              </div>
            </div>

            {/* Floating Card 2 */}
            <div className="absolute bottom-10 -right-4 lg:-right-8 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl flex gap-4 border border-slate-100">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center shadow-inner">
                <Activity size={24} strokeWidth={2.5} />
              </div>
              <div className="pr-4">
                <p className="text-slate-800 font-extrabold text-lg">24/7</p>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{t('publicPages.landing.onlineCare')}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </section>
  <HealthInformation />
  </>
)};

export const HealthInformation = () => {
  const { t } = useTranslation();
  const [activeArticle, setActiveArticle] = React.useState(null);
  const [showAll, setShowAll] = React.useState(false);

  const articleImages = {
    1: "https://images.unsplash.com/photo-1581056771107-24ca5f033842?q=80&w=600&auto=format&fit=crop",
    2: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?q=80&w=600&auto=format&fit=crop",
    3: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=600&auto=format&fit=crop",
    4: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=600&auto=format&fit=crop",
    5: "https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=600&auto=format&fit=crop",
    6: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600&auto=format&fit=crop",
    7: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=600&auto=format&fit=crop",
    8: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?q=80&w=600&auto=format&fit=crop",
    9: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&auto=format&fit=crop",
  };

  const allPosts = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((id) => ({
    id,
    image: articleImages[id],
    category: t(`healthInfo.articles.${id}.category`),
    title: t(`healthInfo.articles.${id}.title`),
    excerpt: t(`healthInfo.articles.${id}.excerpt`),
    content: t(`healthInfo.articles.${id}.content`),
  }));

  const visiblePosts = showAll ? allPosts : allPosts.slice(0, 6);

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">{t('healthInfo.sectionTitle')}</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">{t('healthInfo.sectionSubtitle')}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visiblePosts.map(post => (
            <div key={post.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
              <div className="relative overflow-hidden h-56">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary-700 shadow-sm uppercase tracking-wider">
                  {post.category}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-slate-800 mb-3 leading-snug group-hover:text-primary-600 transition-colors">
                  {post.title}
                </h3>
                <p className="text-slate-600 mb-6 flex-1 line-clamp-3">
                  {post.excerpt}
                </p>
                <button
                  onClick={() => setActiveArticle(post)}
                  className="text-primary-600 font-semibold flex items-center hover:text-primary-700 transition group/btn mt-auto self-start"
                >
                  {t('healthInfo.readArticle')}
                  <svg className="ml-2 w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <button
            onClick={() => setShowAll(prev => !prev)}
            className="bg-slate-50 text-slate-700 px-8 py-3 rounded-full font-bold border border-slate-200 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition shadow-sm"
          >
            {showAll ? t('healthInfo.showLess') : t('healthInfo.viewAllPosts', { count: allPosts.length })}
          </button>
        </div>
      </div>

      {/* Article Reader Modal */}
      {activeArticle && (
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setActiveArticle(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal image header */}
            <div className="relative h-52 shrink-0">
              <img src={activeArticle.image} alt={activeArticle.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
              <div className="absolute bottom-4 left-6 right-12">
                <span className="text-xs font-bold uppercase tracking-wider text-white/80 bg-primary-600/80 px-2 py-0.5 rounded-full">
                  {activeArticle.category}
                </span>
                <h2 className="text-xl font-extrabold text-white mt-2 leading-snug">{activeArticle.title}</h2>
              </div>
              <button
                onClick={() => setActiveArticle(null)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg transition backdrop-blur-sm"
              >
                ×
              </button>
            </div>

            {/* Article body */}
            <div className="overflow-y-auto p-6 flex-1">
              <p className="text-slate-500 text-sm italic mb-5 border-l-4 border-primary-200 pl-4">{activeArticle.excerpt}</p>
              <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed space-y-4">
                {activeArticle.content.split('\n\n').map((para, i) => {
                  if (para.startsWith('**') && para.endsWith('**')) {
                    return <h4 key={i} className="font-bold text-slate-800 text-base mt-4">{para.replace(/\*\*/g, '')}</h4>;
                  }
                  // Render bold inline text
                  const parts = para.split(/(\*\*[^*]+\*\*)/g);
                  return (
                    <p key={i}>
                      {parts.map((part, j) =>
                        part.startsWith('**') && part.endsWith('**')
                          ? <strong key={j}>{part.replace(/\*\*/g, '')}</strong>
                          : part
                      )}
                    </p>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 shrink-0 flex justify-end">
              <button
                onClick={() => setActiveArticle(null)}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition text-sm"
              >
                {t('healthInfo.closeBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export const Features = () => {
  const { t } = useTranslation();
  return (
  <section className="py-24 bg-gradient-to-b from-slate-50 to-white flex-1 flex flex-col justify-center">
    <div className="container mx-auto px-4 max-w-6xl">
      <div className="text-center mb-16">
        <div className="inline-flex items-center space-x-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full mb-6 border border-primary-100 shadow-sm">
          <Activity size={18} className="text-primary-600" />
          <span className="font-bold text-sm uppercase tracking-wider">{t('publicPages.features.sectionLabel')}</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-4 tracking-tight">{t('publicPages.features.title')}</h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">{t('publicPages.features.description')}</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="group p-8 bg-white rounded-3xl text-center shadow-md border border-slate-100 hover:shadow-2xl hover:border-primary-200 transition-all duration-300 transform hover:-translate-y-2">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center rounded-2xl mx-auto mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-4 group-hover:text-primary-600 transition-colors">{t('publicPages.features.findDoctors')}</h3>
          <p className="text-slate-600 leading-relaxed">{t('publicPages.features.findDoctorsDesc')}</p>
        </div>
        
        <div className="group p-8 bg-white rounded-3xl text-center shadow-md border border-slate-100 hover:shadow-2xl hover:border-primary-200 transition-all duration-300 transform hover:-translate-y-2">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center rounded-2xl mx-auto mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-4 group-hover:text-primary-600 transition-colors">{t('publicPages.features.liveConsultations')}</h3>
          <p className="text-slate-600 leading-relaxed">{t('publicPages.features.liveConsultationsDesc')}</p>
        </div>
        
        <div className="group p-8 bg-white rounded-3xl text-center shadow-md border border-slate-100 hover:shadow-2xl hover:border-primary-200 transition-all duration-300 transform hover:-translate-y-2">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center rounded-2xl mx-auto mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-4 group-hover:text-primary-600 transition-colors">{t('publicPages.features.smartReminders')}</h3>
          <p className="text-slate-600 leading-relaxed">{t('publicPages.features.smartRemindersDesc')}</p>
        </div>
      </div>
      
      <div className="mt-16 text-center">
        <Link to="/register" className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:from-primary-700 hover:to-primary-800 transition-all font-bold text-lg group">
          Get Started Today
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </div>
  </section>
)};

export const Contact = () => {
  const { t } = useTranslation();

  return (
    <section className="py-24 bg-slate-50 min-h-[calc(100vh-5rem)]">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <span className="inline-flex items-center justify-center rounded-full bg-primary-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary-700 mb-4">
            {t('publicPages.contact.title')}
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-4 tracking-tight">{t('publicPages.contact.subtitle')}</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 leading-relaxed">
            {t('publicPages.contact.desc')}
          </p>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl md:p-10">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary-700 mb-3">{t('publicPages.contact.sectionLabel')}</p>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">{t('publicPages.contact.sectionTitle')}</h2>
            <p className="text-slate-600">{t('publicPages.contact.sectionDescription')}</p>
          </div>
          <ContactForm recipientEmail="addisugebeyehu519@gmail.com" />
        </div>

        <div className="mt-8 text-center text-slate-600">
          <p className="text-sm">{t('publicPages.contact.footerNote')}</p>
        </div>
      </div>
    </section>
  );
};

export const About = () => {
  const { t } = useTranslation();
  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 via-white to-slate-50 flex-1">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center space-x-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full mb-6 border border-primary-100 shadow-sm">
            <Activity size={18} className="text-primary-600" />
            <span className="font-bold text-sm uppercase tracking-wider">{t('publicPages.about.headerLabel')}</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-800 mb-6 tracking-tight">
            {t('publicPages.about.title')}
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            {t('publicPages.about.heroDesc')}
          </p>
        </div>

        {/* Main Content with Image */}
        <div className="flex flex-col lg:flex-row items-center gap-16 mb-24">
          <div className="flex-1 lg:order-2">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-white transform hover:scale-[1.02] transition-transform duration-500">
              <img
                src="/hero-doctor-ethiopian.png"
                alt="Professional healthcare team"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent"></div>
              
              {/* Floating Stats */}
              <div className="absolute bottom-6 left-6 right-6 flex gap-4">
                <div className="flex-1 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
                  <p className="text-3xl font-extrabold text-primary-600">1000+</p>
                  <p className="text-xs text-slate-600 font-semibold">{t('publicPages.about.cardHappyPatients')}</p>
                </div>
                <div className="flex-1 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
                  <p className="text-3xl font-extrabold text-emerald-600">50+</p>
                  <p className="text-xs text-slate-600 font-semibold">{t('publicPages.about.cardExpertDoctors')}</p>
                </div>
                <div className="flex-1 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
                  <p className="text-3xl font-extrabold text-amber-600">24/7</p>
                  <p className="text-xs text-slate-600 font-semibold">{t('publicPages.about.cardSupport')}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 lg:order-1">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              {t('publicPages.about.storyLabel')}
            </h2>
            <div className="space-y-5 text-slate-600 leading-relaxed">
              <p className="text-lg font-medium text-slate-700">
                {t('publicPages.about.welcome')}
              </p>
              <p className="text-base">
                {t('publicPages.about.connection')}
              </p>
              <p className="text-base">
                {t('publicPages.about.commitment')}
              </p>
            </div>
            
            <div className="mt-8 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-200">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold text-sm">{t('publicPages.about.badgeVerified')}</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-200">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold text-sm">{t('publicPages.about.badgeSecure')}</span>
              </div>
              <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full border border-amber-200">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold text-sm">{t('publicPages.about.badgeAlwaysAvailable')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mission & Values Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-24">
          {/* Mission Card */}
          <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 hover:shadow-2xl transition-shadow duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-slate-800 mb-4">{t('publicPages.about.missionHeading')}</h3>
              <p className="text-slate-600 leading-relaxed text-lg">
                {t('publicPages.about.mission')}
              </p>
            </div>
          </div>

          {/* Values Card */}
          <div className="bg-gradient-to-br from-cyan-100 via-cyan-200 to-teal-100 p-10 rounded-3xl shadow-xl text-slate-900 relative overflow-hidden group">
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/40 rounded-full translate-y-1/2 -translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/70 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8 text-cyan-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold mb-6 flex items-center gap-3 text-slate-900">
                {t('publicPages.about.prioritize.title')}
              </h3>
              <ul className="space-y-4">
                {(t('publicPages.about.prioritize.items', { returnObjects: true }) || []).map((item, index) => (
                  <li key={index} className="flex items-start gap-3 group/item">
                    <div className="mt-1 w-6 h-6 rounded-lg bg-white/70 backdrop-blur-sm flex items-center justify-center shrink-0 group-hover/item:bg-white transition-colors">
                      <svg className="w-4 h-4 text-cyan-700" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-slate-900 font-medium text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Vision Statement */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-100 via-blue-50 to-primary-100 rounded-[3rem] transform -rotate-1"></div>
          <div className="relative bg-white p-12 md:p-16 rounded-[3rem] shadow-2xl border border-slate-100">
            <div className="text-center max-w-4xl mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-4xl font-extrabold text-slate-800 mb-6">{t('publicPages.about.visionHeading')}</h3>
              <div className="relative">
                <svg className="absolute -left-4 -top-4 w-12 h-12 text-primary-200 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-2xl text-slate-700 leading-relaxed mb-8 italic font-medium relative z-10">
                  {t('publicPages.about.vision')}
                </p>
              </div>
              <div className="h-1 w-32 bg-gradient-to-r from-transparent via-primary-400 to-transparent mx-auto mb-8"></div>
              <p className="text-3xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                {t('publicPages.about.closing')}
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center">
          <Link to="/register" className="inline-flex items-center gap-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-10 py-5 rounded-full shadow-xl hover:shadow-2xl hover:from-primary-700 hover:to-primary-800 transition-all font-bold text-lg group">
            {t('publicPages.about.ctaButton')}
            <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};
  