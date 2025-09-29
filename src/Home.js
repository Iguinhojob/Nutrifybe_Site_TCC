import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import fundoImage from './fundo_index.png';

const Home = () => {
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
      
      <main className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Seja Bem Vindo Ao 
              <span className="hero-brand">
                <span className="nutri-part">Nutri</span><span className="fybe-part">fybe</span>
              </span>
            </h1>
            <p className="hero-description">
              Este projeto vai além de um site: é uma solução inovadora voltada para nutricionistas, 
              que une tecnologia e cuidado humano. A plataforma oferece um ambiente moderno, seguro e 
              intuitivo para facilitar atendimentos, organizar rotinas e integrar o acompanhamento 
              nutricional a outras áreas da saúde. É um avanço no jeito de cuidar — mais prático, 
              eficaz e conectado.

              Este sistema foi criado especialmente para você, profissional da nutrição que busca 
              otimizar seu atendimento e acompanhar seus pacientes de forma prática e centralizada. 
              Ao se registrar, você terá acesso a uma área exclusiva, onde poderá enviar recomendações 
              personalizadas, acompanhar a evolução dos usuários e manter uma comunicação direta com 
              cada um deles. Sua atuação é essencial — e agora, mais facilitada do que nunca.
            </p>
            <div className="hero-actions">
              <Link to="/solicitar-consulta" className="btn btn-primary btn-lg">Solicitar Consulta</Link>
              <Link to="/registro" className="btn btn-secondary btn-lg">Sou Nutricionista</Link>
              <Link to="/login" className="btn btn-ghost btn-lg">Entrar</Link>
            </div>
          </div>
          <div className="hero-image">
            <img src="images/mascote.png" alt="Mascote Nutrifybe" />
          </div>
        </div>
        <div className="hero-decoration"></div>
        <div className="hero-decoration"></div>
      </main>
    </div>
  );
};

export default Home;