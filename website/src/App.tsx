import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { LoadingSpinner } from './components/LoadingSpinner';

// Lazy Pages
const Home = lazy(() => import('./pages/Home'));
const Layouts = lazy(() => import('./pages/Layouts'));
const Customization = lazy(() => import('./pages/Customization'));
const Categories = lazy(() => import('./pages/Categories'));
const Tech = lazy(() => import('./pages/Tech'));
const Changes = lazy(() => import('./pages/Changes'));
const Contribute = lazy(() => import('./pages/Contribute'));
const About = lazy(() => import('./pages/About'));

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Basename vem do Vite (/ em dev, /personalnews/ em prod)
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

export default function App() {
  return (
    <Router basename={basename}>
      <div className="min-h-screen bg-black text-white">
        <Header />
        <ScrollToTop />
        
        <main>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/layouts" element={<Layouts />} />
              <Route path="/customization" element={<Customization />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/tech" element={<Tech />} />
              <Route path="/changes" element={<Changes />} />
              <Route path="/contribute" element={<Contribute />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>
    </Router>
  );
}
