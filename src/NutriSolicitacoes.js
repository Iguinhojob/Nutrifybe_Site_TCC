import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import NutriLayout, { PageHeader, useShell } from './ui/NutriLayout';
import { Badge, ConfirmDialog, EmptyState, ErrorState, LoadingState, Notice, useToast } from './ui/feedback';
import Icon from './ui/icons';
import { solicitacoesAPI } from './services/api';
import { bmi, fmtNum, friendlyError, idOf, initialOf, nameOf, pick, plural } from './ui/format';

function Field({ label, value, unit, wide }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={wide ? 'wide' : undefined}>
      <dt>{label}</dt>
      <dd className={empty ? 'is-empty' : undefined}>{empty ? 'Não informado' : `${value}${unit ? ` ${unit}` : ''}`}</dd>
    </div>
  );
}

function Solicitacoes() {
  const { refreshPending, handleAuthError } = useShell();
  const toast = useToast();
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [rejectBusy, setRejectBusy] = useState(false);
  const [inlineError, setInlineError] = useState({});

  const load = useCallback(async () => {
    setError('');
    try {
      const list = await solicitacoesAPI.getByNutricionista();
      setRequests(Array.isArray(list) ? list : []);
    } catch (e) {
      if (handleAuthError(e)) return;
      setError(friendlyError(e, 'Não foi possível carregar as solicitações.'));
    }
  }, [handleAuthError]);

  useEffect(() => { load(); }, [load]);

  const removeLocal = (id) => setRequests((list) => (list || []).filter((r) => String(idOf(r)) !== String(id)));

  const accept = async (request) => {
    const id = idOf(request);
    setBusyId(id);
    setInlineError((m) => ({ ...m, [id]: '' }));
    try {
      const accepted = await solicitacoesAPI.acceptScoped(id);
      removeLocal(id);
      refreshPending();
      toast.show({
        tone: 'success',
        title: 'Solicitação aceita',
        message: `${accepted?.nome || nameOf(request)} agora é seu paciente. Você já pode ver o diário e conversar pelo Nutrifybe.`,
        action: accepted?.id ? { to: `/ficha-paciente/${accepted.id}`, label: 'Abrir ficha do paciente' } : undefined,
      });
    } catch (e) {
      if (handleAuthError(e)) return;
      const msg = e.status === 409
        ? 'Este paciente já está vinculado a outro nutricionista, por isso não pode ser aceito.'
        : e.status === 404
          ? 'Esta solicitação não está mais disponível. Atualize a lista.'
          : friendlyError(e, 'Não foi possível aceitar a solicitação.');
      setInlineError((m) => ({ ...m, [id]: msg }));
    } finally {
      setBusyId(null);
    }
  };

  const confirmReject = async () => {
    const id = idOf(rejecting);
    setRejectBusy(true);
    try {
      await solicitacoesAPI.denyScoped(id);
      removeLocal(id);
      refreshPending();
      toast.show({ tone: 'info', title: 'Solicitação recusada', message: `${nameOf(rejecting)} continua usando o aplicativo no modo solo.` });
      setRejecting(null);
    } catch (e) {
      if (handleAuthError(e)) return;
      setInlineError((m) => ({ ...m, [id]: friendlyError(e, 'Não foi possível recusar a solicitação.') }));
      setRejecting(null);
    } finally {
      setRejectBusy(false);
    }
  };

  const count = requests?.length || 0;

  return (
    <>
      <PageHeader
        back={{ to: '/nutri-dashboard', label: 'Voltar ao painel' }}
        eyebrow="Novos pacientes"
        title="Solicitações de acompanhamento"
        description={requests ? (count ? `${plural(count, 'pessoa aguarda', 'pessoas aguardam')} sua resposta.` : 'Você está em dia com as solicitações.') : 'Pacientes que pediram seu acompanhamento pelo aplicativo.'}
        actions={requests && (
          <button type="button" className="nf-btn secondary" onClick={() => { setRequests(null); load(); refreshPending(); }}>
            <Icon name="refresh" size={17} /> Atualizar
          </button>
        )}
      />

      <div style={{ marginBottom: 20 }}>
        <Notice tone="info" title="Como funciona">
          Ao <strong style={{ display: 'inline' }}>aceitar</strong>, o paciente passa a compartilhar com você o diário alimentar, as medidas e a conversa.
          Ao <strong style={{ display: 'inline' }}>recusar</strong>, ele continua usando o aplicativo no modo solo e pode escolher outro nutricionista.
        </Notice>
      </div>

      {error ? (
        <div className="nf-card"><ErrorState onRetry={load}>{error}</ErrorState></div>
      ) : requests === null ? (
        <div className="nf-card"><LoadingState label="Carregando solicitações…" /></div>
      ) : count === 0 ? (
        <div className="nf-card">
          <EmptyState icon="inbox" title="Nenhuma solicitação pendente" headingLevel={2}
            action={<Link to="/nutri-dashboard" className="nf-btn secondary">Ir para o painel</Link>}>
            Quando um paciente escolher você no aplicativo, o pedido aparece aqui para você aceitar ou recusar.
          </EmptyState>
        </div>
      ) : (
        <ul className="nf-list" style={{ gap: 16 }} aria-label="Solicitações pendentes">
          {requests.map((r) => {
            const id = idOf(r);
            const peso = pick(r, 'peso', 'Peso');
            const altura = pick(r, 'altura', 'Altura');
            const imc = bmi(peso, altura);
            const busy = busyId === id;
            const headingId = `sol-${id}`;
            return (
              <li key={id} className="nf-card" aria-labelledby={headingId}>
                <div className="nf-card-head" style={{ alignItems: 'flex-start' }}>
                  <div className="nf-row" style={{ gap: 12, flexWrap: 'nowrap', minWidth: 0 }}>
                    <span className="nf-avatar lg" aria-hidden="true">{initialOf(nameOf(r))}</span>
                    <div style={{ minWidth: 0 }}>
                      <h2 id={headingId} style={{ fontSize: '1.1rem' }}>{nameOf(r)}</h2>
                      <p style={{ overflowWrap: 'anywhere' }}>{pick(r, 'email', 'Email')}</p>
                    </div>
                  </div>
                  <Badge tone="warning" icon="clock">Aguardando resposta</Badge>
                </div>
                <dl className="nf-dl" style={{ marginBottom: 16 }}>
                  <Field label="Objetivo" value={pick(r, 'objetivo', 'Objetivo')} />
                  <Field label="Idade" value={pick(r, 'idade', 'Idade')} unit="anos" />
                  <Field label="Peso" value={peso != null ? fmtNum(peso, Number.isInteger(Number(peso)) ? 0 : 1) : null} unit="kg" />
                  <Field label="Altura" value={altura != null ? fmtNum(altura) : null} unit="cm" />
                  <Field label="IMC (calculado)" value={imc ? fmtNum(imc, 1) : null} />
                  <Field label="Condição de saúde" value={pick(r, 'condicaoSaude', 'CondicaoSaude')} wide />
                </dl>
                {inlineError[id] && <div style={{ marginBottom: 12 }}><Notice tone="danger" role="alert">{inlineError[id]}</Notice></div>}
                <div className="nf-row">
                  <button type="button" className="nf-btn primary" onClick={() => accept(r)} disabled={busy || busyId !== null}>
                    {busy ? <span className="nf-spinner" aria-hidden="true" /> : <Icon name="userCheck" size={18} />}
                    {busy ? 'Aceitando…' : 'Aceitar paciente'}
                  </button>
                  <button type="button" className="nf-btn danger-outline" onClick={() => setRejecting(r)} disabled={busy}>
                    <Icon name="userX" size={18} /> Recusar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!rejecting}
        tone="danger"
        icon="userX"
        title={`Recusar a solicitação de ${nameOf(rejecting)}?`}
        confirmLabel="Recusar solicitação"
        cancelLabel="Voltar"
        busy={rejectBusy}
        onCancel={() => setRejecting(null)}
        onConfirm={confirmReject}
      >
        <p>Esta ação não pode ser desfeita por aqui.</p>
        <ul className="effects">
          <li>A solicitação sai da sua lista.</li>
          <li>{nameOf(rejecting)} continua no aplicativo no modo solo e pode pedir acompanhamento a outro nutricionista (ou a você de novo).</li>
          <li>Nenhum dado do paciente é apagado.</li>
        </ul>
      </ConfirmDialog>
    </>
  );
}

export default function NutriSolicitacoes() {
  return <NutriLayout narrow><Solicitacoes /></NutriLayout>;
}
