import React, { useState, useEffect } from 'react';
import queryString from 'query-string';
import './styles/style.css'; // Upewnij się, że style są zaimportowane
import ItemList from './ItemList';

const SkinRadarApp = () => {
  const [steamId, setSteamId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);

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

    if (steamId && username && avatar) { 
      setSteamId(steamId);
      setUsername(username);
      setAvatar(avatar);
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
  };

  if (steamId && username && avatar) {
    return (
      <ItemList 
        username={username} 
        avatar={avatar} 
        onLogout={handleLogout} 
      />
    );
  }

  return (
    <div className="start-container">
      <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: 'url("/assets/graf2.jpg") center center / cover no-repeat',
        opacity: 0.015,
        animation: 'none'
      }}
      aria-hidden="true"
      />
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
            <img src="/assets/grayinsta.png" alt="Discord" className="social-icon" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            <img src="/assets/discord.png" alt="Instagram" className="social-icon" />
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
