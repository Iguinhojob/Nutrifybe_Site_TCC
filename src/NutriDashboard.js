import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';
import Modal from './Modal';
import { pacientesAPI, nutricionistasAPI, solicitacoesAPI } from './services/api';

const NutriDashboard = () => {
  const [acceptedPatients, setAcceptedPatients] = useState([]);
  const [managedNutricionists, setManagedNutricionists] = useState([]);
  const [transferModal, setTransferModal] = useState({ isOpen: false, patient: null });
  const [selectNutriModal, setSelectNutriModal] = useState({ isOpen: false, patient: null, reason: '' });
  const [transferReason, setTransferReason] = useState('');
  const [searchNutri, setSearchNutri] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

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
        setCurrentUser(user);
        
        const pacientes = await pacientesAPI.getByNutricionista(user.Id || user.id);
        const nutricionistas = await nutricionistasAPI.getAll();
        console.log('Todos os nutricionistas:', nutricionistas);
        
        setAcceptedPatients(pacientes);
        const approvedNutris = nutricionistas.filter(n => (n.Status || n.status) === 'approved');
        console.log('Nutricionistas aprovados:', approvedNutris);
        setManagedNutricionists(approvedNutris);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };
    
    loadData();
  }, [navigate]);

  const handleEndService = (patient) => {
    console.log('handleEndService chamado:', patient);
    console.log('Estado atual transferModal:', transferModal);
    setTransferModal({ isOpen: true, patient });
    setTransferReason('');
    console.log('Modal deveria abrir agora');
  };

  const handleTransferReasonSubmit = () => {
    if (!transferReason.trim()) {
      alert('Por favor, escreva o motivo do encerramento.');
      return;
    }
    
    setTransferModal({ isOpen: false, patient: null });
    setSelectNutriModal({ 
      isOpen: true, 
      patient: transferModal.patient, 
      reason: transferReason 
    });
    setSearchNutri('');
  };

  const handleSelectNutri = async (selectedNutriId) => {
    try {
      const selectedNutri = managedNutricionists.find(n => (n.Id || n.id) === selectedNutriId);
      if (!selectedNutri) return;

      const patient = selectNutriModal.patient;
      const patientId = patient.Id || patient.id;
      
      // Criar solicitação pendente com motivo da transferência
      const solicitacao = {
        nome: patient.Nome || patient.nome,
        email: patient.Email || patient.email,
        idade: patient.Idade || patient.idade,
        peso: patient.Peso || patient.peso,
        altura: patient.Altura || patient.altura,
        objetivo: `TRANSFERÊNCIA: ${patient.Objetivo || patient.objetivo}`,
        condicaoSaude: `Motivo da transferência: ${selectNutriModal.reason}. Condição anterior: ${patient.CondicaoSaude || patient.condicao_saude || 'Não informado'}`,
        nutricionistaId: selectedNutriId
      };
      
      await solicitacoesAPI.create(solicitacao);
      
      // Remover paciente do nutricionista atual
      await pacientesAPI.delete(patientId);

      // Atualizar lista local
      const updatedPatients = acceptedPatients.filter(p => (p.Id || p.id) !== patientId);
      setAcceptedPatients(updatedPatients);

      alert(`Paciente ${patient.Nome || patient.nome} foi transferido para ${selectedNutri.Nome || selectedNutri.nome} e aparecerá nas solicitações pendentes.`);
      
      setSelectNutriModal({ isOpen: false, patient: null, reason: '' });
      setTransferReason('');
    } catch (error) {
      console.error('Erro ao transferir paciente:', error);
      alert('Erro ao transferir paciente: ' + error.message);
    }
  };

  const getFilteredNutris = () => {
    console.log('managedNutricionists:', managedNutricionists);
    console.log('currentUser:', currentUser);
    
    const availableNutris = managedNutricionists.filter(n => {
      const isApproved = (n.Status || n.status) === 'approved';
      const isDifferentUser = (n.Id || n.id) !== (currentUser?.Id || currentUser?.id);
      console.log(`Nutricionista ${n.Nome || n.nome}: approved=${isApproved}, different=${isDifferentUser}`);
      return isApproved && isDifferentUser;
    });
    
    console.log('availableNutris:', availableNutris);
    
    if (!searchNutri) return availableNutris;
    
    return availableNutris.filter(n => 
      (n.Nome || n.nome || '').toLowerCase().includes(searchNutri.toLowerCase()) ||
      (n.CRN || n.crn || '').toLowerCase().includes(searchNutri.toLowerCase()) ||
      (n.Email || n.email || '').toLowerCase().includes(searchNutri.toLowerCase())
    );
  };



  return (
    <div className="nutri-theme">
      <Header theme="nutri" links={headerLinks} />
      
      <main className="nutri-dashboard">
        <div className="nutri-welcome">
          <h1 className="nutri-welcome-title">
            Seja Bem Vindo(a) ao <span className="nutri-brand">Nutrifybe</span>
          </h1>
          <p className="nutri-subtitle">Gerencie seus pacientes e prescreva dietas personalizadas!</p>
        </div>

        <div className="nutri-card">
          <div className="patients-list">
            {acceptedPatients.length === 0 ? (
              <p className="no-patients-message">Você não tem pacientes.</p>
            ) : (
              acceptedPatients.map(patient => (
                <div key={patient.Id || patient.id} className="patient-item">
                  <div className="patient-info">
                    <i className="fas fa-user-circle patient-icon"></i>
                    <div className="patient-details">
                      <h3>{patient.Nome || patient.nome}</h3>
                      <p>Email: {patient.Email || patient.email}</p>
                      <p>Objetivo: {patient.Objetivo || patient.objetivo}</p>
                    </div>
                  </div>
                  <div className="patient-actions">
                    <Link 
                      to={`/ficha-paciente/${patient.Id || patient.id}`} 
                      className="btn btn-primary"
                    >
                      Ver Ficha
                    </Link>
                    <button 
                      className="btn btn-warning"
                      style={{marginLeft: '0.5rem'}}
                      onClick={() => {
                        console.log('Clicou em encerrar:', patient);
                        handleEndService(patient);
                      }}
                    >
                      Encerrar Atendimento
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <Modal
        isOpen={transferModal.isOpen}
        onClose={() => setTransferModal({ isOpen: false, patient: null })}
        title="Encerrar e Transferir Atendimento"
        className="transfer-modal"
      >
        <label htmlFor="transferReason">
          Por favor, descreva o motivo do encerramento e transferência do atendimento de{' '}
          <strong>{transferModal.patient?.Nome || transferModal.patient?.nome}</strong>:
        </label>
        <textarea
          id="transferReason"
          className="form-textarea"
          placeholder="Ex: Paciente precisa de uma especialidade diferente, incompatibilidade de horários, etc."
          value={transferReason}
          onChange={(e) => setTransferReason(e.target.value)}
          required
          style={{width: '100%', minHeight: '100px', margin: '1rem 0'}}
        />
        <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
          <button className="btn btn-primary" onClick={handleTransferReasonSubmit}>
            Transferir para Outro Nutricionista
          </button>
          <button 
            className="btn btn-warning" 
            onClick={async () => {
              try {
                const patientId = transferModal.patient.Id || transferModal.patient.id;
                await pacientesAPI.delete(patientId);
                const updatedPatients = acceptedPatients.filter(p => (p.Id || p.id) !== patientId);
                setAcceptedPatients(updatedPatients);
                
                alert(`Atendimento de ${transferModal.patient.Nome || transferModal.patient.nome} foi encerrado definitivamente.`);
                setTransferModal({ isOpen: false, patient: null });
                setTransferReason('');
              } catch (error) {
                console.error('Erro ao encerrar atendimento:', error);
                alert('Erro ao encerrar atendimento: ' + error.message);
              }
            }}
          >
            Apenas Encerrar
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={selectNutriModal.isOpen}
        onClose={() => setSelectNutriModal({ isOpen: false, patient: null, reason: '' })}
        title="Transferir Paciente para qual Nutricionista?"
      >
        <p><strong>Paciente:</strong> {selectNutriModal.patient?.Nome || selectNutriModal.patient?.nome}</p>
        <p><strong>Motivo:</strong> <em>{selectNutriModal.reason}</em></p>
        <hr style={{ margin: '15px 0' }} />
        
        <label htmlFor="searchNutri" style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          Pesquisar Nutricionista:
        </label>
        <input
          type="text"
          id="searchNutri"
          className="form-input"
          placeholder="Digite nome ou CRN para buscar..."
          value={searchNutri}
          onChange={(e) => setSearchNutri(e.target.value)}
          style={{marginBottom: '1rem'}}
        />
        
        <div style={{maxHeight: '300px', overflowY: 'auto'}}>
          {getFilteredNutris().length === 0 ? (
            <p>Nenhum nutricionista disponível.</p>
          ) : (
            getFilteredNutris().map(nutri => (
              <div key={nutri.Id || nutri.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '0.5rem'}}>
                <div>
                  <strong>{nutri.Nome || nutri.nome}</strong><br />
                  <small>{nutri.Email || nutri.email} (CRN: {nutri.CRN || nutri.crn})</small>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleSelectNutri(nutri.Id || nutri.id)}
                >
                  Selecionar
                </button>
              </div>
            ))
          )}
        </div>
      </Modal>

    </div>
  );
};

export default NutriDashboard;