import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { nutricionistasAPI, adminAPI } from './services/api';
import api from './services/api';
import jsPDF from 'jspdf';
import './css/style.css';
const fundoImage = '/images/fundo_index.png';

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
  const [allAdmins, setAllAdmins] = useState([]);
  const navigate = useNavigate();

  const reloadData = async () => {
    try {
      const nutricionistas = await nutricionistasAPI.getAll();
      const activities = await adminAPI.getActivityLog();
      const pacientes = await api.pacientesAPI.getAll();
      
      setManagedNutricionists(nutricionistas);
      setActivityLog(activities);
      setAllPatients(pacientes);
      
      const stats = {
        totalPacientes: pacientes.length,
        pacientesAtivos: pacientes.filter(p => p.ativo === true).length,
        nutricionistasAtivos: nutricionistas.filter(n => n.Status === 'approved' && n.ativo === true).length,
        solicitacoesPendentes: (await api.solicitacoesAPI.getAll()).length
      };
      setSystemStats(stats);
    } catch (error) {
      console.error('Erro ao recarregar dados:', error);
    }
  };

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
        const pacientes = await api.pacientesAPI.getAll();
        const admins = await adminAPI.getAll();
        
        setManagedNutricionists(nutricionistas);
        setActivityLog(activities);
        setAllPatients(pacientes);
        setAllAdmins(admins);
        
        // Calcular estatísticas do sistema
        const stats = {
          totalPacientes: pacientes.length,
          pacientesAtivos: pacientes.filter(p => p.ativo === true).length,
          nutricionistasAtivos: nutricionistas.filter(n => n.status === 'approved' && n.ativo === true).length,
          solicitacoesPendentes: (await api.solicitacoesAPI.getAll()).length
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

      let updateData = {};
      
      if (action === 'approve') {
        updateData = { status: 'approved', ativo: 1 };
        addToActivityLog('Aprovado', nutri.nome);
      } else if (action === 'reject') {
        updateData = { status: 'rejected' };
        addToActivityLog('Rejeitado', nutri.nome);
      } else if (action === 'delete') {
        await nutricionistasAPI.delete(id);
        addToActivityLog('Excluído', nutri.nome);
      } else if (action === 'activate') {
        updateData = { ativo: 1 };
        addToActivityLog('Ativado', nutri.nome);
      } else if (action === 'deactivate') {
        updateData = { ativo: 0 };
        addToActivityLog('Desativado', nutri.nome);
      }
      
      if (Object.keys(updateData).length > 0) {
        await nutricionistasAPI.update(id, updateData);
      }

      // Recarregar todos os dados
      await reloadData();
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

  const currentAdmin = JSON.parse(localStorage.getItem('currentAdmin'));
  const headerLinks = [
    { href: '/', text: 'Início' },
    { href: '/admin-login', text: 'Sair' }
  ];

  const stats = getStats();

  return (
    <div className="public-theme" style={{backgroundImage: `url(${fundoImage})`}}>
      <style>{`
        .admin-profile-btn:hover {
          background: #059669 !important;
        }
      `}</style>
      <Header theme="admin" links={headerLinks} />
      
      <main className="form-section" style={{minHeight: 'calc(100vh - 80px)', padding: '2rem 1rem'}}>
        <div className="info-card" style={{maxWidth: '1400px', width: '95%'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
            <h1 className="info-title" style={{margin: 0}}>Dashboard do Administrador</h1>
            <div 
              className="admin-profile-btn"
              style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                background: '#10b981', 
                color: 'white', 
                padding: '0.5rem 1rem', 
                borderRadius: '8px', 
                fontSize: '0.9rem', 
                cursor: 'pointer'
              }}
              onClick={() => setActiveTab('profile')}
            >
              <div 
                style={{
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  backgroundImage: currentAdmin?.foto ? `url(${currentAdmin.foto})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}
              >
                {!currentAdmin?.foto && '👤'}
              </div>
              {JSON.parse(localStorage.getItem('currentAdmin'))?.nome || 'Admin'}
            </div>
          </div>
          
          <div style={{display: 'flex', justifyContent: 'center', marginBottom: '2rem', gap: '0.5rem', flexWrap: 'wrap'}}>
            <button 
              className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Dashboard
            </button>
            <button 
              className={`btn ${activeTab === 'manage' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('manage')}
            >
              👩‍⚕️ Nutricionistas
            </button>
            <button 
              className={`btn ${activeTab === 'activity' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('activity')}
            >
              📋 Atividades
            </button>
            <button 
              className={`btn ${activeTab === 'patients' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('patients')}
            >
              🏥 Pacientes
            </button>
            <button 
              className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('reports')}
            >
              📈 Relatórios
            </button>
            <button 
              className={`btn ${activeTab === 'admins' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('admins')}
            >
              👤 Admins
            </button>

            <button 
              className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('settings')}
            >
              ⚙️ Configurações
            </button>
          </div>

          {activeTab === 'dashboard' && (
            <>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem'}}>
                <div style={{background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '1.5rem', borderRadius: '16px', textAlign: 'center'}}>
                  <h3 style={{margin: '0 0 0.5rem 0', fontSize: '2rem'}}>{stats.total}</h3>
                  <p style={{margin: 0, opacity: 0.9}}>Total Nutricionistas</p>
                </div>
                <div style={{background: 'linear-gradient(135deg, #f093fb, #f5576c)', color: 'white', padding: '1.5rem', borderRadius: '16px', textAlign: 'center'}}>
                  <h3 style={{margin: '0 0 0.5rem 0', fontSize: '2rem'}}>{stats.approved}</h3>
                  <p style={{margin: 0, opacity: 0.9}}>Aprovados</p>
                </div>
                <div style={{background: 'linear-gradient(135deg, #4facfe, #00f2fe)', color: 'white', padding: '1.5rem', borderRadius: '16px', textAlign: 'center'}}>
                  <h3 style={{margin: '0 0 0.5rem 0', fontSize: '2rem'}}>{systemStats.totalPacientes || 0}</h3>
                  <p style={{margin: 0, opacity: 0.9}}>Total Pacientes</p>
                </div>
                <div style={{background: 'linear-gradient(135deg, #43e97b, #38f9d7)', color: 'white', padding: '1.5rem', borderRadius: '16px', textAlign: 'center'}}>
                  <h3 style={{margin: '0 0 0.5rem 0', fontSize: '2rem'}}>{systemStats.solicitacoesPendentes || 0}</h3>
                  <p style={{margin: 0, opacity: 0.9}}>Solicitações Pendentes</p>
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
                            {consultResult.status ? consultResult.status.toUpperCase() : 'N/A'}
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
                            handleNutriAction(consultResult.Id, 'delete');
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
            <div style={{display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginBottom: '2rem'}}>
              <div style={{background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb'}}>
                <h3 style={{color: '#10b981', marginBottom: '1rem', fontSize: '1.2rem'}}>Adicionar Nutricionista</h3>
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

              <div style={{background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb'}}>
                <h3 style={{color: '#10b981', marginBottom: '1rem', fontSize: '1.2rem'}}>Nutricionistas ({getFilteredNutris().length})</h3>
                
                <div style={{marginBottom: '1rem', display: 'flex', gap: '1rem'}}>
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px'}}
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px'}}
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendentes</option>
                    <option value="approved">Aprovados</option>
                    <option value="rejected">Rejeitados</option>
                  </select>
                </div>
                
                <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                  {getFilteredNutris().length === 0 ? (
                    <div style={{textAlign: 'center', color: '#6b7280', padding: '2rem'}}>Nenhum nutricionista encontrado</div>
                  ) : (
                    getFilteredNutris().map(nutri => (
                      <div key={nutri.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'white', borderRadius: '8px', marginBottom: '0.5rem', border: '1px solid #e5e7eb'}}>
                        <div>
                          <div style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{nutri.nome}</div>
                          <div style={{color: '#6b7280', fontSize: '0.9rem'}}>{nutri.email} • CRN: {nutri.crn}</div>
                        </div>
                        <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            color: 'white',
                            background: nutri.status === 'approved' ? '#10b981' : 
                                       nutri.status === 'pending' ? '#f59e0b' : '#ef4444'
                          }}>
                            {nutri.status === 'approved' ? 'APROVADO' : nutri.status === 'pending' ? 'PENDENTE' : 'REJEITADO'}
                          </span>
                          {nutri.status === 'approved' && (
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              color: 'white',
                              background: nutri.ativo !== false ? '#059669' : '#dc2626'
                            }}>
                              {nutri.ativo !== false ? 'ATIVO' : 'INATIVO'}
                            </span>
                          )}
                          {nutri.status === 'pending' && (
                            <button 
                              style={{padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer'}}
                              onClick={() => handleNutriAction(nutri.id, 'approve')}
                            >
                              Aprovar
                            </button>
                          )}
                          {nutri.status === 'approved' && (
                            <button 
                              style={{padding: '0.5rem 1rem', background: nutri.ativo !== false ? '#f59e0b' : '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer'}}
                              onClick={() => handleNutriAction(nutri.id, nutri.ativo !== false ? 'deactivate' : 'activate')}
                            >
                              {nutri.ativo !== false ? 'Desativar' : 'Ativar'}
                            </button>
                          )}
                          <button 
                            style={{padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer'}}
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
                        <small style={{color: 'var(--gray-500)'}}>{new Date(activity.timestamp).toLocaleString()}</small>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div style={{marginTop: '1rem', display: 'flex', gap: '1rem'}}>
                <button 
                  className="btn btn-primary" 
                  style={{flex: 1}}
                  onClick={() => {
                    const doc = new jsPDF();
                    const date = new Date().toLocaleDateString();
                    const time = new Date().toLocaleTimeString();
                    
                    // Cabeçalho
                    doc.setFillColor(16, 185, 129);
                    doc.rect(0, 0, 210, 30, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(24);
                    doc.text('NUTRIFYBE', 20, 20);
                    doc.setFontSize(12);
                    doc.text('Log de Atividades do Sistema', 20, 26);
                    doc.setFontSize(10);
                    doc.text(`${date} - ${time}`, 150, 20);
                    
                    // Título
                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(16);
                    doc.text('Histórico de Atividades', 20, 45);
                    
                    // Estatísticas
                    doc.setFontSize(12);
                    doc.text(`Total de atividades: ${activityLog.length}`, 20, 55);
                    
                    // Lista de atividades
                    let yPos = 70;
                    doc.setFontSize(9);
                    
                    if (activityLog.length === 0) {
                      doc.setTextColor(128, 128, 128);
                      doc.text('Nenhuma atividade registrada.', 20, yPos);
                    } else {
                      activityLog.forEach((activity, index) => {
                        if (yPos > 270) {
                          doc.addPage();
                          yPos = 20;
                        }
                        
                        // Linha separadora
                        doc.setDrawColor(200, 200, 200);
                        doc.line(20, yPos - 2, 190, yPos - 2);
                        
                        // Ação
                        doc.setTextColor(16, 185, 129);
                        doc.setFont(undefined, 'bold');
                        doc.text(`${index + 1}. ${activity.action}`, 20, yPos);
                        
                        // Usuário
                        doc.setTextColor(0, 0, 0);
                        doc.setFont(undefined, 'normal');
                        doc.text(`Usuário: ${activity.nutriName}`, 25, yPos + 6);
                        
                        // Data
                        doc.setTextColor(128, 128, 128);
                        doc.text(`Data: ${new Date(activity.timestamp).toLocaleString()}`, 25, yPos + 12);
                        
                        yPos += 20;
                      });
                    }
                    
                    // Rodapé
                    const pageCount = doc.internal.getNumberOfPages();
                    for (let i = 1; i <= pageCount; i++) {
                      doc.setPage(i);
                      doc.setFontSize(8);
                      doc.setTextColor(128, 128, 128);
                      doc.text(`Página ${i} de ${pageCount}`, 20, 290);
                      doc.text('Nutrifybe - Log de Atividades', 150, 290);
                    }
                    
                    doc.save(`Log_Atividades_Nutrifybe_${new Date().toISOString().split('T')[0]}.pdf`);
                  }}
                >
                  📄 Exportar Log (PDF)
                </button>
                <button 
                  className="btn btn-warning" 
                  style={{flex: 1}}
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
                  🗑️ Limpar Histórico
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'patients' && (
            <div style={{background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                <h3 style={{color: '#10b981', margin: 0, fontSize: '1.2rem'}}>Pacientes ({allPatients.length})</h3>
                <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                  <span style={{color: '#6b7280', fontSize: '0.9rem'}}>Ativos: {allPatients.filter(p => p.ativo === true).length}</span>
                  <span style={{color: '#6b7280', fontSize: '0.9rem'}}>Inativos: {allPatients.filter(p => p.ativo !== true).length}</span>
                </div>
              </div>
              
              <div style={{maxHeight: '500px', overflowY: 'auto', border: '1px solid #f3f4f6', borderRadius: '8px', padding: '0.5rem'}}>
                {allPatients.length === 0 ? (
                  <p className="no-items-message">Nenhum paciente encontrado.</p>
                ) : (
                  allPatients.map(patient => {
                    const nutri = managedNutricionists.find(n => n.id === patient.nutricionista_id);
                    return (
                      <div key={patient.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: patient.ativo === true ? '#f9fafb' : '#fef2f2', borderRadius: '8px', marginBottom: '0.5rem', border: `1px solid ${patient.ativo === true ? '#e5e7eb' : '#fecaca'}`}}>
                        <div style={{flex: 1}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem'}}>
                            <div style={{fontWeight: 'bold', fontSize: '1.1rem', color: patient.ativo === true ? '#111827' : '#6b7280'}}>{patient.nome}</div>
                            <div style={{fontSize: '0.8rem', color: '#6b7280'}}>#{patient.id}</div>
                          </div>
                          <div style={{color: '#6b7280', fontSize: '0.85rem', lineHeight: '1.4'}}>
                            📧 {patient.email}
                            <br />
                            👩‍⚕️ {nutri?.nome || 'Sem nutricionista'} • 🎯 {patient.objetivo}
                            <br />
                            📅 {new Date(patient.data_criacao).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end'}}>
                          <span style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            color: 'white',
                            background: patient.ativo === true ? '#10b981' : '#ef4444'
                          }}>
                            {patient.ativo === true ? '✓ ATIVO' : '✗ INATIVO'}
                          </span>
                          <div style={{display: 'flex', gap: '0.5rem'}}>
                            <button 
                              style={{
                                padding: '0.4rem 0.8rem', 
                                background: patient.ativo === true ? '#f59e0b' : '#10b981', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '6px', 
                                fontSize: '0.75rem', 
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                              onClick={async () => {
                                try {
                                  await api.pacientesAPI.update(patient.id, { ativo: patient.ativo === true ? 0 : 1 });
                                  addToActivityLog(patient.ativo === true ? 'Paciente Desativado' : 'Paciente Ativado', patient.nome);
                                  await reloadData();
                                } catch (error) {
                                  alert('Erro ao alterar status do paciente.');
                                }
                              }}
                            >
                              {patient.ativo === true ? '🚫 Desativar' : '✓ Ativar'}
                            </button>
                            <button 
                              style={{
                                padding: '0.4rem 0.8rem', 
                                background: '#ef4444', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '6px', 
                                fontSize: '0.75rem', 
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                              onClick={async () => {
                                if (window.confirm(`Excluir paciente ${patient.nome}?`)) {
                                  try {
                                    await api.pacientesAPI.delete(patient.id);
                                    addToActivityLog('Paciente Excluído', patient.nome);
                                    await reloadData();
                                  } catch (error) {
                                    alert('Erro ao excluir paciente.');
                                  }
                                }
                              }}
                            >
                              🗑️ Excluir
                            </button>
                          </div>
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
                    const date = new Date().toLocaleDateString();
                    const time = new Date().toLocaleTimeString();
                    
                    // Cabeçalho com logo
                    doc.setFillColor(16, 185, 129);
                    doc.rect(0, 0, 210, 30, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(24);
                    doc.text('NUTRIFYBE', 20, 20);
                    doc.setFontSize(12);
                    doc.text('Sistema de Gestão Nutricional', 20, 26);
                    
                    // Data e hora
                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(10);
                    doc.text(`Gerado em: ${date} às ${time}`, 150, 20);
                    
                    // Título do relatório
                    doc.setFontSize(18);
                    doc.text('Relatório de Pacientes', 20, 45);
                    
                    // Estatísticas em caixas
                    const stats = [
                      { label: 'Total', value: allPatients.length, color: [59, 130, 246] },
                      { label: 'Ativos', value: allPatients.filter(p => p.ativo === true).length, color: [16, 185, 129] },
                      { label: 'Inativos', value: allPatients.filter(p => p.ativo !== true).length, color: [239, 68, 68] }
                    ];
                    
                    stats.forEach((stat, index) => {
                      const x = 20 + (index * 60);
                      doc.setFillColor(...stat.color);
                      doc.rect(x, 55, 50, 20, 'F');
                      doc.setTextColor(255, 255, 255);
                      doc.setFontSize(16);
                      doc.text(stat.value.toString(), x + 25, 63, { align: 'center' });
                      doc.setFontSize(10);
                      doc.text(stat.label, x + 25, 70, { align: 'center' });
                    });
                    
                    // Lista de pacientes
                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(14);
                    doc.text('Lista Detalhada de Pacientes', 20, 90);
                    
                    let yPos = 100;
                    doc.setFontSize(9);
                    
                    allPatients.forEach((patient, index) => {
                      if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                      }
                      
                      const nutri = managedNutricionists.find(n => n.Id === patient.NutricionistaId);
                      const status = patient.ativo === true ? 'ATIVO' : 'INATIVO';
                      const statusColor = patient.ativo === true ? [16, 185, 129] : [239, 68, 68];
                      
                      // Linha separadora
                      doc.setDrawColor(200, 200, 200);
                      doc.line(20, yPos - 2, 190, yPos - 2);
                      
                      // Nome e ID
                      doc.setFontSize(11);
                      doc.setFont(undefined, 'bold');
                      doc.text(`${index + 1}. ${patient.Nome}`, 20, yPos);
                      doc.setTextColor(...statusColor);
                      doc.text(`[${status}]`, 150, yPos);
                      
                      // Detalhes
                      doc.setTextColor(0, 0, 0);
                      doc.setFont(undefined, 'normal');
                      doc.setFontSize(9);
                      yPos += 8;
                      doc.text(`Email: ${patient.Email}`, 25, yPos);
                      yPos += 6;
                      doc.text(`Nutricionista: ${nutri?.Nome || 'Não atribuído'}`, 25, yPos);
                      yPos += 6;
                      doc.text(`Objetivo: ${patient.Objetivo || 'Não informado'}`, 25, yPos);
                      yPos += 6;
                      doc.text(`Cadastro: ${new Date(patient.DataCadastro).toLocaleDateString()}`, 25, yPos);
                      yPos += 12;
                    });
                    
                    // Rodapé
                    const pageCount = doc.internal.getNumberOfPages();
                    for (let i = 1; i <= pageCount; i++) {
                      doc.setPage(i);
                      doc.setFontSize(8);
                      doc.setTextColor(128, 128, 128);
                      doc.text(`Página ${i} de ${pageCount}`, 20, 290);
                      doc.text('Nutrifybe - Sistema de Gestão Nutricional', 150, 290);
                    }
                    
                    doc.save(`Pacientes_Nutrifybe_${new Date().toISOString().split('T')[0]}.pdf`);
                  }}
                >
                  📄 Exportar Pacientes (PDF)
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
                        <small style={{color: '#6b7280'}}>{new Date(activity.timestamp).toLocaleString()}</small>
                      </div>
                    ))
                  </div>
                </div>
              </div>
              
              <div style={{marginTop: '2rem', textAlign: 'center', display: 'flex', gap: '1rem', justifyContent: 'center'}}>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    const doc = new jsPDF();
                    const date = new Date().toLocaleDateString();
                    const time = new Date().toLocaleTimeString();
                    
                    // Cabeçalho com logo
                    doc.setFillColor(16, 185, 129);
                    doc.rect(0, 0, 210, 35, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(28);
                    doc.text('NUTRIFYBE', 20, 22);
                    doc.setFontSize(12);
                    doc.text('Relatório Executivo do Sistema', 20, 30);
                    
                    // Data e hora
                    doc.setFontSize(10);
                    doc.text(`${date} - ${time}`, 150, 25);
                    
                    // Estatísticas em dashboard
                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(16);
                    doc.text('Dashboard Executivo', 20, 50);
                    
                    const dashboardStats = [
                      { label: 'Nutricionistas', value: managedNutricionists.length, active: systemStats.nutricionistasAtivos },
                      { label: 'Pacientes', value: systemStats.totalPacientes, active: systemStats.pacientesAtivos },
                      { label: 'Solicitações', value: systemStats.solicitacoesPendentes, active: 0 }
                    ];
                    
                    let xPos = 20;
                    dashboardStats.forEach((stat) => {
                      // Caixa principal
                      doc.setFillColor(248, 250, 252);
                      doc.rect(xPos, 60, 55, 30, 'F');
                      doc.setDrawColor(226, 232, 240);
                      doc.rect(xPos, 60, 55, 30);
                      
                      // Números
                      doc.setFontSize(20);
                      doc.setTextColor(16, 185, 129);
                      doc.text(stat.value.toString(), xPos + 27, 75, { align: 'center' });
                      
                      // Label
                      doc.setFontSize(10);
                      doc.setTextColor(0, 0, 0);
                      doc.text(stat.label, xPos + 27, 82, { align: 'center' });
                      
                      // Ativos (se aplicável)
                      if (stat.active > 0) {
                        doc.setFontSize(8);
                        doc.setTextColor(34, 197, 94);
                        doc.text(`${stat.active} ativos`, xPos + 27, 87, { align: 'center' });
                      }
                      
                      xPos += 60;
                    });
                    
                    // Lista de Nutricionistas
                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(14);
                    doc.text('Nutricionistas Cadastrados', 20, 110);
                    
                    let yPos = 120;
                    doc.setFontSize(9);
                    managedNutricionists.forEach((nutri, index) => {
                      if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                      }
                      const statusColor = nutri.Status === 'approved' ? [34, 197, 94] : [239, 68, 68];
                      doc.setTextColor(0, 0, 0);
                      doc.text(`${index + 1}. ${nutri.Nome}`, 20, yPos);
                      doc.text(nutri.Email, 80, yPos);
                      doc.setTextColor(...statusColor);
                      doc.text(nutri.Status?.toUpperCase() || 'N/A', 150, yPos);
                      yPos += 8;
                    });
                    
                    // Nova página para pacientes se necessário
                    if (yPos > 200) {
                      doc.addPage();
                      yPos = 20;
                    }
                    
                    // Lista de Pacientes
                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(14);
                    doc.text('Pacientes Cadastrados', 20, yPos);
                    yPos += 10;
                    
                    doc.setFontSize(9);
                    allPatients.forEach((patient, index) => {
                      if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                      }
                      const statusColor = patient.ativo === true ? [34, 197, 94] : [239, 68, 68];
                      doc.setTextColor(0, 0, 0);
                      doc.text(`${index + 1}. ${patient.Nome}`, 20, yPos);
                      doc.text(patient.Email, 80, yPos);
                      doc.setTextColor(...statusColor);
                      doc.text(patient.ativo === true ? 'ATIVO' : 'INATIVO', 150, yPos);
                      yPos += 8;
                    });
                    
                    // Rodapé
                    const pageCount = doc.internal.getNumberOfPages();
                    for (let i = 1; i <= pageCount; i++) {
                      doc.setPage(i);
                      doc.setFontSize(8);
                      doc.setTextColor(128, 128, 128);
                      doc.text(`Página ${i} de ${pageCount}`, 20, 290);
                      doc.text('Nutrifybe - Relatório Confidencial', 150, 290);
                    }
                    
                    doc.save(`Relatorio_Executivo_Nutrifybe_${new Date().toISOString().split('T')[0]}.pdf`);
                  }}
                >
                  📈 Exportar Relatório (PDF)
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    const data = {
                      nutricionistas: managedNutricionists,
                      pacientes: allPatients,
                      atividades: activityLog,
                      estatisticas: systemStats,
                      dataExportacao: new Date().toLocaleString()
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
          
          {activeTab === 'admins' && (
            <div style={{background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb'}}>
              <h3 style={{color: '#10b981', marginBottom: '1.5rem', fontSize: '1.2rem'}}>Gerenciar Administradores ({allAdmins.length})</h3>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem'}}>
                <div style={{background: '#f9fafb', padding: '1.5rem', borderRadius: '8px'}}>
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
                      await adminAPI.create(adminData);
                      const updatedAdmins = await adminAPI.getAll();
                      setAllAdmins(updatedAdmins);
                      alert('Admin criado com sucesso!');
                      e.target.reset();
                      addToActivityLog('Admin Criado', adminData.nome);
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
                
                <div>
                  <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                    {allAdmins.length === 0 ? (
                      <div style={{textAlign: 'center', color: '#6b7280', padding: '2rem'}}>Nenhum admin encontrado</div>
                    ) : (
                      allAdmins.map(admin => (
                        <div key={admin.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '8px', marginBottom: '0.5rem', border: '1px solid #e5e7eb'}}>
                          <div>
                            <div style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{admin.nome}</div>
                            <div style={{color: '#6b7280', fontSize: '0.9rem'}}>{admin.email}</div>
                            <div style={{color: '#6b7280', fontSize: '0.8rem'}}>{new Date(admin.dataCriacao).toLocaleDateString()}</div>
                          </div>
                          {admin.id !== currentAdmin?.id && allAdmins.length > 1 ? (
                            <button 
                              style={{padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer'}}
                              onClick={async () => {
                                if (window.confirm(`Tem certeza que deseja excluir o admin ${admin.nome}?\n\nEsta ação não pode ser desfeita!`)) {
                                  try {
                                    await adminAPI.delete(admin.id);
                                    const updatedAdmins = await adminAPI.getAll();
                                    setAllAdmins(updatedAdmins);
                                    addToActivityLog('Admin Excluído', admin.nome);
                                    alert('Admin excluído com sucesso!');
                                  } catch (error) {
                                    alert('Erro ao excluir admin.');
                                  }
                                }
                              }}
                            >
                              🗑️ Excluir
                            </button>
                          ) : (
                            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem'}}>
                              <span style={{padding: '0.5rem 1rem', background: '#9ca3af', color: 'white', borderRadius: '6px', fontSize: '0.8rem', cursor: 'not-allowed'}}>
                                {admin.id === currentAdmin?.id ? '🚫 Você mesmo' : '🚫 Último admin'}
                              </span>
                              <small style={{color: '#6b7280', fontSize: '0.7rem', textAlign: 'center'}}>
                                {admin.id === currentAdmin?.id ? 'Não pode se excluir' : 'Deve ter pelo menos 1 admin'}
                              </small>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'profile' && (
            <div style={{background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e5e7eb'}}>
              <h3 style={{color: '#10b981', marginBottom: '2rem', fontSize: '1.4rem', textAlign: 'center'}}>Meu Perfil</h3>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '3rem', alignItems: 'start'}}>
                <div style={{textAlign: 'center'}}>
                  <div style={{position: 'relative', display: 'inline-block', marginBottom: '1rem'}}>
                    <div 
                      style={{
                        width: '120px', 
                        height: '120px', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '3rem', 
                        color: 'white',
                        backgroundImage: currentAdmin?.foto ? `url(${currentAdmin.foto})` : 'linear-gradient(135deg, #10b981, #059669)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        cursor: 'pointer',
                        border: '3px solid #e5e7eb'
                      }}
                      onClick={() => document.getElementById('photoInput').click()}
                    >
                      {!currentAdmin?.foto && '👤'}
                    </div>
                    <input 
                      id="photoInput" 
                      type="file" 
                      accept="image/*" 
                      style={{display: 'none'}} 
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const canvas = document.createElement('canvas');
                          const ctx = canvas.getContext('2d');
                          const img = new Image();
                          
                          img.onload = async () => {
                            canvas.width = 200;
                            canvas.height = 200;
                            ctx.drawImage(img, 0, 0, 200, 200);
                            const foto = canvas.toDataURL('image/jpeg', 0.7);
                            
                            try {
                              await adminAPI.update(currentAdmin.id, { foto });
                              // Atualizar localStorage
                              const updatedAdmin = { ...currentAdmin, foto };
                              localStorage.setItem('currentAdmin', JSON.stringify(updatedAdmin));
                              addToActivityLog('Foto Atualizada', currentAdmin.nome);
                              alert('Foto atualizada com sucesso!');
                              // Forçar re-render
                              setActiveTab('dashboard');
                              setTimeout(() => setActiveTab('profile'), 100);
                            } catch (error) {
                              alert('Erro ao atualizar foto: ' + error.message);
                            }
                          };
                          
                          const reader = new FileReader();
                          reader.onload = (e) => img.src = e.target.result;
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div style={{position: 'absolute', bottom: '5px', right: '5px', background: '#10b981', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', cursor: 'pointer'}}>
                      📷
                    </div>
                    {currentAdmin?.foto && (
                      <div 
                        style={{position: 'absolute', bottom: '5px', left: '5px', background: '#ef4444', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', cursor: 'pointer'}}
                        onClick={async () => {
                          if (window.confirm('Remover foto de perfil?')) {
                            try {
                              await adminAPI.update(currentAdmin.id, { foto: null });
                              // Atualizar localStorage
                              const updatedAdmin = { ...currentAdmin, foto: null };
                              localStorage.setItem('currentAdmin', JSON.stringify(updatedAdmin));
                              addToActivityLog('Foto Removida', currentAdmin.nome);
                              alert('Foto removida com sucesso!');
                              // Forçar re-render
                              setActiveTab('dashboard');
                              setTimeout(() => setActiveTab('profile'), 100);
                            } catch (error) {
                              alert('Erro ao remover foto.');
                            }
                          }
                        }}
                      >
                        🗑️
                      </div>
                    )}
                  </div>
                  <h4 style={{margin: '0 0 0.5rem 0', color: '#374151'}}>{currentAdmin?.nome}</h4>
                  <p style={{color: '#6b7280', fontSize: '0.9rem', margin: '0 0 0.5rem 0'}}>Administrador</p>
                  <div style={{background: '#f3f4f6', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', color: '#6b7280'}}>
                    <div style={{marginBottom: '0.25rem'}}><strong>Email:</strong> {currentAdmin?.email}</div>
                    <div><strong>ID:</strong> #{currentAdmin?.id}</div>
                  </div>
                </div>
                
                <div>
                  <div style={{background: '#f9fafb', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem'}}>
                    <h5 style={{margin: '0 0 1rem 0', color: '#374151'}}>Editar Informações</h5>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      const nome = formData.get('nome');
                      const email = formData.get('email');
                      
                      try {
                        await adminAPI.update(currentAdmin.id, { nome, email });
                        // Atualizar localStorage
                        const updatedAdmin = { ...currentAdmin, nome, email };
                        localStorage.setItem('currentAdmin', JSON.stringify(updatedAdmin));
                        alert('Informações atualizadas com sucesso!');
                        addToActivityLog('Perfil Atualizado', nome);
                        // Forçar re-render
                        setActiveTab('dashboard');
                        setTimeout(() => setActiveTab('profile'), 100);
                      } catch (error) {
                        alert('Erro ao atualizar informações.');
                      }
                    }}>
                      <div className="form-group">
                        <label className="form-label">Nome</label>
                        <input type="text" name="nome" className="form-input" defaultValue={currentAdmin?.nome} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input type="email" name="email" className="form-input" defaultValue={currentAdmin?.email} required />
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: '1px solid #e5e7eb', marginTop: '1rem', paddingTop: '1rem'}}>
                        <span style={{fontWeight: '500', color: '#374151'}}>Membro desde:</span>
                        <span style={{color: '#6b7280'}}>{new Date(currentAdmin?.dataCriacao).toLocaleDateString()}</span>
                      </div>
                      <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}}>Salvar Alterações</button>
                    </form>
                  </div>
                  
                  <div style={{background: '#f9fafb', padding: '1.5rem', borderRadius: '8px'}}>
                    <h5 style={{margin: '0 0 1rem 0', color: '#374151'}}>Alterar Senha</h5>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      const senhaAtual = formData.get('senhaAtual');
                      const novaSenha = formData.get('novaSenha');
                      const confirmarSenha = formData.get('confirmarSenha');
                      
                      if (senhaAtual !== currentAdmin?.senha) {
                        alert('Senha atual incorreta!');
                        return;
                      }
                      
                      if (novaSenha !== confirmarSenha) {
                        alert('Nova senha e confirmação não coincidem!');
                        return;
                      }
                      
                      if (novaSenha.length < 6) {
                        alert('Nova senha deve ter pelo menos 6 caracteres!');
                        return;
                      }
                      
                      try {
                        await adminAPI.update(currentAdmin.id, { senha: novaSenha });
                        const updatedAdmin = { ...currentAdmin, senha: novaSenha };
                        localStorage.setItem('currentAdmin', JSON.stringify(updatedAdmin));
                        alert('Senha alterada com sucesso!');
                        e.target.reset();
                        addToActivityLog('Senha Alterada', currentAdmin.nome);
                      } catch (error) {
                        alert('Erro ao alterar senha.');
                      }
                    }}>
                      <div className="form-group">
                        <label className="form-label">Senha Atual</label>
                        <input type="password" name="senhaAtual" className="form-input" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Nova Senha</label>
                        <input type="password" name="novaSenha" className="form-input" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Confirmar Nova Senha</label>
                        <input type="password" name="confirmarSenha" className="form-input" required />
                      </div>
                      <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Alterar Senha</button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div style={{background: 'var(--gray-50)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--gray-200)'}}>
              <h3 style={{color: 'var(--accent-green)', marginBottom: '1.5rem', textAlign: 'center'}}>Configurações do Sistema</h3>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
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
                    <li style={{padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6'}}>Versão: <strong>2.0.0</strong></li>
                    <li style={{padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6'}}>Banco: <strong>SQL Server</strong></li>
                    <li style={{padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6'}}>Servidor: <strong>SQL Server Somee.com</strong></li>
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