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
          background-color: #f0f4ff;
          background-image:
            radial-gradient(ellipse at 10% 20%, rgba(99,102,241,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 90% 80%, rgba(6,182,212,0.07) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(167,139,250,0.05) 0%, transparent 60%);
          font-family: 'Inter', 'Poppins', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* ── HEADER OVERRIDE ── */
        .home-wrapper header {
          background: rgba(255,255,255,0.85) !important;
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(99,102,241,0.1);
          box-shadow: 0 2px 20px rgba(99,102,241,0.08);
        }

        .home-wrapper .logo {
          display: none !important;
        }

        .home-wrapper nav ul li a {
          color: #3730a3 !important;
          font-weight: 500;
          font-size: 0.95rem;
          text-shadow: none !important;
          padding: 0.5rem 0.9rem;
          border-radius: 8px;
          transition: background 0.2s, color 0.2s;
        }

        .home-wrapper nav ul li a:hover,
        .home-wrapper nav ul li a.active {
          background: rgba(99,102,241,0.1) !important;
          color: #4338ca !important;
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
          font-family: 'Inter', 'Poppins', sans-serif;
          font-size: clamp(2.2rem, 4vw, 3.6rem);
          font-weight: 800;
          color: #1a1a2e;
          line-height: 1.1;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .home-hero-title .brand-name {
          display: block;
          background: linear-gradient(135deg, #6366f1, #22d3ee, #a78bfa);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: titleGradient 4s ease-in-out infinite;
        }

        @keyframes titleGradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .home-hero-desc {
          font-size: 1.05rem;
          color: #4b5563;
          line-height: 1.8;
          max-width: 480px;
          margin: 0;
        }

        .home-hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(167,139,250,0.1));
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 999px;
          padding: 0.35rem 0.9rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: #4338ca;
          letter-spacing: 0.03em;
          width: fit-content;
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
          background: linear-gradient(135deg, #6366f1, #818cf8);
          color: #fff;
          box-shadow: 0 4px 18px rgba(99,102,241,0.4);
        }

        .hbtn-consult:hover {
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          box-shadow: 0 8px 28px rgba(99,102,241,0.55);
          transform: translateY(-3px);
        }

        .hbtn-nutri {
          background: linear-gradient(135deg, #0891b2, #06b6d4);
          color: #fff;
          box-shadow: 0 4px 18px rgba(6,182,212,0.35);
        }

        .hbtn-nutri:hover {
          background: linear-gradient(135deg, #0e7490, #0891b2);
          box-shadow: 0 8px 28px rgba(6,182,212,0.5);
          transform: translateY(-3px);
        }

        .hbtn-login {
          background: rgba(255,255,255,0.8);
          color: #3730a3;
          border: 1.5px solid rgba(99,102,241,0.25);
          box-shadow: 0 2px 8px rgba(99,102,241,0.08);
          backdrop-filter: blur(10px);
        }

        .hbtn-login:hover {
          border-color: rgba(99,102,241,0.5);
          box-shadow: 0 6px 20px rgba(99,102,241,0.15);
          transform: translateY(-2px);
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
          width: 440px;
          height: 440px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(167,139,250,0.06) 50%, transparent 100%);
          z-index: 0;
          animation: pulseCircle 4s ease-in-out infinite;
        }

        @keyframes pulseCircle {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.06); opacity: 1; }
        }

        .mascote-img {
          position: relative;
          z-index: 1;
          max-width: 380px;
          width: 100%;
          animation: mascoteFloat 4s ease-in-out infinite;
          filter: drop-shadow(0 20px 40px rgba(99,102,241,0.2)) drop-shadow(0 0 60px rgba(167,139,250,0.15));
        }

        @keyframes mascoteFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }

        /* floating decorative elements */
        .float-badge {
          position: absolute;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 14px;
          padding: 0.6rem 1rem;
          box-shadow: 0 8px 24px rgba(99,102,241,0.12);
          font-size: 0.85rem;
          font-weight: 600;
          color: #3730a3;
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
          border: 1.5px solid rgba(99,102,241,0.18);
          border-radius: 50%;
          z-index: 0;
        }

        .arc-1 {
          width: 200px;
          height: 200px;
          top: 5%;
          left: 5%;
          border-style: dashed;
          border-color: rgba(99,102,241,0.2);
          animation: arcSpin 22s linear infinite;
        }

        .arc-2 {
          width: 110px;
          height: 110px;
          bottom: 10%;
          right: 8%;
          border-color: rgba(6,182,212,0.25);
          animation: arcSpin 16s linear infinite reverse;
        }

        .arc-3 {
          width: 60px;
          height: 60px;
          top: 30%;
          left: 15%;
          border-color: rgba(167,139,250,0.3);
          animation: arcSpin 10s linear infinite;
        }

        @keyframes arcSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ── FEATURES STRIP ── */
        .home-features {
          background: linear-gradient(180deg, #fff 0%, #f0f4ff 100%);
          border-top: 1px solid rgba(99,102,241,0.08);
          padding: 4rem 3rem;
          position: relative;
        }

        .home-features-title {
          text-align: center;
          font-size: 1.6rem;
          font-weight: 800;
          color: #1a1a2e;
          margin-bottom: 2.5rem;
          letter-spacing: -0.02em;
        }

        .home-features-title span {
          background: linear-gradient(135deg, #6366f1, #22d3ee);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .home-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          max-width: 1100px;
          margin: 0 auto;
        }

        .home-feature-card {
          background: rgba(255,255,255,0.9);
          border-radius: 20px;
          padding: 2rem 1.5rem;
          text-align: center;
          border: 1px solid rgba(99,102,241,0.1);
          backdrop-filter: blur(10px);
          transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
          position: relative;
          overflow: hidden;
        }

        .home-feature-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #6366f1, #22d3ee, #a78bfa);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .home-feature-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 40px rgba(99,102,241,0.15);
          border-color: rgba(99,102,241,0.25);
        }

        .home-feature-card:hover::before {
          opacity: 1;
        }

        .home-feature-icon {
          font-size: 2.4rem;
          margin-bottom: 1rem;
          display: block;
        }

        .home-feature-title {
          font-size: 1rem;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 0.5rem;
        }

        .home-feature-text {
          font-size: 0.875rem;
          color: #6b7280;
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

        /* ── DARK MODE ── */
        body.dark-mode .home-wrapper {
          background-color: #0F1012 !important;
          background-image:
            radial-gradient(ellipse at 10% 20%, rgba(124,58,237,0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 90% 80%, rgba(76,29,149,0.08) 0%, transparent 50%) !important;
        }

        body.dark-mode .home-wrapper header {
          background: linear-gradient(135deg, #4C1D95, #7C3AED) !important;
          border-bottom: 1px solid rgba(124,58,237,0.3) !important;
          box-shadow: 0 2px 20px rgba(124,58,237,0.4) !important;
        }

        body.dark-mode .home-wrapper nav ul li a {
          color: #F1F1F3 !important;
          text-shadow: none !important;
        }

        body.dark-mode .home-wrapper nav ul li a:hover,
        body.dark-mode .home-wrapper nav ul li a.active {
          background: rgba(167,139,250,0.2) !important;
          color: #C4B5FD !important;
        }

        body.dark-mode .home-hero-title {
          color: #F1F1F3 !important;
        }

        body.dark-mode .home-hero-title .brand-name {
          background: linear-gradient(135deg, #A78BFA, #22d3ee, #C4B5FD) !important;
          background-size: 200% 200% !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
          animation: titleGradient 4s ease-in-out infinite !important;
        }

        body.dark-mode .home-hero-desc {
          color: #9B9DA5 !important;
        }

        body.dark-mode .home-hero-tag {
          background: rgba(124,58,237,0.15) !important;
          border-color: rgba(167,139,250,0.3) !important;
          color: #C4B5FD !important;
        }

        body.dark-mode .hbtn-consult {
          background: linear-gradient(135deg, #7C3AED, #A78BFA) !important;
          box-shadow: 0 4px 18px rgba(124,58,237,0.5) !important;
        }

        body.dark-mode .hbtn-consult:hover {
          background: linear-gradient(135deg, #6D28D9, #8B5CF6) !important;
          box-shadow: 0 8px 28px rgba(124,58,237,0.65) !important;
        }

        body.dark-mode .hbtn-nutri {
          background: linear-gradient(135deg, #4C1D95, #6D28D9) !important;
          box-shadow: 0 4px 18px rgba(76,29,149,0.5) !important;
        }

        body.dark-mode .hbtn-nutri:hover {
          background: linear-gradient(135deg, #3B0764, #4C1D95) !important;
          box-shadow: 0 8px 28px rgba(76,29,149,0.65) !important;
        }

        body.dark-mode .hbtn-login {
          background: rgba(32,34,40,0.9) !important;
          color: #F1F1F3 !important;
          border-color: rgba(167,139,250,0.2) !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
        }

        body.dark-mode .hbtn-login:hover {
          border-color: rgba(167,139,250,0.5) !important;
          box-shadow: 0 6px 20px rgba(124,58,237,0.25) !important;
        }

        body.dark-mode .float-badge {
          background: rgba(24,26,29,0.9) !important;
          border-color: rgba(167,139,250,0.2) !important;
          color: #C4B5FD !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important;
        }

        body.dark-mode .mascote-bg-circle {
          background: radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(76,29,149,0.08) 50%, transparent 100%) !important;
        }

        body.dark-mode .mascote-img {
          filter: drop-shadow(0 20px 40px rgba(124,58,237,0.35)) drop-shadow(0 0 80px rgba(167,139,250,0.2)) !important;
        }

        body.dark-mode .arc-decoration {
          border-color: rgba(167,139,250,0.15) !important;
        }

        body.dark-mode .arc-2 {
          border-color: rgba(34,211,238,0.15) !important;
        }

        body.dark-mode .arc-3 {
          border-color: rgba(196,181,253,0.2) !important;
        }

        body.dark-mode .home-features {
          background: linear-gradient(180deg, #0F1012 0%, #111318 100%) !important;
          border-top: 1px solid #2A2D32 !important;
        }

        body.dark-mode .home-features-title {
          color: #F1F1F3 !important;
        }

        body.dark-mode .home-feature-card {
          background: #181A1D !important;
          border-color: #2A2D32 !important;
        }

        body.dark-mode .home-feature-card:hover {
          background: #202228 !important;
          box-shadow: 0 16px 40px rgba(124,58,237,0.2) !important;
          border-color: rgba(167,139,250,0.3) !important;
        }

        body.dark-mode .home-feature-title {
          color: #F1F1F3 !important;
        }

        body.dark-mode .home-feature-text {
          color: #9B9DA5 !important;
        }
      `}</style>

      <Header theme="public" links={headerLinks} />

      <main className="home-hero">
        {/* LEFT */}
        <div className="home-hero-left">
          <div className="home-hero-tag">✨ Plataforma Nutricional Inteligente</div>
          <h1 className="home-hero-title">
            Seja Bem Vindo Ao{' '}
            <span className="brand-name">NutriFybe</span>
          </h1>
          <p className="home-hero-desc">
            Uma solução inovadora que une tecnologia e cuidado humano. Nossa plataforma oferece
            um ambiente moderno, seguro e intuitivo para facilitar atendimentos nutricionais,
            organizar rotinas e integrar o acompanhamento à outras áreas da saúde.
          </p>
          <div className="home-hero-buttons">
            <Link to="/solicitar-consulta" className="hbtn hbtn-consult">
              Solicitar Consulta
            </Link>
            <Link to="/registro" className="hbtn hbtn-nutri">
              Sou Nutricionista
            </Link>
            <Link to="/login" className="hbtn hbtn-login">
              Entrar
            </Link>
          </div>
        </div>

        {/* RIGHT */}
        <div className="home-hero-right">
          <div className="arc-decoration arc-1"></div>
          <div className="arc-decoration arc-2"></div>
          <div className="arc-decoration arc-3"></div>
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
        <h2 className="home-features-title">Tudo que você precisa em <span>um só lugar</span></h2>
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
