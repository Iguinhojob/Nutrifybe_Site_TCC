import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { nutricionistasAPI, adminAPI } from './services/api';
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
        
        setManagedNutricionists(nutricionistas);
        setActivityLog(activities);
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
        await nutricionistasAPI.update(id, { ...nutri, status: 'approved' });
        addToActivityLog('Aprovado', nutri.nome);
      } else if (action === 'reject') {
        await nutricionistasAPI.update(id, { ...nutri, status: 'rejected' });
        addToActivityLog('Rejeitado', nutri.nome);
      } else if (action === 'delete') {
        await nutricionistasAPI.delete(id);
        addToActivityLog('Excluído', nutri.nome);
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
          </div>

          {activeTab === 'dashboard' && (
            <>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem'}}>
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
                          <button 
                            className="nutri-action-btn btn-reject"
                            onClick={() => {
                              handleNutriAction(consultResult.id, 'reject');
                              setConsultResult(null);
                              setConsultMessage('');
                              setConsultCrn('');
                            }}
                          >
                            Rejeitar
                          </button>
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
                        </div>
                        <div className="nutri-actions">
                          {nutri.status === 'pending' && (
                            <>
                              <button 
                                className="nutri-action-btn btn-approve"
                                onClick={() => handleNutriAction(nutri.id, 'approve')}
                              >
                                Aprovar
                              </button>
                              <button 
                                className="nutri-action-btn btn-reject"
                                onClick={() => handleNutriAction(nutri.id, 'reject')}
                              >
                                Rejeitar
                              </button>
                            </>
                          )}
                          {nutri.status === 'approved' && (
                            <button 
                              className="nutri-action-btn btn-reject"
                              onClick={() => handleNutriAction(nutri.id, 'reject')}
                            >
                              Rejeitar
                            </button>
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
                  try {
                    await adminAPI.clearActivityLog();
                    setActivityLog([]);
                  } catch (error) {
                    console.error('Erro ao limpar histórico:', error);
                  }
                }}
              >
                Limpar Histórico
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;