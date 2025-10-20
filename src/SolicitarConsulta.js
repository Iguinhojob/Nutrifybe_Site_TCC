import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { solicitacoesAPI, nutricionistasAPI } from './services/api';
const fundoImage = '/images/fundo_index.png';

const SolicitarConsulta = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    idade: '',
    peso: '',
    altura: '',
    objetivo: '',
    condicaoSaude: '',
    nutricionistaId: ''
  });
  const [nutricionistas, setNutricionistas] = useState([]);
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

  useEffect(() => {
    const loadNutricionistas = async () => {
      try {
        const nutris = await nutricionistasAPI.getAll();
        // Filtrar nutricionistas aprovados e ativos (compatibilidade com diferentes formatos)
        const aprovados = nutris.filter(n => 
          (n.status === 'approved' || n.Status === 'approved') && 
          (n.ativo === 1 || n.ativo === true || n.Ativo === 1 || n.Ativo === true)
        );
        setNutricionistas(aprovados);
        console.log('Nutricionistas carregados:', aprovados);
      } catch (error) {
        console.error('Erro ao carregar nutricionistas:', error);
        setMessage('Erro ao carregar lista de nutricionistas.');
      }
    };
    
    loadNutricionistas();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const { nome, email, idade, peso, altura, objetivo, condicaoSaude, nutricionistaId } = formData;

    if (!nome || !email || !idade || !peso || !altura || !objetivo || !condicaoSaude || !nutricionistaId) {
      setMessage('Por favor, preencha todos os campos.');
      return;
    }

    // Validações adicionais
    if (parseInt(idade) < 1 || parseInt(idade) > 120) {
      setMessage('Por favor, insira uma idade válida.');
      return;
    }

    if (parseFloat(peso) <= 0 || parseFloat(peso) > 500) {
      setMessage('Por favor, insira um peso válido.');
      return;
    }

    if (parseFloat(altura) <= 0 || parseFloat(altura) > 300) {
      setMessage('Por favor, insira uma altura válida em centímetros.');
      return;
    }

    try {
      console.log('Enviando solicitação:', {
        nome,
        email,
        idade: parseInt(idade),
        peso: parseFloat(peso),
        altura: parseFloat(altura),
        objetivo,
        condicaoSaude,
        nutricionistaId: parseInt(nutricionistaId)
      });

      const response = await solicitacoesAPI.create({
        nome,
        email,
        idade: parseInt(idade),
        peso: parseFloat(peso),
        altura: parseFloat(altura),
        objetivo,
        condicaoSaude,
        nutricionistaId: parseInt(nutricionistaId),
        status: 'pending'
      });

      console.log('Resposta da API:', response);
      setMessage('Solicitação enviada com sucesso! O nutricionista entrará em contato em breve.');
      
      setFormData({
        nome: '',
        email: '',
        idade: '',
        peso: '',
        altura: '',
        objetivo: '',
        condicaoSaude: '',
        nutricionistaId: ''
      });

      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error('Erro detalhado ao enviar solicitação:', error);
      setMessage(`Erro ao enviar solicitação: ${error.message}. Verifique se a API está rodando.`);
    }
  };

  return (
    <div className="public-theme" style={{backgroundImage: `url(${fundoImage})`}}>
      <Header theme="public" links={headerLinks} />
      
      <main className="form-section">
        <div className="form-container">
          <div className="form-card">
            <h2 className="form-title">Solicitar Consulta</h2>
            <p className="form-subtitle">Preencha seus dados para solicitar uma consulta nutricional</p>
            
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
                  name="nome"
                  className="form-input"
                  placeholder="Digite seu nome completo"
                  value={formData.nome}
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
                <label className="form-label">Idade</label>
                <input
                  type="number"
                  name="idade"
                  className="form-input"
                  placeholder="Digite sua idade"
                  value={formData.idade}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  name="peso"
                  className="form-input"
                  placeholder="Digite seu peso"
                  value={formData.peso}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Altura (cm)</label>
                <input
                  type="number"
                  name="altura"
                  className="form-input"
                  placeholder="Digite sua altura"
                  value={formData.altura}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Objetivo</label>
                <select
                  name="objetivo"
                  className="form-input"
                  value={formData.objetivo}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Selecione seu objetivo</option>
                  <option value="Perder peso">Perder peso</option>
                  <option value="Ganhar peso">Ganhar peso</option>
                  <option value="Manter peso">Manter peso</option>
                  <option value="Ganhar massa muscular">Ganhar massa muscular</option>
                  <option value="Melhorar saúde">Melhorar saúde</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Condição de saúde ou restrição alimentar</label>
                <textarea
                  name="condicaoSaude"
                  className="form-input"
                  placeholder="Descreva alguma condição de saúde ou restrição alimentar (ou digite 'Nenhuma')"
                  value={formData.condicaoSaude}
                  onChange={handleInputChange}
                  rows="3"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Escolha um Nutricionista</label>
                <select
                  name="nutricionistaId"
                  className="form-input"
                  value={formData.nutricionistaId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Selecione um nutricionista</option>
                  {nutricionistas.map(nutri => (
                    <option key={nutri.id || nutri.Id} value={nutri.id || nutri.Id}>
                      {nutri.nome || nutri.Nome} - CRN: {nutri.crn || nutri.CRN}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-lg">Enviar Solicitação</button>
              </div>
            </form>
            
            <div className="link-container">
              <p className="link-text">Já é nutricionista?</p>
              <Link to="/login" className="link link-highlight">Faça login aqui</Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SolicitarConsulta;