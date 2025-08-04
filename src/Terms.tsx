// Utwórz src/Terms.tsx
import React from 'react';

interface TermsProps {
  onGoBack: () => void; // Dodaj prop
}

const Terms: React.FC<TermsProps> = ({ onGoBack }) => {
  return (
    <div className="legal-page">
      <div className="legal-scroll-container">
        <div className="legal-content">
          <div className="legal-header">
            <button onClick={onGoBack} className="back-button">
              ← Back to App
            </button>
          </div>
          
          <h1>Terms of Service</h1>
          <p className="last-updated">Last updated: January 8, 2025</p>
          
          <section>
            <h2>Acceptance of Terms</h2>
            <p>By using SkinRadar, you agree to these Terms of Service. If you do not agree, please do not use our service.</p>
          </section>

          <section>
            <h2>Description of Service</h2>
            <p>SkinRadar is a price tracking and alert service for CS2 (Counter-Strike 2) skins and items. We provide:</p>
            <ul>
              <li>Real-time price monitoring</li>
              <li>Price alert notifications</li>
              <li>Market comparison tools</li>
              <li>Historical price data</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Terms;