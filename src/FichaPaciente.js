import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from './Header';
import { pacientesAPI } from './services/api';

const FichaPaciente = () => {
  const { id } = useParams();
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const isDark = document.body.classList.contains('dark-mode');
  const dm = {
    card:   isDark ? '#1e2d24' : '#f8fafc',
    border: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
    text:   isDark ? '#e0e0e0' : '#374151',
    text2:  isDark ? '#aaa'    : '#6b7280',
    warn:   isDark ? '#2d2010' : '#fef3c7',
    warnBorder: isDark ? '#5a4010' : '#fbbf24',
    warnText:   isDark ? '#fcd34d' : '#92400e',
  };




  const headerLinks = [
    { href: '/nutri-dashboard', text: 'Dashboard' },
    { href: '/nutri-solicitacoes', text: 'Solicitações' },
    { href: '/', text: 'Sair', onClick: () => localStorage.removeItem('currentUser') }
  ];

  useEffect(() => {
    const loadPaciente = async () => {
      try {
        // Busca todos os pacientes e filtra pelo ID
        const allPacientes = await pacientesAPI.getAll();
        console.log('=== DEBUG FICHA PACIENTE ===');
        console.log('Todos os pacientes:', allPacientes);
        console.log('ID buscado da URL:', id, 'tipo:', typeof id);
        
        const data = allPacientes.find(p => {
          const pacienteId = p.Id || p.id;
          console.log('Paciente:', p.nome, 'ID:', pacienteId, 'tipo:', typeof pacienteId);
          console.log('Comparando:', pacienteId, '===', id, '?', String(pacienteId) === String(id));
          return String(pacienteId) === String(id);
        });
        
        // Garantir que todos os pacientes tenham calendário
        if (data) {
          if (!data.calendario) {
            data.calendario = {};
          }
        }
        
        console.log('Resultado da busca:', data);
        console.log('=== FIM DEBUG ===');
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
        <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
          <p>Paciente não encontrado</p>
          <p style={{fontSize: '0.9rem', color: '#666'}}>ID buscado: {id}</p>
          <p style={{fontSize: '0.9rem', color: '#666'}}>Verifique o console para mais detalhes</p>
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
            <h1 style={{color: dm.text, marginBottom: '0.5rem'}}>{paciente.nome}</h1>
            <p style={{color: dm.text2}}>{paciente.email}</p>
          </div>

          <div className="patient-data-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem'}}>
            <div style={{background: dm.card, padding: '1.5rem', borderRadius: '12px', border: `1px solid ${dm.border}`}}>
              <h3 style={{color: '#06b6d4', marginBottom: '1rem'}}>Dados Pessoais</h3>
              <p style={{color: dm.text}}><strong>Idade:</strong> {paciente.idade} anos</p>
              <p style={{color: dm.text}}><strong>Peso:</strong> {paciente.peso} kg</p>
              <p style={{color: dm.text}}><strong>Altura:</strong> {paciente.altura ? (paciente.altura / 100).toFixed(2) : 'N/A'} m</p>
              <p style={{color: dm.text}}><strong>IMC:</strong> {paciente.peso && paciente.altura ? (paciente.peso / Math.pow(paciente.altura / 100, 2)).toFixed(1) : 'N/A'}</p>
            </div>

            <div style={{background: dm.card, padding: '1.5rem', borderRadius: '12px', border: `1px solid ${dm.border}`}}>
              <h3 style={{color: '#06b6d4', marginBottom: '1rem'}}>Objetivos</h3>
              <p style={{color: dm.text}}><strong>Objetivo:</strong> {paciente.objetivo}</p>
              <p style={{color: dm.text}}><strong>Condição de Saúde:</strong> {paciente.condicao_saude || paciente.condicaoSaude}</p>
            </div>
          </div>

          <div style={{background: dm.warn, padding: '1.5rem', borderRadius: '12px', border: `1px solid ${dm.warnBorder}`, textAlign: 'center', marginBottom: '2rem'}}>
            <h3 style={{color: dm.warnText, marginBottom: '1rem'}}>📱 Funcionalidade em Desenvolvimento</h3>
            <p style={{color: dm.warnText, marginBottom: '1rem'}}>A ficha completa do paciente estará disponível no aplicativo móvel em breve.</p>
            <p style={{color: dm.warnText, fontSize: '0.9rem'}}>Por enquanto, você pode acessar as informações básicas e criar prescrições.</p>
          </div>



          <div className="patient-buttons" style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
            <Link 
              to={`/nutri-prescricao/${paciente.Id || paciente.id}`}
              className="btn btn-primary btn-lg"
            >
              <span style={{fontSize: '1rem', marginRight: '0.5rem'}}>📝</span> Criar Prescrição
            </Link>
            <Link 
              to={`/nutri-calendario/${paciente.Id || paciente.id}`}
              className="btn btn-outline btn-lg"
            >
              <span style={{fontSize: '1rem', marginRight: '0.5rem'}}>📅</span> Calendário
            </Link>
          </div>
        </div>
      </main>

    </div>
  );
};

export default FichaPaciente;