import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from './Header';
import { pacientesAPI } from './services/api';

const FichaPaciente = () => {
  const { id } = useParams();
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);

  const headerLinks = [
    { href: '/nutri-dashboard', text: 'Dashboard' },
    { href: '/nutri-solicitacoes', text: 'Solicitações' },
    { href: '/', text: 'Sair', onClick: () => localStorage.removeItem('currentUser') }
  ];

  useEffect(() => {
    const loadPaciente = async () => {
      try {
        // Primeiro tenta buscar por ID específico
        let data;
        try {
          data = await pacientesAPI.getById(id);
        } catch {
          // Se falhar, busca todos e filtra pelo ID
          const allPacientes = await pacientesAPI.getAll();
          data = allPacientes.find(p => (p.Id || p.id) === parseInt(id));
        }
        
        setPaciente(data);
      } catch (error) {
        console.error('Erro ao carregar paciente:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPaciente();
  }, [id]);

  if (loading) {
    return (
      <div className="nutri-theme">
        <Header theme="nutri" links={headerLinks} />
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="nutri-theme">
        <Header theme="nutri" links={headerLinks} />
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
          <p>Paciente não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nutri-theme">
      <Header theme="nutri" links={headerLinks} />
      
      <main className="nutri-dashboard">
        <div className="nutri-card">
          <Link to="/nutri-dashboard" className="back-arrow">
            <i className="fas fa-arrow-left"></i>
          </Link>
          
          <div style={{textAlign: 'center', marginBottom: '2rem'}}>
            <div style={{fontSize: '4rem', color: '#06b6d4', marginBottom: '1rem'}}>👤</div>
            <h1 style={{color: '#374151', marginBottom: '0.5rem'}}>{paciente.Nome || paciente.nome}</h1>
            <p style={{color: '#6b7280'}}>{paciente.Email || paciente.email}</p>
          </div>

          <div style={{
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: '#f8fafc',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{color: '#06b6d4', marginBottom: '1rem'}}>Dados Pessoais</h3>
              <p><strong>Idade:</strong> {paciente.Idade || paciente.idade} anos</p>
              <p><strong>Peso:</strong> {paciente.Peso || paciente.peso} kg</p>
              <p><strong>Altura:</strong> {((paciente.Altura || paciente.altura) / 100).toFixed(2)} m</p>
              <p><strong>IMC:</strong> {((paciente.Peso || paciente.peso) / Math.pow((paciente.Altura || paciente.altura) / 100, 2)).toFixed(1)}</p>
            </div>

            <div style={{
              background: '#f8fafc',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{color: '#06b6d4', marginBottom: '1rem'}}>Objetivos</h3>
              <p><strong>Objetivo:</strong> {paciente.Objetivo || paciente.objetivo}</p>
              <p><strong>Condição de Saúde:</strong> {paciente.CondicaoSaude || paciente.condicaoSaude}</p>
            </div>
          </div>

          <div style={{
            background: '#fef3c7',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #fbbf24',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <h3 style={{color: '#92400e', marginBottom: '1rem'}}>📱 Funcionalidade em Desenvolvimento</h3>
            <p style={{color: '#92400e', marginBottom: '1rem'}}>
              A ficha completa do paciente estará disponível no aplicativo móvel em breve.
            </p>
            <p style={{color: '#92400e', fontSize: '0.9rem'}}>
              Por enquanto, você pode acessar as informações básicas e criar prescrições.
            </p>
          </div>

          <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
            <Link 
              to={`/nutri-prescricao/${paciente.Id || paciente.id}`}
              className="btn btn-primary btn-lg"
            >
              <span style={{fontSize: '1rem', marginRight: '0.5rem'}}>📝</span> Criar Prescrição
            </Link>
            <Link 
              to={`/nutri-calendario/${paciente.Id || paciente.id}`}
              className="btn btn-secondary btn-lg"
            >
              <span style={{fontSize: '1rem', marginRight: '0.5rem'}}>📅</span> Ver Calendário
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FichaPaciente;