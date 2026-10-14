import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { nutricionistasAPI } from './services/api';
const fundoImage = '/images/fundo_index.png';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    crn: '',
    senha: ''
  });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('sessao') === 'expirada';

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

    setSubmitting(true);
    try {
      const user = await nutricionistasAPI.login(email.trim(), crn.trim(), senha);
      
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        navigate('/nutri-dashboard');
      } else {
        setMessage('E-mail, CRN ou senha incorretos. Confira os dados e tente novamente.');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      
      if (error.message === 'ACCOUNT_INACTIVE') {
        setMessage('Sua conta foi desativada pelo administrador. Fale com o suporte para reativá-la.');
      } else if (error.message === 'PENDING_APPROVAL') {
        setMessage('Seu cadastro ainda está em análise. Você poderá entrar assim que o administrador aprovar sua conta.');
      } else {
        setMessage('Não foi possível falar com o servidor. Verifique sua conexão e tente novamente em instantes.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="public-theme">
      <Header theme="public" links={headerLinks} />
      
      <main className="form-section">
        <div className="form-container">
          <div className="form-card">
            <h2 className="form-title">Entrar</h2>
            <p className="form-subtitle">Acesse sua conta de nutricionista</p>
            
            <form className="form-body" onSubmit={handleSubmit} noValidate>
              {sessionExpired && !message && (
                <div className="form-message error" role="status">
                  Sua sessão expirou. Entre novamente para continuar de onde parou.
                </div>
              )}
              {message && (
                <div className="form-message error" role="alert">
                  {message}
                </div>
              )}
              
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">E-mail</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  name="email"
                  className="form-input"
                  placeholder="Digite seu e-mail"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="login-crn">CRN</label>
                <input
                  id="login-crn"
                  type="text"
                  autoComplete="off"
                  name="crn"
                  className="form-input"
                  placeholder="Digite seu CRN"
                  value={formData.crn}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="login-senha">Senha</label>
                <input
                  id="login-senha"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  name="senha"
                  className="form-input"
                  placeholder="Digite sua senha"
                  value={formData.senha}
                  onChange={handleInputChange}
                  required
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
                  Mostrar senha
                </label>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-lg" disabled={submitting} aria-busy={submitting}>{submitting ? 'Entrando…' : 'Entrar'}</button>
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
      
      <Footer />
    </div>
  );
};

export default Login;
