import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import NutriLayout, { useShell } from './ui/NutriLayout';
import { Badge, EmptyState, ErrorState, LoadingState, Notice, useToast } from './ui/feedback';
import Icon from './ui/icons';
import ChatPanel from './nutri/ChatPanel';
import WeightChart from './nutri/WeightChart';
import EncerrarVinculoDialog from './nutri/EncerrarVinculoDialog';
import { decodePlan, META_ORIGEM, planTotals } from './nutri/plan';
import { pacientesAPI } from './services/api';
import { formatFoodText } from './foodNames';
import {
  fmtDay, fmtNum, fmtTime, friendlyError, idOf, initialOf, isNum, nameOf, parseJson,
  plural, recordDay, relativeDay, todayKey, toNum,
} from './ui/format';

const TABS = [
  { id: 'resumo', label: 'Resumo', icon: 'layout' },
  { id: 'diario', label: 'Diário alimentar', icon: 'book' },
  { id: 'evolucao', label: 'Evolução', icon: 'trending' },
  { id: 'plano', label: 'Plano alimentar', icon: 'clipboard' },
  { id: 'conversa', label: 'Conversa', icon: 'chat' },
];

const sum = (list, field) => list.reduce((total, item) => total + (toNum(item[field]) || 0), 0);
const waterMl = (r) => toNum(r.quantidadeMl ?? r.amountMl) || 0;

function groupByDay(list) {
  return (list || []).reduce((acc, item) => {
    const day = recordDay(item);
    if (day) (acc[day] ||= []).push(item);
    return acc;
  }, {});
}

function Progress({ label, value, goal, unit, digits = 0, note }) {
  const pct = goal ? Math.round((value / goal) * 100) : null;
  const over = pct !== null && pct > 100;
  return (
    <div className={`nf-progress${over ? ' over' : ''}`}>
      <div className="top">
        <strong>{label}</strong>
        <span>
          {fmtNum(value, digits)} {unit}{goal ? ` de ${fmtNum(goal, digits)} ${unit}` : ''}
          {pct !== null && ` · ${pct}%`}
        </span>
      </div>
      {goal ? (
        <div className="track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(pct, 100)} aria-valuetext={`${pct}% da meta${over ? ', acima da meta' : ''}`}>
          <div className="fill" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      ) : null}
      {(over || note) && <span className="note">{over ? `Acima da meta em ${fmtNum(value - goal, digits)} ${unit}. ` : ''}{note}</span>}
    </div>
  );
}

function Def({ label, children, wide }) {
  const empty = children === undefined || children === null || children === '';
  return (
    <div className={wide ? 'wide' : undefined}>
      <dt>{label}</dt>
      <dd className={empty ? 'is-empty' : undefined} style={{ whiteSpace: 'pre-wrap' }}>{empty ? 'Não informado' : children}</dd>
    </div>
  );
}

function MealCard({ meal }) {
  const time = fmtTime(meal.criadoEm);
  return (
    <article className="nf-meal">
      <div className="nf-meal-head">
        <span>
          <span className="t">{meal.nome || 'Refeição'}</span>
          {time && <span className="time"> · {time}</span>}
        </span>
        <span className="kcal">{fmtNum(meal.calorias)} kcal</span>
      </div>
      {meal.descricao && <p className="foods">{formatFoodText(meal.descricao)}</p>}
      <div className="nf-macros">
        <span><b>Carboidratos</b> {fmtNum(meal.carboidratos, 1)} g</span>
        <span><b>Proteínas</b> {fmtNum(meal.proteinas, 1)} g</span>
        <span><b>Gorduras</b> {fmtNum(meal.gorduras, 1)} g</span>
        <span><b>Fibras</b> {fmtNum(meal.fibras, 1)} g</span>
      </div>
    </article>
  );
}

/* ----------------------------- Abas ----------------------------- */

