import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from './Header';
import Modal from './Modal';
import { pacientesAPI } from './services/api';

const FichaPaciente = () => {
  const { id } = useParams();
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayModal, setDayModal] = useState({ isOpen: false });
  const [dayData, setDayData] = useState({
    alimentacao: '',
    notas: '',
    status: 'planejado'
  });

  const renderCalendar = () => {
    if (!paciente) return null;

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    
    const days = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} style={{padding: '8px'}}></div>
      );
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayInfo = paciente.calendario && paciente.calendario[currentDateStr];
      const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
      
      days.push(
        <div
          key={day}
          style={{
            padding: '8px',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: isToday ? '#06b6d4' : dayInfo ? '#f0f9ff' : 'white',
            color: isToday ? 'white' : 'black',
            position: 'relative',
            minHeight: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => openDayModal(currentDateStr)}
        >
          <div>{day}</div>
          {dayInfo && (
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: dayInfo.status === 'cumprido' ? '#10b981' : 
                             dayInfo.status === 'parcialmente-cumprido' ? '#f59e0b' : '#ef4444',
              position: 'absolute',
              top: '2px',
              right: '2px'
            }}></div>
          )}
        </div>
      );
    }
    
    return days;
  };

  const openDayModal = (dateStr) => {
    setSelectedDate(dateStr);
    const dayInfo = paciente.calendario && paciente.calendario[dateStr] || {};
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
        console.log('Todos os pacientes:', allPacientes);
        console.log('ID buscado:', id);
        
        const data = allPacientes.find(p => {
          const pacienteId = p.Id || p.id;
          console.log('Comparando:', pacienteId, 'com', id);
          return String(pacienteId) === String(id);
        });
        
        console.log('Paciente encontrado:', data);
        if (data && !data.calendario) {
          data.calendario = {
            '2025-01-15': { alimentacao: 'Café da manhã: Aveia com frutas\nAlmoço: Frango grelhado com salada\nJantar: Sopa de legumes', notas: 'Paciente relatou mais energia', status: 'cumprido' },
            '2025-01-16': { alimentacao: 'Café da manhã: Iogurte natural\nAlmoço: Peixe com arroz integral\nJantar: Salada com proteína', notas: 'Seguiu a dieta corretamente', status: 'cumprido' },
            '2025-01-17': { alimentacao: 'Café da manhã: Pão integral\nAlmoço: Não seguiu a dieta\nJantar: Pizza', notas: 'Teve dificuldades no almoço', status: 'parcialmente-cumprido' }
          };
        }
        setPaciente(data);
      } catch (error) {
        console.error('Erro ao carregar paciente:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPaciente();
  }, [id]);

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
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
          <p>Paciente não encontrado</p>
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

          <div style={{
            background: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            marginBottom: '2rem'
          }}>
            <h3 style={{color: '#06b6d4', marginBottom: '1rem'}}>📅 Calendário Nutricional</h3>
            <div className="calendar-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
              <button className="btn btn-outline" onClick={() => navigateMonth('prev')}>
                ←
              </button>
              <h4>{getFormattedDate()}</h4>
              <button className="btn btn-outline" onClick={() => navigateMonth('next')}>
                →
              </button>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px',
              textAlign: 'center'
            }}>
              <div style={{fontWeight: 'bold', padding: '8px'}}>Dom</div>
              <div style={{fontWeight: 'bold', padding: '8px'}}>Seg</div>
              <div style={{fontWeight: 'bold', padding: '8px'}}>Ter</div>
              <div style={{fontWeight: 'bold', padding: '8px'}}>Qua</div>
              <div style={{fontWeight: 'bold', padding: '8px'}}>Qui</div>
              <div style={{fontWeight: 'bold', padding: '8px'}}>Sex</div>
              <div style={{fontWeight: 'bold', padding: '8px'}}>Sáb</div>
              {renderCalendar()}
            </div>
          </div>

          <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
            <Link 
              to={`/nutri-prescricao/${paciente.id}`}
              className="btn btn-primary btn-lg"
            >
              <span style={{fontSize: '1rem', marginRight: '0.5rem'}}>📝</span> Criar Prescrição
            </Link>
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
          className="form-textarea"
          placeholder="Descreva a alimentação do dia..."
          value={dayData.alimentacao}
          onChange={(e) => setDayData({ ...dayData, alimentacao: e.target.value })}
          style={{width: '100%', minHeight: '100px', margin: '0.5rem 0'}}
        />

        <label htmlFor="notasDiarias">Notas e Observações:</label>
        <textarea
          id="notasDiarias"
          className="form-textarea"
          placeholder="Adicione notas sobre o dia..."
          value={dayData.notas}
          onChange={(e) => setDayData({ ...dayData, notas: e.target.value })}
          style={{width: '100%', minHeight: '80px', margin: '0.5rem 0'}}
        />

        <label htmlFor="statusDiario">Status do Dia:</label>
        <select
          id="statusDiario"
          className="form-input"
          value={dayData.status}
          onChange={(e) => setDayData({ ...dayData, status: e.target.value })}
          style={{width: '100%', margin: '0.5rem 0'}}
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

export default FichaPaciente;