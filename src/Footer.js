import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '2rem 1rem',
      marginTop: 'auto',
      textAlign: 'center'
    }}>
      <div style={{maxWidth: '1200px', margin: '0 auto'}}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          <div>
            <h4 style={{color: '#22d3ee', marginBottom: '1rem'}}>Nutrifybe</h4>
            <p style={{fontSize: '0.9rem', opacity: '0.8'}}>
              Sistema de gestão nutricional desenvolvido por estudantes do ITB.
            </p>
          </div>
          
          <div>
            <h4 style={{color: '#22d3ee', marginBottom: '1rem'}}>Links Úteis</h4>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              <Link to="/sobre-nos" style={{color: 'white', textDecoration: 'none', fontSize: '0.9rem'}}>Sobre Nós</Link>
              <Link to="/suporte" style={{color: 'white', textDecoration: 'none', fontSize: '0.9rem'}}>Suporte</Link>
            </div>
          </div>
          
          <div>
            <h4 style={{color: '#22d3ee', marginBottom: '1rem'}}>Legal</h4>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              <Link to="/termos-uso" style={{color: 'white', textDecoration: 'none', fontSize: '0.9rem'}}>Termos de Uso</Link>
              <Link to="/politica-privacidade" style={{color: 'white', textDecoration: 'none', fontSize: '0.9rem'}}>Política de Privacidade</Link>
            </div>
          </div>
        </div>
        
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          paddingTop: '1rem',
          fontSize: '0.8rem',
          opacity: '0.7'
        }}>
          © 2025 Nutrifybe - ITB Brasílio Flores de Azevedo. Projeto Acadêmico.
        </div>
      </div>
    </footer>
  );
};

export default Footer;