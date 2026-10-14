import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import NutriLayout, { PageHeader, useShell } from './ui/NutriLayout';
import { Badge, EmptyState, ErrorState, LoadingState, useToast } from './ui/feedback';
import Icon from './ui/icons';
import EncerrarVinculoDialog from './nutri/EncerrarVinculoDialog';
import { pacientesAPI, solicitacoesAPI } from './services/api';
import { firstName, fmtDay, friendlyError, idOf, initialOf, nameOf, parseJson, pick, plural, relativeDay, todayKey } from './ui/format';

function upcomingRetorno(patient) {
  const r = parseJson(patient?.retorno, null);
  if (!r?.data || r.data < todayKey()) return null;
  return r;
}

function Dashboard() {
  const { user, refreshPending, handleAuthError } = useShell();
  const toast = useToast();
  const [patients, setPatients] = useState(null);
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [ending, setEnding] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const [pacientes, solicitacoes] = await Promise.all([
        pacientesAPI.getByNutricionista(),
        solicitacoesAPI.getByNutricionista(),
      ]);
      setPatients(Array.isArray(pacientes) ? pacientes : []);
      setRequests(Array.isArray(solicitacoes) ? solicitacoes : []);
    } catch (e) {
      if (handleAuthError(e)) return;
      setError(friendlyError(e, 'Não foi possível carregar seus pacientes.'));
    }
  }, [handleAuthError]);

  useEffect(() => { load(); }, [load]);

  const retornos = useMemo(() => (patients || [])
    .map((p) => ({ patient: p, retorno: upcomingRetorno(p) }))
    .filter((x) => x.retorno)
    .sort((a, b) => `${a.retorno.data}${a.retorno.hora || ''}`.localeCompare(`${b.retorno.data}${b.retorno.hora || ''}`)), [patients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = patients || [];
    if (!q) return list;
    return list.filter((p) => [nameOf(p, ''), pick(p, 'email', 'Email'), pick(p, 'objetivo', 'Objetivo')]
      .some((v) => String(v || '').toLowerCase().includes(q)));
  }, [patients, search]);

  const loading = patients === null && !error;
  const pending = requests || [];
  const today = fmtDay(todayKey(), { weekday: 'long', day: 'numeric', month: 'long' });

  const onEnded = ({ mode, patient, destinoNome }) => {
    setPatients((list) => (list || []).filter((p) => String(idOf(p)) !== String(idOf(patient))));
    setEnding(null);
    refreshPending();
    toast.show({
      tone: 'success',
      title: mode === 'transferir' ? 'Paciente transferido' : 'Acompanhamento encerrado',
      message: mode === 'transferir'
        ? `${nameOf(patient)} agora aguarda o aceite de ${destinoNome}.`
        : `${nameOf(patient)} voltou ao modo solo no aplicativo. O histórico foi preservado.`,
    });
  };

  return (
    <>
      <PageHeader
        eyebrow={today}
        title={`Olá, ${firstName(pick(user, 'nome', 'Nome')) || 'nutricionista'}`}
        docTitle="Painel"
        description="Comece pelas solicitações que aguardam resposta e depois acompanhe seus pacientes."
      />

      {error ? (
        <div className="nf-card"><ErrorState onRetry={load}>{error}</ErrorState></div>
      ) : loading ? (
        <div className="nf-card"><LoadingState label="Carregando seu painel…" /></div>
      ) : (
        <>
          <section aria-labelledby="prioridades" className="nf-grid cols-3" style={{ marginBottom: 28 }}>
            <h2 id="prioridades" className="nf-sr-only">Prioridades</h2>

            <article className={`nf-card nf-priority${pending.length ? ' is-urgent' : ''}`}>
              <div className="nf-row" style={{ justifyContent: 'space-between' }}>
                <h3 className="nf-section-title"><Icon name="inbox" size={19} /> Solicitações pendentes</h3>
                {pending.length > 0 && <Badge tone="warning" icon="clock">Aguardando você</Badge>}
              </div>
              <div className="count" aria-hidden="true">{pending.length}</div>
              {pending.length ? (
                <>
                  <p className="nf-sr-only">{plural(pending.length, 'solicitação aguardando resposta', 'solicitações aguardando resposta')}</p>
                  <ul className="nf-list" style={{ gap: 4 }}>
                    {pending.slice(0, 3).map((r) => (
                      <li key={idOf(r)} style={{ color: 'var(--nf-text-2)', fontSize: '.92rem' }}>
                        <strong style={{ color: 'var(--nf-text)' }}>{nameOf(r)}</strong>
                        {pick(r, 'objetivo', 'Objetivo') ? ` · ${pick(r, 'objetivo', 'Objetivo')}` : ''}
                      </li>
                    ))}
                    {pending.length > 3 && <li style={{ color: 'var(--nf-muted)', fontSize: '.9rem' }}>e mais {pending.length - 3}</li>}
                  </ul>
                  <Link to="/nutri-solicitacoes" className="nf-btn primary">Revisar solicitações</Link>
                </>
              ) : (
                <p style={{ color: 'var(--nf-muted)' }}>Nenhuma solicitação aguardando resposta. Novos pedidos feitos pelo aplicativo aparecem aqui.</p>
              )}
            </article>

            <article className="nf-card nf-priority">
              <h3 className="nf-section-title"><Icon name="calendar" size={19} /> Próximos retornos</h3>
              {retornos.length ? (
                <ul className="nf-list" style={{ gap: 8 }}>
                  {retornos.slice(0, 3).map(({ patient, retorno }) => (
                    <li key={idOf(patient)}>
                      <Link to={`/nutri-calendario/${idOf(patient)}`} style={{ fontWeight: 600 }}>{nameOf(patient)}</Link>
                      <div style={{ color: 'var(--nf-muted)', fontSize: '.88rem' }}>
                        {fmtDay(retorno.data, { weekday: 'short', day: 'numeric', month: 'short' })}
                        {retorno.hora ? ` às ${retorno.hora}` : ''} · {relativeDay(retorno.data)}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--nf-muted)' }}>Nenhum retorno agendado. Você pode agendar pelo histórico de cada paciente.</p>
              )}
            </article>

            <article className="nf-card nf-priority">
              <h3 className="nf-section-title"><Icon name="users" size={19} /> Pacientes em acompanhamento</h3>
              <div className="count" aria-hidden="true">{patients.length}</div>
              <p style={{ color: 'var(--nf-muted)' }}>
                {patients.length
                  ? `${plural(patients.length, 'paciente compartilha', 'pacientes compartilham')} diário, medidas e conversa com você.`
                  : 'Quando você aceitar uma solicitação, o paciente aparece aqui.'}
              </p>
              {patients.length > 0 && <a href="#pacientes" className="nf-btn secondary">Ver lista</a>}
            </article>
          </section>

          <section aria-labelledby="pacientes" className="nf-card">
            <div className="nf-card-head">
              <div>
                <h2 id="pacientes" tabIndex={-1}>Seus pacientes</h2>
                <p>Abra a ficha para ver resumo, diário, evolução, plano alimentar e conversa.</p>
              </div>
              {patients.length > 0 && (
                <div className="nf-search" style={{ flex: '0 1 320px', minWidth: 220 }}>
                  <Icon name="search" size={18} />
                  <label htmlFor="busca-paciente" className="nf-sr-only">Buscar paciente</label>
                  <input id="busca-paciente" type="search" className="nf-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, e-mail ou objetivo" autoComplete="off" />
                </div>
              )}
            </div>

            {patients.length === 0 ? (
              <EmptyState
                icon="users"
                title="Você ainda não acompanha nenhum paciente"
                action={pending.length > 0 && <Link to="/nutri-solicitacoes" className="nf-btn primary">Ver {plural(pending.length, 'solicitação', 'solicitações')}</Link>}
              >
                O paciente envia a solicitação pelo aplicativo Nutrifybe. Assim que você aceitar, ele aparece nesta lista.
              </EmptyState>
            ) : filtered.length === 0 ? (
              <EmptyState icon="search" title="Nenhum paciente encontrado" action={<button type="button" className="nf-btn secondary" onClick={() => setSearch('')}>Limpar busca</button>}>
                Nenhum paciente corresponde a “{search}”.
              </EmptyState>
            ) : (
              <>
                {search && <p role="status" style={{ color: 'var(--nf-muted)', fontSize: '.9rem', marginBottom: 10 }}>{plural(filtered.length, 'paciente encontrado', 'pacientes encontrados')}</p>}
                <ul className="nf-list">
                  {filtered.map((p) => {
                    const pid = idOf(p);
                    const retorno = upcomingRetorno(p);
                    return (
                      <li key={pid} className="nf-list-item">
                        <div className="who">
                          <span className="nf-avatar" aria-hidden="true">{initialOf(nameOf(p))}</span>
                          <div>
                            <div className="nf-row" style={{ gap: 8 }}>
                              <span className="name">{nameOf(p)}</span>
                              <Badge tone="success" icon="check">Vínculo ativo</Badge>
                              {retorno && <Badge tone="info" icon="calendar">Retorno {fmtDay(retorno.data, { day: '2-digit', month: '2-digit' })}</Badge>}
                            </div>
                            <div className="meta">
                              Objetivo: {pick(p, 'objetivo', 'Objetivo') || 'não informado'} · {pick(p, 'email', 'Email')}
                            </div>
                          </div>
                        </div>
                        <div className="acts">
                          <Link to={`/ficha-paciente/${pid}`} className="nf-btn primary sm" aria-label={`Abrir ficha de ${nameOf(p)}`}>Abrir ficha</Link>
                          <Link to={`/ficha-paciente/${pid}?aba=conversa`} className="nf-btn secondary sm" aria-label={`Conversar com ${nameOf(p)}`}>
                            <Icon name="chat" size={16} /> Conversa
                          </Link>
                          <button type="button" className="nf-btn danger-outline sm" onClick={() => setEnding(p)} aria-label={`Encerrar ou transferir acompanhamento de ${nameOf(p)}`}>
                            Encerrar…
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>
        </>
      )}

      <EncerrarVinculoDialog
        open={!!ending}
        patient={ending}
        currentUserId={idOf(user)}
        onClose={() => setEnding(null)}
        onDone={onEnded}
      />
    </>
  );
}

export default function NutriDashboard() {
  return <NutriLayout><Dashboard /></NutriLayout>;
}
