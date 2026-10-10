import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from './Header';
import { pacientesAPI } from './services/api';
import { formatFoodText } from './foodNames';

export default function FichaPaciente() {
  const { id } = useParams();
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dark, setDark] = useState(() => localStorage.getItem('darkMode') === 'true');
  useEffect(() => {
    const syncTheme = (event) => setDark(event.detail?.darkMode ?? localStorage.getItem('darkMode') === 'true');
    window.addEventListener('nutrifybe-theme-change', syncTheme);
    return () => window.removeEventListener('nutrifybe-theme-change', syncTheme);
  }, []);
  const C = {
    card: dark ? '#172321' : '#fff', soft: dark ? '#1d2c2a' : '#f4f8f9',
    border: dark ? 'rgba(255,255,255,.1)' : '#e2e8f0',
    text: dark ? '#e6f2f1' : '#18343a', muted: dark ? '#a7bfbd' : '#647a80',
    primary: '#0891a3', accent: dark ? '#67e8f9' : '#0e7490',
  };
  const headerLinks = [
    { href: '/nutri-dashboard', text: 'Dashboard' },
    { href: '/nutri-solicitacoes', text: 'Solicitações' },
    { href: '/', text: 'Sair', onClick: () => localStorage.removeItem('currentUser') },
  ];

  useEffect(() => {
    let active = true;
    setLoading(true);
    pacientesAPI.getById(id).then((data) => {
      if (active) setPaciente(data);
    }).catch((e) => {
      if (active) setError(e.message || 'Não foi possível carregar a ficha deste paciente.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  let planoAtual = null;
  try {
    const parsed = JSON.parse(paciente?.prescricaoSemanal || 'null');
    if (parsed?.version === 1 && Array.isArray(parsed.meals)) planoAtual = parsed;
  } catch { /* Prescrição antiga em texto livre. */ }
  const refeicoesDoDiario = Array.isArray(paciente?.refeicoes) ? paciente.refeicoes : [];
  const diasDoDiario = Object.values(refeicoesDoDiario.reduce((dias, refeicao) => {
    const dia = String(refeicao.criadoEm || '').slice(0, 10);
    if (!dia) return dias;
    (dias[dia] ||= []).push(refeicao);
    return dias;
  }, {})).sort((a, b) => b[0].criadoEm.localeCompare(a[0].criadoEm));
  const somaDoDia = (refeicoes, campo) => refeicoes.reduce((total, refeicao) => total + Number(refeicao[campo] || 0), 0);
  const panel = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 16 };
  const label = { color: C.muted, fontSize: '.76rem', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 800 };
  const value = { color: C.text, margin: '5px 0 0', fontWeight: 650, lineHeight: 1.5, overflowWrap: 'anywhere' };

  if (loading) return <div className="nutri-theme"><Header theme="nutri" links={headerLinks} /><main className="nutri-dashboard"><div className="nutri-card">Carregando o acompanhamento do paciente…</div></main></div>;
  if (error || !paciente) return <div className="nutri-theme"><Header theme="nutri" links={headerLinks} /><main className="nutri-dashboard"><div className="nutri-card"><p role="alert">{error || 'Paciente não encontrado ou sem vínculo aceito.'}</p><Link to="/nutri-dashboard">Voltar ao dashboard</Link></div></main></div>;

  return (
    <div className="nutri-theme">
      <Header theme="nutri" links={headerLinks} />
      <main className="nutri-dashboard" style={{ maxWidth: 1120, margin: '0 auto', padding: '5.5rem 1rem 3rem' }}>
        <Link to="/nutri-dashboard" style={{ color: C.accent, fontWeight: 800, textDecoration: 'none' }}>Voltar aos pacientes</Link>
        <section style={{ ...panel, marginTop: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <div style={{ width: 58, height: 58, display: 'grid', placeItems: 'center', borderRadius: 18, color: '#fff', background: C.primary, fontSize: 24, fontWeight: 900 }}>{paciente.nome?.[0]?.toUpperCase() || 'P'}</div>
            <div><h1 style={{ color: C.text, margin: 0 }}>{paciente.nome}</h1><p style={{ color: C.muted, margin: '5px 0 0' }}>{paciente.email} · Acompanhamento ativo</p></div>
          </div>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            <Link className="btn patient-chat-link" to={`/nutri-chat/${paciente.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: dark ? '#1d3936' : '#ecfeff', border: `1px solid ${dark ? '#285b55' : '#a5f3fc'}`, color: dark ? '#99f6e4' : '#0e7490', boxShadow: 'none', textDecoration: 'none' }}>
              <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" /></svg>
              Abrir chat
            </Link>
            <Link className="btn btn-primary" to={`/nutri-prescricao/${paciente.id}`}>Prescrever dieta</Link>
            <Link className="btn btn-outline" to={`/nutri-calendario/${paciente.id}`}>Calendário e consultas</Link>
          </div>
        </section>

        <section style={panel}>
          <h2 style={{ color: C.text, margin: '0 0 16px' }}>Perfil clínico e objetivos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px 24px' }}>
            {[
              ['Idade', paciente.idade != null ? `${paciente.idade} anos` : 'Não informada'],
              ['Sexo', paciente.sexo || 'Não informado'], ['Objetivo', paciente.objetivo || 'Não informado'],
              ['Peso atual / meta', `${paciente.peso ? `${paciente.peso} kg` : '—'} / ${paciente.pesoMeta ? `${paciente.pesoMeta} kg` : '—'}`],
              ['Altura / IMC', `${paciente.altura ? `${paciente.altura} cm` : '—'} / ${paciente.peso && paciente.altura ? (paciente.peso / ((paciente.altura / 100) ** 2)).toFixed(1) : '—'}`],
              ['Atividade física', paciente.atividade || 'Não informada'],
              ['Meta de hidratação', paciente.metaAgua ? `${paciente.metaAgua} L por dia` : 'Não informada'],
              ['Restrições e alergias', paciente.restricoes || 'Nenhuma informada'],
              ['Condição / observações', paciente.condicaoSaude || paciente.observacoes || 'Nenhuma informada'],
              ['Preferência de acompanhamento', paciente.preferenciaAcompanhamento || 'Não informada'],
            ].map(([title, content]) => <div key={title}><div style={label}>{title}</div><p style={value}>{content}</p></div>)}
          </div>
        </section>

        <section style={panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}><h2 style={{ color: C.text, margin: 0 }}>Plano alimentar atual</h2><Link to={`/nutri-prescricao/${paciente.id}`} style={{ color: C.accent, fontWeight: 800 }}>Editar prescrição →</Link></div>
          {planoAtual ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 10, marginTop: 14 }}>{planoAtual.meals.map((meal, index) => <article key={index} style={{ background: C.soft, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}><strong style={{ color: C.text }}>{meal.horario ? `${meal.horario} · ` : ''}{meal.nome || `Refeição ${index + 1}`}</strong>{meal.alimentos && <p style={{ color: C.muted, whiteSpace: 'pre-wrap', margin: '8px 0 4px' }}>{meal.alimentos}</p>}{meal.porcao && <small style={{ color: C.text }}>Porção: {meal.porcao}</small>}{meal.calorias != null && meal.calorias !== '' && <p style={{ color: C.primary, fontWeight: 850, margin: '7px 0 0' }}>{meal.calorias} kcal</p>}{meal.observacao && <p style={{ color: C.muted, margin: '6px 0 0' }}>Opção/observação: {meal.observacao}</p>}</article>)}{planoAtual.notes && <div style={{ gridColumn: '1 / -1', color: C.text, whiteSpace: 'pre-wrap', background: C.soft, padding: 14, borderRadius: 12 }}><strong>Orientações gerais</strong><br />{planoAtual.notes}</div>}</div> : paciente.prescricaoSemanal ? <div style={{ color: C.text, lineHeight: 1.75, whiteSpace: 'pre-wrap', marginTop: 12 }}>{paciente.prescricaoSemanal}</div> : <p style={{ color: C.muted, marginBottom: 0 }}>Ainda não há uma dieta prescrita para este paciente.</p>}
        </section>

        <section style={panel}>
          <h2 style={{ color: C.text, margin: '0 0 5px' }}>Diário alimentar</h2>
          <p style={{ color: C.muted, margin: '0 0 16px' }}>Consumo registrado pelo paciente · somente leitura</p>
          {diasDoDiario.length ? <div style={{ display: 'grid', gap: 12 }}>{diasDoDiario.map((refeicoes) => {
            const dia = String(refeicoes[0].criadoEm).slice(0, 10);
            return <article key={dia} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, background: C.soft }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <strong style={{ color: C.text }}>{new Date(`${dia}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                <span style={{ color: C.primary, fontWeight: 850 }}>{somaDoDia(refeicoes, 'calorias').toFixed(0)} kcal</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, color: C.muted, fontSize: 13, margin: '8px 0 12px' }}>
                <span>Carboidratos {somaDoDia(refeicoes, 'carboidratos').toFixed(1)} g</span><span>Proteínas {somaDoDia(refeicoes, 'proteinas').toFixed(1)} g</span><span>Gorduras {somaDoDia(refeicoes, 'gorduras').toFixed(1)} g</span><span>Fibras {somaDoDia(refeicoes, 'fibras').toFixed(1)} g</span>
              </div>
              {refeicoes.map(refeicao => <div key={refeicao.id} style={{ borderTop: `1px solid ${C.border}`, padding: '9px 0 3px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
                <div><strong style={{ color: C.text }}>{refeicao.nome || 'Refeição'}</strong>{refeicao.descricao && <div style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{formatFoodText(refeicao.descricao)}</div>}</div>
                <span style={{ color: C.muted, fontSize: 12 }}>{Number(refeicao.calorias || 0).toFixed(0)} kcal · C {Number(refeicao.carboidratos || 0).toFixed(1)} g · P {Number(refeicao.proteinas || 0).toFixed(1)} g · G {Number(refeicao.gorduras || 0).toFixed(1)} g · F {Number(refeicao.fibras || 0).toFixed(1)} g</span>
              </div>)}
            </article>;
          })}</div> : <p style={{ color: C.muted, marginBottom: 0 }}>O paciente ainda não registrou refeições no diário.</p>}
        </section>
      </main>
    </div>
  );
}
