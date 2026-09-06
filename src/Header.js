import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { nutricionistasAPI, solicitacoesAPI } from './services/api';

const Header = ({ theme = 'public', links = [] }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({ nome: '', email: '', telefone: '', especialidade: '', foto: '' });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [pendingCount, setPendingCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Fechar menu mobile ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest('nav')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [mobileMenuOpen]);

  // Fechar menu mobile ao redimensionar tela
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (theme === 'nutri') {
      const loadUserData = async () => {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (user.id || user.Id) {
          try {
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
            setCurrentUser(user);
            setFormData({
              nome: user.nome || user.Nome || '',
              email: user.email || user.Email || '',
              telefone: user.telefone || user.Telefone || '',
              especialidade: user.especialidade || user.Especialidade || '',
              foto: user.foto || user.Foto || ''
            });
          }
        }
      };
      loadUserData();
    }
  }, [theme]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Sanitização avançada contra XSS
    const sanitizedValue = value
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newFoto = event.target.result;
        setFormData(prev => ({ ...prev, foto: newFoto }));
        console.log('Foto carregada:', newFoto ? 'Sim' : 'Não');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    try {
      await nutricionistasAPI.update(currentUser.id || currentUser.Id, formData);
      
      // Buscar dados atualizados do banco
      const updatedUserFromDB = await nutricionistasAPI.getById(currentUser.id || currentUser.Id);
      
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
      setProfileDropdown(false);
      
      // Recarregar a página para sincronizar todos os componentes
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao atualizar perfil.');
    }
  };

  useEffect(() => {
    if (theme !== 'minimal') return;
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = user.id || user.Id;
    if (!userId) return;
    solicitacoesAPI.getByNutricionista(userId)
      .then(s => setPendingCount(s.length))
      .catch(() => {});
  }, [theme]);

  if (theme === 'admin-minimal') {
    return (
      <div style={{
        position: 'fixed', top: 0, right: 0, zIndex: 9999,
        padding: '1rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        pointerEvents: 'none'
      }}>
        <button
          onClick={toggleDarkMode}
          style={{
            pointerEvents: 'all',
            background: darkMode ? 'rgba(32,34,40,0.85)' : 'rgba(255,255,255,0.85)',
            border: darkMode ? '1px solid #2A2D32' : '1px solid #e5e7eb',
            borderRadius: '50%', width: '38px', height: '38px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', backdropFilter: 'blur(10px)'
          }}
          title={darkMode ? 'Modo claro' : 'Modo escuro'}
        >
          {darkMode ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
        <a
          href="/"
          title="Sair"
          style={{
            pointerEvents: 'all',
            background: darkMode ? 'rgba(32,34,40,0.85)' : 'rgba(255,255,255,0.85)',
            border: darkMode ? '1px solid #2A2D32' : '1px solid #e5e7eb',
            borderRadius: '50%', width: '38px', height: '38px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', backdropFilter: 'blur(10px)',
            textDecoration: 'none', color: darkMode ? '#9B9DA5' : '#6b7280',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.color = darkMode ? '#9B9DA5' : '#6b7280'; e.currentTarget.style.borderColor = darkMode ? '#2A2D32' : '#e5e7eb'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </a>
      </div>
    );
  }

  if (theme === 'minimal') {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userName = user.nome || user.Nome || 'Perfil';
    const userFoto = user.foto || user.Foto || '';
    return (
      <div style={{
        position: 'fixed', top: 0, right: 0, zIndex: 9999,
        padding: '1rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        pointerEvents: 'none'
      }}>
        <button
          onClick={toggleDarkMode}
          style={{
            pointerEvents: 'all',
            background: darkMode ? 'rgba(32,34,40,0.85)' : 'rgba(255,255,255,0.85)',
            border: darkMode ? '1px solid #2A2D32' : '1px solid #e5e7eb',
            borderRadius: '50%', width: '38px', height: '38px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', backdropFilter: 'blur(10px)'
          }}
          title={darkMode ? 'Modo claro' : 'Modo escuro'}
        >
          {darkMode ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
        <Link
          to="/nutri-solicitacoes"
          title="Solicitações Pendentes"
          style={{
            pointerEvents: 'all',
            background: darkMode ? 'rgba(32,34,40,0.85)' : 'rgba(255,255,255,0.85)',
            border: darkMode ? '1px solid #2A2D32' : '1px solid #e5e7eb',
            borderRadius: '20px', height: '38px',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0 0.75rem',
            cursor: 'pointer', backdropFilter: 'blur(10px)',
            textDecoration: 'none', color: darkMode ? '#F1F1F3' : '#374151',
            fontSize: '0.85rem', fontWeight: 600, position: 'relative'
          }}
        >
          <div style={{ position: 'relative' }}>
            <i className="fas fa-bell" style={{ fontSize: '0.8rem', color: darkMode ? '#A78BFA' : '#06b6d4' }}></i>
            {pendingCount > 0 && (
              <span style={{
                position: 'absolute', top: '-6px', right: '-6px',
                background: '#ef4444', color: 'white',
                borderRadius: '50%', width: '14px', height: '14px',
                fontSize: '0.6rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>!</span>
            )}
          </div>
          Solicitações
        </Link>
        <Link
          to="/nutri-perfil"
          title="Meu Perfil"
          style={{
            pointerEvents: 'all',
            background: darkMode ? 'rgba(32,34,40,0.85)' : 'rgba(255,255,255,0.85)',
            border: darkMode ? '1px solid #2A2D32' : '1px solid #e5e7eb',
            borderRadius: '20px', height: '38px',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0 0.75rem',
            cursor: 'pointer', backdropFilter: 'blur(10px)',
            textDecoration: 'none', color: darkMode ? '#F1F1F3' : '#374151',
            fontSize: '0.85rem', fontWeight: 600
          }}
        >
          <div style={{
            width: '24px', height: '24px', borderRadius: '50%',
            overflow: 'hidden', background: darkMode ? '#202228' : '#e0f2fe',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            {userFoto
              ? <img src={userFoto} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <i className="fas fa-user" style={{ color: '#06b6d4', fontSize: '0.7rem' }}></i>
            }
          </div>
          {userName}
        </Link>
        <a
          href="/"
          title="Voltar ao início"
          style={{
            pointerEvents: 'all',
            background: darkMode ? 'rgba(32,34,40,0.85)' : 'rgba(255,255,255,0.85)',
            border: darkMode ? '1px solid #2A2D32' : '1px solid #e5e7eb',
            borderRadius: '50%', width: '38px', height: '38px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', backdropFilter: 'blur(10px)',
            textDecoration: 'none', color: darkMode ? '#9B9DA5' : '#6b7280',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.color = darkMode ? '#9B9DA5' : '#6b7280'; e.currentTarget.style.borderColor = darkMode ? '#2A2D32' : '#e5e7eb'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </a>
      </div>
    );
  }

  return (
    <header className={theme === 'nutri' ? 'nutri-theme' : theme === 'admin' ? 'admin-theme' : ''}>
      <div className="container">
        {theme !== 'nutri' && (
          <Link to="/" className="logo">
            <span className="logo-text">
              <span className="nutri-part">Nutri</span><span className="fybe-part">fybe</span>
            </span>
          </Link>
        )}

        <button
          onClick={toggleDarkMode}
          className="dark-mode-toggle"
          aria-label="Alternar modo escuro"
          title={darkMode ? 'Modo claro' : 'Modo escuro'}
          style={theme === 'nutri' ? { position: 'absolute', right: '115px', top: '50%', transform: 'translateY(-50%)' } : {}}
        >
          {darkMode ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme === 'nutri' || theme === 'admin' ? 'white' : '#6366f1'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
        {theme === 'nutri' && (
          <>
            <div 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setProfileDropdown(!profileDropdown);
              }}
              style={{
                position: 'absolute',
                right: '60px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                zIndex: '1000'
              }}
            >
              <span style={{
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}>
                {formData.nome || 'Nutricionista'}
              </span>
              <div 
                className="profile-icon"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                  overflow: 'hidden',
                  background: !formData.foto ? 'rgba(255, 255, 255, 0.2)' : 'transparent'
                }}
              >
                {formData.foto ? (
                  <img 
                    src={formData.foto} 
                    alt="Foto do perfil" 
                    style={{width: '100%', height: '100%', objectFit: 'cover'}}
                  />
                ) : (
                  <i className="fas fa-user" style={{color: 'white', fontSize: '1.2rem'}}></i>
                )}
              </div>
            </div>
            
            {profileDropdown && (
              <div style={{
                position: 'absolute', right: '10px', top: '70px',
                background: darkMode ? '#181A1D' : 'white', borderRadius: '12px',
                boxShadow: darkMode ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.15)',
                zIndex: '9999', overflow: 'hidden',
                border: darkMode ? '1px solid #2A2D32' : '1px solid #e0e0e0', minWidth: '200px'
              }}>
                <div style={{ padding: '1rem', borderBottom: darkMode ? '1px solid #2A2D32' : '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: darkMode ? '#202228' : '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {formData.foto
                      ? <img src={formData.foto} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <i className="fas fa-user" style={{ color: '#06b6d4' }}></i>
                    }
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: darkMode ? '#F1F1F3' : '#1e293b' }}>{formData.nome}</p>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: darkMode ? '#9B9DA5' : '#64748b' }}>{formData.especialidade || 'Nutricionista'}</p>
                  </div>
                </div>
                <Link to="/nutri-perfil" onClick={() => setProfileDropdown(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', color: darkMode ? '#F1F1F3' : '#374151', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = darkMode ? '#202228' : '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <i className="fas fa-user-edit" style={{ color: '#06b6d4', width: '16px' }}></i>
                  Editar Perfil
                </Link>
                <button onClick={() => setProfileDropdown(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', color: darkMode ? '#F1F1F3' : '#374151', background: 'none', border: 'none', width: '100%', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', borderTop: darkMode ? '1px solid #2A2D32' : '1px solid #f0f0f0', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = darkMode ? '#202228' : '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <i className="fas fa-times" style={{ color: '#94a3b8', width: '16px' }}></i>
                  Fechar
                </button>
              </div>
            )}
          </>
        )}
        <nav>
          <ul className={mobileMenuOpen ? 'mobile-menu-open' : ''}>
            {links.map((link, index) => (
              <li key={index}>
                <Link 
                  to={link.href} 
                  className={location.pathname === link.href ? 'active' : ''}
                  onClick={link.onClick}
                >
                  {link.text}
                </Link>
              </li>
            ))}
          </ul>
          <button 
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
            aria-label="Menu"
            onClick={toggleMobileMenu}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;