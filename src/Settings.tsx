import React, { useState } from 'react';

interface SettingsProps {
  username: string;
  avatar: string;
  onLogout: () => void;
  firstLogin: string;
  onNavigateToHome: () => void;
  onNavigateToSearch: () => void;
  onNavigateToFavorites: () => void;
  onNavigateToNotifications: () => void;
  onNavigateToSupport: () => void;
  isPremium?: boolean;
}

const Settings: React.FC<SettingsProps> = ({ 
  username, 
  avatar, 
  onLogout, 
  firstLogin,
  onNavigateToHome,
  onNavigateToSearch,
  onNavigateToFavorites,
  onNavigateToNotifications,
  onNavigateToSupport,
  isPremium = false
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [activeMenu2] = useState<number>(-1);
  
  // Settings state
  const [priceAlerts, setPriceAlerts] = useState<boolean>(true);
  const [resultLimit, setResultLimit] = useState<number>(isPremium ? 5 : 3);
  const [platforms, setPlatforms] = useState<{[key: string]: boolean}>({
    CSFloat: true,
    Skinport: true,
    BitSkins: true,
    WAXPEER: true,
    SkinBaron: true,
    ShadowPay: true
  });

  const platformIcons: {[key: string]: string} = {
    CSFloat: '/assets/csfloat.png',
    Skinport: '/assets/skinport.png',
    BitSkins: '/assets/bitskins.png',
    WAXPEER: '/assets/waxpeer.png',
    SkinBaron: '/assets/skinbaron.png',
    ShadowPay: '/assets/shadowpay.png'
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    onLogout();
  };

  const handlePlatformToggle = (platform: string) => {
    if (!isPremium) return; // Block for freemium users
    
    setPlatforms(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
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
            <span className='user-sub'>{isPremium ? 'PREMIUM' : 'FREEMIUM'}</span>
            <span className="user-menu-date">
              Member since: <b>{formattedDate}</b>
            </span>
          </div>
        </div>
        <button className="dropdown-button" onClick={() => {}}>
          <img src="/assets/settings.png" className="dropdown-icon"/>
          <span className="dropdown-button-text">SETTINGS</span>
        </button>
        <button className="dropdown-button" onClick={onNavigateToSupport}>
          <img src="/assets/questmark.png" className="dropdown-icon"/>
          <span className="dropdown-button-text">SUPPORT</span>
        </button>
      </div>

      <div className={`scroll-container${isMenuOpen ? ' scroll-container-dropdown-open' : ''}`}>
        <div className="settings-content">
          
          {/* Price Alerts Setting */}
          <div className="settings-section">
            <div className="filter-label">Price Alerts</div>
            <div className="settings-description">
              Get notified when tracked items drop in price
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={priceAlerts}
                onChange={() => setPriceAlerts(!priceAlerts)}
              />
              <span className="slider"></span>
            </label>
          </div>

          {/* Result Limit Setting */}
          <div className="settings-section">
            <div className="filter-label">
              Search Result Limit
              {!isPremium && <span className="premium-badge">PREMIUM ONLY</span>}
            </div>
            <div className="settings-description">
              Number of items to display at once
            </div>
            <div className="checkbox-container">
              {[3, 4, 5].map(limit => (
                <button 
                  key={limit}
                  className={`checkbox-button${resultLimit === limit ? ' checkbox-button-active' : ''}${!isPremium ? ' checkbox-button-freemium-disabled' : ''}`}
                  onClick={() => {
                    if (isPremium) {
                      setResultLimit(limit);
                    }
                  }}
                  disabled={!isPremium}
                >
                  <span className="checkbox-text">{limit}</span>
                </button>
              ))}
            </div>
            {!isPremium && (
              <div className="premium-warning">
                Upgrade to Premium to increase search result limit
              </div>
            )}
          </div>

          {/* Preferred Platforms Setting */}
          <div className="settings-section">
            <div className="filter-label">
              Preferred Platforms
              {!isPremium && <span className="premium-badge">PREMIUM ONLY</span>}
            </div>
            <div className="settings-description">
              Choose which marketplaces to display in suggestions
            </div>
            <div className="platforms-container">
              {Object.entries(platforms).map(([platform, enabled]) => (
                <button 
                  key={platform}
                  className={`platform-button${enabled ? ' platform-button-active' : ''}${!isPremium ? ' checkbox-button-disabled' : ''}`}
                  onClick={() => handlePlatformToggle(platform)}
                  disabled={!isPremium}
                >
                  <img 
                    src={platformIcons[platform]} 
                    alt={platform}
                    className="platform-icon"
                  />
                  <span className="platform-text">
                    {platform}
                  </span>
                </button>
              ))}
            </div>
            {!isPremium && (
              <div className="premium-warning">
                Upgrade to Premium to customize marketplace preferences
              </div>
            )}
          </div>

        </div>
      </div>

      <div className="menu2">
        <div className="menu2-inner">
          {[
            { icon: '/assets/home.png', onClick: onNavigateToHome },
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

export default Settings;