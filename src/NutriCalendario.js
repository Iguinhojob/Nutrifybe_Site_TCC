import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import { pacientesAPI } from './services/api';

const MEAL_KEYWORDS = [
  { key: 'cafe',    label: 'Café da Manhã',    icon: '☕', color: '#f59e0b', terms: ['café','cafe','manhã','manha','breakfast','desjejum'] },
  { key: 'lanche1', label: 'Lanche da Manhã', icon: '🍎', color: '#10b981', terms: ['lanche manhã','lanche da manhã','lanche manha','lanche 1','lanche1'] },
  { key: 'almoco',  label: 'Almoço',          icon: '🍽️', color: '#6366f1', terms: ['almoço','almoco','lunch'] },
  { key: 'lanche2', label: 'Lanche da Tarde', icon: '🥪', color: '#06b6d4', terms: ['lanche tarde','lanche da tarde','lanche 2','lanche2','lanche'] },
  { key: 'jantar',  label: 'Jantar',          icon: '🌙', color: '#8b5cf6', terms: ['jantar','dinner','janta'] },
  { key: 'ceia',    label: 'Ceia',            icon: '🌛', color: '#ec4899', terms: ['ceia','noite','supper'] },
];

function parseMeals(alimentacao) {
  if (!alimentacao) return null;
  const lines = alimentacao.split('\n').map(l => l.trim()).filter(Boolean);
  const meals = {};
  let currentKey = null;
  for (const line of lines) {
    const lower = line.toLowerCase();
    const found = MEAL_KEYWORDS.find(m => m.terms.some(t => lower.includes(t)));
    if (found) {
      currentKey = found.key;
      const content = line.replace(/^[^:：]+[:：]\s*/, '').trim();
      if (!meals[currentKey]) meals[currentKey] = [];
      if (content) meals[currentKey].push(content);
    } else if (currentKey) {
      meals[currentKey].push(line);
    } else {
      if (!meals['geral']) meals['geral'] = [];
      meals['geral'].push(line);
    }
  }
  return Object.keys(meals).length > 0 ? meals : null;
}

const STATUS_CONFIG = {
  cumprido:               { color: '#10b981', label: 'Cumprido',            icon: '✓' },
  'parcialmente-cumprido':{ color: '#f59e0b', label: 'Parcialmente Cumprido', icon: '◑' },
  'nao-cumprido':         { color: '#ef4444', label: 'Não Cumprido',        icon: '✗' },
  planejado:              { color: '#6366f1', label: 'Planejado',            icon: '○' },
};

const REVIEW_STATUSES = ['cumprido', 'parcialmente-cumprido', 'nao-cumprido'];
const REGISTRO_COLOR = '#06b6d4';

