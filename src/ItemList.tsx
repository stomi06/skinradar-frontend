import React, { useState } from 'react';
import './styles/style.css';
import ItemAdd from './ItemAdd';

interface ItemListProps {
  username: string;
  avatar: string;
  onLogout: () => void;
}

const ItemList: React.FC<ItemListProps> = ({ username, avatar, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [activeMenu2, setActiveMenu2] = useState<number>(1);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    if (window.confirm('Czy na pewno chcesz się wylogować?')) {
      onLogout();
    }
  };

  const navigateToAddItem = () => {
    setShowAddItem(true);
    setIsMenuOpen(false);
  };

  const navigateToList = () => setShowAddItem(false);

  if (showAddItem) {
    return (
      <ItemAdd
        username={username}
        avatar={avatar}
        onLogout={onLogout}
        onNavigateToList={navigateToList}
      />
    );
  }

  return (
    <div className="container">
      <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: 'url("/assets/graf2.jpg") center center / cover no-repeat',
        opacity: 0.015,
        animation: 'none'
      }}
      aria-hidden="true"
      />
      <div className="menu">
        <div className="menu-inner">
          <button onClick={toggleMenu} className="menu-icon" style={{ background: 'none', border: 'none' }}>
            <img src="/assets/menu.png" alt="menu" />
          </button>
          <img src="/assets/skinradar.png" alt="logo" className="logo"/>
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
              </div>
          </div>
          <button className="dropdown-button" onClick={navigateToList}>
            <img src="/assets/eye.png" className="dropdown-icon"/>
            <span className="dropdown-button-text">LIST</span>
          </button>
          <button className="dropdown-button" onClick={navigateToAddItem}>
            <img src="/assets/add.png" className="dropdown-icon"/>
            <span className="dropdown-button-text">SEARCH</span>
          </button>
        </div>

      <div className={`scroll-container${isMenuOpen ? ' scroll-container-dropdown-open' : ''}`}>
        <div style={{ flex: 1, padding: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span className="title">Witaj w aplikacji SkinRadar {username}!</span>
        </div>
      </div>

      <div className="menu2">
        <div className="menu2-inner">
          {['/assets/settings.png', '/assets/bell.png', '/assets/questmark.png'].map((icon, idx) => (
            <button
              key={idx}
              onClick={() => setActiveMenu2(idx)}
              className="menu2-button"
              style={{ background: 'none', border: 'none', padding: 0 }}
            >
              <div className={`menu2-icon-wrapper${activeMenu2 === idx ? ' menu2-icon-wrapper-active' : ''}`}>
                <img
                  src={icon}
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