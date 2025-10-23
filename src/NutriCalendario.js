import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import Modal from './Modal';
import { pacientesAPI } from './services/api';

const NutriCalendario = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentPatient, setCurrentPatient] = useState(null);
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);

  const [dayModal, setDayModal] = useState({ isOpen: false });
  const [dayData, setDayData] = useState({
    alimentacao: '',
    notas: '',
    status: 'planejado'
  });

  const headerLinks = [
    { href: '/nutri-dashboard', text: 'Início' },
    { href: '/nutri-solicitacoes', text: 'Solicitações Pendentes' },
    { href: '/login', text: 'Sair', onClick: () => navigate('/login') }
  ];

  useEffect(() => {
    const loadPatient = async () => {
    let patient;
    try {
      patient = await pacientesAPI.getById(id);
    } catch {
      const allPacientes = await pacientesAPI.getAll();
      patient = allPacientes.find(p => (p.Id || p.id) === parseInt(id));
    }
    
    if (patient) {
      // Carregar calendário do banco ou criar vazio
      if (patient.calendario && typeof patient.calendario === 'string') {
        try {
          patient.calendario = JSON.parse(patient.calendario);
        } catch (e) {
          console.error('Erro ao parsear calendário:', e);
          patient.calendario = {};
        }
      } else if (!patient.calendario) {
        patient.calendario = {};
      }
      
      console.log('Calendário carregado:', patient.calendario);
      setCurrentPatient(patient);
    } else {
      alert('Paciente não encontrado para o calendário.');
      navigate('/nutri-dashboard');
    }
    };
    
    loadPatient();
  }, [id, navigate]);

  const renderCalendar = () => {
    if (!currentPatient) return null;

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    
    const days = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} style={{
          background: '#f9fafb',
          minHeight: '100px'
        }}></div>
      );
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayInfo = currentPatient.calendario && currentPatient.calendario[currentDateStr];
      const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
      
      days.push(
        <div
          key={day}
          onClick={() => openDayModal(currentDateStr)}
          style={{
            background: isToday ? '#4ade80' : 'white',
            minHeight: window.innerWidth < 768 ? '60px' : '100px',
            padding: window.innerWidth < 768 ? '0.5rem' : '0.75rem',
            cursor: 'pointer',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            color: isToday ? 'white' : '#374151',
            transition: 'all 0.3s ease',
            border: isToday ? '2px solid #22c55e' : 'none'
          }}
          onMouseEnter={(e) => {
            if (!isToday) {
              e.target.style.background = '#f0fdf4';
              e.target.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isToday) {
              e.target.style.background = 'white';
              e.target.style.transform = 'translateY(0)';
            }
          }}
        >
          <span style={{
            fontWeight: 600,
            fontSize: '1.1rem',
            marginBottom: '0.5rem'
          }}>{day}</span>
          {dayInfo && dayInfo.status && (
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: dayInfo.status === 'cumprido' ? '#10b981' : 
                         dayInfo.status === 'parcialmente-cumprido' ? '#f59e0b' : '#ef4444',
              marginBottom: '0.5rem'
            }}></div>
          )}
          {dayInfo && dayInfo.alimentacao && (
            <div style={{
              fontSize: '0.7rem',
              color: isToday ? 'rgba(255,255,255,0.8)' : '#6b7280',
              lineHeight: 1.3,
              overflow: 'hidden'
            }}>
              {dayInfo.alimentacao.split('\n')[0].substring(0, 20)}...
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  const openDayModal = (dateStr) => {
    setSelectedDate(dateStr);
    const dayInfo = currentPatient.calendario[dateStr] || {};
    setDayData({
      alimentacao: dayInfo.alimentacao || '',
      notas: dayInfo.notas || '',
      status: dayInfo.status || 'planejado'
    });
    setDayModal({ isOpen: true });
  };

  const saveDayDetails = async () => {
    if (!currentPatient || !selectedDate) return;

    if (!currentPatient.calendario) {
      currentPatient.calendario = {};
    }
    
    currentPatient.calendario[selectedDate] = {
      alimentacao: dayData.alimentacao,
      notas: dayData.notas,
      status: dayData.status
    };
    
    try {
      const patientId = currentPatient.Id || currentPatient.id;
      console.log('Salvando calendário para paciente ID:', patientId);
      console.log('Dados do calendário:', currentPatient.calendario);
      
      await pacientesAPI.update(patientId, {
        calendario: currentPatient.calendario
      });
      
      setCurrentPatient({...currentPatient});
      alert('Detalhes do dia salvos com sucesso!');
      setDayModal({ isOpen: false });
    } catch (error) {
      console.error('Erro ao salvar calendário:', error);
      alert('Erro ao salvar: ' + error.message);
    }
  };

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const getFormattedDate = () => {
    const date = new Date(currentYear, currentMonth).toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    });
    return date.charAt(0).toUpperCase() + date.slice(1);
  };

  const getSelectedDateFormatted = () => {
    if (!selectedDate) return '';
    return new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (!currentPatient) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="nutri-theme">
      <Header theme="nutri" links={headerLinks} />
      
      <main className="form-section" style={{
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        padding: '2rem 1rem',
        minHeight: '100vh'
      }}>
        <div style={{width: '100%', maxWidth: '900px', marginBottom: '1rem'}}>
          <Link to={`/nutri-prescricao/${currentPatient.Id || currentPatient.id}`} className="btn btn-outline">
            <i className="fas fa-arrow-left"></i>
          </Link>
        </div>
        
        <div style={{textAlign: 'center', marginBottom: '2rem'}}>
          <h1 className="info-title">Calendário de {currentPatient.Nome || currentPatient.nome}</h1>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: window.innerWidth < 768 ? '1rem' : '2rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          maxWidth: '900px',
          width: '100%'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            padding: window.innerWidth < 768 ? '1rem' : '1.5rem',
            background: 'var(--accent-green)',
            color: 'white',
            borderRadius: '16px'
          }}>
            <button 
              onClick={() => navigateMonth('prev')}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <h2 style={{
              margin: 0, 
              fontSize: window.innerWidth < 768 ? '1.2rem' : '1.5rem', 
              fontWeight: 600,
              color: 'white'
            }}>{getFormattedDate()}</h2>
            <button 
              onClick={() => navigateMonth('next')}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '2px',
            background: '#e5e7eb',
            borderRadius: '16px',
            overflow: 'hidden',
            width: '100%'
          }}>
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} style={{
                background: '#f3f4f6',
                padding: '1rem',
                textAlign: 'center',
                fontWeight: 600,
                color: '#374151',
                fontSize: '0.9rem'
              }}>{day}</div>
            ))}
            {renderCalendar()}
          </div>
        </div>
      </main>

      <Modal
        isOpen={dayModal.isOpen}
        onClose={() => setDayModal({ isOpen: false })}
        title={getSelectedDateFormatted()}
      >
        <label htmlFor="alimentacaoDiaria">Alimentação do Dia:</label>
        <textarea
          id="alimentacaoDiaria"
          className="modal-textarea"
          placeholder="Descreva a alimentação do dia..."
          value={dayData.alimentacao}
          onChange={(e) => setDayData({ ...dayData, alimentacao: e.target.value })}
        />

        <label htmlFor="notasDiarias">Notas e Observações:</label>
        <textarea
          id="notasDiarias"
          className="modal-textarea"
          placeholder="Adicione notas sobre o dia..."
          value={dayData.notas}
          onChange={(e) => setDayData({ ...dayData, notas: e.target.value })}
        />

        <label htmlFor="statusDiario">Status do Dia:</label>
        <select
          id="statusDiario"
          className="modal-select"
          value={dayData.status}
          onChange={(e) => setDayData({ ...dayData, status: e.target.value })}
        >
          <option value="planejado">Planejado</option>
          <option value="cumprido">Cumprido</option>
          <option value="parcialmente-cumprido">Parcialmente Cumprido</option>
          <option value="nao-cumprido">Não Cumprido</option>
        </select>

        <div style={{marginTop: '1rem'}}>
          <button className="btn btn-primary" style={{width: '100%'}} onClick={saveDayDetails}>
            Salvar Detalhes do Dia
          </button>
        </div>
        
        <div style={{marginTop: '1rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px'}}>
          <h4 style={{margin: '0 0 0.5rem 0', color: '#374151'}}>Legenda:</h4>
          <div style={{display: 'flex', gap: '1rem', fontSize: '0.9rem', flexWrap: 'wrap'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <div style={{width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981'}}></div>
              <span>Cumprido</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <div style={{width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b'}}></div>
              <span>Parcial</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <div style={{width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444'}}></div>
              <span>Não Cumprido</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NutriCalendario;