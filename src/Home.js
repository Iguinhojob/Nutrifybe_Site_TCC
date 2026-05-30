import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

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
    <div className="home-wrapper">
      <style>{`
        .home-wrapper {
          min-height: 100vh;
          background-color: #f7f6f2;
          background-image:
            repeating-linear-gradient(
              120deg,
              rgba(180, 170, 140, 0.07) 0px,
              rgba(180, 170, 140, 0.07) 1px,
              transparent 1px,
              transparent 60px
            ),
            repeating-linear-gradient(
              60deg,
              rgba(180, 170, 140, 0.05) 0px,
              rgba(180, 170, 140, 0.05) 1px,
              transparent 1px,
              transparent 60px
            );
          font-family: 'Inter', 'Poppins', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* ── HEADER OVERRIDE ── */
        .home-wrapper header {
          background: rgba(247, 246, 242, 0.92) !important;
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(0,0,0,0.07);
          box-shadow: 0 1px 12px rgba(0,0,0,0.06);
        }

        .home-wrapper .logo {
          display: none !important;
        }

        .home-wrapper nav ul li a {
          color: #1a1a1a !important;
          font-weight: 500;
          font-size: 0.95rem;
          text-shadow: none !important;
          padding: 0.5rem 0.9rem;
          border-radius: 8px;
          transition: background 0.2s, color 0.2s;
        }

        .home-wrapper nav ul li a:hover,
        .home-wrapper nav ul li a.active {
          background: rgba(45, 122, 79, 0.1) !important;
          color: #2d7a4f !important;
          transform: none;
          box-shadow: none;
        }

        /* ── HERO ── */
        .home-hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 3rem;
          max-width: 1200px;
          margin: 0 auto;
          padding: 5rem 3rem 4rem;
          min-height: calc(100vh - 72px);
        }

        .home-hero-left {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .home-hero-title {
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: clamp(2.2rem, 4vw, 3.4rem);
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1.15;
          margin: 0;
        }

        .home-hero-title .brand-name .nutri-part {
          color: #22d3ee;
        }

        .home-hero-title .brand-name .fybe-part {
          color: #c4b5fd;
        }

        .home-hero-desc {
          font-size: 1.05rem;
          color: #4a4a4a;
          line-height: 1.75;
          max-width: 480px;
          margin: 0;
        }

        .home-hero-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          margin-top: 0.5rem;
          max-width: 320px;
        }

        .hbtn {
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.9rem 1.6rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          font-family: 'Inter', sans-serif;
        }

        .hbtn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        }

        .hbtn-consult {
          background: #3eb575;
          color: #fff;
          box-shadow: 0 4px 14px rgba(62, 181, 117, 0.35);
        }

        .hbtn-consult:hover {
          background: #2d9e62;
          box-shadow: 0 8px 22px rgba(62, 181, 117, 0.45);
        }

        .hbtn-nutri {
          background: #1e5c38;
          color: #fff;
          box-shadow: 0 4px 14px rgba(30, 92, 56, 0.3);
        }

        .hbtn-nutri:hover {
          background: #174d2f;
          box-shadow: 0 8px 22px rgba(30, 92, 56, 0.4);
        }

        .hbtn-login {
          background: #fff;
          color: #1a1a1a;
          border: 1.5px solid #d0d0d0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .hbtn-login:hover {
          border-color: #aaa;
          box-shadow: 0 6px 18px rgba(0,0,0,0.1);
        }

        .hbtn-icon {
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        /* ── RIGHT COLUMN ── */
        .home-hero-right {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mascote-bg-circle {
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(62,181,117,0.12) 0%, rgba(62,181,117,0.03) 70%, transparent 100%);
          z-index: 0;
        }

        .mascote-img {
          position: relative;
          z-index: 1;
          max-width: 380px;
          width: 100%;
          animation: mascoteFloat 4s ease-in-out infinite;
          filter: drop-shadow(0 20px 40px rgba(0,0,0,0.12));
        }

        @keyframes mascoteFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }

        /* floating decorative elements */
        .float-badge {
          position: absolute;
          background: #fff;
          border-radius: 14px;
          padding: 0.6rem 1rem;
          box-shadow: 0 6px 20px rgba(0,0,0,0.1);
          font-size: 0.85rem;
          font-weight: 600;
          color: #1a1a1a;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          z-index: 2;
          animation: badgeFloat 5s ease-in-out infinite;
        }

        .float-badge-1 {
          top: 12%;
          right: 2%;
          animation-delay: 0s;
        }

        .float-badge-2 {
          bottom: 18%;
          left: 2%;
          animation-delay: 1.5s;
        }

        .float-badge-3 {
          top: 55%;
          right: 0%;
          animation-delay: 0.8s;
        }

        @keyframes badgeFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        .arc-decoration {
          position: absolute;
          border: 2px solid rgba(138, 100, 200, 0.2);
          border-radius: 50%;
          z-index: 0;
        }

        .arc-1 {
          width: 180px;
          height: 180px;
          top: 5%;
          left: 5%;
          border-style: dashed;
          animation: arcSpin 20s linear infinite;
        }

        .arc-2 {
          width: 100px;
          height: 100px;
          bottom: 10%;
          right: 8%;
          border-color: rgba(62, 181, 117, 0.25);
          animation: arcSpin 15s linear infinite reverse;
        }

        @keyframes arcSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ── FEATURES STRIP ── */
        .home-features {
          background: #fff;
          border-top: 1px solid rgba(0,0,0,0.06);
          padding: 3.5rem 3rem;
        }

        .home-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .home-feature-card {
          background: rgba(180, 230, 195, 0.18);
          border-radius: 16px;
          padding: 1.75rem;
          text-align: center;
          border: 1px solid rgba(62, 181, 117, 0.2);
          backdrop-filter: blur(8px);
          transition: transform 0.25s, box-shadow 0.25s, background 0.25s;
        }

        .home-feature-card:hover {
          transform: translateY(-4px);
          background: rgba(180, 230, 195, 0.28);
          box-shadow: 0 10px 28px rgba(62, 181, 117, 0.12);
        }

        .home-feature-icon {
          font-size: 2.2rem;
          margin-bottom: 0.75rem;
          display: block;
        }

        .home-feature-title {
          font-size: 1rem;
          font-weight: 700;
          color: #1a4a2e;
          margin-bottom: 0.4rem;
        }

        .home-feature-text {
          font-size: 0.875rem;
          color: #3a5a45;
          line-height: 1.6;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .home-hero {
            grid-template-columns: 1fr;
            padding: 3rem 1.5rem;
            text-align: center;
            min-height: auto;
            gap: 2rem;
          }
          .home-hero-desc { max-width: 100%; margin: 0 auto; }
          .home-hero-buttons { max-width: 100%; align-items: center; }
          .home-hero-right { order: -1; }
          .mascote-img { max-width: 260px; }
          .mascote-bg-circle { width: 280px; height: 280px; }
          .float-badge { display: none; }
        }

        @media (max-width: 600px) {
          .home-features { padding: 2.5rem 1rem; }
          .home-hero { padding: 2rem 1rem; }
        }
      `}</style>

      <Header theme="public" links={headerLinks} />

      <main className="home-hero">
        {/* LEFT */}
        <div className="home-hero-left">
          <h1 className="home-hero-title">
            Seja Bem Vindo Ao{' '}
            <span className="brand-name">
              <span className="nutri-part">Nutri</span><span className="fybe-part">fybe</span>
            </span>
          </h1>
          <p className="home-hero-desc">
            Uma solução inovadora que une tecnologia e cuidado humano. Nossa plataforma oferece
            um ambiente moderno, seguro e intuitivo para facilitar atendimentos nutricionais,
            organizar rotinas e integrar o acompanhamento à outras áreas da saúde.
          </p>
          <div className="home-hero-buttons">
            <Link to="/solicitar-consulta" className="hbtn hbtn-consult">
              <span className="hbtn-icon">📅</span> Solicitar Consulta
            </Link>
            <Link to="/registro" className="hbtn hbtn-nutri">
              <span className="hbtn-icon">🩺</span> Sou Nutricionista
            </Link>
            <Link to="/login" className="hbtn hbtn-login">
              <span className="hbtn-icon">🔑</span> Entrar
            </Link>
          </div>
        </div>

        {/* RIGHT */}
        <div className="home-hero-right">
          <div className="arc-decoration arc-1"></div>
          <div className="arc-decoration arc-2"></div>
          <div className="mascote-bg-circle"></div>

          <img
            src="images/mascote.png"
            alt="Mascote Nutrifybe"
            className="mascote-img"
          />

          <div className="float-badge float-badge-1">
            <span>👤</span> Nutricionista
          </div>
          <div className="float-badge float-badge-2">
            <span>💧</span> Hidratação
          </div>
          <div className="float-badge float-badge-3">
            <span>📊</span> Progresso
          </div>
        </div>
      </main>

      <section className="home-features">
        <div className="home-features-grid">
          <div className="home-feature-card">
            <span className="home-feature-icon">🏥</span>
            <div className="home-feature-title">Para Pacientes</div>
            <p className="home-feature-text">Solicite consultas e receba acompanhamento personalizado</p>
          </div>
          <div className="home-feature-card">
            <span className="home-feature-icon">👩‍⚕️</span>
            <div className="home-feature-title">Para Nutricionistas</div>
            <p className="home-feature-text">Gerencie pacientes e crie prescrições de forma prática</p>
          </div>
          <div className="home-feature-card">
            <span className="home-feature-icon">📈</span>
            <div className="home-feature-title">Relatórios</div>
            <p className="home-feature-text">Acompanhe métricas e analise o progresso dos pacientes</p>
          </div>
          <div className="home-feature-card">
            <span className="home-feature-icon">🔒</span>
            <div className="home-feature-title">Seguro e Confiável</div>
            <p className="home-feature-text">Dados protegidos com tecnologia avançada e privacidade total</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
