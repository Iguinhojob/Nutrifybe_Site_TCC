import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import fundoImage from './fundo_index.png';

const RecuperarSenha = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const headerLinks = [
    { href: '/', text: 'Início' },
    { href: '/solicitar-consulta', text: 'Solicitar Consulta' },
    { href: '/registro', text: 'Registro' },
    { href: '/login', text: 'Entrar' },
    { href: '/sobre-nos', text: 'Sobre nós' },
    { href: '/suporte', text: 'Suporte' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setMessage('Por favor, digite seu e-mail.');
      return;
    }
    setMessage('Instruções de recuperação foram enviadas para seu e-mail.');
  };

  return (
    <div className="public-theme" style={{backgroundImage: `url(${fundoImage})`}}>
      <Header theme="public" links={headerLinks} />
      
      <main className="form-section">
        <div className="form-container">
          <div className="form-card">
            <h2 className="form-title">Recuperar Senha</h2>
            <p className="form-subtitle">Digite seu e-mail para receber instruções</p>
            
            <form className="form-body" onSubmit={handleSubmit}>
              {message && (
                <div className="form-message success">
                  {message}
                </div>
              )}
              
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Digite seu e-mail cadastrado"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-lg">Enviar</button>
              </div>
            </form>
            
            <div className="link-container">
              <p className="link-text">Lembrou da senha?</p>
              <Link to="/login" className="link link-highlight">Voltar ao login</Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default RecuperarSenha;