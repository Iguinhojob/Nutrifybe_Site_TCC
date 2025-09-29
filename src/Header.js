import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = ({ theme = 'public', links = [] }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className={theme === 'nutri' ? 'nutri-theme' : theme === 'admin' ? 'admin-theme' : ''}>
      <div className="container">
        <nav>
          <ul className={mobileMenuOpen ? 'mobile-menu-open' : ''}>
            {links.map((link, index) => (
              <li key={index}>
                <Link 
                  to={link.href} 
                  className={location.pathname === link.href ? 'active' : ''}
                  onClick={link.onClick}
                >
                  {link.text}
                </Link>
              </li>
            ))}
          </ul>
          <button 
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
            aria-label="Menu"
            onClick={toggleMobileMenu}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;