import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from './Header';
import { pacientesAPI } from './services/api';

const dateOf = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const dateKey = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  ? value
  : dateOf(value)?.toLocaleDateString('en-CA') || 'sem-data';
const number = (value, digits = 0) => value == null || value === '' ? '—' : Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : '—';

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

  const mealsByDay = useMemo(() => {
    const days = new Map();
    (paciente?.refeicoes || []).forEach((meal) => {
      const key = dateKey(meal.criadoEm || meal.createdAt);
      if (!days.has(key)) days.set(key, []);
      days.get(key).push(meal);
    });
    return [...days.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [paciente]);
  const waterByDay = useMemo(() => {
    const days = new Map();
    (paciente?.agua || []).forEach((record) => {
      const key = dateKey(record.criadoEm || record.createdAt);
      days.set(key, (days.get(key) || 0) + Number(record.quantidadeMl || record.amountMl || 0));
    });
    return [...days.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [paciente]);
  const latestWeight = paciente?.medidas?.find((item) => item.peso)?.peso;
  let planoAtual = null;
  try {
    const parsed = JSON.parse(paciente?.prescricaoSemanal || 'null');
    if (parsed?.version === 1 && Array.isArray(parsed.meals)) planoAtual = parsed;
  } catch { /* Prescrição antiga em texto livre. */ }
  const panel = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 16 };
  const label = { color: C.muted, fontSize: '.76rem', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 800 };
  const value = { color: C.text, margin: '5px 0 0', fontWeight: 650, lineHeight: 1.5, overflowWrap: 'anywhere' };

  if (loading) return <div className="nutri-theme"><Header theme="nutri" links={headerLinks} /><main className="nutri-dashboard"><div className="nutri-card">Carregando o acompanhamento do paciente…</div></main></div>;
  if (error || !paciente) return <div className="nutri-theme"><Header theme="nutri" links={headerLinks} /><main className="nutri-dashboard"><div className="nutri-card"><p role="alert">{error || 'Paciente não encontrado ou sem vínculo aceito.'}</p><Link to="/nutri-dashboard">Voltar ao dashboard</Link></div></main></div>;

  return (
    <div className="nutri-theme">
      <Header theme="nutri" links={headerLinks} />
      <main className="nutri-dashboard" style={{ maxWidth: 1120, margin: '0 auto', padding: '5.5rem 1rem 3rem' }}>
        <Link to="/nutri-dashboard" style={{ color: C.accent, fontWeight: 800, textDecoration: 'none' }}>← Voltar aos pacientes</Link>
        <section style={{ ...panel, marginTop: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <div style={{ width: 58, height: 58, display: 'grid', placeItems: 'center', borderRadius: 18, color: '#fff', background: C.primary, fontSize: 24, fontWeight: 900 }}>{paciente.nome?.[0]?.toUpperCase() || 'P'}</div>
            <div><h1 style={{ color: C.text, margin: 0 }}>{paciente.nome}</h1><p style={{ color: C.muted, margin: '5px 0 0' }}>{paciente.email} · Acompanhamento ativo</p></div>
          </div>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            <Link className="btn btn-primary" to={`/nutri-prescricao/${paciente.id}`}>Prescrever dieta</Link>
            <Link className="btn btn-outline" to={`/nutri-calendario/${paciente.id}`}>Calendário e consultas</Link>
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(165px,1fr))', gap: 12, marginBottom: 16 }}>
          {[
            ['Refeições registradas', String((paciente.refeicoes || []).length)],
            ['Dias com registros', String(mealsByDay.length)],
            ['Último peso informado', latestWeight ? `${latestWeight} kg` : paciente.peso ? `${paciente.peso} kg` : 'Sem registro'],
            ['Plano alimentar', paciente.prescricaoSemanal ? 'Prescrito' : 'Pendente'],
          ].map(([title, amount]) => <div key={title} style={{ ...panel, margin: 0, background: C.soft }}><div style={label}>{title}</div><div style={{ color: C.text, fontSize: '1.25rem', fontWeight: 900, marginTop: 7 }}>{amount}</div></div>)}
        </div>

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}><h2 style={{ color: C.text, margin: '0 0 5px' }}>Diário alimentar</h2><span style={{ color: C.muted, fontSize: '.85rem' }}>Registros enviados pelo aplicativo</span></div>
          {!mealsByDay.length ? <p style={{ color: C.muted, padding: '18px 0' }}>O paciente ainda não registrou refeições. Nenhum consumo foi estimado.</p> : mealsByDay.map(([day, meals]) => {
            const total = meals.reduce((sum, meal) => sum + Number(meal.calorias || 0), 0);
            const d = dateOf(`${day}T12:00:00`);
            return <div key={day} style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: 8, color: C.text, fontWeight: 850 }}><span>{d ? d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Data indisponível'}</span><span>{number(total)} kcal · {meals.length} {meals.length === 1 ? 'refeição' : 'refeições'}</span></div>
              {meals.slice().sort((a, b) => String(b.criadoEm).localeCompare(String(a.criadoEm))).map((meal) => {
                const date = dateOf(meal.criadoEm || meal.createdAt);
                return <article key={meal.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 8, padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
                  <div><div style={{ color: C.text, fontWeight: 800 }}>{meal.nome || 'Refeição'}{date && <small style={{ color: C.muted, fontWeight: 500 }}> · {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>}</div>{meal.descricao && <p style={{ color: C.muted, margin: '4px 0', whiteSpace: 'pre-wrap' }}>{meal.descricao}</p>}<small style={{ color: C.muted }}>C {number(meal.carboidratos, 1)} g · P {number(meal.proteinas, 1)} g · G {number(meal.gorduras, 1)} g</small></div>
                  <strong style={{ color: C.accent, whiteSpace: 'nowrap' }}>{number(meal.calorias)} kcal</strong>
                </article>;
              })}
            </div>;
          })}
        </section>

        <section style={panel}>
          <h2 style={{ color: C.text, margin: '0 0 12px' }}>Hidratação registrada</h2>
          {!waterByDay.length ? <p style={{ color: C.muted }}>O paciente ainda não registrou consumo de água no aplicativo.</p> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10 }}>{waterByDay.slice(0, 14).map(([day, amount]) => <div key={day} style={{ background: C.soft, borderRadius: 12, padding: 12 }}><div style={{ color: C.muted, fontSize: '.8rem', textTransform: 'capitalize' }}>{dateOf(`${day}T12:00:00`)?.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}</div><strong style={{ display: 'block', color: C.text, marginTop: 4 }}>{number(amount)} ml</strong></div>)}</div>}
        </section>

        <section style={panel}>
          <h2 style={{ color: C.text, margin: '0 0 12px' }}>Evolução de medidas</h2>
          {!paciente.medidas?.length ? <p style={{ color: C.muted }}>Nenhuma medida registrada no aplicativo ainda.</p> : <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', color: C.text, minWidth: 560 }}><thead><tr>{['Data', 'Peso', 'Cintura', 'Quadril', 'Braço', 'Gordura corporal'].map((heading) => <th key={heading} style={{ textAlign: 'left', padding: 10, color: C.muted, borderBottom: `1px solid ${C.border}` }}>{heading}</th>)}</tr></thead><tbody>{paciente.medidas.map((item) => <tr key={item.id}>{[dateOf(item.criadoEm)?.toLocaleDateString('pt-BR') || '—', item.peso ? `${item.peso} kg` : '—', item.cintura ? `${item.cintura} cm` : '—', item.quadril ? `${item.quadril} cm` : '—', item.braco ? `${item.braco} cm` : '—', item.gorduraCorporal ? `${item.gorduraCorporal}%` : '—'].map((cell, i) => <td key={i} style={{ padding: 10, borderBottom: `1px solid ${C.border}` }}>{cell}</td>)}</tr>)}</tbody></table></div>}
        </section>

        <section style={panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}><h2 style={{ color: C.text, margin: 0 }}>Plano alimentar atual</h2><Link to={`/nutri-prescricao/${paciente.id}`} style={{ color: C.accent, fontWeight: 800 }}>Editar prescrição →</Link></div>
          {planoAtual ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 10, marginTop: 14 }}>{planoAtual.meals.map((meal, index) => <article key={index} style={{ background: C.soft, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}><strong style={{ color: C.text }}>{meal.horario ? `${meal.horario} · ` : ''}{meal.nome || `Refeição ${index + 1}`}</strong>{meal.alimentos && <p style={{ color: C.muted, whiteSpace: 'pre-wrap', margin: '8px 0 4px' }}>{meal.alimentos}</p>}{meal.porcao && <small style={{ color: C.text }}>Porção: {meal.porcao}</small>}{meal.calorias != null && meal.calorias !== '' && <p style={{ color: C.primary, fontWeight: 850, margin: '7px 0 0' }}>{meal.calorias} kcal</p>}{meal.observacao && <p style={{ color: C.muted, margin: '6px 0 0' }}>Opção/observação: {meal.observacao}</p>}</article>)}{planoAtual.notes && <div style={{ gridColumn: '1 / -1', color: C.text, whiteSpace: 'pre-wrap', background: C.soft, padding: 14, borderRadius: 12 }}><strong>Orientações gerais</strong><br />{planoAtual.notes}</div>}</div> : paciente.prescricaoSemanal ? <div style={{ color: C.text, lineHeight: 1.75, whiteSpace: 'pre-wrap', marginTop: 12 }}>{paciente.prescricaoSemanal}</div> : <p style={{ color: C.muted, marginBottom: 0 }}>Ainda não há uma dieta prescrita para este paciente.</p>}
        </section>
      </main>
    </div>
  );
}
