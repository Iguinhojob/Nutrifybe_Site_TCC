import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { nutricionistasAPI } from './services/api';

const Header = ({ theme = 'public', links = [] }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({ nome: '', email: '', telefone: '', especialidade: '', foto: '' });
  const location = useLocation();

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

  return (
    <header className={theme === 'nutri' ? 'nutri-theme' : theme === 'admin' ? 'admin-theme' : ''}>
      <div className="container">
        <Link to="/" className="logo">
          <span className="logo-text">
            <span className="nutri-part">Nutri</span><span className="fybe-part">fybe</span>
          </span>
        </Link>
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
                position: 'absolute',
                right: '10px',
                top: '70px',
                width: '350px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                zIndex: '9999',
                padding: '20px',
                border: '1px solid #e0e0e0'
              }}>
                <div style={{textAlign: 'center', marginBottom: '15px'}}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    margin: '0 auto 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid var(--secondary-cyan)',
                    overflow: 'hidden'
                  }}>
                    {formData.foto ? (
                      <img 
                        src={formData.foto} 
                        alt="Foto do perfil" 
                        style={{width: '100%', height: '100%', objectFit: 'cover'}}
                      />
                    ) : (
                      <i className="fas fa-user" style={{fontSize: '2rem', color: '#ccc'}}></i>
                    )}
                  </div>

                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{display: 'none'}} id="foto-upload-header" />
                  <label htmlFor="foto-upload-header" style={{background: 'var(--secondary-cyan)', color: 'white', padding: '5px 15px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.9rem'}}>Alterar Foto</label>
                </div>
                
                <div style={{marginBottom: '10px'}}>
                  <input type="text" name="nome" value={formData.nome} onChange={handleInputChange} placeholder="Nome" style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '8px'}} />
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email" style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '8px'}} />
                  <input type="tel" name="telefone" value={formData.telefone} onChange={handleInputChange} placeholder="Telefone" style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '8px'}} />
                  <input type="text" name="especialidade" value={formData.especialidade} onChange={handleInputChange} placeholder="Especialidade" style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px'}} />
                </div>
                
                <div style={{display: 'flex', gap: '10px'}}>
                  <button onClick={handleSave} style={{flex: 1, background: 'var(--secondary-cyan)', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer'}}>Salvar</button>
                  <button onClick={() => setProfileDropdown(false)} style={{flex: 1, background: '#f0f0f0', color: '#666', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer'}}>Fechar</button>
                </div>
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