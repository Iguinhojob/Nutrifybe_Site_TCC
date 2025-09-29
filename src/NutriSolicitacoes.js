import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';
import { solicitacoesAPI } from './services/api';

const NutriSolicitacoes = () => {
  const [pendingRequests, setPendingRequests] = useState([]);

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

        
        const solicitacoes = await solicitacoesAPI.getByNutricionista(user.id);
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
      const updatedPending = pendingRequests.filter(req => req.id !== id);
      setPendingRequests(updatedPending);
      
      alert(`Paciente ${acceptedPatient.nome} aceito com sucesso!`);
    } catch (error) {
      console.error('Erro ao aceitar paciente:', error);
      alert('Erro ao aceitar paciente.');
    }
  };

  const rejectPatientRequest = async (id) => {
    try {
      const rejectedPatient = pendingRequests.find(req => req.id === id);
      await solicitacoesAPI.delete(id);
      const updatedPending = pendingRequests.filter(req => req.id !== id);
      setPendingRequests(updatedPending);
      
      alert(`Paciente ${rejectedPatient.nome} recusado.`);
    } catch (error) {
      console.error('Erro ao recusar paciente:', error);
      alert('Erro ao recusar paciente.');
    }
  };

  return (
    <div className="nutri-theme">
      <Header theme="nutri" links={headerLinks} />
      
      <main className="nutri-dashboard">
        <Link to="/nutri-dashboard" className="btn btn-outline" style={{marginBottom: '1rem'}}>
          Voltar ao Dashboard
        </Link>
        
        <div className="nutri-welcome">
          <h1 className="nutri-welcome-title">Solicitações Pendentes</h1>
          <p className="nutri-subtitle">Gerencie as solicitações de novos pacientes</p>
        </div>

        <div className="nutri-card">
          <div className="pending-requests">
            {pendingRequests.length === 0 ? (
              <p className="no-patients-message">Não há solicitações pendentes.</p>
            ) : (
              pendingRequests.map(request => (
                <div key={request.id} className="request-item">
                  <i className="fas fa-user-circle request-icon"></i>
                  <div className="request-info">
                    <h3>{request.nome}</h3>
                    <p><strong>Objetivo:</strong> {request.objetivo}</p>
                    <p><strong>Peso:</strong> {request.peso}</p>
                    <p><strong>Idade:</strong> {request.idade}</p>
                    <p><strong>Altura:</strong> {request.altura}</p>
                    <p><strong>Condição de saúde ou restrição alimentar?</strong> {request.condicaoSaude}.</p>
                  </div>
                  <div className="request-actions">
                    <button 
                      className="btn-accept"
                      onClick={() => acceptPatientRequest(request.id)}
                    >
                      Aceitar
                    </button>
                    <button 
                      className="btn-reject"
                      onClick={() => rejectPatientRequest(request.id)}
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