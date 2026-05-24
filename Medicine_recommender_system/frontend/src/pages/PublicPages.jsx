import React, { useContext } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Activity, LayoutDashboard } from 'lucide-react';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
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
    <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2 text-primary-600">
          <Activity size={24} strokeWidth={2.5} />
          <span className="font-bold text-xl tracking-tight text-slate-800">HealthConnect</span>
        </Link>
        <nav className="hidden md:flex space-x-8">
          <Link to="/" className="text-slate-600 hover:text-primary-600 font-medium transition">{t('publicLayout.home')}</Link>
          <Link to="/features" className="text-slate-600 hover:text-primary-600 font-medium transition">{t('publicLayout.features')}</Link>
          <Link to="/about" className="text-slate-600 hover:text-primary-600 font-medium transition">{t('publicLayout.about')}</Link>
          <Link to="/contact" className="text-slate-600 hover:text-primary-600 font-medium transition">{t('publicLayout.contact')}</Link>
        </nav>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          {user ? (
            <Link
              to={dashboardPath}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 text-sm font-medium rounded-md hover:bg-primary-700 shadow-sm transition"
            >
              <LayoutDashboard size={16} />
              Back to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-slate-600 hover:text-primary-600 font-medium transition">{t('publicLayout.login')}</Link>
              <Link to="/register" className="bg-primary-600 text-white px-4 py-2 text-sm font-medium rounded-md hover:bg-primary-700 shadow-sm transition">{t('publicLayout.register')}</Link>
            </>
          )}
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
  <section className="py-24 bg-white flex-1 flex flex-col justify-center">
    <div className="container mx-auto px-4 max-w-5xl">
      <h2 className="text-4xl font-bold text-center text-slate-800 mb-12">{t('publicPages.features.title')}</h2>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="p-8 bg-slate-50 rounded-2xl text-center shadow-sm border border-slate-100 hover:shadow-md transition">
          <div className="w-16 h-16 bg-primary-100 text-primary-600 flex items-center justify-center rounded-full mx-auto mb-6 text-2xl font-bold">1</div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">{t('publicPages.features.findDoctors')}</h3>
          <p className="text-slate-600">{t('publicPages.features.findDoctorsDesc')}</p>
        </div>
        <div className="p-8 bg-slate-50 rounded-2xl text-center shadow-sm border border-slate-100 hover:shadow-md transition">
          <div className="w-16 h-16 bg-primary-100 text-primary-600 flex items-center justify-center rounded-full mx-auto mb-6 text-2xl font-bold">2</div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">{t('publicPages.features.liveConsultations')}</h3>
          <p className="text-slate-600">{t('publicPages.features.liveConsultationsDesc')}</p>
        </div>
        <div className="p-8 bg-slate-50 rounded-2xl text-center shadow-sm border border-slate-100 hover:shadow-md transition">
          <div className="w-16 h-16 bg-primary-100 text-primary-600 flex items-center justify-center rounded-full mx-auto mb-6 text-2xl font-bold">3</div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">{t('publicPages.features.smartReminders')}</h3>
          <p className="text-slate-600">{t('publicPages.features.smartRemindersDesc')}</p>
        </div>
      </div>
    </div>
  </section>
)};

export const About = () => {
  const { t } = useTranslation();
  return (
  <section className="py-24 bg-slate-50 flex-1 flex flex-col justify-center">
    <div className="container mx-auto px-4 max-w-3xl text-center">
      <h2 className="text-4xl font-bold text-slate-800 mb-6">{t('publicPages.about.title')}</h2>
      <p className="text-lg text-slate-600 leading-relaxed mb-6">
        {t('publicPages.about.p1')}
      </p>
      <p className="text-lg text-slate-600 leading-relaxed">
        {t('publicPages.about.p2')}
      </p>
    </div>
  </section>
)};

export const Contact = () => {
  const { t } = useTranslation();
  return (
  <section className="py-24 bg-white flex-1 flex flex-col justify-center">
    <div className="container mx-auto px-4 max-w-3xl text-center">
      <h2 className="text-4xl font-bold text-slate-800 mb-6">{t('publicPages.contact.title')}</h2>
      <p className="text-lg text-slate-600 mb-8">{t('publicPages.contact.desc')}</p>
      <a href="mailto:support@healthconnect.com" className="inline-block bg-primary-600 text-white px-8 py-3 rounded-md shadow-md hover:bg-primary-700 transition font-medium text-lg">
        {t('publicPages.contact.emailButton')}
      </a>
    </div>
  </section>
)};
