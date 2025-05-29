import React, { useState } from 'react';

interface HomeProps {
  username: string;
  avatar: string;
  onLogout: () => void;
  firstLogin: string;
  onNavigateToSearch: () => void;
  onNavigateToFavorites: () => void;
  onNavigateToNotifications: () => void;
  onNavigateToSettings: () => void;
  onNavigateToSupport: () => void;
  isPremium: boolean; // Dodaj tę linię
}

const Home: React.FC<HomeProps> = ({ 
  username, 
  avatar, 
  onLogout, 
  firstLogin,
  onNavigateToSearch,
  onNavigateToFavorites,
  onNavigateToNotifications,
  onNavigateToSettings,
  onNavigateToSupport,
  isPremium // Dodaj tę linię
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [activeMenu2] = useState<number>(0); // Home is index 0

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    onLogout();
  };

  const formattedDate = firstLogin ? new Date(firstLogin).toLocaleDateString() : '';

  return (
    <div className="container">
      <div className="menu">
        <div className="menu-inner">
          <button onClick={toggleMenu} className="menu-icon" style={{ background: 'none', border: 'none' }}>
            <img src="/assets/menu.png" alt="menu" />
          </button>
          <img src="/assets/logo.png" alt="logo" className="logo"/>
        </div>
      </div>

      <div className={`dropdown-menu${isMenuOpen ? ' dropdown-menu-visible' : ''}`}>
        <div className="user-menu-section">
          <img src={avatar} alt="avatar" className="user-menu-avatar" />
          <div className="user-menu-info">
            <div className="user-menu-name">
              <span className="user-menu-text">{username}</span>
              <button className="logout-button" onClick={handleLogout}>
                <img src="/assets/logout.png" alt="logout" className="logout-icon" />
              </button>
            </div>
            <span className={`user-sub${isPremium ? '' : ' user-sub-free'}`}>
              {isPremium ? 'PREMIUM' : 'FREE'}
            </span>
            <span className="user-menu-date">
              Member since: <b>{formattedDate}</b>
            </span>
          </div>
        </div>
        <button className="dropdown-button" onClick={onNavigateToSettings}>
          <img src="/assets/settings.png" className="dropdown-icon"/>
          <span className="dropdown-button-text">SETTINGS</span>
        </button>
        <button className="dropdown-button" onClick={onNavigateToSupport}>
          <img src="/assets/questmark.png" className="dropdown-icon"/>
          <span className="dropdown-button-text">SUPPORT</span>
        </button>
      </div>

      <div className={`scroll-container${isMenuOpen ? ' scroll-container-dropdown-open' : ''}`}>
        <div className="home-content">
          
          {/* PWA Installation Guide */}
          <div className="home-section pwa-section">
            <div className="section-header">
              <img src="/assets/download.png" alt="Install" className="section-icon"/>
              <span className="section-title">Install SkinRadar Mobile App</span>
            </div>
            <div className="pwa-guide">
              <div className="pwa-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <div className="step-title">Open browser menu</div>
                  <div className="step-description">Look for three dots or menu icon</div>
                </div>
              </div>
              <div className="pwa-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <div className="step-title">Find "Install app" or "Add to Home Screen"</div>
                  <div className="step-description">Different browsers use different names</div>
                </div>
              </div>
              <div className="pwa-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <div className="step-title">Confirm installation</div>
                  <div className="step-description">App will be added to your device</div>
                </div>
              </div>
              <div className="pwa-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <div className="step-title">Find app on your desktop</div>
                  <div className="step-description">Use it like a regular native application</div>
                </div>
              </div>
            </div>
          </div>

          {/* Giveaway Section */}
          <div className="home-section giveaway-section">
            <div className="section-header">
              <img src="/assets/gift.png" alt="Giveaway" className="section-icon"/>
              <span className="section-title">Active Giveaway</span>
            </div>
            <div className="giveaway-content">
              <div className="giveaway-item">
                <img 
                  src="https://steamcommunity-a.akamaihd.net/economy/image/class/730/5289829088" 
                  alt="Desert Eagle | Printstream" 
                  className="giveaway-image"
                />
                <div className="giveaway-details">
                  <div className="giveaway-name">Desert Eagle | Printstream</div>
                  <div className="giveaway-condition">Factory New</div>
                  <div className="giveaway-meta">
                    <span className="giveaway-rarity covert">Covert</span>
                    <span className="giveaway-collection">The Fracture Collection</span>
                  </div>
                </div>
              </div>
              <div className="giveaway-action">
                <button 
                  className="join-giveaway-button"
                  onClick={() => window.open('https://discord.gg/2rJJbDpF', '_blank')}
                >
                  <span>Join Giveaway</span>
                </button>
                <div className="giveaway-info">
                  <div className="giveaway-participants">247 participants</div>
                  <div className="giveaway-deadline">Ends: June 15, 2025</div>
                </div>
              </div>
            </div>
          </div>

          {/* Most Searched Skins */}
          <div className="home-section">
            <div className="section-header">
              <img src="/assets/trend.png" alt="Trending" className="section-icon"/>
              <span className="section-title">Most Searched This Week</span>
            </div>
            <div className="trending-skins">
              <div className="trending-item">
                <div className="trending-rank">1</div>
                <div className="trending-details">
                  <div className="trending-name">AK-47 | Redline</div>
                  <div className="trending-searches">2,847 searches</div>
                </div>
                <div className="trending-change up">+12%</div>
              </div>
              <div className="trending-item">
                <div className="trending-rank">2</div>
                <div className="trending-details">
                  <div className="trending-name">AWP | Dragon Lore</div>
                  <div className="trending-searches">2,134 searches</div>
                </div>
                <div className="trending-change up">+8%</div>
              </div>
              <div className="trending-item">
                <div className="trending-rank">3</div>
                <div className="trending-details">
                  <div className="trending-name">Karambit | Doppler</div>
                  <div className="trending-searches">1,923 searches</div>
                </div>
                <div className="trending-change down">-3%</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="menu2">
        <div className="menu2-inner">
          {[
            { icon: '/assets/home.png', onClick: () => {} },
            { icon: '/assets/searchimage.png', onClick: onNavigateToSearch },
            { icon: '/assets/heart.png', onClick: onNavigateToFavorites },
            { icon: '/assets/bell.png', onClick: onNavigateToNotifications }
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={item.onClick}
              className="menu2-button"
              style={{ background: 'none', border: 'none', padding: 0 }}
            >
              <div className={`menu2-icon-wrapper${activeMenu2 === idx ? ' menu2-icon-wrapper-active' : ''}`}>
                <img
                  src={item.icon}
                  alt=""
                  className={`menu-button-icon${activeMenu2 === idx ? ' menu-button-icon-active' : ''}`}
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;