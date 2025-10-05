import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { nutricionistasAPI } from './services/api';

const NutriPerfil = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    especialidade: '',
    foto: ''
  });
  const [loading, setLoading] = useState(false);

  const headerLinks = [
    { href: '/nutri-dashboard', text: 'Dashboard' },
    { href: '/nutri-solicitacoes', text: 'Solicitações' },
    { href: '/', text: 'Sair', onClick: () => {
      localStorage.removeItem('currentUser');
      navigate('/');
    }}
  ];

  useEffect(() => {
    const loadUserData = async () => {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (!user.id && !user.Id) {
        navigate('/login');
        return;
      }
      
      try {
        // Buscar dados atualizados do banco
        const userData = await nutricionistasAPI.getById(user.id || user.Id);
        setCurrentUser(userData);
        setFormData({
          nome: userData.nome || userData.Nome || '',
          email: userData.email || userData.Email || '',
          telefone: userData.telefone || userData.Telefone || '',
          especialidade: userData.especialidade || userData.Especialidade || '',
          foto: userData.foto || userData.Foto || ''
        });
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        // Fallback para dados do localStorage
        setCurrentUser(user);
        setFormData({
          nome: user.nome || user.Nome || '',
          email: user.email || user.Email || '',
          telefone: user.telefone || user.Telefone || '',
          especialidade: user.especialidade || user.Especialidade || '',
          foto: user.foto || user.Foto || ''
        });
      }
    };
    
    loadUserData();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Sanitizar entrada para prevenir XSS
    const sanitizedValue = value
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          foto: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const userId = currentUser.id || currentUser.Id;
      await nutricionistasAPI.update(userId, formData);
      
      // Buscar dados atualizados do banco
      const updatedUserFromDB = await nutricionistasAPI.getById(userId);
      
      // Atualizar localStorage com dados do banco
      localStorage.setItem('currentUser', JSON.stringify(updatedUserFromDB));
      
      // Atualizar estados locais
      setCurrentUser(updatedUserFromDB);
      setFormData({
        nome: updatedUserFromDB.nome || updatedUserFromDB.Nome || '',
        email: updatedUserFromDB.email || updatedUserFromDB.Email || '',
        telefone: updatedUserFromDB.telefone || updatedUserFromDB.Telefone || '',
        especialidade: updatedUserFromDB.especialidade || updatedUserFromDB.Especialidade || '',
        foto: updatedUserFromDB.foto || updatedUserFromDB.Foto || ''
      });
      
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="nutri-theme">
      <Header theme="nutri" links={headerLinks} />
      
      <main className="nutri-dashboard">
        <div className="nutri-welcome">
          <h1 className="nutri-welcome-title">Meu Perfil</h1>
          <p className="nutri-subtitle">Gerencie suas informações pessoais</p>
        </div>

        <div className="nutri-card">
          <div className="admin-close-btn" onClick={() => navigate('/nutri-dashboard')}>
            ✕
          </div>

          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem'}}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              overflow: 'hidden',
              border: '3px solid var(--secondary-cyan)'
            }}>
              {formData.foto ? (
                <img 
                  src={formData.foto} 
                  alt="Foto do perfil" 
                  style={{width: '100%', height: '100%', objectFit: 'cover'}}
                />
              ) : (
                <i className="fas fa-user" style={{fontSize: '3rem', color: '#ccc'}}></i>
              )}
            </div>
            
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{display: 'none'}}
              id="foto-upload"
            />
            <label htmlFor="foto-upload" className="btn btn-secondary" style={{cursor: 'pointer'}}>
              Alterar Foto
            </label>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem'}}>
            <div className="form-group">
              <label className="form-label">Nome Completo</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Digite seu nome completo"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Digite seu email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input
                type="tel"
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Digite seu telefone"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Especialidade</label>
              <input
                type="text"
                name="especialidade"
                value={formData.especialidade}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Digite sua especialidade"
              />
            </div>
          </div>

          <div style={{textAlign: 'center', marginTop: '2rem'}}>
            <button 
              className="btn btn-primary btn-lg"
              onClick={handleSave}
              disabled={loading}
              style={{minWidth: '200px'}}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NutriPerfil;