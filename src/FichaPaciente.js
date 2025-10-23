import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from './Header';
import Modal from './Modal';
import { pacientesAPI } from './services/api';

const FichaPaciente = () => {
  const { id } = useParams();
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [dayModal, setDayModal] = useState({ isOpen: false });
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayData, setDayData] = useState({
    alimentacao: '',
    notas: '',
    status: 'planejado'
  });
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());




  const headerLinks = [
    { href: '/nutri-dashboard', text: 'Dashboard' },
    { href: '/nutri-solicitacoes', text: 'Solicitações' },
    { href: '/', text: 'Sair', onClick: () => localStorage.removeItem('currentUser') }
  ];

  useEffect(() => {
    const loadPaciente = async () => {
      try {
        // Busca todos os pacientes e filtra pelo ID
        const allPacientes = await pacientesAPI.getAll();
        console.log('=== DEBUG FICHA PACIENTE ===');
        console.log('Todos os pacientes:', allPacientes);
        console.log('ID buscado da URL:', id, 'tipo:', typeof id);
        
        const data = allPacientes.find(p => {
          const pacienteId = p.Id || p.id;
          console.log('Paciente:', p.nome, 'ID:', pacienteId, 'tipo:', typeof pacienteId);
          console.log('Comparando:', pacienteId, '===', id, '?', String(pacienteId) === String(id));
          return String(pacienteId) === String(id);
        });
        
        // Garantir que todos os pacientes tenham calendário
        if (data) {
          if (!data.calendario) {
            data.calendario = {};
          }
        }
        
        console.log('Resultado da busca:', data);
        console.log('=== FIM DEBUG ===');
        setPaciente(data);
      } catch (error) {
        console.error('Erro ao carregar paciente:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPaciente();
  }, [id]);

  const renderCalendar = () => {
    if (!paciente) return null;

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
      const dayInfo = paciente.calendario && paciente.calendario[currentDateStr];
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
    const dayInfo = (paciente.calendario && paciente.calendario[dateStr]) || {};
    setDayData({
      alimentacao: dayInfo.alimentacao || '',
      notas: dayInfo.notas || '',
      status: dayInfo.status || 'planejado'
    });
    setDayModal({ isOpen: true });
  };

  const saveDayDetails = () => {
    if (!paciente || !selectedDate) return;

    if (!paciente.calendario) {
      paciente.calendario = {};
    }
    
    paciente.calendario[selectedDate] = {
      alimentacao: dayData.alimentacao,
      notas: dayData.notas,
      status: dayData.status
    };
    
    setPaciente({...paciente});
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

  if (loading) {
    return (
      <div className="nutri-theme">
        <Header theme="nutri" links={headerLinks} />
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="nutri-theme">
        <Header theme="nutri" links={headerLinks} />
        <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
          <p>Paciente não encontrado</p>
          <p style={{fontSize: '0.9rem', color: '#666'}}>ID buscado: {id}</p>
          <p style={{fontSize: '0.9rem', color: '#666'}}>Verifique o console para mais detalhes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nutri-theme">
      <Header theme="nutri" links={headerLinks} />
      
      <main className="nutri-dashboard">
        <div className="nutri-card">
          <Link to="/nutri-dashboard" className="back-arrow">
            <i className="fas fa-arrow-left"></i>
          </Link>
          
          <div style={{textAlign: 'center', marginBottom: '2rem'}}>
            <div style={{fontSize: '4rem', color: '#06b6d4', marginBottom: '1rem'}}>👤</div>
            <h1 style={{color: '#374151', marginBottom: '0.5rem'}}>{paciente.nome}</h1>
            <p style={{color: '#6b7280'}}>{paciente.email}</p>
          </div>

          <div style={{
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: '#f8fafc',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{color: '#06b6d4', marginBottom: '1rem'}}>Dados Pessoais</h3>
              <p><strong>Idade:</strong> {paciente.idade} anos</p>
              <p><strong>Peso:</strong> {paciente.peso} kg</p>
              <p><strong>Altura:</strong> {paciente.altura ? (paciente.altura / 100).toFixed(2) : 'N/A'} m</p>
              <p><strong>IMC:</strong> {paciente.peso && paciente.altura ? (paciente.peso / Math.pow(paciente.altura / 100, 2)).toFixed(1) : 'N/A'}</p>
            </div>

            <div style={{
              background: '#f8fafc',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{color: '#06b6d4', marginBottom: '1rem'}}>Objetivos</h3>
              <p><strong>Objetivo:</strong> {paciente.objetivo}</p>
              <p><strong>Condição de Saúde:</strong> {paciente.condicao_saude || paciente.condicaoSaude}</p>
            </div>
          </div>

          <div style={{
            background: '#fef3c7',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #fbbf24',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <h3 style={{color: '#92400e', marginBottom: '1rem'}}>📱 Funcionalidade em Desenvolvimento</h3>
            <p style={{color: '#92400e', marginBottom: '1rem'}}>
              A ficha completa do paciente estará disponível no aplicativo móvel em breve.
            </p>
            <p style={{color: '#92400e', fontSize: '0.9rem'}}>
              Por enquanto, você pode acessar as informações básicas e criar prescrições.
            </p>
          </div>



          <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
            <Link 
              to={`/nutri-prescricao/${paciente.Id || paciente.id}`}
              className="btn btn-primary btn-lg"
            >
              <span style={{fontSize: '1rem', marginRight: '0.5rem'}}>📝</span> Criar Prescrição
            </Link>
            <button 
              onClick={() => setShowCalendar(!showCalendar)}
              className="btn btn-outline btn-lg"
            >
              <span style={{fontSize: '1rem', marginRight: '0.5rem'}}>📅</span> {showCalendar ? 'Fechar Calendário' : 'Calendário'}
            </button>
          </div>
        </div>

        {showCalendar && (
          <div className="info-card calendar-card" style={{maxWidth: '900px', width: '100%', marginTop: '2rem'}}>
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
        )}
      </main>

      {showCalendar && (
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
        </Modal>
      )}

    </div>
  );
};

export default FichaPaciente;