function ResumoTab({ p, ctx, goTo }) {
  const { latestWeight, metaKcal, metaAguaMl, mealsByDay, waterByDay, lastRecordDay } = ctx;
  const today = todayKey();
  const todayMeals = mealsByDay[today] || [];
  const todayWater = (waterByDay[today] || []).reduce((s, r) => s + waterMl(r), 0);
  const peso = latestWeight?.value ?? toNum(p.peso);
  const meta = toNum(p.pesoMeta);
  const diff = peso && meta ? peso - meta : null;

  return (
    <div className="nf-stack">
      <div className="nf-grid cols-3">
        <div className="nf-card flat nf-metric">
          <span className="label">Peso atual</span>
          <span className="value">{peso ? fmtNum(peso, 1) : '—'}<small>kg</small></span>
          <span className="hint">{latestWeight ? `Registrado ${relativeDay(latestWeight.day)}` : peso ? 'Informado no cadastro' : 'Ainda não informado'}</span>
        </div>
        <div className="nf-card flat nf-metric">
          <span className="label">Meta de peso</span>
          <span className="value">{meta ? fmtNum(meta, 1) : '—'}<small>kg</small></span>
          <span className="hint">{diff === null ? 'Sem meta definida' : Math.abs(diff) < 0.05 ? 'Meta alcançada' : `${diff > 0 ? 'Faltam' : 'Abaixo da meta em'} ${fmtNum(Math.abs(diff), 1)} kg${diff > 0 ? ' para a meta' : ''}`}</span>
        </div>
        <div className="nf-card flat nf-metric">
          <span className="label">Último registro no diário</span>
          <span className="value" style={{ fontSize: '1.2rem' }}>{lastRecordDay ? relativeDay(lastRecordDay) : 'Nenhum'}</span>
          <span className="hint">{lastRecordDay ? fmtDay(lastRecordDay) : 'O paciente ainda não registrou refeições'}</span>
        </div>
      </div>

      <section className="nf-card" aria-labelledby="hoje-titulo">
        <div className="nf-card-head">
          <div>
            <h2 id="hoje-titulo">Hoje</h2>
            <p>{fmtDay(today)} · {plural(todayMeals.length, 'refeição registrada', 'refeições registradas')}</p>
          </div>
          <button type="button" className="nf-btn secondary sm" onClick={() => goTo('diario', today)}>Ver diário de hoje</button>
        </div>
        <div className="nf-grid cols-2">
          <Progress label="Calorias" value={sum(todayMeals, 'calorias')} goal={metaKcal?.calorias} unit="kcal"
            note={metaKcal ? `Meta ${META_ORIGEM[metaKcal.origem] || 'do aplicativo'}.` : 'Meta calórica indisponível nesta versão da API.'} />
          <Progress label="Hidratação" value={todayWater} goal={metaAguaMl} unit="ml"
            note={metaAguaMl ? null : 'O paciente não definiu meta de água.'} />
        </div>
      </section>

      <section className="nf-card" aria-labelledby="perfil-titulo">
        <div className="nf-card-head"><h2 id="perfil-titulo">Perfil clínico e objetivos</h2></div>
        <dl className="nf-dl">
          <Def label="Objetivo">{p.objetivo}</Def>
          <Def label="Idade">{p.idade != null ? `${p.idade} anos` : null}</Def>
          <Def label="Sexo">{p.sexo}</Def>
          <Def label="Atividade física">{p.atividade}</Def>
          <Def label="Meta de hidratação">{isNum(p.metaAgua) ? `${fmtNum(p.metaAgua, 1)} L por dia` : null}</Def>
          <Def label="Preferência de acompanhamento">{p.preferenciaAcompanhamento}</Def>
          <Def label="Restrições e alergias" wide>{p.restricoes}</Def>
          <Def label="Condição de saúde" wide>{p.condicaoSaude}</Def>
          <Def label="Observações" wide>{p.observacoes}</Def>
          {p.motivacao && <Def label="Motivação" wide>{p.motivacao}</Def>}
        </dl>
      </section>
    </div>
  );
}