const dateKey = (value) => {
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatNumber = (value, digits = 0) => Number.isFinite(Number(value))
  ? Number(value).toFixed(digits)
  : '—';

const MONTHS_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

const NutriCalendario = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear]   = useState(today.getFullYear());
  const [isDark] = useState(() => document.body.classList.contains('dark-mode'));

  // Retorno
  const [showRetornoForm, setShowRetornoForm] = useState(false);
  const [retornoData, setRetornoData] = useState({ data: '', hora: '', observacao: '' });
  const [retornoSalvo, setRetornoSalvo] = useState(null);
  const [savingRetorno, setSavingRetorno] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');

  const headerLinks = [
    { href: '/nutri-dashboard', text: 'Início' },
    { href: '/nutri-solicitacoes', text: 'Solicitações Pendentes' },
    { href: '/login', text: 'Sair', onClick: () => navigate('/login') },
  ];

  useEffect(() => {
    (async () => {
      try {
        const p = await pacientesAPI.getById(id);
        if (!p) { navigate('/nutri-dashboard'); return; }
        if (typeof p.calendario === 'string') {
          try { p.calendario = JSON.parse(p.calendario); } catch { p.calendario = {}; }
        }
        p.calendario = p.calendario || {};
        if (typeof p.retorno === 'string') {
          try { p.retorno = JSON.parse(p.retorno); } catch { p.retorno = null; }
        }
        setPatient(p);
        if (p.retorno) {
          setRetornoSalvo(p.retorno);
          setRetornoData(p.retorno);
        }
      } catch {
        navigate('/nutri-dashboard');
      }
    })();
  }, [id, navigate]);

  const navigateMonth = (dir) => {
    if (dir === 'prev') {
      if (month === 0) { setYear(y => y - 1); setMonth(11); }
      else setMonth(m => m - 1);
    } else {
      if (month === 11) { setYear(y => y + 1); setMonth(0); }
      else setMonth(m => m + 1);
    }
  };

  const saveRetorno = async () => {
    if (!retornoData.data) return;
    setSavingRetorno(true);
    try {
      const patientId = patient.Id || patient.id;
      await pacientesAPI.updateClinical(patientId, { retorno: retornoData });
      setRetornoSalvo({ ...retornoData });
      setShowRetornoForm(false);
    } catch (e) {
      alert('Erro ao salvar retorno: ' + e.message);
    } finally {
      setSavingRetorno(false);
    }
  };

  const removeRetorno = async () => {
    if (!window.confirm('Remover agendamento de retorno?')) return;
    try {
      const patientId = patient.Id || patient.id;
      await pacientesAPI.updateClinical(patientId, { retorno: null });
      setRetornoSalvo(null);
      setRetornoData({ data: '', hora: '', observacao: '' });
    } catch (e) {
      alert('Erro ao remover retorno: ' + e.message);
    }
  };

  const mealsByDate = useMemo(() => {
    const grouped = {};
    (patient?.refeicoes || []).forEach((meal) => {
      const key = dateKey(meal.criadoEm || meal.createdAt);
      if (!key) return;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(meal);
    });
    return grouped;
  }, [patient?.refeicoes]);

  const waterByDate = useMemo(() => {
    const grouped = {};
    (patient?.agua || []).forEach((record) => {
      const key = dateKey(record.criadoEm || record.createdAt);
      if (!key) return;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(record);
    });
    return grouped;
  }, [patient?.agua]);

  const measurementsByDate = useMemo(() => {
    const grouped = {};
    (patient?.medidas || []).forEach((record) => {
      const key = dateKey(record.criadoEm || record.createdAt);
      if (!key) return;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(record);
    });
    return grouped;
  }, [patient?.medidas]);

  const saveReviewStatus = async (status) => {
    if (!selectedDate || !patient || savingReview) return;
    const previousCalendar = patient.calendario || {};
    const nextCalendar = {
      ...previousCalendar,
      [selectedDate]: { ...(previousCalendar[selectedDate] || {}), status },
    };
    setSavingReview(true);
    setReviewMessage('');
    setPatient((current) => ({ ...current, calendario: nextCalendar }));
    try {
      await pacientesAPI.updateClinical(patient.Id || patient.id, { calendario: nextCalendar });
      setReviewMessage('Avaliação salva para este dia.');
    } catch (error) {
      setPatient((current) => ({ ...current, calendario: previousCalendar }));
      setReviewMessage(error.message || 'Não foi possível salvar a avaliação.');
    } finally {
      setSavingReview(false);
    }
  };

  const buildCalendar = () => {
    const firstDay   = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < firstDay; i++) cells.push({ empty: true, key: `e${i}` });
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const info    = patient?.calendario?.[dateStr];
      const meals   = mealsByDate[dateStr] || [];
      const water   = waterByDate[dateStr] || [];
      const measurements = measurementsByDate[dateStr] || [];
      const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      const isRetorno = retornoSalvo?.data === dateStr;
      cells.push({ day: d, dateStr, info, meals, water, measurements, isToday, isRetorno, key: dateStr });
    }
    return cells;
  };

  const selectedInfo = selectedDate ? patient?.calendario?.[selectedDate] : null;
  const selectedMeals = selectedDate ? (mealsByDate[selectedDate] || []) : [];
  const selectedWater = selectedDate ? (waterByDate[selectedDate] || []) : [];
  const selectedMeasurements = selectedDate ? (measurementsByDate[selectedDate] || []) : [];
  const statusCfg    = selectedInfo?.status ? (STATUS_CONFIG[selectedInfo.status] || STATUS_CONFIG.planejado) : null;
  const parsedMeals  = selectedInfo ? parseMeals(selectedInfo.alimentacao) : null;
  const recordedDays = new Set([
    ...Object.keys(mealsByDate),
    ...Object.keys(waterByDate),
    ...Object.keys(measurementsByDate),
  ]);

  const stats = patient ? (() => {
    const entries = Object.entries(patient.calendario)
      .filter(([day]) => (mealsByDate[day] || []).length > 0)
      .map(([, entry]) => entry);
    return {
      total:    recordedDays.size,
      cumprido: entries.filter(e => e.status === 'cumprido').length,
      parcial:  entries.filter(e => e.status === 'parcialmente-cumprido').length,
      nao:      entries.filter(e => e.status === 'nao-cumprido').length,
    };
  })() : null;

  /* ── Tokens de cor ── */
  const c = {
    bg:       isDark ? '#0F1012' : 'transparent',
    card:     isDark ? '#181A1D' : 'rgba(255,255,255,0.97)',
    raised:   isDark ? '#202228' : '#f8fafc',
    border:   isDark ? '#2A2D32' : '#e2e8f0',
    text:     isDark ? '#F1F1F3' : '#1e293b',
    muted:    isDark ? '#9B9DA5' : '#64748b',
    accent:   isDark ? '#A78BFA' : '#6366f1',
    dayHover: isDark ? '#202228' : '#f0f9ff',
    todayBg:  isDark ? '#4C1D95' : '#6366f1',
    emptyBg:  isDark ? '#0F1012' : '#f1f5f9',
    retornoBg:  isDark ? '#1a2a1a' : '#f0fdf4',
    retornoBorder: isDark ? '#2a4a2a' : '#bbf7d0',
    shadow:   isDark
      ? '0 20px 40px rgba(0,0,0,0.5)'
      : '0 20px 60px rgba(99,102,241,0.12), 0 4px 16px rgba(0,0,0,0.06)',
  };

  if (!patient) {
    return (
      <div className="nutri-theme" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: c.muted }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Carregando histórico...</p>
        </div>
      </div>
    );
  }

  const patientName = patient.Nome || patient.nome || 'Paciente';
  const cells = buildCalendar();

  return (
    <div className="nutri-theme" style={{ minHeight: '100vh', background: c.bg }}>
      <Header theme="nutri" links={headerLinks} />

      <main style={{ padding: '2rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>

        {/* ── Cabeçalho da página ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <Link
            to={`/nutri-prescricao/${patient.Id || patient.id}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '2.5rem', height: '2.5rem', borderRadius: '50%',
              background: c.card, border: `1px solid ${c.border}`,
              color: c.accent, fontSize: '1.1rem', textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)', flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
          >
            <i className="fas fa-arrow-left" />
          </Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: c.text }}>
              Histórico de {patientName}
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: c.muted }}>
              Registros enviados pelo aplicativo
            </p>
          </div>
          <button
            onClick={() => setShowRetornoForm(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: showRetornoForm
                ? (isDark ? '#2A2D32' : '#ede9fe')
                : 'linear-gradient(135deg, #10b981, #34d399)',
              border: showRetornoForm ? `1px solid ${c.accent}` : 'none',
              color: showRetornoForm ? c.accent : '#fff',
              padding: '0.6rem 1.2rem', borderRadius: '12px',
              fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
              boxShadow: showRetornoForm ? 'none' : '0 4px 14px rgba(16,185,129,0.35)',
              transition: 'all 0.2s', flexShrink: 0,
            }}
          >
            <i className="fas fa-calendar-plus" />
            {retornoSalvo ? 'Ver Retorno' : 'Agendar Retorno'}
          </button>
        </div>

        {/* Banner retorno salvo */}
        {retornoSalvo && !showRetornoForm && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: c.retornoBg, border: `1px solid ${c.retornoBorder}`,
            borderRadius: '16px', padding: '1rem 1.5rem', marginBottom: '1.5rem',
            animation: 'fadeInUp 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📅</span>
              <div>
                <div style={{ fontWeight: 700, color: c.text, fontSize: '0.95rem' }}>Retorno agendado</div>
                <div style={{ color: c.muted, fontSize: '0.85rem' }}>
                  {new Date(retornoSalvo.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  {retornoSalvo.hora && ` às ${retornoSalvo.hora}`}
                </div>
                {retornoSalvo.observacao && (
                  <div style={{ color: c.muted, fontSize: '0.8rem', marginTop: '0.2rem', fontStyle: 'italic' }}>{retornoSalvo.observacao}</div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setShowRetornoForm(true)} style={{ background: 'none', border: `1px solid ${c.border}`, color: c.muted, padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
                <i className="fas fa-edit" />
              </button>
              <button onClick={removeRetorno} style={{ background: 'none', border: '1px solid #fca5a5', color: '#ef4444', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
                <i className="fas fa-trash" />
              </button>
            </div>
          </div>
        )}

        {/* Formulário de retorno */}
        {showRetornoForm && (
          <div style={{
            background: c.card, borderRadius: '20px', border: `1px solid ${c.border}`,
            marginBottom: '1.5rem', boxShadow: c.shadow, overflow: 'hidden',
            animation: 'fadeInUp 0.3s ease',
          }}>
            <div style={{
              padding: '1.25rem 1.5rem', background: isDark ? '#202228' : '#f8fafc',
              borderBottom: `1px solid ${c.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.2rem' }}>📅</span>
                <span style={{ fontWeight: 700, color: c.text }}>Agendar Retorno</span>
              </div>
              <button onClick={() => setShowRetornoForm(false)} style={{ background: 'none', border: 'none', color: c.muted, fontSize: '1.1rem', cursor: 'pointer' }}>
                <i className="fas fa-times" />
              </button>
            </div>
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>Data *</label>
                <input type="date" value={retornoData.data} onChange={e => setRetornoData(r => ({ ...r, data: e.target.value }))} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: `1px solid ${c.border}`, background: c.raised, color: c.text, fontSize: '0.95rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>Horário</label>
                <input type="time" value={retornoData.hora} onChange={e => setRetornoData(r => ({ ...r, hora: e.target.value }))} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: `1px solid ${c.border}`, background: c.raised, color: c.text, fontSize: '0.95rem', boxSizing: 'border-box' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>Observação</label>
                <input type="text" placeholder="Ex: Trazer exames, consulta de rotina..." value={retornoData.observacao} onChange={e => setRetornoData(r => ({ ...r, observacao: e.target.value }))} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: `1px solid ${c.border}`, background: c.raised, color: c.text, fontSize: '0.95rem', boxSizing: 'border-box' }} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowRetornoForm(false)} style={{ padding: '0.7rem 1.5rem', borderRadius: '10px', border: `1px solid ${c.border}`, background: 'none', color: c.muted, cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                <button onClick={saveRetorno} disabled={!retornoData.data || savingRetorno} style={{ padding: '0.7rem 1.5rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #10b981, #34d399)', color: '#fff', cursor: retornoData.data ? 'pointer' : 'not-allowed', fontWeight: 700, opacity: retornoData.data ? 1 : 0.6, boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>
                  {savingRetorno ? 'Salvando...' : 'Salvar Retorno'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Cards de estatísticas ── */}
        {stats && stats.total > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Registros',   value: stats.total,    color: c.accent,   icon: '📋' },
              { label: 'Cumpridos',   value: stats.cumprido, color: '#10b981',  icon: '✅' },
              { label: 'Parciais',    value: stats.parcial,  color: '#f59e0b',  icon: '⚡' },
              { label: 'Não Cumpridos', value: stats.nao,    color: '#ef4444',  icon: '❌' },
            ].map(s => (
              <div key={s.label} style={{
                background: c.card, borderRadius: '16px', padding: '1.25rem',
                border: `1px solid ${c.border}`, textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.78rem', color: c.muted, marginTop: '0.3rem', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Calendário ── */}
        <div style={{ background: c.card, borderRadius: '24px', boxShadow: c.shadow, border: `1px solid ${c.border}`, overflow: 'hidden' }}>

          {/* Barra de navegação do mês */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1.5rem 2rem',
            background: isDark
              ? 'linear-gradient(135deg, #4C1D95, #7C3AED)'
              : 'linear-gradient(135deg, #6366f1, #818cf8)',
          }}>
            <button
              onClick={() => navigateMonth('prev')}
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                width: '2.5rem', height: '2.5rem', borderRadius: '12px', cursor: 'pointer',
                fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              <i className="fas fa-chevron-left" />
            </button>

            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                {MONTHS_PT[month]} {year}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                <i className="fas fa-eye" style={{ marginRight: '0.4rem' }} />
                Somente visualização
              </div>
            </div>

            <button
              onClick={() => navigateMonth('next')}
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                width: '2.5rem', height: '2.5rem', borderRadius: '12px', cursor: 'pointer',
                fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              <i className="fas fa-chevron-right" />
            </button>
          </div>

          {/* Grade */}
          <div style={{ padding: '1.5rem' }}>
            {/* Nomes dos dias */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
              {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
                <div key={d} style={{
                  textAlign: 'center', padding: '0.6rem 0',
                  fontSize: '0.75rem', fontWeight: 700, color: c.muted,
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Células */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {cells.map(cell => {
                if (cell.empty) return (
                  <div key={cell.key} style={{ background: c.emptyBg, borderRadius: '12px', minHeight: '80px' }} />
                );

                const { day, dateStr, info, meals, water, measurements, isToday } = cell;
                const hasMeal = meals.length > 0;
                const hasWater = water.length > 0;
                const hasMeasurements = measurements.length > 0;
                const hasRegistro = hasMeal || hasWater || hasMeasurements;
                const st = info?.status ? (STATUS_CONFIG[info.status] || STATUS_CONFIG.planejado) : null;
                const isSelected = selectedDate === dateStr;
                const isRetorno = retornoSalvo?.data === dateStr;

                return (
                  <div
                    key={cell.key}
                    onClick={() => {
                      if (!(hasRegistro || info || isRetorno)) return;
                      setReviewMessage('');
                      setSelectedDate(isSelected ? null : dateStr);
                    }}
                    style={{
                      background: isToday ? c.todayBg
                        : isSelected ? (isDark ? '#2A2D32' : '#ede9fe')
                        : isRetorno ? c.retornoBg
                        : c.raised,
                      borderRadius: '12px', minHeight: '80px', padding: '0.6rem',
                      cursor: (hasRegistro || info || isRetorno) ? 'pointer' : 'default',
                      border: isSelected ? `2px solid ${c.accent}`
                        : isRetorno ? '2px solid #10b981'
                        : isToday ? '2px solid transparent'
                        : `1px solid ${c.border}`,
                      transition: 'all 0.2s ease',
                      display: 'flex', flexDirection: 'column', gap: '0.3rem',
                      position: 'relative', overflow: 'hidden',
                    }}
                    onMouseEnter={e => { if ((hasRegistro || info || isRetorno) && !isSelected) e.currentTarget.style.background = c.dayHover; }}
                    onMouseLeave={e => { if ((hasRegistro || info || isRetorno) && !isSelected) e.currentTarget.style.background = isRetorno ? c.retornoBg : c.raised; }}
                  >
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: isToday ? '#fff' : c.text }}>{day}</span>
                    {isRetorno && (
                      <div style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 700 }}>📅 Retorno</div>
                    )}

                    {hasRegistro && (
                      <>
                        <div style={{
                          width: '10px', height: '10px', borderRadius: '50%',
                          background: st?.color || (hasMeal ? REGISTRO_COLOR : '#0ea5e9'), flexShrink: 0,
                          boxShadow: `0 0 0 3px ${(st?.color || (hasMeal ? REGISTRO_COLOR : '#0ea5e9'))}22`,
                        }} />
                        <div style={{
                          fontSize: '0.65rem',
                          color: isToday ? 'rgba(255,255,255,0.8)' : c.muted,
                          lineHeight: 1.3,
                        }}>
                          {[hasMeal && (meals.length === 1 ? '1 refeição' : `${meals.length} refeições`), hasWater && 'água', hasMeasurements && 'medidas'].filter(Boolean).join(' · ')}
                        </div>
                      </>
                    )}
                    {!hasRegistro && st && (
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: st.color, flexShrink: 0,
                      }} />
                    )}
                    {!hasRegistro && info?.alimentacao && (
                      <div style={{
                        fontSize: '0.65rem',
                        color: isToday ? 'rgba(255,255,255,0.8)' : c.muted,
                        lineHeight: 1.3, overflow: 'hidden',
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {info.alimentacao.split('\n')[0].substring(0, 30)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legenda */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center',
            padding: '1rem 1.5rem 1.5rem',
            borderTop: `1px solid ${c.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: REGISTRO_COLOR }} />
              <span style={{ fontSize: '0.78rem', color: c.muted, fontWeight: 500 }}>Registro do paciente</span>
            </div>
            {Object.entries(STATUS_CONFIG).filter(([key]) => key !== 'planejado').map(([key, cfg]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: cfg.color }} />
                <span style={{ fontSize: '0.78rem', color: c.muted, fontWeight: 500 }}>{cfg.label}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '4px', background: '#10b981' }} />
              <span style={{ fontSize: '0.78rem', color: c.muted, fontWeight: 500 }}>Retorno Agendado</span>
            </div>
          </div>
        </div>

        {/* ── Painel de detalhes do dia selecionado ── */}
        {selectedDate && (selectedMeals.length > 0 || selectedWater.length > 0 || selectedMeasurements.length > 0 || selectedInfo || retornoSalvo?.data === selectedDate) && (
          <div style={{
            marginTop: '1.5rem',
            background: c.card, borderRadius: '20px',
            border: `1px solid ${c.border}`,
            boxShadow: c.shadow, overflow: 'hidden',
            animation: 'fadeInUp 0.3s ease',
          }}>
            {/* Cabeçalho do painel */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              background: isDark ? '#202228' : '#f8fafc',
              borderBottom: `1px solid ${c.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {statusCfg && (
                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '12px', background: statusCfg.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: statusCfg.color, fontWeight: 700 }}>
                    {statusCfg.icon}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, color: c.text, fontSize: '1rem' }}>
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  {statusCfg && (
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: statusCfg.color, marginTop: '0.1rem' }}>{statusCfg.label}</div>
                  )}
                  {retornoSalvo?.data === selectedDate && (
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981', marginTop: '0.1rem' }}>
                      📅 Retorno agendado{retornoSalvo.hora ? ` às ${retornoSalvo.hora}` : ''}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedDate(null)} style={{ background: 'none', border: 'none', color: c.muted, fontSize: '1.2rem', cursor: 'pointer', padding: '0.25rem', borderRadius: '8px' }}>
                <i className="fas fa-times" />
              </button>
            </div>

            {/* Conteúdo */}
            <div style={{ padding: '1.5rem', display: 'grid', gap: '1.25rem' }}>

              {selectedMeals.length > 0 && (
                <section>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.6rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Registros alimentares do paciente
                    </div>
                    <span style={{ fontSize: '0.8rem', color: c.muted }}>{selectedMeals.length} {selectedMeals.length === 1 ? 'refeição' : 'refeições'}</span>
                  </div>
                  <div style={{ display: 'grid', gap: '0.65rem' }}>
                    {selectedMeals.slice().sort((a, b) => String(a.criadoEm || '').localeCompare(String(b.criadoEm || ''))).map((meal) => {
                      const time = new Date(meal.criadoEm || meal.createdAt);
                      const hasTime = !Number.isNaN(time.getTime());
                      return (
                        <article key={meal.id || `${meal.nome}-${meal.criadoEm}`} style={{ background: isDark ? '#0F1012' : '#f0fdfa', border: `1px solid ${isDark ? '#2A2D32' : '#bae6fd'}`, borderRadius: '12px', padding: '0.9rem 1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'baseline' }}>
                            <strong style={{ color: c.text, fontSize: '0.95rem' }}>{meal.nome || 'Refeição registrada'}</strong>
                            <strong style={{ color: '#0891b2', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>{formatNumber(meal.calorias)} kcal</strong>
                          </div>
                          {hasTime && <div style={{ color: c.muted, fontSize: '0.78rem', marginTop: '0.2rem' }}>{time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>}
                          {(meal.descricao || meal.itens) && <div style={{ color: c.text, fontSize: '0.88rem', lineHeight: 1.5, marginTop: '0.55rem', whiteSpace: 'pre-wrap' }}>{meal.descricao || meal.itens}</div>}
                          <div style={{ color: c.muted, fontSize: '0.78rem', marginTop: '0.55rem' }}>C {formatNumber(meal.carboidratos, 1)} g · P {formatNumber(meal.proteinas, 1)} g · G {formatNumber(meal.gorduras, 1)} g</div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

              {selectedWater.length > 0 && (
                <section style={{ background: isDark ? '#0F1012' : '#eff6ff', border: `1px solid ${isDark ? '#2A2D32' : '#bfdbfe'}`, borderRadius: '14px', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hidratação registrada</div>
                    <strong style={{ color: '#0369a1', fontSize: '1rem' }}>{selectedWater.reduce((sum, record) => sum + Number(record.quantidadeMl || record.amountMl || 0), 0)} ml</strong>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                    {selectedWater.slice().sort((a, b) => String(a.criadoEm || '').localeCompare(String(b.criadoEm || ''))).map((record) => {
                      const time = new Date(record.criadoEm || record.createdAt);
                      return <span key={record.id || `${record.criadoEm}-${record.quantidadeMl}`} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '999px', padding: '0.4rem 0.65rem', color: c.text, fontSize: '0.82rem' }}>{Number(record.quantidadeMl || record.amountMl || 0)} ml {!Number.isNaN(time.getTime()) && `· ${time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}</span>;
                    })}
                  </div>
                </section>
              )}

              {selectedMeasurements.length > 0 && (
                <section>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>Medidas registradas</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem' }}>
                    {selectedMeasurements.map((measurement) => [
                      ['Peso', measurement.peso, 'kg'],
                      ['Cintura', measurement.cintura, 'cm'],
                      ['Quadril', measurement.quadril, 'cm'],
                      ['Braço', measurement.braco, 'cm'],
                      ['Gordura corporal', measurement.gorduraCorporal, '%'],
                    ].filter(([, value]) => value != null && value !== '').map(([label, value, unit]) => (
                      <div key={`${measurement.id || measurement.criadoEm}-${label}`} style={{ background: c.raised, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '0.75rem' }}>
                        <div style={{ color: c.muted, fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
                        <div style={{ color: c.text, fontSize: '1rem', fontWeight: 800, marginTop: '0.2rem' }}>{value} {unit}</div>
                      </div>
                    ))) }
                  </div>
                </section>
              )}

              {selectedMeals.length > 0 && (
                <section style={{ background: c.raised, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '1rem' }}>
                  <div style={{ fontWeight: 700, color: c.text, fontSize: '0.95rem' }}>Avaliação do nutricionista</div>
                  <p style={{ margin: '0.3rem 0 0.8rem', color: c.muted, fontSize: '0.84rem', lineHeight: 1.45 }}>Escolha a cor que deve aparecer neste dia para organizar o acompanhamento do paciente.</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
                    {REVIEW_STATUSES.map((key) => {
                      const option = STATUS_CONFIG[key];
                      const active = selectedInfo?.status === key;
                      return (
                        <button key={key} type="button" onClick={() => saveReviewStatus(key)} disabled={savingReview} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 0.75rem', borderRadius: '9px', border: `1px solid ${active ? option.color : c.border}`, background: active ? `${option.color}18` : c.card, color: active ? option.color : c.text, fontWeight: 700, fontSize: '0.8rem', cursor: savingReview ? 'wait' : 'pointer', opacity: savingReview ? 0.7 : 1 }}>
                          <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: option.color }} />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  {reviewMessage && <div role="status" style={{ color: reviewMessage.startsWith('Avaliação salva') ? '#059669' : '#dc2626', fontSize: '0.82rem', marginTop: '0.7rem', fontWeight: 600 }}>{reviewMessage}</div>}
                </section>
              )}

              {/* Refeições separadas */}
              {parsedMeals && (() => {
                const mealOrder = ['cafe','lanche1','almoco','lanche2','jantar','ceia','geral'];
                const rendered = [];
                for (const key of mealOrder) {
                  if (!parsedMeals[key]) continue;
                  const cfg = MEAL_KEYWORDS.find(m => m.key === key);
                  const label = cfg ? cfg.label : 'Alimentação';
                  const icon  = cfg ? cfg.icon  : '🍽️';
                  const color = cfg ? cfg.color : '#6366f1';
                  rendered.push(
                    <div key={key} style={{ background: isDark ? '#0F1012' : '#fff', border: `1px solid ${isDark ? '#2A2D32' : '#e2e8f0'}`, borderRadius: '14px', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: color + (isDark ? '22' : '12'), borderBottom: `1px solid ${color}30` }}>
                        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
                      </div>
                      <div style={{ padding: '0.75rem 1rem' }}>
                        {parsedMeals[key].map((item, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: i < parsedMeals[key].length - 1 ? '0.4rem' : 0 }}>
                            <span style={{ color, marginTop: '0.15rem', fontSize: '0.7rem' }}>●</span>
                            <span style={{ color: c.text, fontSize: '0.9rem', lineHeight: 1.5 }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return rendered;
              })()}

              {/* Alimentação sem estrutura de refeições */}
              {!parsedMeals && selectedInfo?.alimentacao && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="fas fa-utensils" style={{ color: '#10b981' }} />
                    Alimentação do Dia
                  </div>
                  <div style={{ background: isDark ? '#0F1012' : '#f0fdf4', border: `1px solid ${isDark ? '#2A2D32' : '#bbf7d0'}`, borderRadius: '12px', padding: '1rem', color: c.text, fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {selectedInfo.alimentacao}
                  </div>
                </div>
              )}

              {selectedInfo?.notas && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="fas fa-sticky-note" style={{ color: '#f59e0b' }} />
                    Notas e Observações
                  </div>
                  <div style={{ background: isDark ? '#0F1012' : '#fffbeb', border: `1px solid ${isDark ? '#2A2D32' : '#fde68a'}`, borderRadius: '12px', padding: '1rem', color: c.text, fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {selectedInfo.notas}
                  </div>
                </div>
              )}

              {retornoSalvo?.data === selectedDate && retornoSalvo.observacao && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="fas fa-calendar-check" style={{ color: '#10b981' }} />
                    Observação do Retorno
                  </div>
                  <div style={{ background: c.retornoBg, border: `1px solid ${c.retornoBorder}`, borderRadius: '12px', padding: '1rem', color: c.text, fontSize: '0.9rem', lineHeight: 1.7 }}>
                    {retornoSalvo.observacao}
                  </div>
                </div>
              )}

              {selectedMeals.length === 0 && selectedWater.length === 0 && selectedMeasurements.length === 0 && !selectedInfo?.alimentacao && !selectedInfo?.notas && retornoSalvo?.data !== selectedDate && (
                <div style={{ textAlign: 'center', color: c.muted, padding: '1rem', fontSize: '0.9rem' }}>
                  <i className="fas fa-info-circle" style={{ marginRight: '0.5rem' }} />
                  Nenhum detalhe registrado para este dia.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mensagem quando não há registros no mês */}
        {stats && stats.total === 0 && (
          <div style={{
            marginTop: '1.5rem', textAlign: 'center', padding: '3rem',
            background: c.card, borderRadius: '20px', border: `1px solid ${c.border}`,
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
            <div style={{ color: c.text, fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              Nenhum registro encontrado
            </div>
            <div style={{ color: c.muted, fontSize: '0.9rem' }}>
              O paciente ainda não enviou registros pelo aplicativo.
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 600px) {
          .cal-day-min { min-height: 56px !important; }
        }
      `}</style>
    </div>
  );
};

export default NutriCalendario;
