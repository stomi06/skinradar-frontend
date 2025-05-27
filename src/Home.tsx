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
  onNavigateToSupport
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
            <span className='user-sub'>PREMIUM</span>
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
        <div style={{ flex: 1, padding: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span className="title">Welcome to SkinRadar Home {username}!</span>
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