function DiarioTab({ ctx, day, setDay }) {
  const { mealsByDay, waterByDay, metaKcal, metaAguaMl, days } = ctx;
  if (!days.length) {
    return (
      <div className="nf-card">
        <EmptyState icon="book" title="Nenhum registro no diário ainda" headingLevel={2}>
          As refeições e a água que o paciente registrar no aplicativo aparecem aqui, organizadas por dia.
        </EmptyState>
      </div>
    );
  }
  const current = days.includes(day) ? day : days[0];
  const index = days.indexOf(current);
  const meals = (mealsByDay[current] || []).slice().sort((a, b) => String(a.criadoEm || '').localeCompare(String(b.criadoEm || '')));
  const water = (waterByDay[current] || []).reduce((s, r) => s + waterMl(r), 0);

  return (
    <div className="nf-stack">
      <div className="nf-card">
        <div className="nf-daynav">
          <button type="button" className="nf-btn secondary sm" onClick={() => setDay(days[index + 1])} disabled={index >= days.length - 1}>
            <Icon name="chevronLeft" size={17} /> Dia anterior
          </button>
          <div className="label">
            <label htmlFor="dia-diario" className="nf-sr-only">Escolher dia com registros</label>
            <select id="dia-diario" className="nf-select" value={current} onChange={(e) => setDay(e.target.value)} style={{ maxWidth: 360 }}>
              {days.map((d) => <option key={d} value={d}>{fmtDay(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}{d === todayKey() ? ' (hoje)' : ''}</option>)}
            </select>
          </div>
          <button type="button" className="nf-btn secondary sm" onClick={() => setDay(days[index - 1])} disabled={index <= 0}>
            Próximo dia <Icon name="chevronRight" size={17} />
          </button>
        </div>
        <p style={{ color: 'var(--nf-muted)', fontSize: '.85rem', marginTop: 10, textAlign: 'center' }}>
          Mostrando apenas dias com registro · {plural(days.length, 'dia', 'dias')} no total
        </p>
      </div>

      <section className="nf-card" aria-labelledby="totais-dia">
        <div className="nf-card-head">
          <div>
            <h2 id="totais-dia">Totais de {fmtDay(current, { day: 'numeric', month: 'long' })}</h2>
            <p>Somente leitura · registrado pelo paciente no aplicativo</p>
          </div>
        </div>
        <div className="nf-grid cols-2" style={{ marginBottom: 16 }}>
          <Progress label="Calorias" value={sum(meals, 'calorias')} goal={metaKcal?.calorias} unit="kcal"
            note={metaKcal ? 'Comparado com a meta diária atual.' : null} />
          <Progress label="Hidratação" value={water} goal={metaAguaMl} unit="ml" note={metaAguaMl ? null : 'Sem meta de água definida.'} />
        </div>
        <div className="nf-totals">
          {[['Carboidratos', 'carboidratos'], ['Proteínas', 'proteinas'], ['Gorduras', 'gorduras'], ['Fibras', 'fibras']].map(([label, field]) => (
            <div key={field} className="nf-total"><div className="l">{label}</div><div className="v">{fmtNum(sum(meals, field), 1)}<small>g</small></div></div>
          ))}
        </div>
      </section>

      <section className="nf-card" aria-labelledby="refeicoes-dia">
        <div className="nf-card-head">
          <h2 id="refeicoes-dia">Refeições registradas</h2>
          <Badge tone="neutral">{plural(meals.length, 'refeição', 'refeições')}</Badge>
        </div>
        {meals.length ? (
          <div className="nf-stack" style={{ gap: 10 }}>{meals.map((m) => <MealCard key={m.id || `${m.nome}-${m.criadoEm}`} meal={m} />)}</div>
        ) : (
          <p style={{ color: 'var(--nf-muted)' }}>Neste dia o paciente registrou apenas água.</p>
        )}
      </section>
    </div>
  );
}

function EvolucaoTab({ p, ctx }) {
  const { medidas, weightPoints, waterByDay, metaAguaMl } = ctx;
  const goal = toNum(p.pesoMeta);
  const first = weightPoints[0];
  const last = weightPoints[weightPoints.length - 1];
  const change = first && last && weightPoints.length > 1 ? last.value - first.value : null;
  const waterDays = Object.keys(waterByDay).sort().reverse().slice(0, 7);

  return (
    <div className="nf-stack">
      <section className="nf-card" aria-labelledby="peso-titulo">
        <div className="nf-card-head">
          <div>
            <h2 id="peso-titulo">Evolução do peso</h2>
            <p>{weightPoints.length ? `${plural(weightPoints.length, 'registro', 'registros')} de peso feitos pelo paciente` : 'Registros de peso feitos pelo paciente no aplicativo'}</p>
          </div>
          {change !== null && (
            <Badge tone={Math.abs(change) < 0.05 ? 'neutral' : 'info'} icon="trending">
              {change > 0 ? '+' : change < 0 ? '−' : ''}{fmtNum(Math.abs(change), 1)} kg desde {fmtDay(first.day, { day: 'numeric', month: 'short' })}
            </Badge>
          )}
        </div>
        {weightPoints.length >= 2 ? (
          <WeightChart points={weightPoints} goal={goal} />
        ) : weightPoints.length === 1 ? (
          <Notice tone="info">Há só um registro de peso ({fmtNum(last.value, 1)} kg, {relativeDay(last.day)}). O gráfico aparece a partir do segundo registro.</Notice>
        ) : (
          <EmptyState icon="scale" title="Nenhum peso registrado ainda">O paciente registra peso e medidas pelo aplicativo. Eles aparecem aqui em ordem de data.</EmptyState>
        )}
      </section>

      {medidas.length > 0 && (
        <section className="nf-card" aria-labelledby="medidas-titulo">
          <div className="nf-card-head"><h2 id="medidas-titulo">Todas as medidas</h2></div>
          <div className="nf-table-wrap">
            <table className="nf-table">
              <caption>Mais recentes primeiro</caption>
              <thead>
                <tr><th scope="col">Data</th><th scope="col" className="num">Peso (kg)</th><th scope="col" className="num">Cintura (cm)</th><th scope="col" className="num">Quadril (cm)</th><th scope="col" className="num">Braço (cm)</th><th scope="col" className="num">Gordura (%)</th></tr>
              </thead>
              <tbody>
                {medidas.map((m) => (
                  <tr key={m.id || m.criadoEm}>
                    <th scope="row" style={{ fontWeight: 500 }}>{fmtDay(recordDay(m), { day: '2-digit', month: '2-digit', year: 'numeric' })}</th>
                    {['peso', 'cintura', 'quadril', 'braco', 'gorduraCorporal'].map((f) => <td key={f} className="num">{isNum(m[f]) ? fmtNum(m[f], 1) : '—'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="nf-card" aria-labelledby="agua-titulo">
        <div className="nf-card-head">
          <div><h2 id="agua-titulo">Hidratação</h2><p>Últimos {plural(waterDays.length || 7, 'dia', 'dias')} com registro de água</p></div>
        </div>
        {waterDays.length ? (
          <div className="nf-stack" style={{ gap: 14 }}>
            {waterDays.map((d) => (
              <Progress key={d} label={fmtDay(d, { weekday: 'short', day: 'numeric', month: 'short' })} value={waterByDay[d].reduce((s, r) => s + waterMl(r), 0)} goal={metaAguaMl} unit="ml" />
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--nf-muted)' }}>O paciente ainda não registrou consumo de água.</p>
        )}
      </section>
    </div>
  );
}

function PlanoTab({ p }) {
  const plan = decodePlan(p.prescricaoSemanal);
  const totals = planTotals(plan.meals);
  const editLink = `/nutri-prescricao/${idOf(p)}`;
  if (plan.kind === 'empty') {
    return (
      <div className="nf-card">
        <EmptyState icon="clipboard" title="Nenhum plano alimentar ainda" headingLevel={2}
          action={<Link to={editLink} className="nf-btn primary"><Icon name="plus" size={18} /> Criar plano alimentar</Link>}>
          Monte as refeições com horários, porções e calorias. O plano aparece no aplicativo do paciente assim que for salvo.
        </EmptyState>
      </div>
    );
  }
  return (
    <div className="nf-stack">
      <section className="nf-card" aria-labelledby="plano-titulo">
        <div className="nf-card-head">
          <div>
            <h2 id="plano-titulo">Plano alimentar atual</h2>
            <p>{plan.kind === 'structured' ? `${plural(totals.count, 'refeição', 'refeições')} · ${fmtNum(totals.total)} kcal prescritas nas refeições` : 'Plano antigo em texto livre'}</p>
          </div>
          <Link to={editLink} className="nf-btn primary"><Icon name="edit" size={17} /> Editar plano</Link>
        </div>
        {plan.kind === 'structured' && totals.count > 0 && !totals.complete && (
          <div style={{ marginBottom: 14 }}>
            <Notice tone="warning">
              {plural(totals.missing, 'refeição está', 'refeições estão')} sem calorias. Elas não serão somadas ao consumo do dia até o valor ser informado. A meta diária do paciente não muda.
            </Notice>
          </div>
        )}
        {plan.meals.length > 0 && (
          <div className="nf-grid cols-2">
            {plan.meals.map((meal, i) => (
              <article key={i} className="nf-meal">
                <div className="nf-meal-head">
                  <span><span className="t">{meal.nome || `Refeição ${i + 1}`}</span>{meal.horario && <span className="time"> · {meal.horario}</span>}</span>
                  {isNum(meal.calorias) ? <span className="kcal">{fmtNum(meal.calorias)} kcal</span> : <Badge tone="warning" icon="alert">Sem calorias</Badge>}
                </div>
                {meal.alimentos && <p className="foods">{meal.alimentos}</p>}
                {meal.porcao && <p className="foods"><strong>Porções:</strong> {meal.porcao}</p>}
                {meal.observacao && <p className="foods" style={{ color: 'var(--nf-muted)' }}><strong>Substituições:</strong> {meal.observacao}</p>}
              </article>
            ))}
          </div>
        )}
        {plan.notes && (
          <div className="nf-card soft" style={{ marginTop: 14 }}>
            <h3 style={{ marginBottom: 6 }}>{plan.kind === 'legacy' ? 'Prescrição' : 'Orientações gerais'}</h3>
            <p style={{ whiteSpace: 'pre-wrap', color: 'var(--nf-text-2)' }}>{plan.notes}</p>
          </div>
        )}
      </section>
    </div>
  );
}

/* ----------------------------- Página ----------------------------- */

function Ficha() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, handleAuthError, refreshPending } = useShell();
  const [searchParams, setSearchParams] = useSearchParams();
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState('');
  const [ending, setEnding] = useState(false);
  const [diaryDay, setDiaryDay] = useState(null);
  const tabRefs = useRef({});

  const tab = TABS.some((t) => t.id === searchParams.get('aba')) ? searchParams.get('aba') : 'resumo';

  const load = useCallback(async () => {
    setError('');
    try {
      setPatient(await pacientesAPI.getById(id));
    } catch (e) {
      if (handleAuthError(e)) return;
      setError(e.status === 404
        ? 'Este paciente não foi encontrado ou não tem mais vínculo ativo com você.'
        : friendlyError(e, 'Não foi possível carregar a ficha deste paciente.'));
    }
  }, [id, handleAuthError]);

  useEffect(() => { load(); }, [load]);

  const ctx = useMemo(() => {
    if (!patient) return null;
    const refeicoes = Array.isArray(patient.refeicoes) ? patient.refeicoes : [];
    const agua = Array.isArray(patient.agua) ? patient.agua : [];
    const medidas = (Array.isArray(patient.medidas) ? patient.medidas : [])
      .slice().sort((a, b) => String(recordDay(b) || '').localeCompare(String(recordDay(a) || '')));
    const mealsByDay = groupByDay(refeicoes);
    const waterByDay = groupByDay(agua);
    const days = [...new Set([...Object.keys(mealsByDay), ...Object.keys(waterByDay)])].sort().reverse();
    const weightPoints = medidas.filter((m) => isNum(m.peso) && recordDay(m))
      .map((m) => ({ day: recordDay(m), value: toNum(m.peso) })).reverse();
    const metaAguaL = toNum(patient.metaAgua);
    const metaKcal = patient.metaDiaria && isNum(patient.metaDiaria.calorias) ? patient.metaDiaria : null;
    return {
      mealsByDay, waterByDay, days, medidas, weightPoints, metaKcal,
      metaAguaMl: metaAguaL ? Math.round(metaAguaL * 1000) : null,
      latestWeight: weightPoints[weightPoints.length - 1] || null,
      lastRecordDay: Object.keys(mealsByDay).sort().reverse()[0] || null,
    };
  }, [patient]);

  useEffect(() => {
    const name = patient ? nameOf(patient) : 'Ficha do paciente';
    const tabLabel = TABS.find((t) => t.id === tab)?.label;
    document.title = `${name} · ${tabLabel} · Nutrifybe`;
  }, [patient, tab]);

  const selectTab = (next, { focus = false } = {}) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'resumo') params.delete('aba'); else params.set('aba', next);
    setSearchParams(params, { replace: true });
    if (focus) tabRefs.current[next]?.focus();
  };

  const onTabKey = (event) => {
    const i = TABS.findIndex((t) => t.id === tab);
    let next = null;
    if (event.key === 'ArrowRight') next = TABS[(i + 1) % TABS.length].id;
    if (event.key === 'ArrowLeft') next = TABS[(i - 1 + TABS.length) % TABS.length].id;
    if (event.key === 'Home') next = TABS[0].id;
    if (event.key === 'End') next = TABS[TABS.length - 1].id;
    if (next) { event.preventDefault(); selectTab(next, { focus: true }); }
  };

  const goTo = (next, day) => { if (day) setDiaryDay(day); selectTab(next); };

  if (error) {
    return (
      <>
        <Link to="/nutri-dashboard" className="nf-back"><Icon name="arrowLeft" size={17} /> Voltar ao painel</Link>
        <div className="nf-card"><ErrorState title="Ficha indisponível" onRetry={load} action={<Link to="/nutri-dashboard" className="nf-btn secondary">Ir para o painel</Link>}>{error}</ErrorState></div>
      </>
    );
  }
  if (!patient) {
    return (
      <>
        <Link to="/nutri-dashboard" className="nf-back"><Icon name="arrowLeft" size={17} /> Voltar ao painel</Link>
        <div className="nf-card"><LoadingState label="Carregando a ficha do paciente…" /></div>
      </>
    );
  }

  const name = nameOf(patient);
  const retorno = parseJson(patient.retorno, null);
  const retornoFuturo = retorno?.data && retorno.data >= todayKey() ? retorno : null;

  return (
    <>
      <Link to="/nutri-dashboard" className="nf-back"><Icon name="arrowLeft" size={17} /> Voltar aos pacientes</Link>

      <section className="nf-card" style={{ marginBottom: 20 }} aria-labelledby="nome-paciente">
        <div className="nf-row" style={{ gap: 16, alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div className="nf-row" style={{ gap: 14, flexWrap: 'nowrap', minWidth: 0, flex: '1 1 320px' }}>
            <span className="nf-avatar lg" aria-hidden="true">{initialOf(name)}</span>
            <div style={{ minWidth: 0 }}>
              <span className="nf-eyebrow">Ficha do paciente</span>
              <h1 id="nome-paciente" style={{ overflowWrap: 'anywhere' }}>{name}</h1>
              <div className="nf-row" style={{ marginTop: 8 }}>
                <Badge tone="success" icon="check">Vínculo ativo</Badge>
                {retornoFuturo && <Badge tone="info" icon="calendar">Retorno {fmtDay(retornoFuturo.data, { day: 'numeric', month: 'short' })}{retornoFuturo.hora ? ` às ${retornoFuturo.hora}` : ''}</Badge>}
                <span style={{ color: 'var(--nf-muted)', fontSize: '.9rem', overflowWrap: 'anywhere' }}>{patient.email}</span>
              </div>
            </div>
          </div>
          <div className="nf-row">
            <Link className="nf-btn primary" to={`/nutri-prescricao/${idOf(patient)}`}><Icon name="clipboard" size={17} /> Editar plano</Link>
            <Link className="nf-btn secondary" to={`/nutri-calendario/${idOf(patient)}`}><Icon name="calendar" size={17} /> Histórico e retorno</Link>
            <button type="button" className="nf-btn danger-outline" onClick={() => setEnding(true)}>Encerrar…</button>
          </div>
        </div>
      </section>

      <div className="nf-tabs" role="tablist" aria-label="Seções da ficha" onKeyDown={onTabKey}>
        {TABS.map((t) => (
          <button
            key={t.id}
            ref={(el) => { tabRefs.current[t.id] = el; }}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            className="nf-tab"
            onClick={() => selectTab(t.id)}
          >
            <Icon name={t.icon} size={17} /> {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0} className="nf-tabpanel">
        {tab === 'resumo' && <ResumoTab p={patient} ctx={ctx} goTo={goTo} />}
        {tab === 'diario' && <DiarioTab ctx={ctx} day={diaryDay} setDay={setDiaryDay} />}
        {tab === 'evolucao' && <EvolucaoTab p={patient} ctx={ctx} />}
        {tab === 'plano' && <PlanoTab p={patient} />}
        {tab === 'conversa' && <ChatPanel patientId={idOf(patient)} patientName={name} onAuthError={handleAuthError} />}
      </div>

      <EncerrarVinculoDialog
        open={ending}
        patient={patient}
        currentUserId={idOf(user)}
        onClose={() => setEnding(false)}
        onDone={({ mode, destinoNome }) => {
          setEnding(false);
          refreshPending();
          toast.show({
            tone: 'success',
            title: mode === 'transferir' ? 'Paciente transferido' : 'Acompanhamento encerrado',
            message: mode === 'transferir' ? `${name} agora aguarda o aceite de ${destinoNome}.` : `${name} voltou ao modo solo no aplicativo. O histórico foi preservado.`,
          });
          navigate('/nutri-dashboard');
        }}
      />
    </>
  );
}

export default function FichaPaciente() {
  return <NutriLayout><Ficha /></NutriLayout>;
}
