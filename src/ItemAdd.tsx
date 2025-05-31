import React, { useState, useEffect } from 'react';
import './styles/style.css';

interface ItemAddProps {
  username: string;
  avatar: string;
  onLogout: () => void;
  firstLogin: string;
  onNavigateToHome: () => void;
  onNavigateToList: () => void;
  onNavigateToFavorites: () => void;
  onNavigateToNotifications: () => void;
  onNavigateToSettings: () => void;
  onNavigateToSupport: () => void;
  itemAddState: any;
  setItemAddState: any;
  isPremium: boolean; // Dodaj tę linię
}

const wearLevels = ["Factory New", "Minimal Wear", "Field-Tested", "Well-Worn", "Battle-Scarred"];

const rarityStyleMap: Record<string, { colors: string[]; borderColor: string }> = {
  'exotic':    { colors: ['rgba(166,0,231,0.2)', '#10172c'], borderColor: '#a600e7' },
  'classified':{ colors: ['rgba(166,0,231,0.2)', '#10172c'], borderColor: '#a600e7' },
  'superior':  { colors: ['rgba(166,0,231,0.2)', '#10172c'], borderColor: '#a600e7' },

  'covert':        { colors: ['rgba(194,0,0,0.2)', '#10172c'], borderColor: '#c20000' },
  'master':        { colors: ['rgba(194,0,0,0.2)', '#10172c'], borderColor: '#c20000' },
  'extraordinary': { colors: ['rgba(194,0,0,0.2)', '#10172c'], borderColor: '#c20000' },

  'restricted':   { colors: ['rgba(93,43,153,0.2)', '#10172c'], borderColor: '#5d2b9a' },
  'exceptional':  { colors: ['rgba(93,43,153,0.2)', '#10172c'], borderColor: '#5d2b9a' },
  'remarkable':   { colors: ['rgba(93,43,153,0.2)', '#10172c'], borderColor: '#5d2b9a' },

  'industrial grade': { colors: ['rgba(81,138,251,0.2)', '#10172c'], borderColor: '#5189fb' },

  'contraband':   { colors: ['rgba(217,172,70,0.2)', '#10172c'], borderColor: '#d9ac46' },

  'base grade':      { colors: ['rgba(91,116,168,0.2)', '#10172c'], borderColor: '#5b74a8' },
  'consumer grade':  { colors: ['rgba(91,116,168,0.2)', '#10172c'], borderColor: '#5b74a8' },

  'distinguished':   { colors: ['rgba(41,71,157,0.2)', '#10172c'], borderColor: '#29479d' },
  'high grade':      { colors: ['rgba(41,71,157,0.2)', '#10172c'], borderColor: '#29479d' },
  'mil-spec grade':  { colors: ['rgba(41,71,157,0.2)', '#10172c'], borderColor: '#29479d' },
};

const getSessionKey = (username: string) => `itemadd_state_${username}`;

