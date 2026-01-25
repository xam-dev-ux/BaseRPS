import { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { ConnectButton } from './components/wallet/ConnectButton';
import { SoundToggle } from './components/common/SoundToggle';
import { NotificationToggle } from './components/common/NotificationToggle';
import { PushNotificationToggle } from './components/common/PushNotificationToggle';
import { Landing } from './pages/Landing';
import { Play } from './pages/Play';
import { Match } from './pages/Match';
import { Stats } from './pages/Stats';
import { MyBattles } from './pages/MyBattles';
import { Leaderboard } from './pages/Leaderboard';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';

function Navigation() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/play', label: 'Play' },
    { path: '/my-battles', label: 'My Battles' },
    { path: '/stats', label: 'Stats' },
    { path: '/leaderboard', label: 'Leaderboard' },
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🎮</span>
            <span className="text-xl font-bold gradient-text">BaseRPS</span>
          </Link>

          {/* Nav Links - Desktop */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Sound/Notification Toggle & Connect Button */}
          <div className="flex items-center gap-1 md:gap-2">
            <PushNotificationToggle />
            <NotificationToggle />
            <SoundToggle />
            <ConnectButton />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/play" element={<Play />} />
          <Route path="/match/:matchId" element={<Match />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/my-battles" element={<MyBattles />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
