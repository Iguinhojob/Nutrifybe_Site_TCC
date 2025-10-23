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
        // Primeiro tenta buscar por ID específico
        let patient;
        try {
          patient = await pacientesAPI.getById(id);
        } catch {
          // Se falhar, busca todos e filtra pelo ID
          const allPacientes = await pacientesAPI.getAll();
          patient = allPacientes.find(p => (p.Id || p.id) === parseInt(id));
        }
        
        if (patient) {
          setCurrentPatient(patient);
          setPrescription(patient.prescricaoSemanal || patient.PrescricaoSemanal || '');
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
    if (!currentPatient) {
      alert('Nenhum paciente carregado!');
      return;
    }

    if (!prescription.trim()) {
      alert('Por favor, digite uma prescrição antes de salvar.');
      return;
    }

    try {
      const patientId = currentPatient.Id || currentPatient.id;
      console.log('=== DEBUG PRESCRIÇÃO ===');
      console.log('Paciente atual:', currentPatient);
      console.log('ID do paciente:', patientId);
      console.log('Prescrição a salvar:', prescription);
      console.log('Tamanho da prescrição:', prescription.length);
      
      const response = await pacientesAPI.update(patientId, {
        prescricaoSemanal: prescription
      });
      
      console.log('Resposta da API:', response);
      console.log('=== FIM DEBUG ===');
      
      alert('Prescrição semanal salva com sucesso!');
      
      // Atualizar o estado local
      setCurrentPatient({
        ...currentPatient,
        prescricaoSemanal: prescription,
        PrescricaoSemanal: prescription
      });
      
    } catch (error) {
      console.error('=== ERRO COMPLETO ===');
      console.error('Erro:', error);
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      console.error('=== FIM ERRO ===');
      alert('Erro ao salvar prescrição: ' + error.message);
    }
  };

  if (!currentPatient) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="nutri-theme">
      <Header theme="nutri" links={headerLinks} />
      
      <main className="nutri-dashboard">
        <div className="nutri-welcome">
          <h1 className="nutri-welcome-title">Ficha de {currentPatient.Nome || currentPatient.nome}</h1>
        </div>

        <div className="nutri-card">
          <Link to="/nutri-dashboard" className="back-arrow">
            <i className="fas fa-arrow-left"></i>
          </Link>
          <div className="patient-details-section">
            <i className="fas fa-user-circle request-icon"></i>
            <h2 className="patient-name-detail">{currentPatient.Nome || currentPatient.nome}</h2>
            <p><strong>Objetivo:</strong> {currentPatient.Objetivo || currentPatient.objetivo}</p>
            <p><strong>Peso:</strong> {currentPatient.Peso || currentPatient.peso} kg</p>
            <p><strong>Idade:</strong> {currentPatient.Idade || currentPatient.idade} anos</p>
            <p><strong>Altura:</strong> {currentPatient.Altura || currentPatient.altura} cm</p>
            <p><strong>Email:</strong> {currentPatient.Email || currentPatient.email}</p>
            
            <Link 
              to={`/nutri-calendario/${currentPatient.Id || currentPatient.id}`}
              className="btn btn-secondary"
              style={{display: 'inline-block', marginTop: '1rem', textDecoration: 'none'}}
            >
              <span style={{fontSize: '1rem', marginRight: '0.5rem'}}>📅</span> Ver Calendário de Alimentação
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