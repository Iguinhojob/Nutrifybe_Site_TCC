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
      if (!patient.calendario) {
        // Adicionar dados de exemplo para o calendário
        patient.calendario = {
          '2025-01-15': { alimentacao: 'Café da manhã: Aveia com frutas\nAlmoço: Frango grelhado com salada\nJantar: Sopa de legumes', notas: 'Paciente relatou mais energia', status: 'cumprido' },
          '2025-01-16': { alimentacao: 'Café da manhã: Iogurte natural\nAlmoço: Peixe com arroz integral\nJantar: Salada com proteína', notas: 'Seguiu a dieta corretamente', status: 'cumprido' },
          '2025-01-17': { alimentacao: 'Café da manhã: Pão integral\nAlmoço: Não seguiu a dieta\nJantar: Pizza', notas: 'Teve dificuldades no almoço', status: 'parcialmente-cumprido' }
        };
      }
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
        <div key={`empty-${i}`} className="calendar-day empty-day"></div>
      );
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayInfo = currentPatient.calendario && currentPatient.calendario[currentDateStr];
      const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
      
      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? 'current-date' : ''}`}
          onClick={() => openDayModal(currentDateStr)}
        >
          <span className="day-number">{day}</span>
          {dayInfo && dayInfo.status && (
            <div className={`day-status-indicator status-${dayInfo.status}`}></div>
          )}
          {dayInfo && dayInfo.alimentacao && (
            <div className="day-preview">
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

  const saveDayDetails = () => {
    if (!currentPatient || !selectedDate) return;

    if (!currentPatient.calendario) {
      currentPatient.calendario = {};
    }
    
    currentPatient.calendario[selectedDate] = {
      alimentacao: dayData.alimentacao,
      notas: dayData.notas,
      status: dayData.status
    };
    
    setCurrentPatient({...currentPatient});
    alert('Detalhes do dia salvos com sucesso!');
    setDayModal({ isOpen: false });
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
      
      <main className="nutri-dashboard">
        <div style={{marginBottom: '1rem'}}>
          <Link to={`/nutri-prescricao/${currentPatient.Id || currentPatient.id}`} className="btn btn-outline">
            <i className="fas fa-arrow-left"></i>
          </Link>
        </div>
        
        <div className="nutri-welcome">
          <h1 className="nutri-welcome-title">Calendário de {currentPatient.Nome || currentPatient.nome}</h1>
        </div>

        <div className="info-card calendar-card" style={{maxWidth: '900px', width: '100%'}}>
          <div className="calendar-header">
            <button className="calendar-nav-btn" onClick={() => navigateMonth('prev')}>
              <i className="fas fa-chevron-left"></i>
            </button>
            <h2>{getFormattedDate()}</h2>
            <button className="calendar-nav-btn" onClick={() => navigateMonth('next')}>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          <div className="calendar-grid">
            <div className="day-name">Dom</div>
            <div className="day-name">Seg</div>
            <div className="day-name">Ter</div>
            <div className="day-name">Qua</div>
            <div className="day-name">Qui</div>
            <div className="day-name">Sex</div>
            <div className="day-name">Sáb</div>
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