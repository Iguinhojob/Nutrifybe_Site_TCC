import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import NutriLayout, { PageHeader, useShell } from './ui/NutriLayout';
import { Badge, ConfirmDialog, ErrorState, LoadingState, Notice, useToast } from './ui/feedback';
import Icon from './ui/icons';
import { decodePlan, planTotals } from './nutri/plan';
import { pacientesAPI } from './services/api';
import { fmtNum, friendlyError, isNum, nameOf, plural } from './ui/format';

const newMeal = () => ({ horario: '', nome: '', alimentos: '', porcao: '', calorias: '', observacao: '' });
const SUGESTOES = ['Café da manhã', 'Lanche da manhã', 'Almoço', 'Lanche da tarde', 'Jantar', 'Ceia'];
let keySeq = 0;
const row = (meal) => ({ key: `m${++keySeq}`, meal: { ...newMeal(), ...meal } });
const hasContent = (meal) => [meal.nome, meal.alimentos, meal.porcao, meal.calorias, meal.observacao].some((v) => String(v ?? '').trim());
const kcalInvalid = (value) => String(value ?? '').trim() !== '' && (!Number.isFinite(Number(value)) || Number(value) < 0);
const snapshot = (rows, notes) => JSON.stringify({ meals: rows.map((r) => r.meal), notes });

