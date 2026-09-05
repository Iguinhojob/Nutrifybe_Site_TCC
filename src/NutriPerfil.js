import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { nutricionistasAPI } from './services/api';

const NutriPerfil = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    nome: '', email: '', telefone: '', especialidade: '', descricao: '', foto: ''
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDark, setIsDark] = useState(document.body.classList.contains('dark-mode'));

  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.body.classList.contains('dark-mode')));
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const headerLinks = [
    { href: '/nutri-dashboard', text: 'Dashboard' },
    { href: '/nutri-solicitacoes', text: 'Solicitações' },
    { href: '/', text: 'Sair', onClick: () => { localStorage.removeItem('currentUser'); navigate('/'); } }
  ];

  useEffect(() => {
    const loadUserData = async () => {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (!user.id && !user.Id) { navigate('/login'); return; }
      try {
        const userData = await nutricionistasAPI.getById(user.id || user.Id);
        setCurrentUser(userData);
        setFormData({
          nome: userData.nome || userData.Nome || '',
          email: userData.email || userData.Email || '',
          telefone: userData.telefone || userData.Telefone || '',
          especialidade: userData.especialidade || userData.Especialidade || '',
          descricao: userData.descricao || userData.Descricao || '',
          foto: userData.foto || userData.Foto || ''
        });
      } catch {
        setCurrentUser(user);
        setFormData({
          nome: user.nome || user.Nome || '',
          email: user.email || user.Email || '',
          telefone: user.telefone || user.Telefone || '',
          especialidade: user.especialidade || user.Especialidade || '',
          descricao: user.descricao || user.Descricao || '',
          foto: user.foto || user.Foto || ''
        });
      }
    };
    loadUserData();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setFormData(prev => ({ ...prev, foto: ev.target.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const userId = currentUser.id || currentUser.Id;
      await nutricionistasAPI.update(userId, formData);
      const updated = await nutricionistasAPI.getById(userId);
      localStorage.setItem('currentUser', JSON.stringify(updated));
      setCurrentUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Erro ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Carregando...</div>;

  const crn = currentUser.crn || currentUser.Crn || currentUser.CRN || '';
  const dataCriacao = currentUser.dataCriacao || currentUser.DataCriacao || '';

  return (
    <div className="nutri-theme">
      <Header theme="minimal" />

      <main style={{ padding: '5rem 1rem 2rem', minHeight: '100vh' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          {/* Banner de sucesso */}
          {saved && (
            <div style={{
              background: 'linear-gradient(135deg, #10b981, #34d399)',
              color: 'white', borderRadius: '12px', padding: '1rem 1.5rem',
              marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
              boxShadow: '0 4px 20px rgba(16,185,129,0.3)', fontWeight: 600
            }}>
              <i className="fas fa-check-circle" style={{ fontSize: '1.25rem' }}></i>
              Perfil atualizado com sucesso!
            </div>
          )}

          {/* Card principal - hero do perfil */}
          <div style={{
            background: isDark
              ? 'linear-gradient(135deg, #4C1D95, #7C3AED)'
              : 'linear-gradient(135deg, rgba(6,182,212,0.9), rgba(16,185,129,0.9))',
            borderRadius: '24px 24px 0 0', padding: '2.5rem 2.5rem 4rem',
            position: 'relative', overflow: 'hidden'
          }}>
            {/* Decoração de fundo */}
            <div style={{
              position: 'absolute', top: '-40px', right: '-40px',
              width: '200px', height: '200px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)'
            }} />
            <div style={{
              position: 'absolute', bottom: '-20px', left: '10%',
              width: '120px', height: '120px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)'
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', position: 'relative', zIndex: 1 }}>
              {/* Foto */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: '110px', height: '110px', borderRadius: '50%',
                  border: '4px solid rgba(255,255,255,0.8)',
                  overflow: 'hidden', background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                }}>
                  {formData.foto
                    ? <img src={formData.foto} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <i className="fas fa-user" style={{ fontSize: '2.5rem', color: 'rgba(255,255,255,0.8)' }}></i>
                  }
                </div>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} id="foto-upload" />
                <label htmlFor="foto-upload" style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  color: isDark ? '#8B6FCF' : '#06b6d4', fontSize: '0.85rem'
                }}>
                  <i className="fas fa-camera"></i>
                </label>
              </div>

              {/* Info principal */}
              <div style={{ flex: 1 }}>
                <h1 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 800, margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  {formData.nome || 'Nutricionista'}
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.9)', margin: '0.25rem 0 0', fontSize: '1rem', fontWeight: 500 }}>
                  {formData.especialidade || 'Especialidade não informada'}
                </p>
                {crn && (
                  <span style={{
                    display: 'inline-block', marginTop: '0.5rem',
                    background: 'rgba(255,255,255,0.2)', color: 'white',
                    padding: '0.25rem 0.75rem', borderRadius: '20px',
                    fontSize: '0.85rem', fontWeight: 600, backdropFilter: 'blur(10px)'
                  }}>
                    CRN: {crn}
                  </span>
                )}
              </div>

              {/* Botão voltar */}
              <button onClick={() => navigate('/nutri-dashboard')} style={{
                background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
                color: 'white', borderRadius: '10px', padding: '0.5rem 1rem',
                cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                backdropFilter: 'blur(10px)', alignSelf: 'flex-start'
              }}>
                Voltar
              </button>
            </div>
          </div>

          {/* Card de formulário */}
          <div style={{
            background: isDark ? '#181A1D' : 'white',
            borderRadius: '0 0 24px 24px',
            boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.4)' : '0 20px 60px rgba(0,0,0,0.1)',
            border: isDark ? '1px solid #2A2D32' : 'none',
            padding: '2.5rem', marginTop: '-1px'
          }}>

            {/* Stats rápidos */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
              {[
                { icon: 'fa-envelope', label: 'Email', value: formData.email || 'â€”' },
                { icon: 'fa-phone', label: 'Telefone', value: formData.telefone || 'â€”' },
                { icon: 'fa-calendar', label: 'Membro desde', value: dataCriacao ? dataCriacao.split('T')[0] : 'â€”' },
              ].map((item, i) => (
                <div key={i} style={{
                  flex: '1', minWidth: '160px',
                  background: isDark ? '#202228' : '#f8fafc',
                  borderRadius: '12px', padding: '1rem',
                  border: `1px solid ${isDark ? '#2A2D32' : '#e2e8f0'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <i className={`fas ${item.icon}`} style={{ color: isDark ? '#8B6FCF' : '#06b6d4', fontSize: '0.85rem' }}></i>
                    <span style={{ fontSize: '0.75rem', color: isDark ? '#9B9DA5' : '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
                  </div>
                  <p style={{ margin: 0, color: isDark ? '#F1F1F3' : '#1e293b', fontWeight: 600, fontSize: '0.9rem', wordBreak: 'break-all' }}>{item.value}</p>
                </div>
              ))}
            </div>

            <div style={{ borderTop: `1px solid ${isDark ? '#2A2D32' : '#e2e8f0'}`, paddingTop: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: isDark ? '#F1F1F3' : '#1e293b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fas fa-edit" style={{ color: isDark ? '#8B6FCF' : '#06b6d4' }}></i>
                Editar Informações
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: isDark ? '#9B9DA5' : '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    Nome Completo
                  </label>
                  <input type="text" name="nome" value={formData.nome} onChange={handleInputChange}
                    placeholder="Seu nome completo"
                    style={{ width: '100%', padding: '0.875rem 1rem', border: `2px solid ${isDark ? '#2A2D32' : '#e2e8f0'}`, borderRadius: '10px', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', background: isDark ? '#202228' : 'white', color: isDark ? '#F1F1F3' : '#1e293b' }}
                    onFocus={e => e.target.style.borderColor = isDark ? '#A78BFA' : '#06b6d4'}
                    onBlur={e => e.target.style.borderColor = isDark ? '#2A2D32' : '#e2e8f0'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: isDark ? '#9B9DA5' : '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    Email
                  </label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                    placeholder="seu@email.com"
                    style={{ width: '100%', padding: '0.875rem 1rem', border: `2px solid ${isDark ? '#2A2D32' : '#e2e8f0'}`, borderRadius: '10px', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', background: isDark ? '#202228' : 'white', color: isDark ? '#F1F1F3' : '#1e293b' }}
                    onFocus={e => e.target.style.borderColor = isDark ? '#A78BFA' : '#06b6d4'}
                    onBlur={e => e.target.style.borderColor = isDark ? '#2A2D32' : '#e2e8f0'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: isDark ? '#9B9DA5' : '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    Telefone
                  </label>
                  <input type="tel" name="telefone" value={formData.telefone} onChange={handleInputChange}
                    placeholder="(00) 00000-0000"
                    style={{ width: '100%', padding: '0.875rem 1rem', border: `2px solid ${isDark ? '#2A2D32' : '#e2e8f0'}`, borderRadius: '10px', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', background: isDark ? '#202228' : 'white', color: isDark ? '#F1F1F3' : '#1e293b' }}
                    onFocus={e => e.target.style.borderColor = isDark ? '#A78BFA' : '#06b6d4'}
                    onBlur={e => e.target.style.borderColor = isDark ? '#2A2D32' : '#e2e8f0'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: isDark ? '#9B9DA5' : '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    Especialidade
                  </label>
                  <input type="text" name="especialidade" value={formData.especialidade} onChange={handleInputChange}
                    placeholder="Ex: Nutrição Esportiva"
                    style={{ width: '100%', padding: '0.875rem 1rem', border: `2px solid ${isDark ? '#2A2D32' : '#e2e8f0'}`, borderRadius: '10px', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', background: isDark ? '#202228' : 'white', color: isDark ? '#F1F1F3' : '#1e293b' }}
                    onFocus={e => e.target.style.borderColor = isDark ? '#A78BFA' : '#06b6d4'}
                    onBlur={e => e.target.style.borderColor = isDark ? '#2A2D32' : '#e2e8f0'}
                  />
                </div>
              </div>

              {/* Descrição profissional */}
              <div style={{ marginTop: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: isDark ? '#9B9DA5' : '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Descrição Profissional
                </label>
                <textarea name="descricao" value={formData.descricao} onChange={handleInputChange}
                  placeholder="Conte sobre sua experiência, abordagem de trabalho, áreas de atuação e o que te diferencia como profissional..."
                  rows={5}
                  style={{
                    width: '100%', padding: '0.875rem 1rem', border: `2px solid ${isDark ? '#2A2D32' : '#e2e8f0'}`,
                    borderRadius: '10px', fontSize: '0.95rem', outline: 'none',
                    transition: 'border-color 0.2s', resize: 'vertical', lineHeight: 1.6,
                    fontFamily: 'inherit', boxSizing: 'border-box',
                    background: isDark ? '#202228' : 'white', color: isDark ? '#F1F1F3' : '#1e293b'
                  }}
                  onFocus={e => e.target.style.borderColor = isDark ? '#A78BFA' : '#06b6d4'}
                  onBlur={e => e.target.style.borderColor = isDark ? '#2A2D32' : '#e2e8f0'}
                />
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: isDark ? '#9B9DA5' : '#94a3b8' }}>
                  Esta descrição será visível para os pacientes ao escolherem um nutricionista.
                </p>
              </div>

              {/* Botão salvar */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', gap: '1rem' }}>
                <button onClick={() => navigate('/nutri-dashboard')} style={{
                  padding: '0.875rem 1.75rem', borderRadius: '10px',
                  border: `2px solid ${isDark ? '#2A2D32' : '#e2e8f0'}`,
                  background: isDark ? '#202228' : 'white',
                  color: isDark ? '#9B9DA5' : '#64748b',
                  fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem'
                }}>
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={loading} style={{
                  padding: '0.875rem 2rem', borderRadius: '10px', border: 'none',
                  background: loading ? '#94a3b8' : isDark ? 'linear-gradient(135deg, #7C3AED, #A78BFA)' : 'linear-gradient(135deg, #06b6d4, #10b981)',
                  color: 'white', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem', boxShadow: loading ? 'none' : '0 4px 20px rgba(6,182,212,0.4)',
                  display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                }}>
                  {loading
                    ? <><i className="fas fa-spinner fa-spin"></i> Salvando...</>
                    : <><i className="fas fa-save"></i> Salvar Alterações</>
                  }
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default NutriPerfil;



