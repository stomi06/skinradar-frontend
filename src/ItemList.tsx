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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [activeMenu2, setActiveMenu2] = useState<number>(1);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

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
      <div className="menu">
        <div className="menu-inner">
          <button onClick={toggleMenu} className="menu-icon" style={{ background: 'none', border: 'none' }}>
            <img src="/assets/menu.png" alt="menu" />
          </button>
          <button onClick={toggleUserMenu} className="avatar" style={{ background: 'none', border: 'none', padding: 0 }}>
            <img src={avatar} alt="avatar" />
          </button>
        </div>
      </div>

      <div className="scroll-container">
        {isMenuOpen && (
          <div className="dropdown-menu">
            <button className="dropdown-button" onClick={navigateToList}>
              <span className="dropdown-button-text">LISTA</span>
            </button>
            <button className="dropdown-button" onClick={navigateToAddItem}>
              <span className="dropdown-button-text">DODAJ</span>
            </button>
          </div>
        )}

        {isUserMenuOpen && (
          <div className="user-menu">
            <span className="user-menu-text">{username}</span>
            <button className="logout-button" onClick={handleLogout}>
              <img src="/assets/logout.png" alt="logout" className="logout-icon" />
            </button>
          </div>
        )}

        <div style={{ flex: 1, padding: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span className="title">Witaj w aplikacji SkinRadar!</span>
          <span className='title'>AK-47 | Redline</span>
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