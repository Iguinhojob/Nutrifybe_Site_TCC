import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from './Header';
import { pacientesAPI } from './services/api';

export default function NutriPrescricao() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [prescription, setPrescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const dark = document.body.classList.contains('dark-mode');
  const C = { card: dark ? '#172321' : '#fff', soft: dark ? '#1d2c2a' : '#f4f8f9', border: dark ? 'rgba(255,255,255,.1)' : '#e2e8f0', text: dark ? '#e6f2f1' : '#18343a', muted: dark ? '#a7bfbd' : '#647a80' };
  const links = [{ href: '/nutri-dashboard', text: 'Início' }, { href: '/nutri-solicitacoes', text: 'Solicitações' }, { href: '/nutri-dashboard', text: 'Sair', onClick: () => { localStorage.removeItem('currentUser'); navigate('/login'); } }];

  useEffect(() => {
    let active = true;
    pacientesAPI.getById(id).then((data) => {
      if (!active) return;
      setPatient(data);
      setPrescription(data.prescricaoSemanal || '');
    }).catch((e) => {
      if (active) setMessage(e.message || 'Não foi possível carregar este paciente.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const save = async () => {
    if (!prescription.trim()) { setMessage('Escreva a prescrição antes de salvar.'); return; }
    setSaving(true); setMessage('');
    try {
      const updated = await pacientesAPI.updateClinical(id, { prescricaoSemanal: prescription.trim() });
      setPatient((previous) => ({ ...previous, ...updated }));
      setPrescription(updated.prescricaoSemanal || prescription.trim());
      setMessage('Prescrição salva e sincronizada com o aplicativo do paciente.');
    } catch (e) {
      setMessage(e.message || 'Não foi possível salvar a prescrição.');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="nutri-theme"><Header theme="nutri" links={links} /><main className="nutri-dashboard">Carregando ficha clínica…</main></div>;
  if (!patient) return <div className="nutri-theme"><Header theme="nutri" links={links} /><main className="nutri-dashboard"><p role="alert">{message || 'Paciente não encontrado ou sem vínculo aceito.'}</p><Link to="/nutri-dashboard">Voltar</Link></main></div>;

  const panel = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, marginBottom: 16 };
  return (
    <div className="nutri-theme">
      <Header theme="nutri" links={links} />
      <main className="nutri-dashboard" style={{ maxWidth: 980, margin: '0 auto', padding: '5.5rem 1rem 3rem' }}>
        <Link to={`/ficha-paciente/${id}`} style={{ color: '#0e7490', fontWeight: 800, textDecoration: 'none' }}>← Voltar ao acompanhamento</Link>
        <section style={{ ...panel, marginTop: 16 }}>
          <p style={{ color: '#0e7490', fontWeight: 850, margin: '0 0 7px' }}>PLANO TERAPÊUTICO</p>
          <h1 style={{ color: C.text, margin: 0 }}>Prescrição de {patient.nome}</h1>
          <p style={{ color: C.muted, marginBottom: 0 }}>A prescrição salva aparece no aplicativo do paciente em “Plano alimentar”.</p>
        </section>

        <section style={{ ...panel, background: C.soft }}>
          <h2 style={{ color: C.text, marginTop: 0, fontSize: '1.1rem' }}>Resumo para personalizar a dieta</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
            <div><strong style={{ color: C.muted }}>Objetivo</strong><div style={{ color: C.text, marginTop: 5 }}>{patient.objetivo || 'Não informado'}</div></div>
            <div><strong style={{ color: C.muted }}>Peso atual / meta</strong><div style={{ color: C.text, marginTop: 5 }}>{patient.peso || '—'} kg / {patient.pesoMeta || '—'} kg</div></div>
            <div><strong style={{ color: C.muted }}>Atividade</strong><div style={{ color: C.text, marginTop: 5 }}>{patient.atividade || 'Não informada'}</div></div>
            <div><strong style={{ color: C.muted }}>Restrições</strong><div style={{ color: C.text, marginTop: 5 }}>{patient.restricoes || 'Nenhuma informada'}</div></div>
            <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: C.muted }}>Condições e observações</strong><div style={{ color: C.text, marginTop: 5 }}>{patient.condicaoSaude || patient.observacoes || 'Nenhuma informada'}</div></div>
          </div>
        </section>

        <section style={panel}>
          <label htmlFor="weekly-prescription" style={{ display: 'block', color: C.text, fontWeight: 850, marginBottom: 8 }}>Plano alimentar e orientações</label>
          <p style={{ color: C.muted, marginTop: 0, fontSize: '.9rem' }}>Registre horários, opções e porções, substituições, hidratação e orientações de acompanhamento. Use uma linha para cada refeição; o app organiza o texto como itens legíveis.</p>
          <textarea id="weekly-prescription" value={prescription} onChange={(e) => setPrescription(e.target.value)} rows={16} placeholder={'Café da manhã — horário e opções\nAlmoço — composição e porções\nLanche — opções de substituição\nJantar — composição e porções\nHidratação e orientações gerais\nRetorno / acompanhamento'} style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', padding: 15, borderRadius: 12, border: `1px solid ${C.border}`, background: C.soft, color: C.text, font: 'inherit', lineHeight: 1.65 }} />
          {message && <p role="status" style={{ color: message.startsWith('Prescrição salva') ? '#059669' : '#b45309', fontWeight: 700 }}>{message}</p>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
            <button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? 'Salvando…' : 'Salvar e enviar ao aplicativo'}</button>
            <Link className="btn btn-outline" to={`/nutri-calendario/${id}`}>Agendar retorno</Link>
            <Link className="btn btn-outline" to={`/ficha-paciente/${id}`}>Cancelar</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
