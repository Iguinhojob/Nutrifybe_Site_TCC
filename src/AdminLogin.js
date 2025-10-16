import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';
const fundoImage = '/images/fundo_index.png';

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

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('Por favor, insira um email válido.');
      return;
    }

    try {
      const response = await fetch('https://refactored-space-sniffle-x5pgw5gp6p5q26q49-8081.app.github.dev/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), senha: password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Sanitizar dados antes de armazenar
        const sanitizedUser = {
          id: data.user.id,
          nome: data.user.nome?.replace(/<[^>]*>/g, ''),
          email: data.user.email?.replace(/<[^>]*>/g, ''),
          type: 'admin'
        };
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentAdmin', JSON.stringify(sanitizedUser));
        setMessage('Login bem-sucedido! Redirecionando...');
        setTimeout(() => {
          navigate('/admin-dashboard');
        }, 1000);
      } else {
        setMessage(data.error || 'Email ou senha incorretos.');
      }
    } catch (error) {
      console.error('Erro no login admin:', error);
      setMessage('Erro ao conectar com o servidor.');
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
                  placeholder="Digite seu email"
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