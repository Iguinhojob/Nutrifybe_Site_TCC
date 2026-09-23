import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './css/polish.css';
import './css/modal-fix.css';
import './css/calendar.css';

const updateFavicon = () => {
  const favicon = document.querySelector('[data-theme-favicon]');
  if (!favicon) return;

  const isDark = document.body.classList.contains('dark-mode');
  favicon.href = `${process.env.PUBLIC_URL || ''}/${isDark ? 'icone-roxo.png' : 'app-icon-1024.png'}`;
};

// Mantém o ícone sincronizado quando o usuário alterna o tema sem recarregar a página.
updateFavicon();
const themeObserver = new MutationObserver(updateFavicon);
themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
