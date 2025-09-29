import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';
import { nutricionistasAPI } from './services/api';
import fundoImage from './fundo_index.png';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    crn: '',
    senha: ''
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const headerLinks = [
    { href: '/', text: 'Início' },
    { href: '/registro', text: 'Registro' },
    { href: '/login', text: 'Entrar' },
    { href: '/sobre-nos', text: 'Sobre nós' },
    { href: '/suporte', text: 'Suporte' }
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const { email, crn, senha } = formData;

    if (!email || !crn || !senha) {
      setMessage('Por favor, preencha todos os campos.');
      return;
    }

    try {
      const user = await nutricionistasAPI.login(email, crn, senha);
      
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        navigate('/nutri-dashboard');
      } else {
        setMessage('E-mail, CRN ou Senha incorretos, ou sua conta ainda não foi aprovada pelo administrador.');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setMessage('Erro ao conectar com o servidor. Verifique se o banco de dados está rodando.');
    }
  };

  return (
    <div className="public-theme" style={{backgroundImage: `url(${fundoImage})`}}>
      <Header theme="public" links={headerLinks} />
      
      <main className="form-section">
        <div className="form-container">
          <div className="form-card">
            <h2 className="form-title">Entrar</h2>
            <p className="form-subtitle">Acesse sua conta de nutricionista</p>
            
            <form className="form-body" onSubmit={handleSubmit}>
              {message && (
                <div className="form-message error">
                  {message}
                </div>
              )}
              
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="Digite seu e-mail"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">CRN</label>
                <input
                  type="text"
                  name="crn"
                  className="form-input"
                  placeholder="Digite seu CRN"
                  value={formData.crn}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Senha</label>
                <input
                  type="password"
                  name="senha"
                  className="form-input"
                  placeholder="Digite sua senha"
                  value={formData.senha}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-lg">Entrar</button>
              </div>
            </form>
            
            <div className="link-container">
              <p className="link-text">Não tem uma conta?</p>
              <Link to="/registro" className="link link-highlight">Registre-se aqui</Link>
              <p className="link-text" style={{marginTop: '1rem', marginBottom: '0.25rem'}}>Esqueceu sua senha?</p>
              <Link to="/recuperar-senha" className="link link-highlight">Recuperar senha</Link>
              <p className="link-text" style={{marginTop: '1rem', marginBottom: '0.25rem'}}>Acesso administrativo</p>
              <Link to="/admin-login" className="link link-highlight">Login Admin</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;