import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  // Usando nav-link class do styles.css + active state
  return (
    <Link
      to={to}
      className={`nav-link ${isActive ? 'active' : ''}`}
    >
      {children}
    </Link>
  );
};

// Base paths dinâmicos
const baseUrl = import.meta.env.BASE_URL;
const appUrl = import.meta.env.MODE === 'production' ? `${baseUrl}app/` : 'http://localhost:5173/';

export default function Header() {
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 nav-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={`${baseUrl}favicon.svg`}
              alt="Personal News Logo"
              className="w-10 h-10 group-hover:scale-110 transition-transform"
            />
            <span className="text-lg font-bold tracking-tight hidden sm:block">
              Personal News
            </span>
          </Link>

          {/* Desktop Navigation */}
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/layouts">{t('nav.layouts')}</NavLink>
            <NavLink to="/customization">{t('nav.customization')}</NavLink>
            <NavLink to="/categories">{t('nav.categories')}</NavLink>
            <NavLink to="/tech">{t('nav.tech')}</NavLink>
            <NavLink to="/changes">{t('nav.changes')}</NavLink>
            <NavLink to="/contribute">{t('nav.contribute')}</NavLink>
            <NavLink to="/about">{t('nav.about')}</NavLink>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <select
              onChange={(e) => changeLanguage(e.target.value)}
              value={i18n.language}
              className="bg-transparent text-xs text-zinc-400 font-medium focus:outline-none cursor-pointer hover:text-white uppercase"
            >
              <option value="pt-BR" className="bg-zinc-900">PT</option>
              <option value="en" className="bg-zinc-900">EN</option>
            </select>

            {/* Launch Button */}
            <a
              href={appUrl}
              className="bg-white text-black hover:bg-zinc-200 font-bold py-2 px-6 rounded-full text-sm transition-all hidden sm:flex items-center gap-2"
            >
              {t('nav.launch')}
            </a>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-lg pt-20 md:hidden">
          <nav className="flex flex-col items-center gap-4 p-6">
            <Link to="/layouts" className="text-lg font-medium text-zinc-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>{t('nav.layouts')}</Link>
            <Link to="/customization" className="text-lg font-medium text-zinc-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>{t('nav.customization')}</Link>
            <Link to="/categories" className="text-lg font-medium text-zinc-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>{t('nav.categories')}</Link>
            <Link to="/tech" className="nav-link-mobile" onClick={() => setMobileMenuOpen(false)}>{t('nav.tech')}</Link>
            <Link to="/changes" className="nav-link-mobile" onClick={() => setMobileMenuOpen(false)}>{t('nav.changes')}</Link>
            <Link to="/contribute" className="nav-link-mobile" onClick={() => setMobileMenuOpen(false)}>{t('nav.contribute')}</Link>
            <Link to="/about" className="nav-link-mobile" onClick={() => setMobileMenuOpen(false)}>{t('nav.about')}</Link>
            <a
              href={appUrl}
              className="mt-4 bg-white text-black font-bold py-3 px-8 rounded-full"
            >
              {t('nav.launch')}
            </a>
          </nav>
        </div>
      )}
    </>
  );
}
