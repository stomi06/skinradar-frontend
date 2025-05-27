import React, { useState } from 'react';
import './styles/style.css';

interface ItemListProps {
  username: string;
  avatar: string;
  onLogout: () => void;
  firstLogin: string;
  onNavigateToHome: () => void;
  onNavigateToSearch: () => void;
  onNavigateToFavorites: () => void;
  onNavigateToNotifications: () => void;
  onNavigateToSettings: () => void;
  onNavigateToSupport: () => void;
}

const ItemList: React.FC<ItemListProps> = ({ 
  username, 
  avatar, 
  onLogout, 
  firstLogin,
  onNavigateToHome,
  onNavigateToSearch,
  onNavigateToFavorites,
  onNavigateToNotifications,
  onNavigateToSettings,
  onNavigateToSupport
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMenu2] = useState<number>(2); // Favorites is index 2

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    if (window.confirm('Czy na pewno chcesz się wylogować?')) {
      onLogout();
    }
  };

  // Formatowanie daty (bez godziny)
  const formattedDate = firstLogin ? new Date(firstLogin).toLocaleDateString() : '';

  // Usuń logikę showAddItem - ItemList ma tylko renderować listę ulubionych
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
          <span className="title">Your Favoritesss {username}!</span>
        </div>
      </div>

      <div className="menu2">
        <div className="menu2-inner">
          {[
            { icon: '/assets/home.png', onClick: onNavigateToHome },
            { icon: '/assets/searchimage.png', onClick: onNavigateToSearch },
            { icon: '/assets/heart.png', onClick: () => {} }, // Current page
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

export default ItemList;