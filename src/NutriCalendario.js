import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import { pacientesAPI } from './services/api';

const STATUS_CONFIG = {
  cumprido:               { color: '#10b981', label: 'Cumprido',            icon: '✓' },
  'parcialmente-cumprido':{ color: '#f59e0b', label: 'Parcialmente Cumprido', icon: '◑' },
  'nao-cumprido':         { color: '#ef4444', label: 'Não Cumprido',        icon: '✗' },
  planejado:              { color: '#6366f1', label: 'Planejado',            icon: '○' },
};

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
        setPatient(p);
      } catch {
        navigate('/nutri-dashboard');
      }
    })();
  }, [id, navigate]);

  const navigateMonth = (dir) => {
    if (dir === 'prev') {
      setMonth(m => m === 0 ? (setYear(y => y - 1), 11) : m - 1);
    } else {
      setMonth(m => m === 11 ? (setYear(y => y + 1), 0) : m + 1);
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
      const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      cells.push({ day: d, dateStr, info, isToday, key: dateStr });
    }
    return cells;
  };

  const selectedInfo = selectedDate ? patient?.calendario?.[selectedDate] : null;
  const statusCfg    = selectedInfo ? (STATUS_CONFIG[selectedInfo.status] || STATUS_CONFIG.planejado) : null;

  const stats = patient ? (() => {
    const entries = Object.values(patient.calendario);
    return {
      total:    entries.length,
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
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: c.text }}>
              Histórico de {patientName}
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: c.muted }}>
              Registros enviados pelo aplicativo
            </p>
          </div>
        </div>

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
                <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{s.icon}</div>
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

                const { day, dateStr, info, isToday } = cell;
                const st = info ? (STATUS_CONFIG[info.status] || STATUS_CONFIG.planejado) : null;
                const isSelected = selectedDate === dateStr;

                return (
                  <div
                    key={cell.key}
                    onClick={() => info ? setSelectedDate(isSelected ? null : dateStr) : null}
                    style={{
                      background: isToday
                        ? c.todayBg
                        : isSelected
                          ? (isDark ? '#2A2D32' : '#ede9fe')
                          : c.raised,
                      borderRadius: '12px',
                      minHeight: '80px',
                      padding: '0.6rem',
                      cursor: info ? 'pointer' : 'default',
                      border: isSelected
                        ? `2px solid ${c.accent}`
                        : isToday
                          ? '2px solid transparent'
                          : `1px solid ${c.border}`,
                      transition: 'all 0.2s ease',
                      display: 'flex', flexDirection: 'column', gap: '0.3rem',
                      position: 'relative', overflow: 'hidden',
                    }}
                    onMouseEnter={e => { if (info && !isSelected) e.currentTarget.style.background = c.dayHover; }}
                    onMouseLeave={e => { if (info && !isSelected) e.currentTarget.style.background = c.raised; }}
                  >
                    <span style={{
                      fontSize: '0.9rem', fontWeight: 700,
                      color: isToday ? '#fff' : c.text,
                    }}>
                      {day}
                    </span>

                    {st && (
                      <>
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: st.color, flexShrink: 0,
                        }} />
                        {info.alimentacao && (
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
                      </>
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
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: cfg.color }} />
                <span style={{ fontSize: '0.78rem', color: c.muted, fontWeight: 500 }}>{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Painel de detalhes do dia selecionado ── */}
        {selectedDate && selectedInfo && (
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
                <div style={{
                  width: '2.5rem', height: '2.5rem', borderRadius: '12px',
                  background: statusCfg.color + '20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem', color: statusCfg.color, fontWeight: 700,
                }}>
                  {statusCfg.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: c.text, fontSize: '1rem' }}>
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </div>
                  <div style={{
                    fontSize: '0.8rem', fontWeight: 600,
                    color: statusCfg.color, marginTop: '0.1rem',
                  }}>
                    {statusCfg.label}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                style={{
                  background: 'none', border: 'none', color: c.muted,
                  fontSize: '1.2rem', cursor: 'pointer', padding: '0.25rem',
                  borderRadius: '8px', transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = c.text}
                onMouseLeave={e => e.currentTarget.style.color = c.muted}
              >
                <i className="fas fa-times" />
              </button>
            </div>

            {/* Conteúdo */}
            <div style={{ padding: '1.5rem', display: 'grid', gap: '1.25rem' }}>
              {selectedInfo.alimentacao && (
                <div>
                  <div style={{
                    fontSize: '0.75rem', fontWeight: 700, color: c.muted,
                    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem',
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                  }}>
                    <i className="fas fa-utensils" style={{ color: '#10b981' }} />
                    Alimentação do Dia
                  </div>
                  <div style={{
                    background: isDark ? '#0F1012' : '#f0fdf4',
                    border: `1px solid ${isDark ? '#2A2D32' : '#bbf7d0'}`,
                    borderRadius: '12px', padding: '1rem',
                    color: c.text, fontSize: '0.9rem', lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {selectedInfo.alimentacao}
                  </div>
                </div>
              )}

              {selectedInfo.notas && (
                <div>
                  <div style={{
                    fontSize: '0.75rem', fontWeight: 700, color: c.muted,
                    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem',
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                  }}>
                    <i className="fas fa-sticky-note" style={{ color: '#f59e0b' }} />
                    Notas e Observações
                  </div>
                  <div style={{
                    background: isDark ? '#0F1012' : '#fffbeb',
                    border: `1px solid ${isDark ? '#2A2D32' : '#fde68a'}`,
                    borderRadius: '12px', padding: '1rem',
                    color: c.text, fontSize: '0.9rem', lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {selectedInfo.notas}
                  </div>
                </div>
              )}

              {!selectedInfo.alimentacao && !selectedInfo.notas && (
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
