import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { nutricionistasAPI } from './services/api';
import fundoImage from './fundo_index.png';

const Register = () => {
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    email: '',
    crn: '',
    senha: '',
    confirmaSenha: ''
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const headerLinks = [
    { href: '/', text: 'Início' },
    { href: '/solicitar-consulta', text: 'Solicitar Consulta' },
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

    try {
      // Verificar se já existe
      const nutricionistas = await nutricionistasAPI.getAll();
      const exists = nutricionistas.some(n => n.email === email || n.crn === crn);
      
      if (exists) {
        setMessage('Já existe um nutricionista com este email ou CRN.');
        return;
      }

      await nutricionistasAPI.create({
        nome: nomeCompleto,
        email: email,
        crn: crn,
        senha: senha,
        status: 'pending',
        ativo: true,
        telefone: '',
        especialidade: ''
      });
      
      setMessage('Registro realizado com sucesso! Aguarde aprovação do administrador.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Erro no registro:', error);
      setMessage('Erro ao conectar com o servidor. Verifique se o banco de dados está rodando.');
    }
  };

  return (
    <div className="public-theme" style={{backgroundImage: `url(${fundoImage})`}}>
      <Header theme="public" links={headerLinks} />
      
      <main className="form-section">
        <div className="form-container">
          <div className="form-card">
            <h2 className="form-title">Registrar</h2>
            <p className="form-subtitle">Crie sua conta de nutricionista</p>
            
            <form className="form-body" onSubmit={handleSubmit}>
              {message && (
                <div className={`form-message ${message.includes('sucesso') ? 'success' : 'error'}`}>
                  {message}
                </div>
              )}
              
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input
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
              
              <div className="form-group">
                <label className="form-label">Confirmar Senha</label>
                <input
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
                <button type="submit" className="btn btn-primary btn-lg">Registrar</button>
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