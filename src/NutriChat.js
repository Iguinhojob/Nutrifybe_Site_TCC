import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from './Header';
import { chatAPI, pacientesAPI } from './services/api';
import './css/nutri-chat.css';

function PaperclipIcon({ size = 19 }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m21.4 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.82-2.83l8.48-8.48" /></svg>;
}

export default function NutriChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [isDark, setIsDark] = useState(() => document.body.classList.contains('dark-mode'));
  const bottom = useRef(null);
  const input = useRef(null);

  useEffect(() => {
    const observer = new MutationObserver(() => setIsDark(document.body.classList.contains('dark-mode')));
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const theme = isDark ? {
    pageText: '#f1f5f9', card: '#18241f', border: '#334155', chatBg: '#101a16',
    incoming: '#24352d', outgoing: '#164e43', muted: '#a8b9b0', input: '#14201b', attach: '#24352d', link: '#5eead4', file: '#d1fae5', error: '#fca5a5',
  } : {
    pageText: '#0f172a', card: '#ffffff', border: '#e2e8f0', chatBg: '#f1f5f4',
    incoming: '#ffffff', outgoing: '#d1fae5', muted: '#64748b', input: '#ffffff', attach: '#f1f5f9', link: '#0f766e', file: '#0f766e', error: '#b91c1c',
  };

  const load = useCallback(async () => {
    try {
      const [person, rows] = await Promise.all([pacientesAPI.getById(id), chatAPI.messages(id)]);
      setPatient(person);
      setMessages(rows);
      setError('');
    } catch (e) {
      setError(e.message || 'Não foi possível carregar esta conversa.');
      if (e.status === 401) navigate('/login');
    }
  }, [id, navigate]);

  useEffect(() => { load(); const timer = setInterval(load, 5000); return () => clearInterval(timer); }, [load]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  const send = async (event) => {
    event.preventDefault();
    if ((!text.trim() && !file) || sending) return;
    setSending(true); setError('');
    const form = new FormData();
    if (text.trim()) form.append('texto', text.trim());
    if (file) form.append('arquivo', file);
    try {
      await chatAPI.send(id, form);
      setText(''); setFile(null); if (input.current) input.current.value = '';
      await load();
    } catch (e) { setError(e.message || 'Falha ao enviar.'); }
    finally { setSending(false); }
  };

  const download = async (message) => {
    try {
      const current = JSON.parse(localStorage.getItem('currentUser') || 'null');
      const response = await fetch(chatAPI.attachmentUrl(message.id, id), { headers: current?.token ? { Authorization: `Bearer ${current.token}` } : {} });
      if (!response.ok) throw new Error('Não foi possível baixar o anexo.');
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = message.arquivoNome || 'anexo'; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e) { setError(e.message); }
  };

  return <div className={`nutri-theme nutri-chat-page${isDark ? ' is-dark' : ''}`}><Header theme="minimal" />
    <main className="nutri-chat-main" style={{ color: theme.pageText }}>
      <Link className="nutri-chat-back" to={`/ficha-paciente/${id}`} style={{ color: theme.link }}>Ficha do paciente</Link>
      <section className="nutri-chat-card" style={{ background: theme.card, borderColor: theme.border }}>
        <header className="nutri-chat-header">
          <div className="nutri-chat-avatar" aria-hidden="true">{(patient?.nome || patient?.Nome || 'P').trim().charAt(0).toUpperCase()}</div>
          <div className="nutri-chat-heading">
            <div className="nutri-chat-eyebrow">CONVERSA PRIVADA</div>
            <h1>{patient?.nome || patient?.Nome || 'Chat com paciente'}</h1>
            <p>Somente você e seu paciente vinculado</p>
          </div>
          <span className="nutri-chat-private"><span aria-hidden="true" /> Privado</span>
        </header>
        <div className="nutri-chat-messages" aria-live="polite" style={{ background: theme.chatBg }}>
          {messages.map(m => <div key={m.id} className={`nutri-chat-row${m.remetenteTipo === 'nutricionista' ? ' is-mine' : ''}`}>
            <article className="nutri-chat-bubble" style={{ background: m.remetenteTipo === 'nutricionista' ? theme.outgoing : theme.incoming, color: theme.pageText }}>
              {m.texto && <div style={{ whiteSpace: 'pre-wrap' }}>{m.texto}</div>}
              {m.arquivoNome && <button type="button" onClick={() => download(m)} className="nutri-chat-file" style={{ color: theme.file }}><PaperclipIcon size={16} /> {m.arquivoNome} · baixar</button>}
              <small style={{ color: theme.muted }}>{new Date(m.criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</small>
            </article>
          </div>)}
          {!messages.length && !error && <p className="nutri-chat-empty" style={{ color: theme.muted }}>Inicie a conversa com {patient?.nome || 'seu paciente'}.</p>}
          <div ref={bottom} />
        </div>
        <form onSubmit={send} className="nutri-chat-composer" style={{ borderColor: theme.border }}>
          <label title="Anexar foto ou documento" aria-label="Anexar foto ou documento" className="nutri-chat-attach" style={{ background: theme.attach, color: theme.link }}>
            <PaperclipIcon size={20} /><input ref={input} type="file" accept="image/jpeg,image/png,image/webp,application/pdf,text/plain" hidden onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>
          <textarea aria-label="Mensagem" value={text} onChange={e => setText(e.target.value)} placeholder="Escreva uma mensagem…" rows={2} maxLength={4000} style={{ borderColor: theme.border, background: theme.input, color: theme.pageText }} />
          <button type="submit" disabled={sending || (!text.trim() && !file)} className="nutri-chat-send">{sending ? 'Enviando…' : 'Enviar'}</button>
          {file && <div className="nutri-chat-file-preview" style={{ color: theme.muted }}>Anexo: {file.name} <button type="button" onClick={() => { setFile(null); if (input.current) input.current.value = ''; }} aria-label="Remover anexo">Remover</button></div>}
          {error && <div role="alert" className="nutri-chat-error" style={{ color: theme.error }}>{error}</div>}
        </form>
      </section>
    </main>
  </div>;
}
