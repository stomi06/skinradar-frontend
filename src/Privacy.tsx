// Utwórz src/Privacy.tsx
import React from 'react';

interface PrivacyProps {
  onGoBack: () => void;
}

const Privacy: React.FC<PrivacyProps> = ({ onGoBack }) => {
  return (
    <div className="legal-page">
      <div className="legal-scroll-container">
        <div className="legal-content">
          <div className="legal-header">
            <button onClick={onGoBack} className="back-button">
              ← Back to App
            </button>
          </div>
          
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last updated: January 8, 2025</p>
          
          <section>
            <h2>1. What Information We Collect</h2>
            <p>We only collect the minimal information necessary to provide our service:</p>
            <ul>
              <li><strong>Steam Account Data:</strong> Steam ID, username, and avatar image (obtained through Steam OpenID when you log in)</li>
              <li><strong>Price Alerts:</strong> The CS2 items you choose to track and your preferred price thresholds</li>
              <li><strong>Login Data:</strong> Timestamp of your first login to determine account age</li>
            </ul>
            <p><strong>We do NOT collect:</strong> Your email address, real name, location, IP address, or any other personal information.</p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Privacy;