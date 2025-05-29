import React, { useState, useEffect } from 'react';
import queryString from 'query-string';
import './styles/style.css';
import ItemList from './ItemList';
import ItemAdd from './ItemAdd';
import Home from './Home';
import Notifications from './Notifications';
import Settings from './Settings';
import Support from './Support';

const SkinRadarApp = () => {
  const [steamId, setSteamId] = useState<string | null>(() => {
    return sessionStorage.getItem('steamId');
  });
  const [username, setUsername] = useState<string | null>(() => {
    return sessionStorage.getItem('username');
  });
  const [avatar, setAvatar] = useState<string | null>(() => {
    return sessionStorage.getItem('avatar');
  });
  const [firstLogin, setFirstLogin] = useState<string | null>(() => {
    return sessionStorage.getItem('firstLogin');
  });
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return sessionStorage.getItem('isPremium') === 'true';
  });
  const [currentPage, setCurrentPage] = useState<string>('home');

  // Stan dla ItemAdd - przechowywany globalnie
  const [itemAddState, setItemAddState] = useState(() => {
    const saved = sessionStorage.getItem('itemAdd_global_state');
    return saved ? JSON.parse(saved) : {
      suggestions: [],
      showSuggestions: false,
      sortBy: 'default',
      itemName: '',
      selectedType: '',
      condition: '',
      priceFrom: '',
      priceTo: '',
      isFilterVisible: false,
      noMatchesError: ''
    };
  });

  // Zapisuj stan ItemAdd do sessionStorage przy każdej zmianie
  useEffect(() => {
    sessionStorage.setItem('itemAdd_global_state', JSON.stringify(itemAddState));
  }, [itemAddState]);

  const handleSteamLogin = async () => {
    try {
      window.location.href = `https://skinradar-d0a6bmd2a3c6dbde.northeurope-01.azurewebsites.net/auth/steam`;
    } catch (error) {
      alert('Error: An error occurred during Steam login');
    }
  };

  const handleDeepLink = (url: string) => {
    const params = queryString.parse(url.split('?')[1]);
    const steamId = params.steamid as string;
    const username = params.username as string;
    const avatar = params.avatar as string;
    const firstLogin = params.first_login as string;
    const premium = params.premium === 'true' || params.premium === 'True';
    
    if (steamId && username && avatar && firstLogin) { 
      setSteamId(steamId);
      setUsername(username);
      setAvatar(avatar);
      setFirstLogin(firstLogin);
      setIsPremium(premium);
      
      // Zapisz do sessionStorage
      sessionStorage.setItem('steamId', steamId);
      sessionStorage.setItem('username', username);
      sessionStorage.setItem('avatar', avatar);
      sessionStorage.setItem('firstLogin', firstLogin);
      sessionStorage.setItem('isPremium', premium.toString());
      
      // Wyczyść URL po zalogowaniu
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  useEffect(() => {
    const url = window.location.href;
    // Sprawdź czy w URL są parametry logowania
    if (url.includes('?') && url.includes('steamid')) {
      handleDeepLink(url);
    }
  }, []);

  const handleLogout = () => {
    // Wyczyść wszystkie dane użytkownika z sessionStorage
    sessionStorage.removeItem('steamId');
    sessionStorage.removeItem('username'); 
    sessionStorage.removeItem('avatar');
    sessionStorage.removeItem('firstLogin');
    sessionStorage.removeItem('isPremium');
    sessionStorage.removeItem('itemAdd_global_state');
    
    // Wyczyść również stan ItemAdd dla tego użytkownika jeśli istnieje
    if (username) {
      sessionStorage.removeItem(`itemadd_state_${username}`);
    }
    
    // Resetuj lokalne stany
    setSteamId(null);
    setUsername(null);
    setAvatar(null);
    setFirstLogin(null);
    setIsPremium(false);
    setCurrentPage('home');
    
    // Resetuj stan ItemAdd
    setItemAddState({
      suggestions: [],
      showSuggestions: false,
      sortBy: 'default',
      itemName: '',
      selectedType: '',
      condition: '',
      priceFrom: '',
      priceTo: '',
      isFilterVisible: false,
      noMatchesError: ''
    });
    
    // Wyczyść URL jeśli zawiera parametry logowania
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  // Funkcje nawigacji
  const navigateToHome = () => setCurrentPage('home');
  const navigateToSearch = () => setCurrentPage('search');
  const navigateToFavorites = () => setCurrentPage('favorites');
  const navigateToNotifications = () => setCurrentPage('notifications');
  const navigateToSettings = () => setCurrentPage('settings');
  const navigateToSupport = () => setCurrentPage('support');

  const renderCurrentPage = () => {
    if (!steamId || !username || !avatar || !firstLogin) return null;

    const commonProps = {
      username,
      avatar,
      onLogout: handleLogout,
      firstLogin,
      onNavigateToHome: navigateToHome,
      onNavigateToSearch: navigateToSearch,
      onNavigateToFavorites: navigateToFavorites,
      onNavigateToNotifications: navigateToNotifications,
      onNavigateToSettings: navigateToSettings,
      onNavigateToSupport: navigateToSupport,
      isPremium
    };

    switch (currentPage) {
      case 'home':
        return <Home {...commonProps} />;
      case 'search':
        return (
          <ItemAdd 
            {...commonProps} 
            onNavigateToList={navigateToFavorites}
            itemAddState={itemAddState}
            setItemAddState={setItemAddState}
          />
        );
      case 'favorites':
        return <ItemList {...commonProps} />;
      case 'notifications':
        return <Notifications {...commonProps} />;
      case 'settings':
        return <Settings {...commonProps} />;
      case 'support':
        return <Support {...commonProps} />;
      default:
        return <Home {...commonProps} />;
    }
  };

  if (steamId && username && avatar && firstLogin) {
    return renderCurrentPage();
  }

  return (
    <div className="start-container">
      <div className="login-content">
        <div className="login-header">
          <div className="welcome-section">
            <h1 className="welcome-title">Welcome to SkinRadar</h1>
            <p className="app-description">
              Never miss a deal. Your radar for CS2 skins prices in real time.
            </p>
          </div>
        </div>

        <div className="login-section">
          <div className="login-card">
            <div className="login-card-header">
              <h2 className="login-title">Get Started</h2>
              <p className="login-subtitle">Sign in with your Steam account to continue</p>
            </div>
            <button onClick={handleSteamLogin} className="login-button">
              <img src="/assets/steam.png" className="steam-logo" alt="Steam" />
              <span className="login-text">Sign in with Steam</span>
            </button>
            <div className="login-features">
              <div className="feature-item">
                <img src="/assets/track.png" alt="Favorites list" className="feature-icon" />
                <span className="feature-text">Track prices</span>
              </div>
              <div className="feature-item">
                <img src="/assets/market.png" alt="Favorites list" className="feature-icon" />
                <span className="feature-text">Multiple markets</span>
              </div>
              <div className="feature-item">
                <img src="/assets/bellON.png" alt="Price alerts" className="feature-icon" />
                <span className="feature-text">Price alerts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer">
        <div className="footer-links">
          <a href="/terms" className="footer-link">Privacy Policy</a>
          <a href="/privacy" className="footer-link">Terms of Service</a>
          <a href="/copyright" className="footer-link">Copyright Info</a>
        </div>
        <div className="social-icons">
          <a href="https://discord.com" target="_blank" rel="noopener noreferrer">
            <img src="/assets/discord.png" alt="Discord" className="social-icon" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            <img src="/assets/instagram.png" alt="Instagram" className="social-icon" />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
            <img src="/assets/youtube.png" alt="YouTube" className="social-icon" />
          </a>
        </div>
        <p className="copyright">© 2025 SkinRadar. Not affiliated with Valve Corp.</p>
      </div>
    </div>
  );
};

export default SkinRadarApp;