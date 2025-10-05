import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Home = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const headerLinks = [
    { href: '/', text: 'Início' },
    { href: '/solicitar-consulta', text: 'Solicitar Consulta' },
    { href: '/registro', text: 'Registro' },
    { href: '/login', text: 'Entrar' },
    { href: '/sobre-nos', text: 'Sobre nós' },
    { href: '/suporte', text: 'Suporte' }
  ];

  return (
    <div className="public-theme">
      <style>{`
        .public-theme {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%);
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }
        
        .floating-particles {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 1;
        }
        
        .particle {
          position: absolute;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          animation: float 6s ease-in-out infinite;
        }
        
        .particle:nth-child(1) { width: 4px; height: 4px; left: 10%; animation-delay: 0s; }
        .particle:nth-child(2) { width: 6px; height: 6px; left: 20%; animation-delay: 1s; }
        .particle:nth-child(3) { width: 3px; height: 3px; left: 30%; animation-delay: 2s; }
        .particle:nth-child(4) { width: 5px; height: 5px; left: 40%; animation-delay: 3s; }
        .particle:nth-child(5) { width: 4px; height: 4px; left: 50%; animation-delay: 4s; }
        .particle:nth-child(6) { width: 6px; height: 6px; left: 60%; animation-delay: 5s; }
        .particle:nth-child(7) { width: 3px; height: 3px; left: 70%; animation-delay: 1.5s; }
        .particle:nth-child(8) { width: 5px; height: 5px; left: 80%; animation-delay: 2.5s; }
        .particle:nth-child(9) { width: 4px; height: 4px; left: 90%; animation-delay: 3.5s; }
        
        @keyframes float {
          0%, 100% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
        }
        
        .hero-title {
          background: linear-gradient(45deg, #fff, #e0e7ff, #fff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
          animation: glow 2s ease-in-out infinite alternate;
        }
        
        @keyframes glow {
          from { text-shadow: 0 0 20px rgba(255, 255, 255, 0.3); }
          to { text-shadow: 0 0 30px rgba(255, 255, 255, 0.5); }
        }
        
        .hero-description {
          max-width: 600px;
          margin: 0 auto 2rem;
        }
        
        .mascote-container {
          position: relative;
          animation: mascoteFloat 3s ease-in-out infinite;
        }
        
        .mascote-container::before {
          content: '';
          position: absolute;
          bottom: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 80%;
          height: 20px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          filter: blur(10px);
        }
        
        @keyframes mascoteFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .btn-enhanced {
          position: relative;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }
        
        .btn-enhanced:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        
        .btn-primary-enhanced {
          background: linear-gradient(45deg, #10b981, #059669);
          color: white;
        }
        
        .btn-primary-enhanced:hover {
          box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
        }
        
        .btn-secondary-enhanced {
          background: white;
          color: #667eea;
          border-color: white;
        }
        
        .btn-secondary-enhanced:hover {
          box-shadow: 0 10px 25px rgba(255, 255, 255, 0.3);
        }
        
        .btn-enhanced span {
          font-size: 1rem !important;
        }
        
        .navbar-scrolled {
          background: rgba(102, 126, 234, 0.95) !important;
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
        }
        
        .features-section {
          padding: 4rem 2rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          margin-top: 2rem;
        }
        
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .feature-card {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.3s ease;
        }
        
        .feature-card:hover {
          transform: translateY(-5px);
        }
        
        .feature-icon {
          font-size: 1.8rem;
          margin-bottom: 1rem;
          display: block;
        }
        
        .feature-title {
          color: white;
          font-size: 1.2rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        
        .feature-text {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.9rem;
        }
      `}</style>
      
      <div className="floating-particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
      
      <Header theme="public" links={headerLinks} className={scrolled ? 'navbar-scrolled' : ''} />
      
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
              Uma solução inovadora que une tecnologia e cuidado humano. Nossa plataforma oferece 
              um ambiente moderno, seguro e intuitivo para facilitar atendimentos nutricionais, 
              organizar rotinas e integrar o acompanhamento à outras áreas da saúde.
            </p>
            <div className="hero-actions">
              <Link to="/solicitar-consulta" className="btn btn-enhanced btn-primary-enhanced btn-lg">
                <span style={{fontSize: '1rem', marginRight: '0.5rem'}}>📋</span> Solicitar Consulta
              </Link>
              <Link to="/registro" className="btn btn-enhanced btn-secondary-enhanced btn-lg">
                🧑‍⚕️ Sou Nutricionista
              </Link>
              <Link to="/login" className="btn btn-enhanced btn-secondary-enhanced btn-lg">
                <span style={{fontSize: '1rem', marginRight: '0.5rem'}}>🔑</span> Entrar
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <div className="mascote-container">
              <img src="images/mascote.png" alt="Mascote Nutrifybe" />
            </div>
          </div>
        </div>
      </main>
      
      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">🏥</span>
            <h3 className="feature-title">Para Pacientes</h3>
            <p className="feature-text">Solicite consultas, escolha seu nutricionista e receba acompanhamento personalizado</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">👩⚕️</span>
            <h3 className="feature-title">Para Nutricionistas</h3>
            <p className="feature-text">Gerencie pacientes, crie prescrições e acompanhe evoluções de forma prática</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📈</span>
            <h3 className="feature-title">Relatórios e Analytics</h3>
            <p className="feature-text">Acompanhe métricas, gere relatórios detalhados e analise o progresso dos pacientes</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🔒</span>
            <h3 className="feature-title">Seguro e Confiável</h3>
            <p className="feature-text">Dados protegidos com tecnologia avançada e total privacidade para todos</p>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Home;