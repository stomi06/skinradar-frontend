const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname === '127.0.0.1'
);

export function register(): void {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

    if (isLocalhost) {
      checkValidServiceWorker(swUrl);
    } else {
      registerValidSW(swUrl);
    }
  }
}

function registerValidSW(swUrl: string): void {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('Pomyślnie zarejestrowano serwis worker:', registration);
    })
    .catch((error) => {
      console.error('Błąd podczas rejestrowania serwis worker:', error);
    });
}

function checkValidServiceWorker(swUrl: string): void {
  fetch(swUrl)
    .then((response) => {
      if (response.status === 404 || response.type === 'opaqueredirect') {
        console.log('Serwis worker nie znaleziony');
      } else {
        registerValidSW(swUrl);
      }
    })
    .catch(() => {
      console.log('Brak połączenia z serwisem, aplikacja może działać offline.');
    });
}
