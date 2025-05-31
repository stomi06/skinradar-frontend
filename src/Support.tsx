import React, { useState } from 'react';

interface SupportProps {
  username: string;
  avatar: string;
  onLogout: () => void;
  firstLogin: string;
  onNavigateToHome: () => void;
  onNavigateToSearch: () => void;
  onNavigateToFavorites: () => void;
  onNavigateToNotifications: () => void;
  onNavigateToSettings: () => void;
  isPremium: boolean;
}

const Support: React.FC<SupportProps> = ({ 
  username, 
  avatar, 
  onLogout, 
  firstLogin,
  onNavigateToHome,
  onNavigateToSearch,
  onNavigateToFavorites,
  onNavigateToNotifications,
  onNavigateToSettings,
  isPremium
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [activeMenu2] = useState<number>(-1);
  const [activeUsers, setActiveUsers] = useState<number>(0); // Dodaj stan dla aktywnych użytkowników

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    onLogout();
  };

  const formattedDate = firstLogin ? new Date(firstLogin).toLocaleDateString() : '';

  // Funkcja do pobierania liczby użytkowników
  const fetchActiveUsers = async () => {
    try {
      const response = await fetch('https://skinradar-d0a6bmd2a3c6dbde.northeurope-01.azurewebsites.net/api/users/count');
      if (response.ok) {
        const data = await response.json();
        setActiveUsers(data.count);
      }
    } catch (error) {
      console.error('Error fetching user count:', error);
      setActiveUsers(0);
    }
  };

  // Pobierz liczbę użytkowników przy załadowaniu komponentu
  React.useEffect(() => {
    fetchActiveUsers();
  }, []);

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
        <button className="dropdown-button" onClick={() => {}}>
          <img src="/assets/questmark.png" className="dropdown-icon"/>
          <span className="dropdown-button-text">SUPPORT</span>
        </button>
      </div>

      <div className={`scroll-container${isMenuOpen ? ' scroll-container-dropdown-open' : ''}`}>
        <div className="settings-content">
          
          {/* App Information Section */}
          <div className="settings-section">
            <div className="filter-label">App Information</div>
            <div className="settings-description">
              Version and system details
            </div>
            <div className="app-info-grid">
              <div className="info-item">
                <span className="info-label">Version:</span>
                <span className="info-value">BETA</span>
              </div>
              <div className="info-item">
                <span className="info-label">Last Update:</span>
                <span className="info-value">May 29, 2025</span>
              </div>
              <div className="info-item">
                <span className="info-label">Released:</span>
                <span className="info-value">June, 2025</span>
              </div>
              <div className="info-item">
                <span className="info-label">Status:</span>
                <span className="info-value status-online">Online</span>
              </div>
              <div className="info-item">
                <span className="info-label">Active Users:</span>
                <span className="info-value">{activeUsers.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="settings-section">
            <div className="filter-label">Frequently Asked Questions</div>
            <div className="settings-description">
              Common questions and answers
            </div>
            <div className="support-faq">
              <div className="faq-item">
                <div className="faq-question">How to track item prices?</div>
                <div className="faq-answer">Search for your item and click the heart icon to add it to favorites. You'll receive notifications when prices change.</div>
              </div>
              <div className="faq-item">
                <div className="faq-question">Which platforms do we support?</div>
                <div className="faq-answer">We support CSFloat, Skinport, BitSkins, WAXPEER, SkinBaron, and ShadowPay marketplaces for real-time price tracking.</div>
              </div>
              <div className="faq-item">
                <div className="faq-question">How often are prices updated?</div>
                <div className="faq-answer">Prices are updated every 5 minutes to ensure maximum accuracy and real-time data.</div>
              </div>
            </div>
          </div>

          {/* Report Issues Section */}
          <div className="settings-section">
            <div className="filter-label">Report Issues</div>
            <div className="settings-description">
              Found a bug or need technical support?
            </div>
            <textarea 
              className="bug-report-textarea"
              placeholder="Describe the issue you encountered..."
              rows={4}
            />
            <div className="submit-buttons">
              <button 
                className="submit-button"
                onClick={() => {
                  // Tu można dodać logikę wysyłania zgłoszenia
                  alert('Bug report submitted successfully!');
                }}
              >
                <img src="/assets/send.png" className="submit-icon"/>
                <span className="submit-text">Submit Report</span>
              </button>
              
              <div className="or-divider">
                <span className="or-text">or get instant help on Discord</span>
              </div>
              
              <button 
                className="discord-button"
                onClick={() => window.open('https://discord.gg/2rJJbDpF', '_blank')}
              >
                <img src="/assets/discord.png" className="submit-icon"/>
                <span className="submit-text">Join Discord</span>
              </button>
            </div>
          </div>

          {/* Contact Section */}
          <div className="settings-section">
            <div className="filter-label">Contact Us</div>
            <div className="settings-description">
              Get in touch for business inquiries
            </div>
            <div className="contact-options">
              <button 
                className="contact-button" 
                onClick={() => window.open('mailto:skinradar.kontakt@gmail.com')}
              >
                <img src="/assets/mail.png" className="contact-icon"/>
                <span className="contact-text">skinradar.kontakt@gmail.com</span>
              </button>
            </div>
          </div>

          {/* Platform Status Section */}
          <div className="settings-section">
            <div className="filter-label">Platform Status</div>
            <div className="settings-description">
              Real-time availability of all marketplaces
            </div>
            <div className="platforms-container">
              {[
                { name: 'CSFloat', icon: '/assets/csfloat.png', status: 'online' },
                { name: 'Skinport', icon: '/assets/skinport.png', status: 'online' },
                { name: 'BitSkins', icon: '/assets/bitskins.png', status: 'maintenance' },
                { name: 'WAXPEER', icon: '/assets/waxpeer.png', status: 'maintenance' },
                { name: 'SkinBaron', icon: '/assets/skinbaron.png', status: 'offline' },
                { name: 'ShadowPay', icon: '/assets/shadowpay.png', status: 'offline' }
              ].map((platform) => (
                <div key={platform.name} className="platform-status-item">
                  <img src={platform.icon} alt={platform.name} className="platform-icon" />
                  <span className="platform-text">{platform.name}</span>
                  <div className={`status-indicator status-${platform.status}`}></div>
                </div>
              ))}
            </div>
          </div>
            
          {/* Footer */}
          <div className="footer">
          <div className="footer-links">
            <a href="/terms" className="footer-link">Privacy Policy</a>
            <a href="/privacy" className="footer-link">Terms of Service</a>
            <a href="/copyright" className="footer-link">Copyright Info</a>
          </div>
          <div className="social-icons">
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer">
              <img src="/assets/discord.png" alt="Discord" className="social-icon" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <img src="/assets/instagram.png" alt="Instagram" className="social-icon" />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
              <img src="/assets/youtube.png" alt="YouTube" className="social-icon" />
            </a>
          </div>
          <p className="copyright">© 2025 SkinRadar. Not affiliated with Valve Corp.</p>
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

export default Support;