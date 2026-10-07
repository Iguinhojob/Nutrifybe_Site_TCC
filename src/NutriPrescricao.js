import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from './Header';
import { pacientesAPI } from './services/api';

const newMeal = () => ({ horario: '', nome: '', alimentos: '', porcao: '', calorias: '', observacao: '' });
const decodePlan = (raw) => {
  try {
    const value = JSON.parse(raw);
    if (value?.version === 1 && Array.isArray(value.meals)) return { meals: value.meals, notes: value.notes || '' };
  } catch { /* legado em texto */ }
  return { meals: [], notes: raw || '' };
};

export default function NutriPrescricao() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [plan, setPlan] = useState({ meals: [newMeal()], notes: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [dark, setDark] = useState(() => localStorage.getItem('darkMode') === 'true');
  useEffect(() => {
    const sync = (event) => setDark(event.detail?.darkMode ?? localStorage.getItem('darkMode') === 'true');
    window.addEventListener('nutrifybe-theme-change', sync);
    return () => window.removeEventListener('nutrifybe-theme-change', sync);
  }, []);
  const C = { card: dark ? '#172321' : '#fff', soft: dark ? '#1d2c2a' : '#f4f8f9', border: dark ? 'rgba(255,255,255,.1)' : '#e2e8f0', text: dark ? '#e6f2f1' : '#18343a', muted: dark ? '#a7bfbd' : '#647a80' };
  const links = [{ href: '/nutri-dashboard', text: 'Início' }, { href: '/nutri-solicitacoes', text: 'Solicitações' }, { href: '/nutri-dashboard', text: 'Sair', onClick: () => { localStorage.removeItem('currentUser'); navigate('/login'); } }];

  useEffect(() => {
    let active = true;
    pacientesAPI.getById(id).then((data) => {
      if (!active) return;
      setPatient(data);
      const decoded = data.prescricaoSemanal ? decodePlan(data.prescricaoSemanal) : { meals: [newMeal()], notes: '' };
      setPlan({ ...decoded, meals: decoded.meals.length ? decoded.meals : [newMeal()] });
    }).catch((e) => { if (active) setMessage(e.message || 'Não foi possível carregar este paciente.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const updateMeal = (index, field, value) => setPlan((old) => ({ ...old, meals: old.meals.map((meal, i) => i === index ? { ...meal, [field]: value } : meal) }));
  const save = async () => {
    const meals = plan.meals.filter((meal) => [meal.nome, meal.alimentos, meal.porcao, meal.calorias, meal.observacao].some((value) => value?.trim())).map((meal) => ({ ...meal }));
    for (const meal of meals) {
      if (meal.calorias && (!Number.isFinite(Number(meal.calorias)) || Number(meal.calorias) < 0)) { setMessage('Informe calorias válidas para cada refeição.'); return; }
      meal.calorias = meal.calorias ? String(Math.round(Number(meal.calorias))) : '';
    }
    if (!meals.length && !plan.notes.trim()) { setMessage('Adicione ao menos uma refeição ou orientação.'); return; }
    setSaving(true); setMessage('');
    try {
      const serialized = JSON.stringify({ version: 1, meals, notes: plan.notes });
      const updated = await pacientesAPI.updateClinical(id, { prescricaoSemanal: serialized });
      setPatient((old) => ({ ...old, ...updated }));
      setPlan({ meals: meals.length ? meals : [newMeal()], notes: plan.notes });
      setMessage('Prescrição salva e sincronizada com o aplicativo do paciente.');
    } catch (e) { setMessage(e.message || 'Não foi possível salvar a prescrição.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="nutri-theme"><Header theme="nutri" links={links} /><main className="nutri-dashboard">Carregando ficha clínica…</main></div>;
  if (!patient) return <div className="nutri-theme"><Header theme="nutri" links={links} /><main className="nutri-dashboard"><p role="alert">{message || 'Paciente não encontrado ou sem vínculo aceito.'}</p><Link to="/nutri-dashboard">Voltar</Link></main></div>;

  const panel = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, marginBottom: 16 };
  const field = { width: '100%', boxSizing: 'border-box', padding: 11, borderRadius: 9, border: `1px solid ${C.border}`, background: C.soft, color: C.text, font: 'inherit' };
  return <div className="nutri-theme">
    <Header theme="nutri" links={links} />
    <main className="nutri-dashboard" style={{ maxWidth: 980, margin: '0 auto', padding: '5.5rem 1rem 3rem' }}>
      <Link to={`/ficha-paciente/${id}`} style={{ color: '#0e7490', fontWeight: 800, textDecoration: 'none' }}>Voltar ao acompanhamento</Link>
      <section style={{ ...panel, marginTop: 16 }}><p style={{ color: '#0e7490', fontWeight: 850, margin: '0 0 7px' }}>PLANO TERAPÊUTICO</p><h1 style={{ color: C.text, margin: 0 }}>Prescrição de {patient.nome}</h1><p style={{ color: C.muted, marginBottom: 0 }}>Organize refeições, horários, porções e orientações. Cada refeição vira um cartão com confirmação no aplicativo.</p></section>
      <section style={{ ...panel, background: C.soft }}><h2 style={{ color: C.text, marginTop: 0, fontSize: '1.1rem' }}>Resumo do paciente</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, color: C.text }}><div><b>Objetivo</b><div>{patient.objetivo || 'Não informado'}</div></div><div><b>Peso atual / meta</b><div>{patient.peso || '—'} kg / {patient.pesoMeta || '—'} kg</div></div><div><b>Atividade</b><div>{patient.atividade || 'Não informada'}</div></div><div><b>Restrições</b><div>{patient.restricoes || 'Nenhuma informada'}</div></div><div style={{ gridColumn: '1 / -1' }}><b>Condições e observações</b><div>{patient.condicaoSaude || patient.observacoes || 'Nenhuma informada'}</div></div></div></section>
      <section style={panel}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><div><h2 style={{ color: C.text, margin: '0 0 4px' }}>Refeições prescritas</h2><span style={{ color: C.muted }}>Preencha uma refeição por cartão.</span></div><button className="btn btn-outline" onClick={() => setPlan((old) => ({ ...old, meals: [...old.meals, newMeal()] }))}>＋ Adicionar refeição</button></div>
        {plan.meals.map((meal, index) => <article key={index} style={{ border: `1px solid ${C.border}`, borderRadius: 13, padding: 16, marginTop: 14, background: C.card }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h3 style={{ color: C.text, margin: '0 0 12px' }}>Refeição {index + 1}</h3>{plan.meals.length > 1 && <button aria-label="Remover refeição" onClick={() => { if (window.confirm("Tem certeza que deseja remover esta refeição do plano?")) setPlan((old) => ({ ...old, meals: old.meals.filter((_, i) => i !== index) })); }} style={{ border: 0, color: '#b91c1c', background: 'transparent', cursor: 'pointer' }}>Remover</button>}</div><div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px,.5fr) minmax(180px,1fr)', gap: 12 }}><label style={{ color: C.muted }}>Horário<input type="time" value={meal.horario} onChange={(e) => updateMeal(index, 'horario', e.target.value)} style={field} /></label><label style={{ color: C.muted }}>Nome da refeição<input placeholder="Ex.: Café da manhã" value={meal.nome} onChange={(e) => updateMeal(index, 'nome', e.target.value)} style={field} /></label><label style={{ color: C.muted, gridColumn: '1 / -1' }}>Alimentos e preparo<textarea rows={3} placeholder="Ex.: iogurte natural, banana e aveia" value={meal.alimentos} onChange={(e) => updateMeal(index, 'alimentos', e.target.value)} style={field} /></label><label style={{ color: C.muted }}>Porções e quantidades<input placeholder="Ex.: 1 pote, 1 unidade, 2 colheres" value={meal.porcao} onChange={(e) => updateMeal(index, 'porcao', e.target.value)} style={field} /></label><label style={{ color: C.muted }}>Calorias da refeição (kcal)<input type="number" min="0" step="1" inputMode="numeric" placeholder="Ex.: 450" value={meal.calorias || ''} onChange={(e) => updateMeal(index, 'calorias', e.target.value)} style={field} /></label><label style={{ color: C.muted, gridColumn: '1 / -1' }}>Substituições / observação<input placeholder="Opções de troca" value={meal.observacao} onChange={(e) => updateMeal(index, 'observacao', e.target.value)} style={field} /></label></div></article>)}
        <label style={{ display: 'block', color: C.text, fontWeight: 800, marginTop: 20 }}>Orientações gerais<textarea rows={4} value={plan.notes} onChange={(e) => setPlan((old) => ({ ...old, notes: e.target.value }))} placeholder="Hidratação, recomendações e acompanhamento" style={{ ...field, marginTop: 7 }} /></label>
        {message && <p role="status" style={{ color: message.startsWith('Prescrição salva') ? '#059669' : '#b45309', fontWeight: 700 }}>{message}</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}><button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? 'Salvando…' : 'Salvar e enviar ao aplicativo'}</button><Link className="btn btn-outline" to={`/nutri-calendario/${id}`}>Agendar retorno</Link><Link className="btn btn-outline" to={`/ficha-paciente/${id}`}>Cancelar</Link></div>
      </section>
    </main>
  </div>;
}
