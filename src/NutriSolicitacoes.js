import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';
import { solicitacoesAPI } from './services/api';

const NutriSolicitacoes = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isDark, setIsDark] = useState(document.body.classList.contains('dark-mode'));

  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.body.classList.contains('dark-mode')));
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const navigate = useNavigate();

  const headerLinks = [
    { href: '/nutri-dashboard', text: 'Início' },
    { href: '/nutri-solicitacoes', text: 'Solicitações Pendentes' },
    { href: '/login', text: 'Sair', onClick: () => navigate('/login') }
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
          navigate('/login');
          return;
        }

        const solicitacoes = await solicitacoesAPI.getByNutricionista(user.Id || user.id);
        setPendingRequests(solicitacoes);
      } catch (error) {
        console.error('Erro ao carregar solicitações:', error);
      }
    };
    
    loadData();
  }, [navigate]);

  const acceptPatientRequest = async (id) => {
    try {
      const acceptedPatient = await solicitacoesAPI.acceptRequest(id);
      const updatedPending = pendingRequests.filter(req => (req.id || req.Id) !== id);
      setPendingRequests(updatedPending);
      
      alert(`Paciente ${acceptedPatient.nome} aceito com sucesso!`);
    } catch (error) {
      console.error('Erro ao aceitar paciente:', error);
      alert('Erro ao aceitar paciente.');
    }
  };

  const rejectPatientRequest = async (id) => {
    try {
      const rejectedPatient = pendingRequests.find(req => (req.id || req.Id) === id);
      await solicitacoesAPI.delete(id);
      const updatedPending = pendingRequests.filter(req => (req.id || req.Id) !== id);
      setPendingRequests(updatedPending);
      
      alert(`Paciente ${rejectedPatient.Nome || rejectedPatient.nome} recusado.`);
    } catch (error) {
      console.error('Erro ao recusar paciente:', error);
      alert('Erro ao recusar paciente.');
    }
  };

  return (
    <div className="nutri-theme">
      <Header theme="minimal" />
      
      <main className="nutri-dashboard">
        <div className="nutri-welcome">
          <button
            onClick={() => navigate('/nutri-dashboard')}
            style={{
              position: 'absolute',
              top: '1.5rem',
              left: '1.5rem',
              background: 'none',
              border: 'none',
              color: isDark ? '#A78BFA' : '#06b6d4',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            Voltar
          </button>
          <h1 className="nutri-welcome-title">Solicitações Pendentes</h1>
          <p className="nutri-subtitle">Gerencie as solicitações de novos pacientes</p>
        </div>

        <div className="nutri-card" style={{ position: 'relative' }}>
          <button
            onClick={() => navigate('/nutri-dashboard')}
            title="Voltar ao Dashboard"
            style={{
              position: 'absolute', top: '1rem', right: '1rem',
              width: '32px', height: '32px', borderRadius: '50%',
              border: `1px solid ${isDark ? '#A78BFA' : '#06b6d4'}`,
              background: 'none',
              color: isDark ? '#A78BFA' : '#06b6d4',
              fontSize: '1rem', fontWeight: 700,
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}
          >
            ×
          </button>
          <div className="pending-requests">
            {pendingRequests.length === 0 ? (
              <p className="no-patients-message">Não há solicitações pendentes.</p>
            ) : (
              pendingRequests.map(request => (
                <div key={request.id} className="request-item">
                  <i className="fas fa-user-circle request-icon"></i>
                  <div className="request-info">
                    <h3>{request.Nome || request.nome}</h3>
                    <p><strong style={{ color: isDark ? '#A78BFA' : '#06b6d4' }}>Email:</strong> <span style={{ color: isDark ? '#F1F1F3' : undefined }}>{request.Email || request.email}</span></p>
                    <p><strong style={{ color: isDark ? '#A78BFA' : '#06b6d4' }}>Objetivo:</strong> <span style={{ color: isDark ? '#F1F1F3' : undefined }}>{request.Objetivo || request.objetivo}</span></p>
                    <p><strong style={{ color: isDark ? '#A78BFA' : '#06b6d4' }}>Peso:</strong> <span style={{ color: isDark ? '#F1F1F3' : undefined }}>{request.Peso || request.peso} kg</span></p>
                    <p><strong style={{ color: isDark ? '#A78BFA' : '#06b6d4' }}>Idade:</strong> <span style={{ color: isDark ? '#F1F1F3' : undefined }}>{request.Idade || request.idade} anos</span></p>
                    <p><strong style={{ color: isDark ? '#A78BFA' : '#06b6d4' }}>Altura:</strong> <span style={{ color: isDark ? '#F1F1F3' : undefined }}>{request.Altura || request.altura} cm</span></p>
                    <p><strong style={{ color: isDark ? '#A78BFA' : '#06b6d4' }}>Condição de saúde:</strong> <span style={{ color: isDark ? '#F1F1F3' : undefined }}>{request.CondicaoSaude || request.condicaoSaude}</span></p>
                  </div>
                  <div className="request-actions">
                    <button 
                      className="btn-accept"
                      style={{ background: isDark ? 'linear-gradient(135deg, #7C3AED, #A78BFA)' : undefined }}
                      onClick={() => acceptPatientRequest(request.Id || request.id)}
                    >
                      Aceitar
                    </button>
                    <button 
                      className="btn-reject"
                      onClick={() => rejectPatientRequest(request.Id || request.id)}
                    >
                      Recusar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default NutriSolicitacoes;