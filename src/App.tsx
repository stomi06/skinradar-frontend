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
  const [steamId, setSteamId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [firstLogin, setFirstLogin] = useState<string | null>(null);
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

    if (steamId && username && avatar && firstLogin) { 
      setSteamId(steamId);
      setUsername(username);
      setAvatar(avatar);
      setFirstLogin(firstLogin);
    }
  };

  useEffect(() => {
    const url = window.location.href;
    if (url.includes('?')) handleDeepLink(url);
  }, []);

  const handleLogout = () => {
    setSteamId(null);
    setUsername(null);
    setAvatar(null);
    setFirstLogin(null);
    setCurrentPage('home');
    // Wyczyść stan ItemAdd przy wylogowaniu
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
    sessionStorage.removeItem('itemAdd_global_state');
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
      onNavigateToSupport: navigateToSupport
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
      <div className="logo-container">
        <img src="/assets/skinradar.png" alt="SkinRadar Logo" className="logo" />
        <p className="app-description">
          Discover, track, and find the best skins for your collection. SkinRadar helps you stay ahead in the market.
        </p>
      </div>
      <div className="login-container">
        <button onClick={handleSteamLogin} className="login-button">
          <img src="/assets/steam.png" className="steam-logo" alt="Steam" />
          <span className="login-text">Sign in</span>
        </button>
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
            <img src="/assets/grayinsta.png" alt="Instagram" className="social-icon" />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
            <img src="/assets/youtube.png" alt="YouTube" className="social-icon" />
          </a>
        </div>
        <p className="copyright">© 2025 SkinRadar. All rights reserved.</p>
      </div>
    </div>
  );
};

export default SkinRadarApp;