const ItemAdd: React.FC<ItemAddProps> = ({ 
  username, 
  avatar, 
  onLogout, 
  firstLogin,
  onNavigateToHome,
  onNavigateToList,
  onNavigateToFavorites,
  onNavigateToNotifications,
  onNavigateToSettings,
  onNavigateToSupport,
  itemAddState,
  setItemAddState,
  isPremium // Dodaj tę linię
}) => {
  // Użyj stanu z props zamiast lokalnego
  const {
    suggestions,
    showSuggestions,
    sortBy,
    itemName,
    selectedType,
    condition,
    priceFrom,
    priceTo,
    isFilterVisible,
    noMatchesError
  } = itemAddState;

  // Funkcje do aktualizacji stanu
  const updateState = (updates: any) => {
    setItemAddState({ ...itemAddState, ...updates });
  };

  // Lokalne stany które nie muszą być zachowane
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [openPricesIndex, setOpenPricesIndex] = useState<number | null>(null);
  const [activeMenu2] = useState<number>(1); // Search is index 1

  // Resetuj sessionStorage przy wylogowaniu
  const handleLogout = () => {
    if (window.confirm('Czy na pewno chcesz się wylogować?')) {
      onLogout();
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleSearch = async () => {
    updateState({ showSuggestions: false });
    setIsLoading(true);
    
    const isStatTrak = selectedType === 'StatTrak™';
    const isSouvenir = selectedType === 'Souvenir';
    
    let queryText = itemName.trim()
      .replace(/^★\s*StatTrak™\s*/i, '')
      .replace(/^StatTrak™\s*/i, '')
      .replace(/^★\s*/i, '')
      .replace(/^Souvenir\s*/i, '');

    const queryParams = new URLSearchParams({
      query: queryText,
      sort_by: sortBy
    });

    if (condition) queryParams.append('condition', condition);
    if (isStatTrak) queryParams.append('stattrak', 'true');
    if (isSouvenir) queryParams.append('souvenir', 'true');
    if (priceFrom) queryParams.append('price_from', priceFrom);
    if (priceTo) queryParams.append('price_to', priceTo);

    try {
      const response = await fetch(`https://skinradar-d0a6bmd2a3c6dbde.northeurope-01.azurewebsites.net/suggestions?${queryParams.toString()}`);
      const data = await response.json();
      
      updateState({ noMatchesError: '' });
      
      if (data.length === 1 && data[0].error) {
        updateState({ 
          noMatchesError: data[0].error,
          showSuggestions: false 
        });
        setIsLoading(false);
        return;
      }

      const newSuggestions = data.filter((suggestion: any) => suggestion.imageurl);

      if (newSuggestions.length === 0) {
        const errorMsg = (priceFrom || priceTo) 
          ? `No matching items were found within the specified price range. Please provide more specific search parameters or adjust the price range.`
          : "No matching items were found. Please provide more specific search parameters.";
        updateState({ 
          noMatchesError: errorMsg,
          showSuggestions: false 
        });
        setIsLoading(false);
        return;
      }

      const imagePromises = newSuggestions.map((suggestion: any) =>
        new Promise<void>((resolve) => {
          const img = new window.Image();
          img.src = suggestion.imageurl;
          if (img.complete) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        })
      );

      await Promise.all(imagePromises);
      updateState({ 
        suggestions: newSuggestions,
        showSuggestions: true 
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Błąd podczas pobierania sugestii:', error);
      setIsLoading(false);
    }
  };

  const toggleFilterVisibility = () => {
    updateState({ isFilterVisible: !isFilterVisible });
  };

  const formattedDate = firstLogin ? new Date(firstLogin).toLocaleDateString() : '';

  return (
    <div className="container">
      <div className="menu">
        <div className="menu-inner">
          <button onClick={toggleMenu} className="menu-icon" style={{ background: 'none', border: 'none' }}>
            <img src="/assets/menu.png" alt="menu"/>
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
        <div className="main-content">
          <div className="search-container">
            <div className="input-row">
              <div className="input" style={{ display: 'flex', alignItems: 'center', flex: 1, paddingLeft: 10, paddingRight: 0 }}>
                <img src="/assets/searchimage.png" alt="search" className="search-icon" />
                <input
                  className="input-inner"
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none' }}
                  placeholder="Item name..."
                  value={itemName}
                  onChange={e => updateState({ itemName: e.target.value })}
                />
              </div>
              <div onClick={toggleFilterVisibility} className="filter-button">
                <img src="/assets/filter.png" alt="filter" className="filter-icon" />
              </div>
            </div>
            
            <div className={`filter-container${isFilterVisible ? ' filter-container-visible' : ''}`}>
              <div className="filter-label">Special:</div>
              <div className="checkbox-container">
                <button
                  type="button"
                  className={`checkbox-button${selectedType === 'StatTrak™' ? ' checkbox-button-active' : ''}`}
                  onClick={() => updateState({ selectedType: selectedType === 'StatTrak™' ? '' : 'StatTrak™' })}
                >
                  <span className="checkbox-text">StatTrak™</span>
                </button>
                <button
                  type="button"
                  className={`checkbox-button${selectedType === 'Souvenir' ? ' checkbox-button-active' : ''}`}
                  onClick={() => updateState({ selectedType: selectedType === 'Souvenir' ? '' : 'Souvenir' })}
                >
                  <span className="checkbox-text">Souvenir</span>
                </button>
              </div>
              
              <div className="filter-label">Wear:</div>
              <div className="checkbox-container">
                {wearLevels.map(option => (
                  <button
                    key={option}
                    type="button"
                    className={`checkbox-button${condition === option ? ' checkbox-button-active' : ''}`}
                    onClick={() => updateState({ condition: condition === option ? '' : option })}
                  >
                    <span className="checkbox-text">{option}</span>
                  </button>
                ))}
              </div>
              
              <div className="filter-label">Price:</div>
              <div className="price-filter-row">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  className="price-filter-input"
                  value={priceFrom}
                  onChange={e => updateState({ priceFrom: e.target.value })}
                />
                <span className="price-filter-separator">-</span>
                <input
                  type="number"
                  min="0"
                  placeholder="ထ"
                  className="price-filter-input"
                  value={priceTo}
                  onChange={e => updateState({ priceTo: e.target.value })}
                />
                <span className="price-filter-currency">$</span>
              </div>
              
              <div className="sorting-container">
                <div className="filter-label">Sort by:</div>
                <div className="sorting-options">
                  <button
                    type="button"
                    className={`checkbox-button${sortBy === 'default' ? ' checkbox-button-active' : ''}`}
                    onClick={() => updateState({ sortBy: 'default' })}
                  >
                    <span className="checkbox-text">Default</span>
                  </button>
                  <button
                    type="button"
                    className={`checkbox-button${sortBy === 'lowest_price' ? ' checkbox-button-active' : ''}`}
                    onClick={() => updateState({ sortBy: 'lowest_price' })}
                  >
                    <span className="checkbox-text">Lowest Price</span>
                  </button>
                  <button
                    type="button"
                    className={`checkbox-button${sortBy === 'highest_price' ? ' checkbox-button-active' : ''}`}
                    onClick={() => updateState({ sortBy: 'highest_price' })}
                  >
                    <span className="checkbox-text">Highest Price</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="search-buttons">
              <button className="search-button" onClick={handleSearch}>
                <span className="search-button-text">Search</span>
              </button>
              <button className="clear-button" onClick={() => {
                updateState({
                  itemName: '',
                  selectedType: '',
                  condition: '',
                  priceFrom: '',
                  priceTo: '',
                  sortBy: 'default',
                  suggestions: [],
                  showSuggestions: false,
                  noMatchesError: ''
                });
              }}>
                <img src="/assets/clear.png" alt="clear" className="clear-icon" />
              </button>
            </div>
          </div>

          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
              <div className="loader"></div>
            </div>
          )}
          {noMatchesError && !isLoading && (
            <div className="no-matches-error">
              {noMatchesError}
            </div>
          )}
          <div className={`suggestions-container${showSuggestions && !isLoading ? ' suggestions-container-visible' : ''}`}>
            {showSuggestions && !isLoading && (
              <div className={`suggestions-container${showSuggestions ? ' suggestions-container-visible' : ''}`}>
                {suggestions.map((suggestion: any, index: number) => {
                  const csfloatLink = (name: string) => `https://csfloat.com/search?sort_by=lowest_price&type=buy_now&market_hash_name=${encodeURIComponent(name)}`;
                  const bitskinsLink = (name: string) => `https://bitskins.com/market/cs2?search={%22order%22:[{%22field%22:%22price%22,%22order%22:%22ASC%22}],%22where%22:{%22skin_name%22:%22${encodeURIComponent(name)}%22}}`;
                  const skinportLink = (name: string) => `https://skinport.com/pl/market?search=${encodeURIComponent(name)}`;
                  const waxpeerLink = (name: string) => `https://waxpeer.com/pl?sort=ASC&order=price&all=0&exact=0&search=${encodeURIComponent(name)}`;

                  const priceObjs = [
                    { market: 'csfloat', value: suggestion.prices?.csfloat, link: csfloatLink(suggestion.display_fullname) },
                    { market: 'bitskins', value: suggestion.prices?.bitskins, link: bitskinsLink(suggestion.display_fullname) },
                    { market: 'skinport', value: suggestion.prices?.skinport, link: skinportLink(suggestion.display_fullname) },
                    { market: 'waxpeer', value: suggestion.prices?.waxpeer, link: waxpeerLink(suggestion.display_fullname) }
                  ].filter(p => typeof p.value === 'number' && !isNaN(p.value));

                  const minObj = priceObjs.length > 0
                    ? priceObjs.reduce((min, p) => p.value < min.value ? p : min, priceObjs[0])
                    : null;
                  const rarityKey = String(suggestion.rarity ?? '').toLowerCase().trim();
                  const rarityStyle = rarityStyleMap[rarityKey];
                  const name = suggestion.display_fullname ?? suggestion.market_hash_name;

                  const gradient15 = rarityStyle
                    ? `linear-gradient(90deg, ${rarityStyle.colors[0]} 0%, #10172c 2%)`
                    : '';
                  const gradient50 = rarityStyle
                    ? `linear-gradient(90deg, ${rarityStyle.colors[0]} 0%, #10172c 40%)`
                    : '';

                  const itemClass = `suggestion-item${hoveredIndex === index ? ' suggestion-item-bg-hover' : ' suggestion-item-bg'}`;

                  return (
                    <div
                      key={index}
                      className={itemClass}
                      style={{
                        borderLeft: rarityStyle ? `2px solid ${rarityStyle.borderColor}` : undefined,
                        '--suggestion-gradient-15': gradient15,
                        '--suggestion-gradient-50': gradient50
                      } as React.CSSProperties}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <div className="suggestion-menu">
                        <a
                          onClick={() => setOpenPricesIndex(openPricesIndex === index ? null : index)}
                          style={{ cursor: "pointer" }}
                        >
                          <img src='assets/cart.png' className='suggestion-cart' alt="Ceny" />
                        </a>
                        <a><img src="assets/heart.png" className="suggestion-heart" /></a>
                      </div>
                      {suggestion.imageurl && (
                        <img src={suggestion.imageurl} alt={name} className="suggestion-image" />
                      )}
                      {/* Prefix */}
                      <div className="suggestion-info">
                        {name.startsWith('StatTrak™ ') && (
                          <span className="suggestion-prefix suggestion-prefix-stattrak">StatTrak™</span>
                        )}
                        {name.startsWith('Souvenir ') && (
                          <span className="suggestion-prefix suggestion-prefix-souvenir">Souvenir</span>
                        )}
                        {name.startsWith('★ StatTrak™ ') && (
                          <span className="suggestion-prefix suggestion-prefix-stattrak">StatTrak™</span>
                        )}
                        <span className="suggestion-text">
                          {name
                            .replace(/^StatTrak™ /, '')
                            .replace(/^Souvenir /, '')
                            .replace(/^★ StatTrak™ /, '★ ')
                            .replace(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/, '')
                        }
                        </span>
                        {suggestion.display_wear && (
                          <span className="suggestion-wear">{suggestion.display_wear}</span>
                        )}
                        <span className="suggestion-details">
                          {suggestion.description}
                        </span>
                      </div>
                      <div className="suggestion-price-container">
                        <span className="suggestion-price">
                          {minObj ? `$${minObj.value.toFixed(2)}` : 'N/A'}
                        </span>
                        <a href={minObj ? minObj.link : "#"} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                          <button className='buy-button'>
                            Buy Now
                            <div style={{ fontSize: '11px', color: '#7C8BA1', marginTop: 2, fontWeight: 'normal' }}>
                              {minObj
                                ? (minObj.market === 'csfloat'
                                    ? 'csfloat.com'
                                    : minObj.market === 'bitskins'
                                      ? 'bitskins.com'
                                      : minObj.market === 'skinport'
                                        ? 'skinport.com'
                                        : minObj.market === 'waxpeer'
                                          ? 'waxpeer.com'
                                          : '')
                                : ''}
                            </div>
                          </button>
                        </a>
                      </div>
                      <div className="suggestion-prices" style={{opacity: openPricesIndex === index ? 1 : 0, visibility: openPricesIndex === index ? "visible" : "hidden"}} onClick={() => setOpenPricesIndex(null)}>
                        <div className="prices-container" onClick={e => e.stopPropagation()}>
                          <a href={csfloatLink(suggestion.display_fullname)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                            <div className="price-market">
                              <img src="assets/csfloat.png" alt="CSFloat" className="price-market-img" />
                              <span className="price-label">CSFloat:</span>
                              <span className="price-value">${suggestion.prices?.csfloat ?? 'N/A'}</span>
                            </div>
                          </a>
                          <a href={bitskinsLink(suggestion.display_fullname)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                            <div className="price-market">
                              <img src="assets/bitskins.png" alt="BitSkins" className="price-market-img" />
                              <span className="price-label">BitSkins:</span>
                              <span className="price-value">${suggestion.prices?.bitskins ?? 'N/A'}</span>
                            </div>
                          </a>
                          <a href={skinportLink(suggestion.display_fullname)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                            <div className="price-market">
                              <img src="assets/skinport.png" alt="SkinPort" className="price-market-img" />
                              <span className="price-label">SkinPort:</span>
                              <span className="price-value">${suggestion.prices?.skinport ?? 'N/A'}</span>
                            </div>
                          </a>
                          <a href={waxpeerLink(suggestion.display_fullname)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                            <div className="price-market">
                              <img src="assets/waxpeer.png" alt="Waxpeer" className="price-market-img" />
                              <span className="price-label">Waxpeer:</span>
                              <span className="price-value">${suggestion.prices?.waxpeer ?? 'N/A'}</span>
                            </div>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="menu2">
        <div className="menu2-inner">
          { [
            { icon: '/assets/home.png', onClick: onNavigateToHome },
            { icon: '/assets/searchimage.png', onClick: () => {} }, // Current page - no action
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
          )) }
        </div>
      </div>
    </div>
  );
};

export default ItemAdd;