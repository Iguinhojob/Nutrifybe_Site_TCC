import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import fundoImage from './fundo_index.png';

const NotFound = () => {
  const headerLinks = [
    { href: '/', text: 'Início' },
    { href: '/solicitar-consulta', text: 'Solicitar Consulta' },
    { href: '/registro', text: 'Registro' },
    { href: '/login', text: 'Entrar' },
    { href: '/sobre-nos', text: 'Sobre nós' },
    { href: '/suporte', text: 'Suporte' }
  ];

  return (
    <div className="public-theme" style={{backgroundImage: `url(${fundoImage})`}}>
      <Header theme="public" links={headerLinks} />
      
      <main className="info-section">
        <div className="info-card" style={{textAlign: 'center'}}>
          <h1 className="info-title" style={{fontSize: '4rem', marginBottom: '1rem'}}>404</h1>
          <h2 style={{color: '#6366f1', marginBottom: '2rem'}}>Página não encontrada</h2>
          
          <p className="info-text" style={{textAlign: 'center', marginBottom: '2rem'}}>
            A página que você está procurando não existe ou foi movida.
          </p>
          
          <Link to="/" className="btn btn-primary btn-lg">
            Voltar ao Início
          </Link>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFound;