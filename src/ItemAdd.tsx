import React, { useState } from 'react';
import './styles/style.css';

interface ItemAddProps {
  username: string;
  avatar: string;
  onLogout: () => void;
  onNavigateToList: () => void;
}

const wearLevels = ["Factory New", "Minimal Wear", "Field-Tested", "Well-Worn", "Battle-Scarred"];

const rarityStyleMap: Record<string, { colors: string[]; borderColor: string }> = {
  'exotic':    { colors: ['rgba(142,0,225,0.2)', '#10172c'], borderColor: '#8d00e1' },
  'classified':{ colors: ['rgba(142,0,225,0.2)', '#10172c'], borderColor: '#8d00e1' },
  'superior':  { colors: ['rgba(142,0,225,0.2)', '#10172c'], borderColor: '#8d00e1' },

  'covert':        { colors: ['rgba(194,0,0,0.2)', '#10172c'], borderColor: '#c20000' },
  'master':        { colors: ['rgba(194,0,0,0.2)', '#10172c'], borderColor: '#c20000' },
  'extraordinary': { colors: ['rgba(194,0,0,0.2)', '#10172c'], borderColor: '#c20000' },

  'restricted':   { colors: ['rgba(93,43,153,0.2)', '#10172c'], borderColor: '#5d2b9a' },
  'exceptional':  { colors: ['rgba(93,43,153,0.2)', '#10172c'], borderColor: '#5d2b9a' },
  'remarkable':   { colors: ['rgba(93,43,153,0.2)', '#10172c'], borderColor: '#5d2b9a' },

  'industrial grade': { colors: ['rgba(81,138,251,0.2)', '#10172c'], borderColor: '#5189fb' },

  'contraband':   { colors: ['rgba(217,172,70,0.2)', '#10172c'], borderColor: '#d9ac46' },

  'base grade':      { colors: ['rgba(142,180,255,0.2)', '#10172c'], borderColor: '#8eb3ff' },
  'consumer grade':  { colors: ['rgba(142,180,255,0.2)', '#10172c'], borderColor: '#8eb3ff' },

  'distinguished':   { colors: ['rgba(41,71,157,0.2)', '#10172c'], borderColor: '#29479d' },
  'high grade':      { colors: ['rgba(41,71,157,0.2)', '#10172c'], borderColor: '#29479d' },
  'mil-spec grade':  { colors: ['rgba(41,71,157,0.2)', '#10172c'], borderColor: '#29479d' },
};