function Prescricao() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { handleAuthError } = useShell();
  const [patient, setPatient] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [rows, setRows] = useState([row()]);
  const [notes, setNotes] = useState('');
  const [legacy, setLegacy] = useState(false);
  const [saved, setSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const focusKey = useRef(null);
  const messageRef = useRef(null);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const data = await pacientesAPI.getById(id);
      setPatient(data);
      const decoded = decodePlan(data.prescricaoSemanal);
      const initialRows = decoded.meals.length ? decoded.meals.map(row) : [row()];
      setRows(initialRows);
      setNotes(decoded.notes);
      setLegacy(decoded.kind === 'legacy');
      setSaved(snapshot(initialRows, decoded.notes));
    } catch (e) {
      if (handleAuthError(e)) return;
      setLoadError(e.status === 404 ? 'Paciente não encontrado ou sem vínculo ativo com você.' : friendlyError(e, 'Não foi possível carregar este paciente.'));
    }
  }, [id, handleAuthError]);

  useEffect(() => { load(); }, [load]);

  const dirty = saved !== null && snapshot(rows, notes) !== saved;

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => {
    if (!focusKey.current) return;
    document.getElementById(`nome-${focusKey.current}`)?.focus();
    focusKey.current = null;
  }, [rows]);

  const meaningful = useMemo(() => rows.filter((r) => hasContent(r.meal)), [rows]);
  const totals = useMemo(() => planTotals(meaningful.map((r) => r.meal)), [meaningful]);
  const ordered = useMemo(() => meaningful.slice().sort((a, b) => (a.meal.horario || '99:99').localeCompare(b.meal.horario || '99:99')), [meaningful]);
  const invalidCount = rows.filter((r) => kcalInvalid(r.meal.calorias)).length;

  const update = (key, field, value) => setRows((list) => list.map((r) => (r.key === key ? { ...r, meal: { ...r.meal, [field]: value } } : r)));
  const move = (index, dir) => setRows((list) => {
    const next = list.slice();
    const [item] = next.splice(index, 1);
    next.splice(index + dir, 0, item);
    return next;
  });
  const addMeal = () => {
    const r = row();
    focusKey.current = r.key;
    setRows((list) => [...list, r]);
  };
  const removeMeal = (key) => {
    setRows((list) => {
      const next = list.filter((r) => r.key !== key);
      return next.length ? next : [row()];
    });
    setRemoving(null);
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => messageRef.current?.focus(), 0);
  };

  // Mesmas validações e mesmo formato salvo de antes.
  const validate = () => {
    for (const r of meaningful) {
      if (kcalInvalid(r.meal.calorias)) return 'Informe calorias válidas (número igual ou maior que zero) em todas as refeições.';
    }
    if (!meaningful.length && !notes.trim()) return 'Adicione ao menos uma refeição ou uma orientação geral antes de salvar.';
    return null;
  };

  const openReview = () => {
    const problem = validate();
    if (problem) { showMessage({ tone: 'danger', text: problem }); return; }
    setMessage(null);
    setReviewing(true);
  };

  const save = async () => {
    const meals = meaningful.map((r) => ({ ...r.meal }));
    for (const meal of meals) meal.calorias = meal.calorias ? String(Math.round(Number(meal.calorias))) : '';
    setSaving(true);
    try {
      const serialized = JSON.stringify({ version: 1, meals, notes });
      const updated = await pacientesAPI.updateClinical(id, { prescricaoSemanal: serialized });
      setPatient((old) => ({ ...old, ...updated }));
      const nextRows = meals.length ? meals.map(row) : [row()];
      setRows(nextRows);
      setLegacy(false);
      setSaved(snapshot(nextRows, notes));
      setReviewing(false);
      setMessage(null);
      toast.show({
        tone: 'success',
        title: 'Plano alimentar salvo',
        message: `${nameOf(patient)} já pode ver o novo plano no aplicativo.`,
        action: { to: `/ficha-paciente/${id}?aba=plano`, label: 'Ver plano na ficha' },
      });
    } catch (e) {
      setReviewing(false);
      if (handleAuthError(e)) return;
      showMessage({ tone: 'danger', text: friendlyError(e, 'Não foi possível salvar o plano. Suas alterações continuam aqui; tente novamente.') });
    } finally {
      setSaving(false);
    }
  };

  const clearPrescription = async () => {
    setSaving(true);
    try {
      const updated = await pacientesAPI.updateClinical(id, { prescricaoSemanal: '' });
      setPatient((old) => ({ ...old, ...updated, prescricaoSemanal: '' }));
      const nextRows = [row()];
      setRows(nextRows);
      setNotes('');
      setLegacy(false);
      setSaved(snapshot(nextRows, ''));
      setClearing(false);
      setMessage(null);
      toast.show({
        tone: 'success',
        title: 'Prescrição excluída',
        message: `${nameOf(patient)} não verá mais este plano no aplicativo. Os registros já feitos no diário foram preservados.`,
      });
    } catch (e) {
      if (handleAuthError(e)) return;
      setClearing(false);
      showMessage({ tone: 'danger', text: friendlyError(e, 'Não foi possível excluir a prescrição. Tente novamente.') });
    } finally {
      setSaving(false);
    }
  };

  const fichaLink = `/ficha-paciente/${id}?aba=plano`;

  if (loadError) {
    return (
      <>
        <Link to="/nutri-dashboard" className="nf-back"><Icon name="arrowLeft" size={17} /> Voltar ao painel</Link>
        <div className="nf-card"><ErrorState title="Plano indisponível" onRetry={load}>{loadError}</ErrorState></div>
      </>
    );
  }
  if (!patient) return <div className="nf-card"><LoadingState label="Carregando plano alimentar…" /></div>;

  const name = nameOf(patient);

  const SaveStatus = () => (
    <p style={{ fontSize: '.88rem', color: dirty ? 'var(--nf-warning)' : 'var(--nf-muted)', display: 'flex', alignItems: 'center', gap: 6 }} aria-live="polite">
      <Icon name={dirty ? 'edit' : 'checkCircle'} size={15} /> {dirty ? 'Alterações não salvas' : 'Tudo salvo'}
    </p>
  );

  return (
    <>
      <PageHeader
        back={{ to: fichaLink, label: `Voltar à ficha de ${name}` }}
        eyebrow="Plano alimentar"
        title={`Plano de ${name}`}
        docTitle={`Plano de ${name}`}
        description="Monte as refeições do dia com horário, alimentos, porções e calorias. Revise o resumo ao lado antes de enviar ao aplicativo."
      />

      <details className="nf-card soft" style={{ marginBottom: 20 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--nf-text)' }}>Dados do paciente para considerar</summary>
        <dl className="nf-dl" style={{ marginTop: 14 }}>
          {[
            ['Objetivo', patient.objetivo],
            ['Peso atual / meta', `${isNum(patient.peso) ? `${fmtNum(patient.peso, 1)} kg` : '—'} / ${isNum(patient.pesoMeta) ? `${fmtNum(patient.pesoMeta, 1)} kg` : '—'}`],
            ['Atividade física', patient.atividade],
            ['Restrições e alergias', patient.restricoes],
            ['Condição de saúde / observações', patient.condicaoSaude || patient.observacoes],
          ].map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd className={value ? undefined : 'is-empty'}>{value || 'Não informado'}</dd></div>
          ))}
        </dl>
      </details>

      {legacy && (
        <div style={{ marginBottom: 20 }}>
          <Notice tone="info" title="Este paciente tinha um plano em texto livre">
            O texto foi colocado em “Orientações gerais”. Se quiser, distribua o conteúdo em refeições antes de salvar.
          </Notice>
        </div>
      )}

      {message && (
        <div ref={messageRef} tabIndex={-1} style={{ marginBottom: 20, outline: 'none' }}>
          <Notice tone={message.tone} role="alert">{message.text}</Notice>
        </div>
      )}

      <div className="nf-editor">
        <div className="nf-stack">
          <datalist id="sugestoes-refeicao">{SUGESTOES.map((s) => <option key={s} value={s} />)}</datalist>
          {rows.map((r, index) => {
            const m = r.meal;
            const invalid = kcalInvalid(m.calorias);
            const title = m.nome?.trim() || `Refeição ${index + 1}`;
            return (
              <section key={r.key} className="nf-meal-editor" aria-labelledby={`titulo-${r.key}`}>
                <div className="nf-meal-editor-head">
                  <h3 id={`titulo-${r.key}`}>{index + 1}. {title}</h3>
                  <button type="button" className="nf-btn ghost sm icon" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Mover ${title} para cima`} title="Mover para cima"><Icon name="arrowUp" size={17} /></button>
                  <button type="button" className="nf-btn ghost sm icon" onClick={() => move(index, 1)} disabled={index === rows.length - 1} aria-label={`Mover ${title} para baixo`} title="Mover para baixo"><Icon name="arrowDown" size={17} /></button>
                  <button type="button" className="nf-btn danger-outline sm" onClick={() => (hasContent(m) ? setRemoving(r) : removeMeal(r.key))} aria-label={`Remover ${title}`}>
                    <Icon name="trash" size={16} /> Remover
                  </button>
                </div>
                <div className="fields">
                  <div className="nf-field">
                    <label htmlFor={`hora-${r.key}`}>Horário</label>
                    <input id={`hora-${r.key}`} type="time" className="nf-input" value={m.horario} onChange={(e) => update(r.key, 'horario', e.target.value)} />
                  </div>
                  <div className="nf-field name-field">
                    <label htmlFor={`nome-${r.key}`}>Nome da refeição</label>
                    <input id={`nome-${r.key}`} className="nf-input" list="sugestoes-refeicao" value={m.nome} placeholder="Ex.: Café da manhã" onChange={(e) => update(r.key, 'nome', e.target.value)} />
                  </div>
                  <div className="nf-field">
                    <label htmlFor={`kcal-${r.key}`}>Calorias (kcal)</label>
                    <input id={`kcal-${r.key}`} type="number" min="0" step="1" inputMode="numeric" className="nf-input" value={m.calorias ?? ''} placeholder="Ex.: 450"
                      aria-invalid={invalid || undefined} aria-describedby={invalid ? `kcal-erro-${r.key}` : undefined}
                      onChange={(e) => update(r.key, 'calorias', e.target.value)} />
                    {invalid && <span id={`kcal-erro-${r.key}`} className="field-error"><Icon name="alertCircle" size={14} /> Use um número igual ou maior que zero.</span>}
                  </div>
                  <div className="nf-field full">
                    <label htmlFor={`alim-${r.key}`}>Alimentos e preparo</label>
                    <textarea id={`alim-${r.key}`} className="nf-textarea" rows={3} value={m.alimentos} placeholder="Ex.: iogurte natural, banana e aveia" onChange={(e) => update(r.key, 'alimentos', e.target.value)} />
                  </div>
                  <div className="nf-field two">
                    <label htmlFor={`porc-${r.key}`}>Porções e quantidades</label>
                    <input id={`porc-${r.key}`} className="nf-input" value={m.porcao} placeholder="Ex.: 1 pote (170 g), 1 unidade, 2 colheres de sopa" onChange={(e) => update(r.key, 'porcao', e.target.value)} />
                  </div>
                  <div className="nf-field full">
                    <label htmlFor={`obs-${r.key}`}>Substituições ou observação</label>
                    <input id={`obs-${r.key}`} className="nf-input" value={m.observacao} placeholder="Ex.: pode trocar a banana por maçã" onChange={(e) => update(r.key, 'observacao', e.target.value)} />
                  </div>
                </div>
              </section>
            );
          })}

          <button type="button" className="nf-btn secondary" onClick={addMeal} style={{ justifySelf: 'start' }}>
            <Icon name="plus" size={18} /> Adicionar refeição
          </button>

          <div className="nf-card">
            <div className="nf-field">
              <label htmlFor="orientacoes">Orientações gerais</label>
              <textarea id="orientacoes" className="nf-textarea" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Hidratação, recomendações e combinados do acompanhamento" />
              <span className="help">Aparece para o paciente junto com o plano.</span>
            </div>
          </div>
        </div>

        <aside className="aside" aria-labelledby="resumo-plano">
          <div className="nf-card">
            <div className="nf-card-head" style={{ marginBottom: 8 }}>
              <h2 id="resumo-plano">Resumo para revisão</h2>
            </div>
            <SaveStatus />
            {ordered.length ? (
              <ul className="nf-summary-list" style={{ margin: '10px 0 12px' }}>
                {ordered.map((r) => (
                  <li key={r.key}>
                    <span className="n"><span>{r.meal.horario || '--:--'}</span>{r.meal.nome?.trim() || 'Sem nome'}</span>
                    <span className={`k${isNum(r.meal.calorias) ? '' : ' missing'}`}>{isNum(r.meal.calorias) ? `${fmtNum(r.meal.calorias)} kcal` : 'sem kcal'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--nf-muted)', margin: '10px 0 12px', fontSize: '.92rem' }}>Nenhuma refeição preenchida ainda.</p>
            )}
            <div className="nf-metric" style={{ paddingTop: 10, borderTop: '1px solid var(--nf-border)' }}>
              <span className="label">Soma das refeições</span>
              <span className="value">{fmtNum(totals.total)}<small>kcal</small></span>
              <span className="hint">{plural(totals.count, 'refeição', 'refeições')}</span>
            </div>
            <div style={{ marginTop: 12 }}>
              {totals.count === 0 ? null : totals.complete ? (
                <Notice tone="success">Essa soma corresponde às calorias prescritas nas refeições. A meta diária do paciente permanece a mesma; cada refeição concluída soma ao consumo do dia.</Notice>
              ) : (
                <Notice tone="warning">{plural(totals.missing, 'refeição está', 'refeições estão')} sem calorias. A meta diária do paciente permanece inalterada.</Notice>
              )}
            </div>
            {invalidCount > 0 && <div style={{ marginTop: 10 }}><Badge tone="danger" icon="alertCircle">{plural(invalidCount, 'campo de calorias inválido', 'campos de calorias inválidos')}</Badge></div>}
            <div className="nf-stack" style={{ gap: 8, marginTop: 16 }}>
              <button type="button" className="nf-btn primary block" onClick={openReview} disabled={saving || !dirty}>
                <Icon name="send" size={17} /> Revisar e salvar
              </button>
              <button type="button" className="nf-btn secondary block" onClick={() => (dirty ? setLeaving(true) : navigate(fichaLink))}>
                {dirty ? 'Descartar alterações' : 'Voltar à ficha'}
              </button>
              {patient.prescricaoSemanal?.trim() && <button type="button" className="nf-btn danger block" onClick={() => setClearing(true)} disabled={saving}>
                <Icon name="trash" size={17} /> Excluir prescrição enviada
              </button>}
              <Link to={`/nutri-calendario/${id}`} className="nf-btn ghost block"><Icon name="calendar" size={17} /> Agendar retorno</Link>
            </div>
          </div>
        </aside>
      </div>

      <div className="nf-sticky-bar">
        <button type="button" className="nf-btn primary" onClick={openReview} disabled={saving || !dirty}>Revisar e salvar</button>
        <span style={{ alignSelf: 'center' }}><SaveStatus /></span>
      </div>

      <ConfirmDialog
        open={reviewing}
        title="Enviar este plano ao aplicativo?"
        icon="clipboard"
        confirmLabel="Salvar e enviar"
        cancelLabel="Continuar editando"
        busy={saving}
        onCancel={() => setReviewing(false)}
        onConfirm={save}
      >
        <p><strong>{name}</strong> verá o plano no aplicativo assim que você salvar. Ele substitui o plano atual.</p>
        {ordered.length > 0 && (
          <ul className="nf-summary-list" aria-label="Refeições do plano">
            {ordered.map((r) => (
              <li key={r.key}>
                <span className="n"><span>{r.meal.horario || '--:--'}</span>{r.meal.nome?.trim() || 'Sem nome'}</span>
                <span className={`k${isNum(r.meal.calorias) ? '' : ' missing'}`}>{isNum(r.meal.calorias) ? `${fmtNum(Math.round(Number(r.meal.calorias)))} kcal` : 'sem kcal'}</span>
              </li>
            ))}
          </ul>
        )}
        {totals.count > 0 && (totals.complete
          ? <Notice tone="success">A meta diária do paciente permanece a mesma. As calorias são da refeição e entram no consumo do dia quando ela for concluída no aplicativo.</Notice>
          : <Notice tone="warning">Refeições sem calorias não serão somadas ao consumo até o valor ser informado. A meta diária permanece a mesma.</Notice>)}
        {notes.trim() && <p style={{ fontSize: '.92rem' }}>Inclui orientações gerais.</p>}
      </ConfirmDialog>

      <ConfirmDialog
        open={clearing}
        tone="danger"
        icon="trash"
        title="Excluir a prescrição enviada?"
        confirmLabel="Excluir prescrição"
        cancelLabel="Manter prescrição"
        busy={saving}
        onCancel={() => setClearing(false)}
        onConfirm={clearPrescription}
      >
        <p>O plano alimentar será removido do aplicativo do paciente. Refeições já registradas no diário continuarão no histórico.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={!!removing}
        tone="danger"
        icon="trash"
        title={`Remover “${removing?.meal.nome?.trim() || 'esta refeição'}”?`}
        confirmLabel="Remover refeição"
        cancelLabel="Manter"
        onCancel={() => setRemoving(null)}
        onConfirm={() => removeMeal(removing.key)}
      >
        <p>Os dados preenchidos nesta refeição serão apagados do formulário. O plano no aplicativo só muda quando você salvar.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={leaving}
        tone="danger"
        icon="alert"
        title="Descartar as alterações?"
        confirmLabel="Descartar e sair"
        cancelLabel="Continuar editando"
        onCancel={() => setLeaving(false)}
        onConfirm={() => { setSaved(snapshot(rows, notes)); setLeaving(false); navigate(fichaLink); }}
      >
        <p>As mudanças feitas desde o último salvamento serão perdidas. O plano que o paciente vê no aplicativo continua o mesmo.</p>
      </ConfirmDialog>
    </>
  );
}

export default function NutriPrescricao() {
  return <NutriLayout><Prescricao /></NutriLayout>;
}
