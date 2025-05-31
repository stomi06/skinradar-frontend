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
            <div className="pwa-visualization">
              <div className="pwa-browser">
                <div className="browser-header">
                  <div className="browser-dots">
                    <div className="dot red"></div>
                    <div className="dot yellow"></div>
                    <div className="dot green"></div>
                  </div>
                  <div className="browser-url">skinradar.app</div>
                </div>
                <div className="browser-content">
                  <div className="browser-menu">⋮</div>
                  <div className="install-popup">
                    <img src="/assets/phone.png" alt="Phone" className="popup-icon-img"/>
                    <div className="popup-text">Install App</div>
                  </div>
                </div>
              </div>
              <div className="pwa-arrow">→</div>
              <div className="pwa-homescreen">
                <div className="homescreen-grid">
                  <div className="app-icon chrome">
                    <img src="/assets/chrome.png" alt="SkinRadar" className="chrome-logo"/>
                  </div>
                  <div className="app-icon skinradar">
                    <img src="/assets/skinradar2.png" alt="SkinRadar" className="skinradar-logo"/>
                  </div>
                  <div className="app-icon settings">
                    <img src="/assets/settings.png" alt="Settings" className="app-icon-img"/>
                  </div>
                  <div className="app-icon camera">
                    <img src="/assets/camera.png" alt="Camera" className="app-icon-img"/>
                  </div>
                </div>
                <div className="homescreen-text">SkinRadar</div>
              </div>
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

          {/* How It Works Section */}
          <div className="home-section how-it-works-section">
            <div className="section-header">
              <img src="/assets/info.png" alt="How it works" className="section-icon"/>
              <span className="section-title">How Price Alerts Work</span>
            </div>
            <div className="how-it-works-content">
              <div className="demo-visualization">
                <div className="demo-phone">
                  <div className="demo-screen">
                    <div className="demo-search-bar">
                      <img src="/assets/searchimage.png" alt="Search" className="demo-search-icon"/>
                      <span className="demo-text">AK Redline</span>
                    </div>
                    <div className="demo-item">
                      <img 
                          src="https://steamcommunity-a.akamaihd.net/economy/image/class/730/4702298879" 
                          alt="AK-47 Redline" 
                          className="demo-item-img"
                      />
                      <div className="demo-item-details">
                        <div className="demo-item-name">AK-47 | Redline</div>
                        <div className="demo-price">€24.50</div>
                      </div>
                    </div>
                    <div className="demo-alert-form">
                      <div className="demo-input">
                        <span>Alert when price drops to: €20.00</span>
                      </div>
                      <div className="demo-button">Set Alert</div>
                    </div>
                  </div>
                </div>
                <div className="demo-arrow">→</div>
                <div className="demo-notification">
                  <img src="/assets/phone.png" alt="Phone" className="notification-icon-img"/>
                  <div className="notification-text">
                    <div className="notification-title">Price Alert!</div>
                    <div className="notification-body">AK-47 Redline is now €19.99</div>
                  </div>
                </div>
              </div>
              <div className="how-it-works-steps">
                <div className="work-step">
                  <div className="step-number">1</div>
                  <div className="step-title">Search for any CS2 skin</div>
                </div>
                <div className="work-step">
                  <div className="step-number">2</div>
                  <div className="step-title">Set your desired price alert</div>
                </div>
                <div className="work-step">
                  <div className="step-number">3</div>
                  <div className="step-title">Get notified when price drops</div>
                </div>
              </div>
            </div>
          </div>

          {/* User Dashboard */}
          <div className="home-section user-dashboard-section">
            <div className="section-header">
              <img src="/assets/user.png" alt="User" className="section-icon"/>
              <span className="section-title">Your Dashboard</span>
            </div>
            <div className="user-dashboard-content">
              <div className="user-info-card">
                <img src={avatar} alt="avatar" className="dashboard-avatar" />
                <div className="user-info-details">
                  <div className="dashboard-username">{username}</div>
                  <div className={`dashboard-status ${isPremium ? 'premium' : 'free'}`}>
                    {isPremium ? 'PREMIUM' : 'FREE'}
                  </div>
                </div>
              </div>
              <div className="user-stats-simple">
                <div className="stat-item-simple">
                  <img src="/assets/eye.png" alt="Tracked" className="stat-icon-img"/>
                  <div className="stat-content">
                    <div className="stat-number">0</div>
                    <div className="stat-label">Tracked Items</div>
                  </div>
                </div>
              </div>
              <div className="user-info-simple">
                <div className="stat-info-simple">
                  <span className="dashboard-member-since">Member since: {formattedDate}</span>
                  <span className="dashboard-premium-exp">Premium expires: 01.07.2025</span>
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
                  <span className="giveaway-collection">The Fracture Collection</span>
                </div>
              </div>
              <div className="giveaway-action">
                <button 
                  className="join-giveaway-button"
                  onClick={() => window.open('https://discord.gg/2rJJbDpF', '_blank')}
                >
                  <span>Join</span>
                </button>
                <div className="giveaway-info">
                  <div className="giveaway-participants">247 participants</div>
                  <div className="giveaway-deadline">Ends: June 15, 2025</div>
                </div>
              </div>
            </div>
          </div>

          {/* News Section */}
          <div className="home-section news-section">
            <div className="section-header">
              <img src="/assets/news.png" alt="News" className="section-icon"/>
              <span className="section-title">Latest News</span>
            </div>
            <div className="news-content">
              <div className="news-item">
                <div className="news-date">Today</div>
                <div className="news-title">CS2 Market Update: New Item Collection Released</div>
                <div className="news-description">The Dreams & Nightmares Collection has been added to CS2, featuring community-designed skins.</div>
              </div>
              <div className="news-item">
                <div className="news-date">2 days ago</div>
                <div className="news-title">SkinRadar Premium Features Expanded</div>
                <div className="news-description">New price alert system and advanced filtering options now available for Premium users.</div>
              </div>
              <div className="news-item">
                <div className="news-date">1 week ago</div>
                <div className="news-title">Major Trading Platforms Integration</div>
                <div className="news-description">Added support for 3 new marketplaces with real-time price tracking.</div>
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