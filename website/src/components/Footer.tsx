import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Github } from 'lucide-react';

const baseUrl = import.meta.env.BASE_URL;

export default function Footer() {
  const { t } = useTranslation();

  return (
    <>
      {/* Gradient Transition */}
      <div className="relative h-32 mt-16">
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 via-transparent to-transparent" />
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src={`${baseUrl}assets/icons/logo.svg`}
                alt="Personal News"
                className="w-8 h-8"
              />
              <span className="font-medium">Personal News</span>
            </div>

            {/* Links */}
            <div className="flex gap-6 text-sm text-text-secondary flex-wrap justify-center">
              <Link to="/layouts" className="hover:text-white transition-colors">
                {t('nav.layouts')}
              </Link>
              <Link to="/tech" className="hover:text-white transition-colors">
                {t('nav.tech')}
              </Link>
              <Link to="/changes" className="hover:text-white transition-colors">
                {t('nav.changes')}
              </Link>
              <a
                href="https://github.com/mafhper/personalnews"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <Github size={14} />
                GitHub
              </a>
            </div>

            {/* Copyright */}
            <p className="text-text-secondary text-sm">
              {t('footer_made_by')}{' '}
              <a
                href="https://github.com/mafhper"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                @mafhper
              </a>
            </p>
          </div>

          <p className="text-center text-text-secondary text-sm mt-8">
            {t('footer')}
          </p>
        </div>
      </footer>
    </>
  );
}