const ItemAdd: React.FC<ItemAddProps> = ({ username, avatar, onLogout, onNavigateToList }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [condition, setCondition] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeMenu2, setActiveMenu2] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [openPricesIndex, setOpenPricesIndex] = useState<number | null>(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  const handleLogout = () => {
    if (window.confirm('Czy na pewno chcesz się wylogować?')) {
      onLogout();
    }
  };

  const handleSearch = async () => {
    setShowSuggestions(false);
    setIsLoading(true);

    const isStatTrak = selectedType === 'StatTrak™';
    const isSouvenir = selectedType === 'Souvenir';
    let queryText = itemName.trim()
      .replace(/^★\s*StatTrak™\s*/i, '')
      .replace(/^StatTrak™\s*/i, '')
      .replace(/^★\s*/i, '')
      .replace(/^Souvenir\s*/i, '');

    if (isStatTrak) {
      queryText = `★ StatTrak™ ${queryText}`;
    } else if (isSouvenir) {
      queryText = `Souvenir ${queryText}`;
    }

    const queryParams = new URLSearchParams({
      query: queryText
    });

    if (condition) {
      queryParams.append('condition', condition);
    }
    if (isStatTrak) {
      queryParams.append('stattrak', 'true');
    }
    if (isSouvenir) {
      queryParams.append('souvenir', 'true');
    }

    fetch(`${process.env.REACT_APP_API_URL}/suggestions?${queryParams.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        const newSuggestions: any[] = [];
        for (const suggestion of data) {
          if (suggestion.imageurl) {
            newSuggestions.push(suggestion);
          }
        }

        // Czekaj aż wszystkie obrazy się załadują
        const imagePromises = newSuggestions.map(
          (suggestion) =>
            new Promise<void>((resolve) => {
              const img = new window.Image();
              img.src = suggestion.imageurl;
              if (img.complete) {
                resolve();
              } else {
                img.onload = () => resolve();
                img.onerror = () => resolve(); // nawet jeśli błąd, nie blokuj
              }
            })
        );

        Promise.all(imagePromises).then(() => {
          setSuggestions(newSuggestions);
          setShowSuggestions(true);
          setIsLoading(false);
        });
      })
      .catch((error) => {
        console.error('Błąd podczas pobierania sugestii:', error);
        setIsLoading(false);
      });
  };

  const toggleFilterVisibility = () => setIsFilterVisible(!isFilterVisible);

  return (
    <div className="container">
      <div className="menu">
        <div className="menu-inner">
          <button onClick={toggleMenu} className="menu-icon" style={{ background: 'none', border: 'none' }}>
            <img src="/assets/menu.png" alt="menu"/>
          </button>
          <button onClick={toggleUserMenu} className="avatar" style={{ background: 'none', border: 'none', padding: 0 }}>
            <img src={avatar} alt="avatar"/>
          </button>
        </div>
      </div>
      <div className="scroll-container">
        {isMenuOpen && (
          <div className="dropdown-menu">
            <button className="dropdown-button" onClick={() => { setIsMenuOpen(false); onNavigateToList(); }}>
              <span className="dropdown-button-text">LISTA</span>
            </button>
            <button className="dropdown-button" onClick={() => setIsMenuOpen(false)}>
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

        {/* Nowy przewijalny obszar */}
        <div className="main-content">
          <div className="search-container">
            <div className="input-row">
              <div className="input" style={{ display: 'flex', alignItems: 'center', flex: 1, paddingLeft: 10, paddingRight: 0 }}>
                <img src="/assets/searchimage.png" alt="search" className="search-icon" />
                <input
                  className="input-inner"
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none' }}
                  placeholder="Wpisz nazwę przedmiotu"
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                />
              </div>
              <div onClick={toggleFilterVisibility} className="filter-button">
                <img src="/assets/filter.png" alt="filter" className="filter-icon" />
              </div>
            </div>
              <div className={`filter-container${isFilterVisible ? ' filter-container-visible' : ''}`}>
                {/* Zawartość filtra - do wyświetlenia kiedy isFilterVisible = true */}
                <div className="checkbox-container">
                  <button
                    type="button"
                    className={`checkbox-button${selectedType === 'StatTrak™' ? ' checkbox-button-active' : ''}`}
                    onClick={() => setSelectedType(selectedType === 'StatTrak™' ? '' : 'StatTrak™')}
                  >
                    <span className="checkbox-text">StatTrak™</span>
                  </button>
                  <button
                    type="button"
                    className={`checkbox-button${selectedType === 'Souvenir' ? ' checkbox-button-active' : ''}`}
                    onClick={() => setSelectedType(selectedType === 'Souvenir' ? '' : 'Souvenir')}
                  >
                    <span className="checkbox-text">Souvenir</span>
                  </button>
                </div>
                <div className="checkbox-container">
                  {wearLevels.map(option => (
                    <button
                      key={option}
                      type="button"
                      className={`checkbox-button${condition === option ? ' checkbox-button-active' : ''}`}
                      onClick={() => setCondition(condition === option ? '' : option)}
                    >
                      <span className="checkbox-text">{option}</span>
                    </button>
                  ))}
                </div>
              </div>
            <button className="search-button" onClick={handleSearch}>
              <span className="search-button-text">Search</span>
            </button>
          </div>

          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
              <div className="loader"></div>
            </div>
          )}
          <div className={`suggestions-container${showSuggestions && !isLoading ? ' suggestions-container-visible' : ''}`}>
            {showSuggestions && !isLoading && (
              <div className={`suggestions-container${showSuggestions ? ' suggestions-container-visible' : ''}`}>
                {suggestions.map((suggestion, index) => {
                  const csfloatLink = (name: string) => `https://csfloat.com/search?sort_by=lowest_price&type=buy_now&market_hash_name=${encodeURIComponent(name)}`;
                  const bitskinsLink = (name: string) => `https://bitskins.com/market/cs2?search={%22order%22:[{%22field%22:%22price%22,%22order%22:%22ASC%22}],%22where%22:{%22skin_name%22:%22${encodeURIComponent(name)}%22}}`;
                  const skinportLink = (name: string) => `https://skinport.com/pl/market?search=${encodeURIComponent(name)}&sort=price&order=asc`;
                  const waxpeerLink = (name: string) => `https://waxpeer.com/pl?sort=ASC&order=price&all=0&exact=0&search=${encodeURIComponent(name)}`;

                  const priceObjs = [
                    { market: 'csfloat', value: suggestion.prices?.csfloat, link: csfloatLink(suggestion.display_fullname) },
                    { market: 'bitskins', value: suggestion.prices?.bitskins, link: bitskinsLink(suggestion.market_hash_name) },
                    { market: 'skinport', value: suggestion.prices?.skinport, link: skinportLink(suggestion.market_hash_name) },
                    { market: 'waxpeer', value: suggestion.prices?.waxpeer, link: waxpeerLink(suggestion.market_hash_name) }
                  ].filter(p => typeof p.value === 'number' && !isNaN(p.value));

                  const minObj = priceObjs.length > 0
                    ? priceObjs.reduce((min, p) => p.value < min.value ? p : min, priceObjs[0])
                    : null;
                  const rarityKey = String(suggestion.rarity ?? '').toLowerCase().trim();
                  const rarityStyle = rarityStyleMap[rarityKey];
                  const name = suggestion.display_fullname ?? suggestion.market_hash_name;

                  const gradient15 = rarityStyle
                    ? `linear-gradient(90deg, ${rarityStyle.colors[0]} 0%, #10172c 20%)`
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
                        <a><img src="assets/eye.png" className="suggestion-eye" /></a>
                      </div>
                      {suggestion.imageurl && (
                        <img src={suggestion.imageurl} alt={name} className="suggestion-image" />
                      )}
                      {/* Prefix */}
                      <div className="suggestion-info">
                        {name.startsWith('StatTrak™ ') && <span className="suggestion-prefix">StatTrak™</span>}
                        {name.startsWith('Souvenir ') && <span className="suggestion-prefix">Souvenir</span>}
                        {name.startsWith('★ StatTrak™ ') && <span className="suggestion-prefix">StatTrak™</span>}
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
                        <div className='prices-container' onClick={e => e.stopPropagation()}>
                          <div>
                            <img src="assets/csfloat.png" alt="CSFloat"/>
                            CSFloat: ${suggestion.prices?.csfloat ?? 'N/A'}
                          </div>
                          <div>
                            <img src="assets/bitskins.png" alt="BitSkins"/>
                            BitSkins: ${suggestion.prices?.bitskins ?? 'N/A'}
                          </div>
                          <div>
                            <img src="assets/skinport.png" alt="SkinPort"/>
                            SkinPort: ${suggestion.prices?.skinport ?? 'N/A'}
                          </div>
                          <div>
                            <img src="assets/waxpeer.png" alt="Waxpeer"/>
                            Waxpeer: ${suggestion.prices?.waxpeer ?? 'N/A'}
                          </div>
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

export default ItemAdd;