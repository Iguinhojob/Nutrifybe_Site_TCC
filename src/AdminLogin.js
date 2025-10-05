import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';
import { adminAPI } from './services/api';
import fundoImage from './fundo_index.png';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const { email, password } = formData;

    if (!email || !password) {
      setMessage('Por favor, preencha todos os campos.');
      return;
    }

    try {
      const admin = await adminAPI.login(email, password);
      
      if (admin) {
        localStorage.setItem('currentAdmin', JSON.stringify(admin));
        setMessage('Login bem-sucedido! Redirecionando...');
        setTimeout(() => {
          navigate('/admin-dashboard');
        }, 1000);
      } else {
        setMessage('Email ou senha incorretos.');
      }
    } catch (error) {
      console.error('Erro no login admin:', error);
      setMessage('Erro ao conectar com o servidor. Verifique se o banco de dados está rodando.');
    }
  };

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
      
      <main className="form-section">
        <div className="form-container">
          <div className="form-card">
            <h2 className="form-title">Login Administrador</h2>
            <p className="form-subtitle">Acesso restrito ao sistema</p>
            
            <form className="form-body" onSubmit={handleSubmit}>
              {message && (
                <div className={`form-message ${message.includes('sucesso') || message.includes('bem-sucedido') ? 'success' : 'error'}`}>
                  {message}
                </div>
              )}
              
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="Digite o email do administrador"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Senha</label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  placeholder="Digite a senha"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-lg">Entrar</button>
              </div>
            </form>
            
            <div className="link-container">
              <p className="link-text">Voltar ao login normal</p>
              <Link to="/login" className="link link-highlight">Login Usuário</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;