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

function Navigation() {
  const location = useLocation();

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
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🎮</span>
            <span className="text-xl font-bold gradient-text">BaseRPS</span>
          </Link>

          {/* Nav Links */}
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
          <div className="flex items-center gap-2">
            <PushNotificationToggle />
            <NotificationToggle />
            <SoundToggle />
            <ConnectButton />
          </div>
        </div>
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
        </Routes>
      </main>
    </div>
  );
}

export default App;
