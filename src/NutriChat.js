import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from './Header';
import { chatAPI, pacientesAPI } from './services/api';

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

  return <div className="nutri-theme"><Header theme="minimal" />
    <main style={{ maxWidth: 900, margin: '5.5rem auto 2rem', padding: '0 1rem', color: theme.pageText }}>
      <Link to="/nutri-dashboard" style={{ color: theme.link, textDecoration: 'none' }}>← Pacientes</Link>
      <section style={{ marginTop: 14, background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 18, overflow: 'hidden', boxShadow: isDark ? '0 12px 36px rgba(0,0,0,.35)' : '0 12px 36px rgba(15,23,42,.08)' }}>
        <header style={{ padding: '18px 22px', background: 'linear-gradient(110deg,#0f766e,#14b8a6)', color: 'white' }}>
          <div style={{ fontSize: 12, opacity: .82 }}>CONVERSA PRIVADA</div>
          <h1 style={{ margin: '3px 0', fontSize: 21 }}>{patient?.nome || patient?.Nome || 'Chat com paciente'}</h1>
          <div style={{ fontSize: 13, opacity: .9 }}>Somente você e seu paciente vinculado</div>
        </header>
        <div aria-live="polite" style={{ height: 'min(60vh, 580px)', overflowY: 'auto', padding: 20, background: theme.chatBg }}>
          {messages.map(m => <div key={m.id} style={{ display: 'flex', justifyContent: m.remetenteTipo === 'nutricionista' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
            <article style={{ maxWidth: '82%', padding: '10px 13px', borderRadius: 15, background: m.remetenteTipo === 'nutricionista' ? theme.outgoing : theme.incoming, color: theme.pageText, boxShadow: isDark ? '0 1px 4px #0006' : '0 1px 3px #0001', overflowWrap: 'anywhere' }}>
              {m.texto && <div style={{ whiteSpace: 'pre-wrap' }}>{m.texto}</div>}
              {m.arquivoNome && <button type="button" onClick={() => download(m)} style={{ display: 'block', marginTop: m.texto ? 8 : 0, border: 0, background: 'transparent', color: theme.file, cursor: 'pointer', padding: 0, textAlign: 'left' }}>📎 {m.arquivoNome} · baixar</button>}
              <small style={{ display: 'block', color: theme.muted, textAlign: 'right', marginTop: 5 }}>{new Date(m.criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</small>
            </article>
          </div>)}
          {!messages.length && !error && <p style={{ textAlign: 'center', color: theme.muted, marginTop: '18vh' }}>Inicie a conversa com {patient?.nome || 'seu paciente'}.</p>}
          <div ref={bottom} />
        </div>
        <form onSubmit={send} style={{ padding: 14, display: 'flex', gap: 9, alignItems: 'end', flexWrap: 'wrap', borderTop: `1px solid ${theme.border}` }}>
          <label title="Anexar foto ou documento" style={{ padding: '11px 13px', background: theme.attach, borderRadius: 12, cursor: 'pointer', fontSize: 20 }}>
            📎<input ref={input} type="file" accept="image/jpeg,image/png,image/webp,application/pdf,text/plain" hidden onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>
          <textarea aria-label="Mensagem" value={text} onChange={e => setText(e.target.value)} placeholder="Escreva uma mensagem…" rows={2} maxLength={4000} style={{ flex: 1, minWidth: 180, resize: 'vertical', border: `1px solid ${theme.border}`, borderRadius: 12, padding: 12, font: 'inherit', background: theme.input, color: theme.pageText }} />
          <button type="submit" disabled={sending || (!text.trim() && !file)} style={{ border: 0, borderRadius: 12, padding: '13px 18px', color: 'white', background: '#0f766e', fontWeight: 700, cursor: 'pointer', opacity: sending ? .6 : 1 }}>{sending ? 'Enviando…' : 'Enviar'}</button>
          {file && <div style={{ flexBasis: '100%', color: theme.muted, fontSize: 13 }}>Anexo: {file.name} <button type="button" onClick={() => { setFile(null); if (input.current) input.current.value = ''; }} aria-label="Remover anexo">Remover</button></div>}
          {error && <div role="alert" style={{ flexBasis: '100%', color: theme.error, fontSize: 13 }}>{error}</div>}
        </form>
      </section>
    </main>
  </div>;
}
