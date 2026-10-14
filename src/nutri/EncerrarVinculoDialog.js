import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, ErrorState, Notice } from '../ui/feedback';
import Icon from '../ui/icons';
import { nutricionistasAPI, pacientesAPI } from '../services/api';
import { friendlyError, idOf, initialOf, nameOf, pick } from '../ui/format';

/**
 * Encerra o acompanhamento de um paciente, com duas saídas suportadas pela API:
 * transferir para outro nutricionista (POST /transferir) ou apenas encerrar (DELETE /vinculo).
 */
export default function EncerrarVinculoDialog({ patient, currentUserId, open, onClose, onDone }) {
  const [mode, setMode] = useState('encerrar');
  const [nutris, setNutris] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [destino, setDestino] = useState('');
  const [motivo, setMotivo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const patientName = nameOf(patient);

  useEffect(() => {
    if (!open) return;
    setMode('encerrar'); setSearch(''); setDestino(''); setMotivo(''); setError('');
  }, [open]);

  const loadNutris = async () => {
    setLoadError(''); setNutris(null);
    try {
      const all = await nutricionistasAPI.getAll();
      setNutris((all || []).filter((n) => pick(n, 'status', 'Status') === 'approved'
        && pick(n, 'ativo', 'Ativo') !== 0 && pick(n, 'ativo', 'Ativo') !== false
        && String(idOf(n)) !== String(currentUserId)));
    } catch (e) {
      setLoadError(friendlyError(e, 'Não foi possível carregar a lista de nutricionistas.'));
    }
  };

  useEffect(() => {
    if (open && mode === 'transferir' && nutris === null && !loadError) loadNutris();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!nutris) return [];
    if (!q) return nutris;
    return nutris.filter((n) => [pick(n, 'nome', 'Nome'), pick(n, 'crn', 'CRN'), pick(n, 'especialidade', 'Especialidade')]
      .some((v) => String(v || '').toLowerCase().includes(q)));
  }, [nutris, search]);

  const destinoNutri = nutris?.find((n) => String(idOf(n)) === String(destino));
  const destinoNome = destinoNutri ? pick(destinoNutri, 'nome', 'Nome') : '';

  const confirm = async () => {
    if (mode === 'transferir' && !destino) { setError('Escolha o nutricionista que vai receber o paciente.'); return; }
    setBusy(true); setError('');
    try {
      if (mode === 'transferir') await pacientesAPI.transfer(idOf(patient), destino);
      else await pacientesAPI.endService(idOf(patient));
      onDone?.({ mode, patient, destinoNome });
    } catch (e) {
      setError(friendlyError(e, mode === 'transferir' ? 'Não foi possível transferir o paciente.' : 'Não foi possível encerrar o acompanhamento.'));
    } finally {
      setBusy(false);
    }
  };

  const optionStyle = (active) => ({
    display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', cursor: 'pointer',
    border: `1.5px solid ${active ? 'var(--nf-primary-text)' : 'var(--nf-border)'}`,
    borderRadius: 12, background: active ? 'var(--nf-primary-soft)' : 'var(--nf-surface)',
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={busy}
      wide
      icon="userX"
      tone="danger"
      title={`Encerrar acompanhamento de ${patientName}`}
      footer={(
        <>
          <button type="button" className="nf-btn secondary" onClick={onClose} disabled={busy}>Cancelar</button>
          <button type="button" className="nf-btn danger" onClick={confirm} disabled={busy || (mode === 'transferir' && !destino)}>
            {busy && <span className="nf-spinner" aria-hidden="true" />}
            {busy ? 'Aguarde…' : mode === 'transferir' ? (destinoNome ? `Transferir para ${destinoNome}` : 'Transferir paciente') : 'Encerrar acompanhamento'}
          </button>
        </>
      )}
    >
      <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 10 }}>
        <legend className="nf-label" style={{ marginBottom: 8 }}>O que você quer fazer?</legend>
        <label style={optionStyle(mode === 'encerrar')}>
          <input type="radio" name="modo-encerrar" value="encerrar" checked={mode === 'encerrar'} onChange={() => setMode('encerrar')} style={{ marginTop: 4 }} />
          <span><strong style={{ color: 'var(--nf-text)' }}>Apenas encerrar</strong><br />
            <span style={{ fontSize: '.9rem' }}>O paciente volta ao modo solo no aplicativo e pode procurar outro profissional.</span></span>
        </label>
        <label style={optionStyle(mode === 'transferir')}>
          <input type="radio" name="modo-encerrar" value="transferir" checked={mode === 'transferir'} onChange={() => setMode('transferir')} style={{ marginTop: 4 }} />
          <span><strong style={{ color: 'var(--nf-text)' }}>Transferir para outro nutricionista</strong><br />
            <span style={{ fontSize: '.9rem' }}>O paciente fica aguardando o aceite do nutricionista escolhido.</span></span>
        </label>
      </fieldset>

      {mode === 'transferir' && (
        <div style={{ display: 'grid', gap: 10 }}>
          <div className="nf-field">
            <label htmlFor="busca-nutri">Buscar nutricionista</label>
            <div className="nf-search">
              <Icon name="search" size={18} />
              <input id="busca-nutri" className="nf-input" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome, CRN ou especialidade" autoComplete="off" />
            </div>
          </div>
          {loadError ? (
            <ErrorState title="Lista indisponível" onRetry={loadNutris}>{loadError}</ErrorState>
          ) : nutris === null ? (
            <p role="status" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span className="nf-spinner" aria-hidden="true" /> Carregando nutricionistas…</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: 'var(--nf-muted)' }}>{nutris.length === 0 ? 'Não há outro nutricionista aprovado e ativo para receber o paciente.' : 'Nenhum nutricionista encontrado para essa busca.'}</p>
          ) : (
            <div role="radiogroup" aria-label="Nutricionista de destino" style={{ display: 'grid', gap: 6, maxHeight: 260, overflowY: 'auto', padding: 2 }}>
              {filtered.map((n) => {
                const nid = String(idOf(n));
                const active = nid === String(destino);
                return (
                  <label key={nid} style={{ ...optionStyle(active), alignItems: 'center', padding: '10px 12px' }}>
                    <input type="radio" name="destino" value={nid} checked={active} onChange={() => { setDestino(nid); setError(''); }} />
                    <span className="nf-avatar" aria-hidden="true">{initialOf(pick(n, 'nome', 'Nome'))}</span>
                    <span style={{ minWidth: 0 }}>
                      <strong style={{ color: 'var(--nf-text)', display: 'block' }}>{pick(n, 'nome', 'Nome')}</strong>
                      <span style={{ fontSize: '.85rem' }}>CRN {pick(n, 'crn', 'CRN') || '—'}{pick(n, 'especialidade', 'Especialidade') ? ` · ${pick(n, 'especialidade', 'Especialidade')}` : ''}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="nf-field">
        <label htmlFor="motivo-encerramento">Motivo (opcional)</label>
        <textarea id="motivo-encerramento" className="nf-textarea" rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: paciente precisa de outra especialidade" />
        <span className="help">Serve apenas como apoio para você agora: o sistema ainda não salva nem envia o motivo.</span>
      </div>

      <Notice tone="warning" title="O que acontece ao confirmar">
        <ul className="effects" style={{ margin: '6px 0 0', paddingLeft: 18 }}>
          {mode === 'transferir' ? (
            <li>{patientName} passa a aguardar o aceite {destinoNome ? `de ${destinoNome}` : 'do nutricionista escolhido'}.</li>
          ) : (
            <li>{patientName} volta ao modo solo no aplicativo.</li>
          )}
          <li>Você deixa de ver o diário, a evolução, o plano alimentar e a conversa deste paciente.</li>
          <li>O cadastro e o histórico do paciente continuam salvos.</li>
        </ul>
      </Notice>

      {error && <Notice tone="danger" role="alert">{error}</Notice>}
    </Dialog>
  );
}
