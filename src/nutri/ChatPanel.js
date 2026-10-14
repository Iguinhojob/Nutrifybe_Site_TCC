import React, { useCallback, useEffect, useRef, useState } from 'react';
import { chatAPI } from '../services/api';
import Icon from '../ui/icons';
import { EmptyState, ErrorState, Notice } from '../ui/feedback';
import { fmtDay, friendlyError, getStoredUser, recordDay, relativeDay } from '../ui/format';

const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf,text/plain';

/** Conversa privada entre o nutricionista e o paciente vinculado (mesma API do chat original). */
export default function ChatPanel({ patientId, patientName = 'paciente', onAuthError }) {
  const [messages, setMessages] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [sendError, setSendError] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const logRef = useRef(null);
  const fileRef = useRef(null);
  const lastCount = useRef(0);

  const load = useCallback(async () => {
    try {
      const rows = await chatAPI.messages(patientId);
      setMessages(Array.isArray(rows) ? rows : []);
      setLoadError('');
    } catch (e) {
      if (onAuthError?.(e)) return;
      setLoadError(friendlyError(e, 'Não foi possível carregar a conversa.'));
    }
  }, [patientId, onAuthError]);

  useEffect(() => {
    load();
    const timer = setInterval(() => { if (!document.hidden) load(); }, 5000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const count = messages?.length || 0;
    if (count !== lastCount.current && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
    lastCount.current = count;
  }, [messages]);

  const send = async (event) => {
    event.preventDefault();
    if ((!text.trim() && !file) || sending) return;
    setSending(true); setSendError('');
    const form = new FormData();
    if (text.trim()) form.append('texto', text.trim());
    if (file) form.append('arquivo', file);
    try {
      await chatAPI.send(patientId, form);
      setText(''); setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (e) {
      if (onAuthError?.(e)) return;
      setSendError(friendlyError(e, 'A mensagem não foi enviada. Tente novamente.'));
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send(event);
    }
  };

  const download = async (message) => {
    try {
      const current = getStoredUser();
      const response = await fetch(chatAPI.attachmentUrl(message.id, patientId), {
        headers: current?.token ? { Authorization: `Bearer ${current.token}` } : {},
      });
      if (!response.ok) throw new Error('Não foi possível baixar o anexo.');
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = message.arquivoNome || 'anexo'; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e) {
      setSendError(friendlyError(e, 'Não foi possível baixar o anexo.'));
    }
  };

  let lastDay = null;

  return (
    <section className="nf-card nf-chat" aria-label={`Conversa com ${patientName}`}>
      <div className="nf-row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--nf-border)', justifyContent: 'space-between' }}>
        <div className="nf-row" style={{ gap: 8 }}>
          <Icon name="lock" size={16} />
          <span style={{ fontSize: '.9rem', color: 'var(--nf-muted)' }}>Conversa privada: só você e {patientName} veem estas mensagens.</span>
        </div>
        <span style={{ fontSize: '.8rem', color: 'var(--nf-muted)' }}>Atualiza a cada 5 segundos</span>
      </div>

      <div ref={logRef} className="nf-chat-log" role="log" aria-live="polite" aria-label="Mensagens" tabIndex={0}>
        {loadError && !messages ? (
          <ErrorState onRetry={load}>{loadError}</ErrorState>
        ) : messages === null ? (
          <p role="status" style={{ margin: 'auto', display: 'flex', gap: 8, alignItems: 'center', color: 'var(--nf-muted)' }}><span className="nf-spinner" aria-hidden="true" /> Carregando conversa…</p>
        ) : messages.length === 0 ? (
          <div style={{ margin: 'auto' }}>
            <EmptyState icon="chat" title="Nenhuma mensagem ainda">
              Envie a primeira mensagem para {patientName}. Ela aparece no aplicativo do paciente.
            </EmptyState>
          </div>
        ) : messages.map((m) => {
          const mine = m.remetenteTipo === 'nutricionista';
          const day = recordDay(m);
          const showDay = day && day !== lastDay;
          lastDay = day;
          return (
            <React.Fragment key={m.id}>
              {showDay && <div className="nf-day-sep">{relativeDay(day) === 'hoje' || relativeDay(day) === 'ontem' ? relativeDay(day) : fmtDay(day, { day: 'numeric', month: 'long' })}</div>}
              <div className={`nf-chat-row${mine ? ' mine' : ''}`}>
                <article className="nf-bubble">
                  <div className="who">{mine ? 'Você' : patientName}</div>
                  {m.texto && <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{m.texto}</div>}
                  {m.arquivoNome && (
                    <button type="button" className="nf-btn secondary sm file" onClick={() => download(m)}>
                      <Icon name="download" size={16} /> {m.arquivoNome}
                    </button>
                  )}
                  <small>{m.criadoEm ? new Date(m.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}</small>
                </article>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <form onSubmit={send} className="nf-chat-composer">
        <label className="nf-btn secondary icon nf-attach-label" title="Anexar foto ou documento">
          <Icon name="paperclip" size={19} />
          <span className="nf-sr-only">Anexar foto ou documento (JPG, PNG, WEBP, PDF ou TXT)</span>
          <input ref={fileRef} type="file" accept={ACCEPT} className="nf-sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        <div>
          <label htmlFor={`msg-${patientId}`} className="nf-sr-only">Mensagem para {patientName}</label>
          <textarea id={`msg-${patientId}`} className="nf-textarea" rows={1} value={text} maxLength={4000}
            onChange={(e) => setText(e.target.value)} onKeyDown={onKeyDown}
            placeholder="Escreva uma mensagem… (Enter envia, Shift+Enter quebra linha)" />
        </div>
        <button type="submit" className="nf-btn primary" disabled={sending || (!text.trim() && !file)}>
          {sending ? <span className="nf-spinner" aria-hidden="true" /> : <Icon name="send" size={17} />}
          <span>{sending ? 'Enviando…' : 'Enviar'}</span>
        </button>
        {file && (
          <div className="extra nf-row" style={{ fontSize: '.88rem', color: 'var(--nf-text-2)' }}>
            <Icon name="paperclip" size={15} /> Anexo: <strong>{file.name}</strong>
            <button type="button" className="nf-btn ghost sm" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}>Remover anexo</button>
          </div>
        )}
        {(sendError || (loadError && messages)) && (
          <div className="extra"><Notice tone="danger" role="alert">{sendError || loadError}</Notice></div>
        )}
      </form>
    </section>
  );
}
