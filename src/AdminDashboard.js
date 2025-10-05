import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { nutricionistasAPI, adminAPI, pacientesAPI, solicitacoesAPI } from './services/api';
import jsPDF from 'jspdf';
import fundoImage from './fundo_index.png';

const AdminDashboard = () => {
  const [managedNutricionists, setManagedNutricionists] = useState([]);
  const [newNutri, setNewNutri] = useState({
    nome: '',
    email: '',
    crn: '',
    senha: ''
  });
  const [addMessage, setAddMessage] = useState('');
  const [consultCrn, setConsultCrn] = useState('');
  const [consultResult, setConsultResult] = useState(null);
  const [consultMessage, setConsultMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [allPatients, setAllPatients] = useState([]);
  const [systemStats, setSystemStats] = useState({});
  const [activityLog, setActivityLog] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const admin = JSON.parse(localStorage.getItem('currentAdmin'));
        if (!admin) {
          navigate('/admin-login');
          return;
        }
        
        const nutricionistas = await nutricionistasAPI.getAll();
        const activities = await adminAPI.getActivityLog();
        const pacientes = await pacientesAPI.getAll();
        
        setManagedNutricionists(nutricionistas);
        setActivityLog(activities);
        setAllPatients(pacientes);
        
        // Calcular estatísticas do sistema
        const stats = {
          totalPacientes: pacientes.length,
          pacientesAtivos: pacientes.filter(p => p.status === 'accepted').length,
          nutricionistasAtivos: nutricionistas.filter(n => n.status === 'approved' && n.ativo !== false).length,
          solicitacoesPendentes: (await solicitacoesAPI.getAll()).length
        };
        setSystemStats(stats);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };
    
    loadData();
  }, [navigate]);

  const addToActivityLog = async (action, nutriName) => {
    try {
      await adminAPI.addActivity({ action, nutriName });
      const activities = await adminAPI.getActivityLog();
      setActivityLog(activities.slice(0, 50)); // Manter apenas 50 registros
    } catch (error) {
      console.error('Erro ao adicionar atividade:', error);
    }
  };

  const handleNutriAction = async (id, action) => {
    try {
      const nutri = managedNutricionists.find(n => n.id === id);
      if (!nutri) return;

      if (action === 'approve') {
        await nutricionistasAPI.update(id, { ...nutri, status: 'approved', ativo: true });
        addToActivityLog('Aprovado', nutri.nome);
      } else if (action === 'reject') {
        await nutricionistasAPI.update(id, { ...nutri, status: 'rejected' });
        addToActivityLog('Rejeitado', nutri.nome);
      } else if (action === 'delete') {
        await nutricionistasAPI.delete(id);
        addToActivityLog('Excluído', nutri.nome);
      } else if (action === 'activate') {
        await nutricionistasAPI.update(id, { ...nutri, ativo: true });
        addToActivityLog('Ativado', nutri.nome);
      } else if (action === 'deactivate') {
        await nutricionistasAPI.update(id, { ...nutri, ativo: false });
        addToActivityLog('Desativado', nutri.nome);
      }

      // Recarregar lista
      const updatedNutris = await nutricionistasAPI.getAll();
      setManagedNutricionists(updatedNutris);
    } catch (error) {
      console.error('Erro na ação do nutricionista:', error);
      alert('Erro ao executar ação.');
    }
  };

  const handleAddNutri = async (e) => {
    e.preventDefault();
    setAddMessage('');

    const { nome, email, crn, senha } = newNutri;

    if (!nome || !email || !crn || !senha) {
      setAddMessage('Por favor, preencha todos os campos para adicionar o nutricionista.');
      return;
    }

    try {
      if (managedNutricionists.some(n => n.email === email || n.crn === crn)) {
        setAddMessage('Já existe um nutricionista com este email ou CRN.');
        return;
      }

      await nutricionistasAPI.create({
        nome,
        email,
        crn,
        senha,
        status: 'pending',
        ativo: true,
        telefone: '',
        especialidade: ''
      });

      const updatedNutris = await nutricionistasAPI.getAll();
      setManagedNutricionists(updatedNutris);

      setNewNutri({ nome: '', email: '', crn: '', senha: '' });
      setAddMessage('Nutricionista adicionado com sucesso e pendente de aprovação!');
      addToActivityLog('Adicionado', nome);
      setTimeout(() => setAddMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao adicionar nutricionista:', error);
      setAddMessage('Erro ao adicionar nutricionista.');
    }
  };

  const handleConsultCrn = (e) => {
    e.preventDefault();
    setConsultMessage('');
    setConsultResult(null);

    if (!consultCrn.trim()) {
      setConsultMessage('Por favor, digite um CRN para consultar.');
      return;
    }

    const foundNutri = managedNutricionists.find(n => 
      n.crn.toLowerCase() === consultCrn.toLowerCase()
    );

    if (foundNutri) {
      setConsultResult(foundNutri);
      setConsultMessage('Nutricionista encontrado!');
    } else {
      setConsultMessage('Nutricionista com este CRN não encontrado.');
    }
  };

  const getPendingNutris = () => managedNutricionists.filter(n => n.status === 'pending');
  const getApprovedNutris = () => managedNutricionists.filter(n => n.status === 'approved');
  const getRejectedNutris = () => managedNutricionists.filter(n => n.status === 'rejected');
  
  const getFilteredNutris = () => {
    let filtered = managedNutricionists;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(n => n.status === statusFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.crn.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };
  
  const getStats = () => {
    return {
      total: managedNutricionists.length,
      pending: getPendingNutris().length,
      approved: getApprovedNutris().length,
      rejected: getRejectedNutris().length
    };
  };

  const headerLinks = [
    { href: '/', text: 'Início' },
    { href: '/admin-login', text: 'Sair' }
  ];

  const stats = getStats();

  return (
    <div className="public-theme" style={{backgroundImage: `url(${fundoImage})`}}>
      <Header theme="admin" links={headerLinks} />
      
      <main className="form-section" style={{minHeight: 'calc(100vh - 80px)', padding: '2rem 1rem'}}>
        <div className="info-card" style={{maxWidth: '1400px', width: '95%'}}>
          <h1 className="info-title">Dashboard do Administrador</h1>
          
          <div style={{display: 'flex', justifyContent: 'center', marginBottom: '2rem', gap: '1rem'}}>
            <button 
              className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={`btn ${activeTab === 'manage' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('manage')}
            >
              Gerenciar
            </button>
            <button 
              className={`btn ${activeTab === 'activity' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('activity')}
            >
              Atividades
            </button>
            <button 
              className={`btn ${activeTab === 'patients' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('patients')}
            >
              Pacientes
            </button>
            <button 
              className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('reports')}
            >
              Relatórios
            </button>
            <button 
              className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('settings')}
            >
              Configurações
            </button>
          </div>

          {activeTab === 'dashboard' && (
            <>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem'}}>
                <div style={{background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '1.5rem', borderRadius: '16px', textAlign: 'center'}}>
                  <h3 style={{margin: '0 0 0.5rem 0', fontSize: '2rem'}}>{stats.total}</h3>
                  <p style={{margin: 0, opacity: 0.9}}>Total de Nutricionistas</p>
                </div>
                <div style={{background: 'linear-gradient(135deg, #f093fb, #f5576c)', color: 'white', padding: '1.5rem', borderRadius: '16px', textAlign: 'center'}}>
                  <h3 style={{margin: '0 0 0.5rem 0', fontSize: '2rem'}}>{stats.pending}</h3>
                  <p style={{margin: 0, opacity: 0.9}}>Pendentes</p>
                </div>
                <div style={{background: 'linear-gradient(135deg, #4facfe, #00f2fe)', color: 'white', padding: '1.5rem', borderRadius: '16px', textAlign: 'center'}}>
                  <h3 style={{margin: '0 0 0.5rem 0', fontSize: '2rem'}}>{stats.approved}</h3>
                  <p style={{margin: 0, opacity: 0.9}}>Aprovados</p>
                </div>
                <div style={{background: 'linear-gradient(135deg, #43e97b, #38f9d7)', color: 'white', padding: '1.5rem', borderRadius: '16px', textAlign: 'center'}}>
                  <h3 style={{margin: '0 0 0.5rem 0', fontSize: '2rem'}}>{stats.rejected}</h3>
                  <p style={{margin: 0, opacity: 0.9}}>Rejeitados</p>
                </div>
              </div>
              
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem'}}>
                <div style={{background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)', color: 'white', padding: '1.5rem', borderRadius: '16px', textAlign: 'center'}}>
                  <h3 style={{margin: '0 0 0.5rem 0', fontSize: '2rem'}}>{systemStats.totalPacientes || 0}</h3>
                  <p style={{margin: 0, opacity: 0.9}}>Total Pacientes</p>
                </div>
                <div style={{background: 'linear-gradient(135deg, #feca57, #ff9ff3)', color: 'white', padding: '1.5rem', borderRadius: '16px', textAlign: 'center'}}>
                  <h3 style={{margin: '0 0 0.5rem 0', fontSize: '2rem'}}>{systemStats.pacientesAtivos || 0}</h3>
                  <p style={{margin: 0, opacity: 0.9}}>Pacientes Ativos</p>
                </div>
                <div style={{background: 'linear-gradient(135deg, #48dbfb, #0abde3)', color: 'white', padding: '1.5rem', borderRadius: '16px', textAlign: 'center'}}>
                  <h3 style={{margin: '0 0 0.5rem 0', fontSize: '2rem'}}>{systemStats.nutricionistasAtivos || 0}</h3>
                  <p style={{margin: 0, opacity: 0.9}}>Nutris Ativos</p>
                </div>
                <div style={{background: 'linear-gradient(135deg, #1dd1a1, #55efc4)', color: 'white', padding: '1.5rem', borderRadius: '16px', textAlign: 'center'}}>
                  <h3 style={{margin: '0 0 0.5rem 0', fontSize: '2rem'}}>{systemStats.solicitacoesPendentes || 0}</h3>
                  <p style={{margin: 0, opacity: 0.9}}>Solicitações</p>
                </div>
              </div>
              
              <div style={{background: 'var(--gray-50)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--gray-200)'}}>
                <h3 style={{color: 'var(--accent-green)', marginBottom: '1.5rem', textAlign: 'center'}}>Consultor de CRN</h3>
                <form onSubmit={handleConsultCrn}>
                  <div className="form-group">
                    <label className="form-label">CRN para Consulta</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Digite o CRN"
                      value={consultCrn}
                      onChange={(e) => setConsultCrn(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}}>Consultar CRN</button>
                </form>

                {consultMessage && (
                  <div className={`alert ${consultMessage.includes('encontrado') ? 'alert-success' : 'alert-error'}`}>
                    {consultMessage}
                  </div>
                )}

                {consultResult && (
                  <div className="nutri-list" style={{ marginTop: '20px' }}>
                    <div className="nutri-item">
                      <div className="nutri-info">
                        <p><strong>Nome:</strong> {consultResult.nome}</p>
                        <p><strong>E-mail:</strong> {consultResult.email}</p>
                        <p><strong>CRN:</strong> {consultResult.crn}</p>
                        <p><strong>Status:</strong> 
                          <span style={{ 
                            fontWeight: 'bold', 
                            color: consultResult.status === 'approved' ? 'green' : 
                                   consultResult.status === 'pending' ? 'orange' : 'red' 
                          }}>
                            {consultResult.status.toUpperCase()}
                          </span>
                          {consultResult.status === 'approved' && (
                            <span style={{
                              marginLeft: '1rem',
                              fontWeight: 'bold',
                              color: consultResult.ativo !== false ? 'green' : 'red'
                            }}>
                              ({consultResult.ativo !== false ? 'ATIVO' : 'INATIVO'})
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="nutri-actions">
                        <button 
                          className="nutri-action-btn btn-delete"
                          onClick={() => {
                            handleNutriAction(consultResult.id, 'delete');
                            setConsultResult(null);
                            setConsultMessage('');
                            setConsultCrn('');
                          }}
                        >
                          Excluir
                        </button>
                        {consultResult.status === 'pending' && (
                          <button 
                            className="nutri-action-btn btn-approve"
                            onClick={() => {
                              handleNutriAction(consultResult.id, 'approve');
                              setConsultResult(null);
                              setConsultMessage('');
                              setConsultCrn('');
                            }}
                          >
                            Aprovar
                          </button>
                        )}
                        {consultResult.status === 'approved' && (
                          <>
                            {consultResult.ativo !== false ? (
                              <button 
                                className="nutri-action-btn btn-warning"
                                onClick={() => {
                                  handleNutriAction(consultResult.id, 'deactivate');
                                  setConsultResult(null);
                                  setConsultMessage('');
                                  setConsultCrn('');
                                }}
                              >
                                Desativar
                              </button>
                            ) : (
                              <button 
                                className="nutri-action-btn btn-success"
                                onClick={() => {
                                  handleNutriAction(consultResult.id, 'activate');
                                  setConsultResult(null);
                                  setConsultMessage('');
                                  setConsultCrn('');
                                }}
                              >
                                Ativar
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          
          {activeTab === 'manage' && (
            <div className="dashboard-sections" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem'}}>
              <div className="admin-section" style={{background: 'var(--gray-50)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--gray-200)'}}>
                <h3 style={{color: 'var(--accent-green)', marginBottom: '1.5rem', textAlign: 'center'}}>Adicionar Nutricionista</h3>
                <form onSubmit={handleAddNutri}>
                  {addMessage && (
                    <div className={`alert ${addMessage.includes('sucesso') ? 'alert-success' : 'alert-error'}`}>
                      {addMessage}
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label className="form-label">Nome Completo</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Digite o nome completo"
                      value={newNutri.nome}
                      onChange={(e) => setNewNutri({ ...newNutri, nome: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="Digite o email"
                      value={newNutri.email}
                      onChange={(e) => setNewNutri({ ...newNutri, email: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">CRN</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Digite o CRN"
                      value={newNutri.crn}
                      onChange={(e) => setNewNutri({ ...newNutri, crn: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Senha Inicial</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Digite a senha inicial"
                      value={newNutri.senha}
                      onChange={(e) => setNewNutri({ ...newNutri, senha: e.target.value })}
                      required
                    />
                  </div>
                  
                  <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}}>Adicionar Nutricionista</button>
                </form>
              </div>

              <div className="admin-section" style={{background: 'var(--gray-50)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--gray-200)'}}>
                <h3 style={{color: 'var(--accent-green)', marginBottom: '1.5rem', textAlign: 'center'}}>Gerenciar Nutricionistas</h3>
                
                <div style={{marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Buscar por nome, email ou CRN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{flex: 1, minWidth: '200px'}}
                  />
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{minWidth: '150px'}}
                  >
                    <option value="all">Todos os Status</option>
                    <option value="pending">Pendentes</option>
                    <option value="approved">Aprovados</option>
                    <option value="rejected">Rejeitados</option>
                  </select>
                </div>
                
                <div className="nutri-list">
                  {getFilteredNutris().length === 0 ? (
                    <p className="no-items-message">Nenhum nutricionista encontrado.</p>
                  ) : (
                    getFilteredNutris().map(nutri => (
                      <div key={nutri.id} className="nutri-item">
                        <div className="nutri-info">
                          <strong>{nutri.nome}</strong> ({nutri.email}) - CRN: {nutri.crn}
                          <span style={{
                            marginLeft: '1rem',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            color: 'white',
                            background: nutri.status === 'approved' ? '#10b981' : 
                                       nutri.status === 'pending' ? '#f59e0b' : '#ef4444'
                          }}>
                            {nutri.status.toUpperCase()}
                          </span>
                          {nutri.status === 'approved' && (
                            <span style={{
                              marginLeft: '0.5rem',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px',
                              fontSize: '0.8rem',
                              fontWeight: 'bold',
                              color: 'white',
                              background: nutri.ativo !== false ? '#059669' : '#dc2626'
                            }}>
                              {nutri.ativo !== false ? 'ATIVO' : 'INATIVO'}
                            </span>
                          )}
                        </div>
                        <div className="nutri-actions">
                          {nutri.status === 'pending' && (
                            <button 
                              className="nutri-action-btn btn-approve"
                              onClick={() => handleNutriAction(nutri.id, 'approve')}
                            >
                              Aprovar
                            </button>
                          )}
                          {nutri.status === 'approved' && (
                            <>
                              {nutri.ativo !== false ? (
                                <button 
                                  className="nutri-action-btn btn-warning"
                                  onClick={() => handleNutriAction(nutri.id, 'deactivate')}
                                >
                                  Desativar
                                </button>
                              ) : (
                                <button 
                                  className="nutri-action-btn btn-success"
                                  onClick={() => handleNutriAction(nutri.id, 'activate')}
                                >
                                  Ativar
                                </button>
                              )}
                            </>
                          )}
                          {nutri.status === 'rejected' && (
                            <button 
                              className="nutri-action-btn btn-approve"
                              onClick={() => handleNutriAction(nutri.id, 'approve')}
                            >
                              Aprovar
                            </button>
                          )}
                          <button 
                            className="nutri-action-btn btn-delete"
                            onClick={() => handleNutriAction(nutri.id, 'delete')}
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'activity' && (
            <div style={{background: 'var(--gray-50)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--gray-200)'}}>
              <h3 style={{color: 'var(--accent-green)', marginBottom: '1.5rem', textAlign: 'center'}}>Log de Atividades</h3>
              
              <div className="nutri-list" style={{maxHeight: '500px', overflowY: 'auto'}}>
                {activityLog.length === 0 ? (
                  <p className="no-items-message">Nenhuma atividade registrada.</p>
                ) : (
                  activityLog.map(activity => (
                    <div key={activity.id} className="nutri-item" style={{borderLeft: '4px solid var(--accent-green)'}}>
                      <div className="nutri-info">
                        <strong>{activity.action}</strong> - {activity.nutriName}
                        <br />
                        <small style={{color: 'var(--gray-500)'}}>{activity.timestamp}</small>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <button 
                className="btn btn-warning" 
                style={{marginTop: '1rem', width: '100%'}}
                onClick={async () => {
                  if (window.confirm('Limpar todas as atividades? Esta ação não pode ser desfeita.')) {
                    try {
                      await adminAPI.clearActivityLog();
                      setActivityLog([]);
                      alert('Histórico limpo com sucesso!');
                    } catch (error) {
                      console.error('Erro ao limpar histórico:', error);
                      alert('Erro ao limpar histórico.');
                    }
                  }
                }}
              >
                Limpar Histórico
              </button>
            </div>
          )}
          
          {activeTab === 'patients' && (
            <div style={{background: 'var(--gray-50)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--gray-200)'}}>
              <h3 style={{color: 'var(--accent-green)', marginBottom: '1.5rem', textAlign: 'center'}}>Gestão de Pacientes</h3>
              
              <div className="nutri-list" style={{maxHeight: '500px', overflowY: 'auto'}}>
                {allPatients.length === 0 ? (
                  <p className="no-items-message">Nenhum paciente encontrado.</p>
                ) : (
                  allPatients.map(patient => {
                    const nutri = managedNutricionists.find(n => n.id == patient.nutricionistaId);
                    return (
                      <div key={patient.id} className="nutri-item">
                        <div className="nutri-info">
                          <strong>{patient.nome}</strong> ({patient.email})
                          <br />
                          <small>Nutricionista: {nutri?.nome || 'Não encontrado'} | Objetivo: {patient.objetivo}</small>
                          <span style={{
                            marginLeft: '1rem',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            color: 'white',
                            background: patient.status === 'accepted' ? '#10b981' : '#f59e0b'
                          }}>
                            {patient.status.toUpperCase()}
                          </span>
                          {patient.status === 'accepted' && (
                            <span style={{
                              marginLeft: '0.5rem',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px',
                              fontSize: '0.8rem',
                              fontWeight: 'bold',
                              color: 'white',
                              background: patient.ativo !== false ? '#059669' : '#dc2626'
                            }}>
                              {patient.ativo !== false ? 'ATIVO' : 'INATIVO'}
                            </span>
                          )}
                        </div>
                        <div className="nutri-actions">
                          {patient.status === 'accepted' && (
                            <>
                              {patient.ativo !== false ? (
                                <button 
                                  className="nutri-action-btn btn-warning"
                                  onClick={async () => {
                                    try {
                                      await pacientesAPI.update(patient.id, { ...patient, ativo: false });
                                      const updatedPatients = await pacientesAPI.getAll();
                                      setAllPatients(updatedPatients);
                                      addToActivityLog('Paciente Desativado', patient.nome);
                                    } catch (error) {
                                      alert('Erro ao desativar paciente.');
                                    }
                                  }}
                                >
                                  Desativar
                                </button>
                              ) : (
                                <button 
                                  className="nutri-action-btn btn-success"
                                  onClick={async () => {
                                    try {
                                      await pacientesAPI.update(patient.id, { ...patient, ativo: true });
                                      const updatedPatients = await pacientesAPI.getAll();
                                      setAllPatients(updatedPatients);
                                      addToActivityLog('Paciente Ativado', patient.nome);
                                    } catch (error) {
                                      alert('Erro ao ativar paciente.');
                                    }
                                  }}
                                >
                                  Ativar
                                </button>
                              )}
                            </>
                          )}
                          <button 
                            className="nutri-action-btn btn-delete"
                            onClick={async () => {
                              if (window.confirm(`Excluir paciente ${patient.nome}?`)) {
                                try {
                                  await pacientesAPI.delete(patient.id);
                                  const updatedPatients = await pacientesAPI.getAll();
                                  setAllPatients(updatedPatients);
                                  addToActivityLog('Paciente Excluído', patient.nome);
                                } catch (error) {
                                  alert('Erro ao excluir paciente.');
                                }
                              }
                            }}
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              <div style={{marginTop: '2rem', textAlign: 'center'}}>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    const doc = new jsPDF();
                    const date = new Date().toLocaleDateString('pt-BR');
                    
                    // Cabeçalho
                    doc.setFontSize(20);
                    doc.text('Relatório de Pacientes - Nutrifybe', 20, 20);
                    doc.setFontSize(12);
                    doc.text(`Data: ${date}`, 20, 30);
                    
                    // Estatísticas
                    doc.setFontSize(16);
                    doc.text('Resumo de Pacientes', 20, 50);
                    doc.setFontSize(12);
                    doc.text(`Total de Pacientes: ${allPatients.length}`, 20, 60);
                    doc.text(`Pacientes Ativos: ${allPatients.filter(p => p.ativo !== false).length}`, 20, 70);
                    doc.text(`Pacientes Inativos: ${allPatients.filter(p => p.ativo === false).length}`, 20, 80);
                    
                    // Lista de pacientes
                    doc.setFontSize(16);
                    doc.text('Lista de Pacientes', 20, 100);
                    doc.setFontSize(10);
                    let yPos = 110;
                    
                    allPatients.forEach((patient, index) => {
                      if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                      }
                      const nutri = managedNutricionists.find(n => n.id == patient.nutricionistaId);
                      const status = patient.ativo !== false ? 'ATIVO' : 'INATIVO';
                      doc.text(`${index + 1}. ${patient.nome} - ${patient.email}`, 20, yPos);
                      yPos += 8;
                      doc.text(`   Nutricionista: ${nutri?.nome || 'Não encontrado'} | Status: ${status}`, 20, yPos);
                      yPos += 8;
                      doc.text(`   Objetivo: ${patient.objetivo}`, 20, yPos);
                      yPos += 12;
                    });
                    
                    doc.save(`pacientes-nutrifybe-${new Date().toISOString().split('T')[0]}.pdf`);
                  }}
                >
                  Exportar Pacientes (PDF)
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'reports' && (
            <div style={{background: 'var(--gray-50)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--gray-200)'}}>
              <h3 style={{color: 'var(--accent-green)', marginBottom: '1.5rem', textAlign: 'center'}}>Relatórios do Sistema</h3>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
                <div style={{padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb'}}>
                  <h4 style={{margin: '0 0 1rem 0', color: '#374151'}}>Resumo Geral</h4>
                  <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                    <li style={{padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6'}}>Total de Nutricionistas: <strong>{managedNutricionists.length}</strong></li>
                    <li style={{padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6'}}>Nutricionistas Ativos: <strong>{systemStats.nutricionistasAtivos}</strong></li>
                    <li style={{padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6'}}>Total de Pacientes: <strong>{systemStats.totalPacientes}</strong></li>
                    <li style={{padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6'}}>Pacientes Ativos: <strong>{systemStats.pacientesAtivos}</strong></li>
                    <li style={{padding: '0.5rem 0'}}>Solicitações Pendentes: <strong>{systemStats.solicitacoesPendentes}</strong></li>
                  </ul>
                </div>
                
                <div style={{padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb'}}>
                  <h4 style={{margin: '0 0 1rem 0', color: '#374151'}}>Atividades Recentes</h4>
                  <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                    {activityLog.slice(0, 5).map(activity => (
                      <div key={activity.id} style={{padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6'}}>
                        <small><strong>{activity.action}</strong> - {activity.nutriName}</small>
                        <br />
                        <small style={{color: '#6b7280'}}>{activity.timestamp}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div style={{marginTop: '2rem', textAlign: 'center', display: 'flex', gap: '1rem', justifyContent: 'center'}}>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    const doc = new jsPDF();
                    const date = new Date().toLocaleDateString('pt-BR');
                    
                    // Cabeçalho
                    doc.setFontSize(20);
                    doc.text('Relatório Nutrifybe', 20, 20);
                    doc.setFontSize(12);
                    doc.text(`Data: ${date}`, 20, 30);
                    
                    // Estatísticas
                    doc.setFontSize(16);
                    doc.text('Estatísticas Gerais', 20, 50);
                    doc.setFontSize(12);
                    doc.text(`Total de Nutricionistas: ${managedNutricionists.length}`, 20, 60);
                    doc.text(`Nutricionistas Ativos: ${systemStats.nutricionistasAtivos}`, 20, 70);
                    doc.text(`Total de Pacientes: ${systemStats.totalPacientes}`, 20, 80);
                    doc.text(`Pacientes Ativos: ${systemStats.pacientesAtivos}`, 20, 90);
                    doc.text(`Solicitações Pendentes: ${systemStats.solicitacoesPendentes}`, 20, 100);
                    
                    // Nutricionistas
                    doc.setFontSize(16);
                    doc.text('Nutricionistas', 20, 120);
                    doc.setFontSize(10);
                    let yPos = 130;
                    managedNutricionists.slice(0, 10).forEach((nutri, index) => {
                      doc.text(`${index + 1}. ${nutri.nome} - ${nutri.email} - Status: ${nutri.status}`, 20, yPos);
                      yPos += 10;
                    });
                    
                    // Pacientes
                    if (yPos > 250) {
                      doc.addPage();
                      yPos = 20;
                    }
                    doc.setFontSize(16);
                    doc.text('Pacientes', 20, yPos);
                    yPos += 10;
                    doc.setFontSize(10);
                    allPatients.slice(0, 10).forEach((patient, index) => {
                      doc.text(`${index + 1}. ${patient.nome} - ${patient.email} - Objetivo: ${patient.objetivo}`, 20, yPos);
                      yPos += 10;
                    });
                    
                    doc.save(`relatorio-nutrifybe-${new Date().toISOString().split('T')[0]}.pdf`);
                  }}
                >
                  Exportar PDF
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    const data = {
                      nutricionistas: managedNutricionists,
                      pacientes: allPatients,
                      atividades: activityLog,
                      estatisticas: systemStats,
                      dataExportacao: new Date().toLocaleString('pt-BR')
                    };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `relatorio-nutrifybe-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                  }}
                >
                  Exportar JSON
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div style={{background: 'var(--gray-50)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--gray-200)'}}>
              <h3 style={{color: 'var(--accent-green)', marginBottom: '1.5rem', textAlign: 'center'}}>Configurações do Sistema</h3>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
                <div style={{padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb'}}>
                  <h4 style={{margin: '0 0 1rem 0', color: '#374151'}}>Adicionar Admin</h4>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const adminData = {
                      nome: formData.get('nome'),
                      email: formData.get('email'),
                      senha: formData.get('senha')
                    };
                    
                    try {
                      const result = await adminAPI.create(adminData);
                      if (result) {
                        alert('Admin criado com sucesso!');
                        e.target.reset();
                        addToActivityLog('Admin Criado', adminData.nome);
                      }
                    } catch (error) {
                      alert('Erro ao criar admin.');
                    }
                  }}>
                    <div className="form-group">
                      <label className="form-label">Nome</label>
                      <input type="text" name="nome" className="form-input" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input type="email" name="email" className="form-input" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Senha</label>
                      <input type="password" name="senha" className="form-input" required />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Criar Admin</button>
                  </form>
                </div>
                
                <div style={{padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb'}}>
                  <h4 style={{margin: '0 0 1rem 0', color: '#374151'}}>Manutenção</h4>
                  <button 
                    className="btn btn-warning"
                    style={{width: '100%', marginBottom: '1rem'}}
                    onClick={async () => {
                      if (window.confirm('Limpar todas as atividades antigas? Esta ação não pode ser desfeita.')) {
                        try {
                          await adminAPI.clearActivityLog();
                          setActivityLog([]);
                          alert('Histórico de atividades limpo com sucesso!');
                        } catch (error) {
                          alert('Erro ao limpar histórico.');
                        }
                      }
                    }}
                  >
                    Limpar Histórico de Atividades
                  </button>
                  
                  <button 
                    className="btn btn-secondary"
                    style={{width: '100%'}}
                    onClick={() => {
                      const data = { nutricionistas: managedNutricionists, pacientes: allPatients };
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `backup-nutrifybe-${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                    }}
                  >
                    Fazer Backup dos Dados
                  </button>
                </div>
                
                <div style={{padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb'}}>
                  <h4 style={{margin: '0 0 1rem 0', color: '#374151'}}>Informações do Sistema</h4>
                  <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                    <li style={{padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6'}}>Versão: <strong>1.0.0</strong></li>
                    <li style={{padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6'}}>Banco: <strong>JSON Server</strong></li>
                    <li style={{padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6'}}>Status: <strong style={{color: 'green'}}>Online</strong></li>
                    <li style={{padding: '0.5rem 0'}}>Administrador: <strong>admin@nutrifybe.com</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;