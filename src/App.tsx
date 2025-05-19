import React, { useState, useEffect } from 'react';
import queryString from 'query-string';
import ItemList from './ItemList';

const SkinRadarApp = () => {
  const [steamId, setSteamId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);

  const handleSteamLogin = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      console.log('API URL:', apiUrl); // <-- dodaj ten log
      window.location.href = `${apiUrl}/auth/steam`;
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
    console.log('User logged out');
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
      <div className="login-container">
        <button onClick={handleSteamLogin} className="login-button">
          <img src="/assets/steam.png" className="steam-logo" alt="Steam" />
          <span className="login-text">Sign in with Steam</span>
        </button>
      </div>
    </div>
  );
};


export default SkinRadarApp;
