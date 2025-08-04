import React, { useState, useEffect } from 'react';
import './styles/style.css';
import './styles/desktopstyle.css';

// Cache dla alertów użytkownika
interface AlertCache {
  data: UserAlert[];
  timestamp: number;
  steamId: string;
}

// Globalny cache (poza komponentem)
let alertsCache: AlertCache | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minut

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
  isPremium: boolean;
  steamId: string;
  updateUserAlertsCount?: (count: number) => void;
}

interface UserAlert {
  id: number;
  steam_id: string;
  market_hash_name: string;
  alert_price: number;
  csfloat_price?: number;
  skinport_price?: number;
  bitskins_price?: number;
  waxpeer_price?: number;
  shadowpay_price?: number;
  skinbaron_price?: number;
  added: string;
  imageurl?: string;
  rarity?: string;
  description?: string;
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
  onNavigateToSupport,
  isPremium,
  steamId,
  updateUserAlertsCount
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMenu2] = useState<number>(2);
  const [userAlerts, setUserAlerts] = useState<UserAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<UserAlert | null>(null);
  const [newAlertPrice, setNewAlertPrice] = useState('');

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    if (window.confirm('Czy na pewno chcesz się wylogować?')) {
      onLogout();
    }
  };

  // Pobierz alerty użytkownika
  useEffect(() => {
    const fetchUserAlerts = async () => {
      if (!steamId) return;
      
      // Sprawdź cache NAJPIERW
      if (alertsCache && 
          alertsCache.steamId === steamId && 
          Date.now() - alertsCache.timestamp < CACHE_DURATION) {
        console.log('Loading alerts from cache');
        setUserAlerts(alertsCache.data);
        
        // Zaktualizuj count w App z cache
        if (updateUserAlertsCount) {
          updateUserAlertsCount(alertsCache.data.length);
        }
        
        setLoading(false);
        return; // WAŻNE: wyjdź z funkcji, nie pobieraj z API
      }
      
      // Tylko jeśli nie ma cache - pobierz z API
      console.log('Fetching fresh alerts from API');
      setLoading(true);
      
      try {
        const response = await fetch(`http://192.168.55.107:8000/alerts/${steamId}`);
        if (response.ok) {
          const alerts = await response.json();
          console.log('Fetched alerts:', alerts);
          
          // Zapisz w cache
          alertsCache = {
            data: alerts,
            timestamp: Date.now(),
            steamId: steamId
          };
          
          setUserAlerts(alerts);
          
          // Zaktualizuj count w App
          if (updateUserAlertsCount) {
            updateUserAlertsCount(alerts.length);
          }
        } else {
          console.error('Failed to fetch user alerts');
        }
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAlerts();
  }, [steamId, updateUserAlertsCount]);


  // Funkcja do formatowania nazwy przedmiotu
  const formatItemName = (marketHashName: string) => {
    const prefixes = [];
    let cleanName = marketHashName;
    let hasStar = false;

    if (cleanName.includes('StatTrak™')) {
      prefixes.push(<span key="stattrak" className="prices-item-prefix-stattrak">StatTrak™</span>);
      cleanName = cleanName.replace('StatTrak™ ', '');
    }
    if (cleanName.startsWith('Souvenir')) {
      prefixes.push(<span key="souvenir" className="prices-item-prefix-souvenir">Souvenir</span>);
      cleanName = cleanName.replace('Souvenir ', '');
    }
    if (cleanName.startsWith('★')) {
      hasStar = true;
      // NIE usuwaj gwiazdki z cleanName - zostaw ją
      // cleanName = cleanName.replace('★ ', ''); // Usuń tę linię
    }

    // Wyciągnij wear z nazwy
    const wearMatch = cleanName.match(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/);
    const wear = wearMatch ? wearMatch[1] : null;
    if (wear) {
      cleanName = cleanName.replace(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/, '');
    }

    return { prefixes, cleanName, wear, hasStar };
  };

  // Funkcja do konwersji hex na rgb:
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '255, 255, 255';
  };

  // Dodaj funkcję do określania rarity:
  const getRarityStyle: Record<string, { colors: string[]; borderColor: string }> = {
  'exotic':    { colors: ['rgba(166,0,231,0.2)', '#111938'], borderColor: '#a600e7' },
  'classified':{ colors: ['rgba(166,0,231,0.2)', '#111938'], borderColor: '#a600e7' },
  'superior':  { colors: ['rgba(166,0,231,0.2)', '#111938'], borderColor: '#a600e7' },

  'covert':        { colors: ['rgba(194,0,0,0.2)', '#111938'], borderColor: '#c20000' },
  'master':        { colors: ['rgba(194,0,0,0.2)', '#111938'], borderColor: '#c20000' },
  'extraordinary': { colors: ['rgba(194,0,0,0.2)', '#111938'], borderColor: '#c20000' },

  'restricted':   { colors: ['rgba(93,43,153,0.2)', '#111938'], borderColor: '#5d2b9a' },
  'exceptional':  { colors: ['rgba(93,43,153,0.2)', '#111938'], borderColor: '#5d2b9a' },
  'remarkable':   { colors: ['rgba(93,43,153,0.2)', '#111938'], borderColor: '#5d2b9a' },

  'industrial grade': { colors: ['rgba(81,138,251,0.2)', '#111938'], borderColor: '#5189fb' },

  'contraband':   { colors: ['rgba(217,172,70,0.2)', '#111938'], borderColor: '#d9ac46' },

  'base grade':      { colors: ['rgba(91,116,168,0.2)', '#111938'], borderColor: '#5b74a8' },
  'consumer grade':  { colors: ['rgba(91,116,168,0.2)', '#111938'], borderColor: '#5b74a8' },

  'distinguished':   { colors: ['rgba(41,71,157,0.2)', '#111938'], borderColor: '#29479d' },
  'high grade':      { colors: ['rgba(41,71,157,0.2)', '#111938'], borderColor: '#29479d' },
  'mil-spec grade':  { colors: ['rgba(41,71,157,0.2)', '#111938'], borderColor: '#29479d' },
};

  // Dodaj funkcje obsługi modali:
  const handleEditAlert = (alert: UserAlert) => {
    setEditingAlert(alert);
    setNewAlertPrice(alert.alert_price.toString());
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingAlert(null);
    setNewAlertPrice('');
  };

  const handleUpdateAlert = async () => {
    if (!editingAlert || !newAlertPrice || parseFloat(newAlertPrice) <= 0) {
      alert('Please enter a valid price');
      return;
    }
    
    try {
      const response = await fetch(`http://192.168.55.107:8000/alerts/${editingAlert.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alert_price: parseFloat(newAlertPrice)
        })
      });
      
      if (response.ok) {
        const updatedAlerts = userAlerts.map(alert => 
          alert.id === editingAlert.id 
            ? { ...alert, alert_price: parseFloat(newAlertPrice) }
            : alert
        );
        
        // Zaktualizuj state
        setUserAlerts(updatedAlerts);
        
        // Zaktualizuj cache
        if (alertsCache && alertsCache.steamId === steamId) {
          alertsCache.data = updatedAlerts;
          alertsCache.timestamp = Date.now();
        }
        
        alert('Alert price updated successfully!');
        closeEditModal();
      } else {
        alert('Failed to update alert price');
      }
    } catch (error) {
      console.error('Error updating alert:', error);
      alert('Error updating alert price');
    }
  };

  // Definicje funkcji linków
  const csfloatLink = (name: string) => `https://csfloat.com/search?sort_by=lowest_price&type=buy_now&market_hash_name=${encodeURIComponent(name)}`;
  const bitskinsLink = (name: string) => `https://bitskins.com/market/cs2?search={%22order%22:[{%22field%22:%22price%22,%22order%22:%22ASC%22}],%22where%22:{%22skin_name%22:%22${encodeURIComponent(name)}%22}}`;
  const skinportLink = (name: string) => `https://skinport.com/pl/market?search=${encodeURIComponent(name)}`;
  const waxpeerLink = (name: string) => `https://waxpeer.com/pl?sort=ASC&order=price&all=0&exact=0&search=${encodeURIComponent(name)}`;
  const shadowpayLink = (name: string) => `https://shadowpay.com/csgo-items?price_from=0&price_to=99802.67&search=${encodeURIComponent(name)}`;
  const skinbaronLink = (name: string) => `https://skinbaron.de/en/csgo?str=${encodeURIComponent(name)}&sort=CF`;

  // Dodaj funkcję do wymuszenia odświeżenia cache:
  const refreshAlerts = async () => {
    if (!steamId) return;
    
    setLoading(true);
    
    // Wyczyść cache
    alertsCache = null;
    
    try {
      console.log('Force refreshing alerts');
      const response = await fetch(`http://192.168.55.107:8000/alerts/${steamId}`);
      if (response.ok) {
        const alerts = await response.json();
        
        // Zapisz nowy cache
        alertsCache = {
          data: alerts,
          timestamp: Date.now(),
          steamId: steamId
        };
        
        setUserAlerts(alerts);
      }
    } catch (error) {
      console.error('Error refreshing alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dodaj funkcję do usuwania alertu (jeśli jeszcze nie masz):
  const handleDeleteAlert = async (alertId: number) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) {
      return;
    }
    
    try {
      const response = await fetch(`http://192.168.55.107:8000/alerts/${alertId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const updatedAlerts = userAlerts.filter(alert => alert.id !== alertId);
        
        // Zaktualizuj state
        setUserAlerts(updatedAlerts);
        
        // Zaktualizuj cache
        if (alertsCache && alertsCache.steamId === steamId) {
          alertsCache.data = updatedAlerts;
          alertsCache.timestamp = Date.now();
        }
        
        alert('Alert deleted successfully!');
      } else {
        alert('Failed to delete alert');
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      alert('Error deleting alert');
    }
  };

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
        {/* Header alertów */}
        <div className="alerts-card-header">
          <h2 className="alerts-card-title">Price Alerts</h2>
          <div className="alerts-card-controls">
            <div className={`alerts-card-limit-info ${isPremium ? 'premium' : ''} ${
              (!isPremium && userAlerts.length >= 3) || (isPremium && userAlerts.length >= 5) ? 'limit-reached' : ''
              }`}>
                {isPremium 
                  ? `${userAlerts.length}/5 alerts used (Premium)` 
                  : `${userAlerts.length}/3 alerts used (Free)`
                }
            </div>
            <button 
              className="alerts-refresh-button"
              onClick={refreshAlerts}
              disabled={loading}
              title="Refresh alerts"
            >
              <img src="assets/refresh.png" alt="Refresh" />
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="alerts-card-loading">
            <div className="loading-spinner">Loading your alerts...</div>
          </div>
        )}

        {/* Empty state */}
        {!loading && userAlerts.length === 0 && (
          <div className="alerts-card-empty">
            <div className="alerts-card-empty-icon"><img src='assets/bellON.png'/></div>
            <div className="alerts-card-empty-text">No price alerts yet</div>
            <div className="alerts-card-empty-subtitle">
              {isPremium 
                ? 'Create up to 5 alerts to get notified when prices drop'
                : 'Create up to 3 alerts to get notified when prices drop'
              }
            </div>
            <button 
              className="alerts-card-add-button"
              onClick={onNavigateToSearch}
            >
              Create Alert
            </button>
          </div>
        )}

        {/* Lista alertów */}
        {!loading && userAlerts.length > 0 && (
          <div className="alerts-card-container">
            {userAlerts.map((alert) => {
              const { prefixes, cleanName, wear } = formatItemName(alert.market_hash_name);
              
              // Oblicz najniższą cenę
              const priceObjs = [
                { market: 'CSFloat', value: alert.csfloat_price },
                { market: 'BitSkins', value: alert.bitskins_price },
                { market: 'SkinPort', value: alert.skinport_price },
                { market: 'Waxpeer', value: alert.waxpeer_price },
                { market: 'ShadowPay', value: alert.shadowpay_price },
                { market: 'SkinBaron', value: alert.skinbaron_price }
              ].filter((p): p is { market: string; value: number } => 
                typeof p.value === 'number' && !isNaN(p.value)
              );

              const minObj = priceObjs.length > 0
                ? priceObjs.reduce((min, p) => p.value < min.value ? p : min)
                : null;

              // Rarity styling
              const rarityKey = (alert.rarity || 'consumer grade').toLowerCase().replace(/\s+/g, ' ').trim();
              const rarityStyle = getRarityStyle[rarityKey] || getRarityStyle['consumer grade'];
              
              return (
                <div 
                  key={alert.id} 
                  className="alert-card-item-card"
                >
                  {/* Header z akcjami */}
                  <div className="alert-card-item-header">
                    <div className="alert-card-item-actions">
                      <button className="alert-card-action-btn alert-card-edit-btn" onClick={() => handleEditAlert(alert)}>
                        <img src="assets/edit.png" alt="Edit" />
                      </button>
                      <button className="alert-card-action-btn alert-card-delete-btn" onClick={() => handleDeleteAlert(alert.id)}>
                        <img src="assets/bin.png" alt="Delete" />
                      </button>
                    </div>
                  </div>

                  {/* Główna zawartość */}
                  <div className="alert-card-item-content">
                    {/* Sekcja obrazu z gradientem */}
                    <div className="alert-card-item-image-section">
                      {alert.imageurl ? (
                        <img 
                          src={alert.imageurl}
                          alt={alert.market_hash_name}
                          className="alert-card-item-image"
                          style={{
                            background: `linear-gradient(90deg, ${rarityStyle.colors[0]} 0%, ${rarityStyle.colors[1]} 100%)`,
                            borderLeft: `2px solid ${rarityStyle.borderColor}`,
                          }}
                        />
                      ) : (
                        <div 
                          className="alert-card-item-no-image"
                          style={{
                            background: `linear-gradient(90deg, ${rarityStyle.colors[0]} 0%, ${rarityStyle.colors[1]} 100%)`,
                            border: `2px solid ${rarityStyle.borderColor}`,
                            borderRadius: '8px'
                          }}
                        >
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Sekcja informacji */}
                    <div className="alert-card-item-info">
                      {/* Nazwa przedmiotu */}
                      <div className="alert-card-item-name-section">
                        {prefixes.length > 0 && (
                          <div className="alert-card-item-prefixes">{prefixes}</div>
                        )}
                        <h3 className="alert-card-item-name">{cleanName}</h3>
                        {wear && (
                          <div className="alert-card-item-wear">{wear}</div>
                        )}
                      </div>

                      {/* Sekcja cen */}
                      <div className="alert-card-item-pricing">
                        <div className="alert-card-price-comparison">
                          <div className="alert-card-item-description">
                            <span className="alert-card-price-label">Added on: {new Date(alert.added).toLocaleDateString()}</span>
                          </div>
                          <div className="alert-card-current-price">
                            <span className="alert-card-price-label">Current Lowest:</span>
                            <span className="alert-card-price-value alert-card-price-current">
                              {minObj ? `$${minObj.value.toFixed(2)}` : 'N/A'}
                            </span>
                            {minObj && (
                              <span className="alert-card-price-market">{minObj.market}</span>
                            )}
                          </div>
                          <div className="alert-card-target-price">
                            <span className="alert-card-price-label">Alert Price:</span>
                            <span className="alert-card-price-value alert-card-price-target">
                              ${alert.alert_price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Wszystkie ceny */}
                      <div className="alert-card-item-all-prices">
                        {alert.csfloat_price && (
                          <a href={csfloatLink(alert.market_hash_name)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                            <div className="alert-card-price-item">
                              <img src="assets/csfloat.png" alt="CSFloat" className="alert-card-market-icon" />
                              <span className="alert-card-market-name">CSFloat</span>
                              <span className="alert-card-market-price">${alert.csfloat_price.toFixed(2)}</span>
                              <img src="assets/external-arrow.png" alt="External" className="alert-card-market-arrow" />
                            </div>
                          </a>
                        )}
                        {alert.skinport_price && (
                          <a href={skinportLink(alert.market_hash_name)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                            <div className="alert-card-price-item">
                              <img src="assets/skinport.png" alt="SkinPort" className="alert-card-market-icon" />
                              <span className="alert-card-market-name">SkinPort</span>
                              <span className="alert-card-market-price">${alert.skinport_price.toFixed(2)}</span>
                              <img src="assets/external-arrow.png" alt="External" className="alert-card-market-arrow" />
                            </div>
                          </a>
                        )}
                        {alert.bitskins_price && (
                          <a href={bitskinsLink(alert.market_hash_name)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                            <div className="alert-card-price-item">
                              <img src="assets/bitskins.png" alt="BitSkins" className="alert-card-market-icon" />
                              <span className="alert-card-market-name">BitSkins</span>
                              <span className="alert-card-market-price">${alert.bitskins_price.toFixed(2)}</span>
                              <img src="assets/external-arrow.png" alt="External" className="alert-card-market-arrow" />
                            </div>
                          </a>
                        )}
                        {alert.waxpeer_price && (
                          <a href={waxpeerLink(alert.market_hash_name)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                            <div className="alert-card-price-item">
                              <img src="assets/waxpeer.png" alt="Waxpeer" className="alert-card-market-icon" />
                              <span className="alert-card-market-name">Waxpeer</span>
                              <span className="alert-card-market-price">${alert.waxpeer_price.toFixed(2)}</span>
                              <img src="assets/external-arrow.png" alt="External" className="alert-card-market-arrow" />
                            </div>
                          </a>
                        )}
                        {alert.shadowpay_price && (
                          <a href={shadowpayLink(alert.market_hash_name)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                            <div className="alert-card-price-item">
                              <img src="assets/shadowpay.png" alt="ShadowPay" className="alert-card-market-icon" />
                              <span className="alert-card-market-name">ShadowPay</span>
                              <span className="alert-card-market-price">${alert.shadowpay_price.toFixed(2)}</span>
                              <img src="assets/external-arrow.png" alt="External" className="alert-card-market-arrow" />
                            </div>
                          </a>
                        )}
                        {alert.skinbaron_price && (
                          <a href={skinbaronLink(alert.market_hash_name)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                            <div className="alert-card-price-item">
                              <img src="assets/skinbaron.png" alt="SkinBaron" className="alert-card-market-icon" />
                              <span className="alert-card-market-name">SkinBaron</span>
                              <span className="alert-card-market-price">${alert.skinbaron_price.toFixed(2)}</span>
                              <img src="assets/external-arrow.png" alt="External" className="alert-card-market-arrow" />
                            </div>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="menu2">
        <div className="menu2-inner">
          {[
            { icon: '/assets/home.png', onClick: onNavigateToHome },
            { icon: '/assets/searchimage.png', onClick: onNavigateToSearch },
            { icon: '/assets/heart.png', onClick: () => {} },
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