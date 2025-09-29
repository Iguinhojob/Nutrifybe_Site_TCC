import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import { pacientesAPI } from './services/api';

const NutriPrescricao = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentPatient, setCurrentPatient] = useState(null);
  const [prescription, setPrescription] = useState('');

  const headerLinks = [
    { href: '/nutri-dashboard', text: 'Início' },
    { href: '/nutri-solicitacoes', text: 'Solicitações Pendentes' },
    { href: '/login', text: 'Sair', onClick: () => navigate('/login') }
  ];

  useEffect(() => {
    const loadPatient = async () => {
      try {
        const patient = await pacientesAPI.getById(id);
        
        if (patient) {
          setCurrentPatient(patient);
          setPrescription(patient.prescricaoSemanal || '');
        } else {
          alert('Paciente não encontrado.');
          navigate('/nutri-dashboard');
        }
      } catch (error) {
        console.error('Erro ao carregar paciente:', error);
        alert('Erro ao carregar dados do paciente.');
        navigate('/nutri-dashboard');
      }
    };
    
    loadPatient();
  }, [id, navigate]);

  const handleSavePrescription = async () => {
    if (!currentPatient) return;

    try {
      await pacientesAPI.update(currentPatient.id, {
        ...currentPatient,
        prescricaoSemanal: prescription
      });
      
      alert('Prescrição semanal salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar prescrição:', error);
      alert('Erro ao salvar prescrição.');
    }
  };

  if (!currentPatient) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="nutri-theme">
      <Header theme="nutri" links={headerLinks} />
      
      <main className="nutri-dashboard">
        <Link to="/nutri-dashboard" className="btn btn-outline" style={{marginBottom: '1rem'}}>
          Voltar ao Dashboard
        </Link>
        
        <div className="nutri-welcome">
          <h1 className="nutri-welcome-title">Ficha de {currentPatient.nome}</h1>
        </div>

        <div className="nutri-card">
          <div className="patient-details-section">
            <i className="fas fa-user-circle request-icon"></i>
            <h2 className="patient-name-detail">{currentPatient.nome}</h2>
            <p><strong>Objetivo:</strong> {currentPatient.objetivo}</p>
            <p><strong>Peso:</strong> {currentPatient.peso} kg</p>
            <p><strong>Idade:</strong> {currentPatient.idade} anos</p>
            <p><strong>Altura:</strong> {currentPatient.altura} cm</p>
            <p><strong>Email:</strong> {currentPatient.email}</p>
            
            <Link 
              to={`/nutri-calendario/${currentPatient.id}`}
              className="btn btn-secondary"
              style={{display: 'inline-block', marginTop: '1rem', textDecoration: 'none'}}
            >
              📅 Ver Calendário de Alimentação
            </Link>
          </div>

          <div className="prescription-section">
            <h3 className="prescription-title">Prescrição Semanal</h3>
            <textarea
              className="prescription-textarea"
              placeholder="Digite aqui a prescrição semanal para o paciente..."
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
            />
            <button 
              className="btn btn-primary"
              style={{width: '100%', marginTop: '1rem'}}
              onClick={handleSavePrescription}
            >
              Salvar Prescrição Semanal
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NutriPrescricao;