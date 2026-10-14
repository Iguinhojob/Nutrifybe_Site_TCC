import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { nutricionistasAPI } from './services/api';
const fundoImage = '/images/fundo_index.png';

const Register = () => {
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    email: '',
    crn: '',
    senha: '',
    confirmaSenha: ''
  });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
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

    const { nomeCompleto, email, crn, senha, confirmaSenha } = formData;

    if (!nomeCompleto || !email || !crn || !senha || !confirmaSenha) {
      setMessage('Por favor, preencha todos os campos.');
      return;
    }

    if (senha.length < 6) {
      setMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (senha !== confirmaSenha) {
      setMessage('As senhas não coincidem.');
      return;
    }

    setSubmitting(true);
    try {
      // Verificar se já existe
      const nutricionistas = await nutricionistasAPI.getAll();
      const exists = nutricionistas.some(n => n.email === email || n.crn === crn);
      
      if (exists) {
        setMessage('Já existe um nutricionista com este e-mail ou CRN. Se a conta é sua, entre ou recupere a senha.');
        setSubmitting(false);
        return;
      }

      await nutricionistasAPI.create({
        nome: nomeCompleto,
        email: email,
        crn: crn,
        senha: senha,
        status: 'pending',
        ativo: 1,
        telefone: '',
        especialidade: ''
      });
      
      setMessage('Cadastro enviado com sucesso! Agora o administrador vai analisar seus dados. Você poderá entrar assim que a conta for aprovada. Redirecionando para o login…');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Erro no registro:', error);
      setMessage('Não foi possível falar com o servidor. Verifique sua conexão e tente novamente em instantes.');
      setSubmitting(false);
    }
  };

  return (
    <div className="public-theme">
      <Header theme="public" links={headerLinks} />
      
      <main className="form-section">
        <div className="form-container">
          <div className="form-card">
            <h2 className="form-title">Registrar</h2>
            <p className="form-subtitle">Crie sua conta de nutricionista</p>
            
            <form className="form-body" onSubmit={handleSubmit} noValidate>
              {message && (
                <div className={`form-message ${message.includes('sucesso') ? 'success' : 'error'}`} role={message.includes('sucesso') ? 'status' : 'alert'}>
                  {message}
                </div>
              )}
              
              <div className="form-group">
                <label className="form-label" htmlFor="reg-nome">Nome Completo</label>
                <input
                  id="reg-nome"
                  autoComplete="name"
                  type="text"
                  name="nomeCompleto"
                  className="form-input"
                  placeholder="Digite seu nome completo"
                  value={formData.nomeCompleto}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">E-mail</label>
                <input
                  id="reg-email"
                  autoComplete="email"
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
                <label className="form-label" htmlFor="reg-crn">CRN</label>
                <input
                  id="reg-crn"
                  autoComplete="off"
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
                <label className="form-label" htmlFor="reg-senha">Senha</label>
                <input
                  id="reg-senha"
                  autoComplete="new-password"
                  type="password"
                  name="senha"
                  className="form-input"
                  placeholder="Mínimo de 6 caracteres"
                  aria-describedby="reg-senha-dica"
                  value={formData.senha}
                  onChange={handleInputChange}
                  required
                />
                <small id="reg-senha-dica" style={{ display: 'block', marginTop: '0.35rem', opacity: 0.85 }}>Use pelo menos 6 caracteres.</small>
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="reg-conf">Confirmar Senha</label>
                <input
                  id="reg-conf"
                  autoComplete="new-password"
                  type="password"
                  name="confirmaSenha"
                  className="form-input"
                  placeholder="Confirme sua senha"
                  value={formData.confirmaSenha}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-lg" disabled={submitting} aria-busy={submitting}>{submitting ? 'Enviando…' : 'Registrar'}</button>
              </div>
            </form>
            
            <div className="link-container">
              <p className="link-text">Já tem uma conta?</p>
              <Link to="/login" className="link link-highlight">Entre aqui</Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Register;
