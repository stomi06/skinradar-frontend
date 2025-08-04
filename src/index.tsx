import App from './App';
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <App />
);

// Rejestrujemy service worker, aby aplikacja była offline-owa
serviceWorkerRegistration.register();
