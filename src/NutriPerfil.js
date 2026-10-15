import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import NutriLayout, { PageHeader, useShell } from './ui/NutriLayout';
import { Badge, LoadingState, Notice, useToast } from './ui/feedback';
import Icon from './ui/icons';
import { nutricionistasAPI, contaAPI } from './services/api';
import { friendlyError, getStoredUser, initialOf } from './ui/format';

const EMPTY = { nome: '', email: '', telefone: '', especialidade: '', descricao: '', foto: '' };
const fromUser = (u) => ({
  nome: u?.nome || u?.Nome || '',
  email: u?.email || u?.Email || '',
  telefone: u?.telefone || u?.Telefone || '',
  especialidade: u?.especialidade || u?.Especialidade || '',
  descricao: u?.descricao || u?.Descricao || '',
  foto: u?.foto || u?.Foto || '',
});

function Perfil() {
  const toast = useToast();
  const { user, handleAuthError } = useShell();
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState(EMPTY);
  const [initial, setInitial] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadWarning, setLoadWarning] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [passwordCode, setPasswordCode] = useState('');
  const [passwordCodeSent, setPasswordCodeSent] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityBusy, setSecurityBusy] = useState(false);
  const [securityMessage, setSecurityMessage] = useState('');

  useEffect(() => {
    const userId = user?.id || user?.Id;
    if (!userId) return;
    nutricionistasAPI.getById(userId)
      .then((data) => { setCurrentUser(data); setFormData(fromUser(data)); setInitial(fromUser(data)); setEmailDraft(data.email || data.Email || ''); })
      .catch((e) => {
        if (handleAuthError(e)) return;
        // Mantém o comportamento anterior: usa os dados da sessão se a API falhar.
        setCurrentUser(user); setFormData(fromUser(user)); setInitial(fromUser(user)); setEmailDraft(user.email || user.Email || '');
        setLoadWarning('Não foi possível buscar seus dados mais recentes. Mostrando os dados salvos nesta sessão.');
      });
  }, [user, handleAuthError]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 320; canvas.height = 320;
        canvas.getContext('2d')?.drawImage(image, 0, 0, 320, 320);
        setFormData((prev) => ({ ...prev, foto: canvas.toDataURL('image/jpeg', 0.75) }));
      };
      image.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const sendEmailCode = async (event) => {
    event.preventDefault(); setSecurityMessage(''); setSecurityBusy(true);
    try { await contaAPI.enviarCodigoEmail(emailDraft.trim().toLowerCase()); setEmailCodeSent(true); setSecurityMessage('Enviamos um codigo para o novo e-mail. Ele expira em 10 minutos.'); }
    catch (e) { setSecurityMessage(friendlyError(e, 'Nao foi possivel enviar o codigo.')); }
    finally { setSecurityBusy(false); }
  };

  const saveEmail = async (event) => {
    event.preventDefault(); setSecurityMessage('');
    if (!/^\d{6}$/.test(emailCode.trim())) { setSecurityMessage('Informe o codigo de 6 numeros recebido no novo e-mail.'); return; }
    setSecurityBusy(true);
    try {
      const result = await contaAPI.alterarEmail(emailDraft.trim().toLowerCase(), emailCode.trim());
      const stored = getStoredUser() || {};
      localStorage.setItem('currentUser', JSON.stringify({ ...stored, email: result.email, token: stored.token }));
      setCurrentUser((old) => ({ ...old, email: result.email }));
      setFormData((old) => ({ ...old, email: result.email }));
      setInitial((old) => ({ ...old, email: result.email }));
      setEmailDraft(result.email); setEmailCode(''); setEmailCodeSent(false);
      setSecurityMessage('E-mail atualizado. Use o novo endereco no proximo acesso.');
    } catch (e) { setSecurityMessage(friendlyError(e, 'Nao foi possivel confirmar o novo e-mail.')); }
    finally { setSecurityBusy(false); }
  };

  const sendPasswordCode = async (event) => {
    event.preventDefault(); setSecurityMessage(''); setSecurityBusy(true);
    try { await contaAPI.enviarCodigoSenha(); setPasswordCodeSent(true); setSecurityMessage('Enviamos um codigo para o e-mail atual da conta. Ele expira em 10 minutos.'); }
    catch (e) { setSecurityMessage(friendlyError(e, 'Nao foi possivel enviar o codigo.')); }
    finally { setSecurityBusy(false); }
  };

  const savePassword = async (event) => {
    event.preventDefault(); setSecurityMessage('');
    if (!/^\d{6}$/.test(passwordCode.trim())) { setSecurityMessage('Informe o codigo de 6 numeros recebido por e-mail.'); return; }
    if (newPassword.length < 6 || newPassword !== confirmPassword) { setSecurityMessage(newPassword.length < 6 ? 'A nova senha precisa ter pelo menos 6 caracteres.' : 'As senhas nao coincidem.'); return; }
    setSecurityBusy(true);
    try {
      await contaAPI.alterarSenha(passwordCode.trim(), newPassword);
      setPasswordCode(''); setNewPassword(''); setConfirmPassword(''); setPasswordCodeSent(false);
      setSecurityMessage('Senha atualizada com sucesso.');
    } catch (e) { setSecurityMessage(friendlyError(e, 'Nao foi possivel confirmar a nova senha.')); }
    finally { setSecurityBusy(false); }
  };

  const dirty = JSON.stringify(formData) !== JSON.stringify(initial);

  const save = async (event) => {
    event.preventDefault();
    if (!currentUser) return;
    if (!formData.nome.trim() || !formData.email.trim()) { setError('Nome e e-mail são obrigatórios.'); return; }
    setLoading(true); setError('');
    try {
      const userId = currentUser.id || currentUser.Id;
      await nutricionistasAPI.update(userId, formData);
      const updated = await nutricionistasAPI.getById(userId);
      // Preserva o token da sessão: a resposta do perfil não traz o token de acesso.
      const stored = getStoredUser() || {};
      localStorage.setItem('currentUser', JSON.stringify({ ...stored, ...updated, token: stored.token }));
      setCurrentUser(updated);
      setFormData(fromUser(updated));
      setInitial(fromUser(updated));
      toast.show({ tone: 'success', title: 'Perfil atualizado', message: 'Suas informações foram salvas.' });
    } catch (e) {
      if (handleAuthError(e)) return;
      setError(friendlyError(e, 'Não foi possível salvar o perfil. Tente novamente.'));
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return <div className="nf-card"><LoadingState label="Carregando seu perfil…" lines={2} /></div>;

  const crn = currentUser.crn || currentUser.Crn || currentUser.CRN || '';
  const nutritionistCode = currentUser.id || currentUser.Id;
  const dataCriacao = currentUser.dataCriacao || currentUser.DataCriacao || '';
  const desde = dataCriacao && !Number.isNaN(new Date(dataCriacao).getTime()) ? new Date(dataCriacao).toLocaleDateString('pt-BR') : null;

  return (
    <>
      <PageHeader eyebrow="Conta" title="Meu perfil" description="Estas informações identificam você para os pacientes no aplicativo." />

      {loadWarning && <div style={{ marginBottom: 16 }}><Notice tone="warning">{loadWarning}</Notice></div>}

      <form onSubmit={save} className="nf-stack" noValidate>
        <section className="nf-card" aria-labelledby="perfil-ident">
          <h2 id="perfil-ident" className="nf-sr-only">Identificação</h2>
          <div className="nf-row" style={{ gap: 18, alignItems: 'center' }}>
            <div className="nf-avatar" style={{ width: 88, height: 88, fontSize: '2rem' }} aria-hidden="true">
              {formData.foto ? <img src={formData.foto} alt="" /> : initialOf(formData.nome)}
            </div>
            <div style={{ flex: '1 1 220px', minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--nf-font-display)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--nf-text)' }}>{formData.nome || 'Nutricionista'}</p>
              <p style={{ color: 'var(--nf-muted)' }}>{formData.especialidade || 'Especialidade não informada'}</p>
              <div className="nf-row" style={{ marginTop: 6 }}>
                {crn && <Badge tone="primary">CRN {crn}</Badge>}
                {desde && <Badge tone="neutral" icon="calendar">Desde {desde}</Badge>}
              </div>
            </div>
            <div className="nf-row">
              <label htmlFor="foto-upload" className="nf-btn secondary sm" style={{ cursor: 'pointer' }}>
                <Icon name="user" size={16} /> {formData.foto ? 'Trocar foto' : 'Adicionar foto'}
              </label>
              <input id="foto-upload" type="file" accept="image/*" onChange={onPhoto} className="nf-sr-only" />
              {formData.foto && <button type="button" className="nf-btn ghost sm" onClick={() => setFormData((p) => ({ ...p, foto: '' }))}>Remover foto</button>}
            </div>
          </div>
        </section>

        <section className="nf-card" aria-labelledby="perfil-codigo">
          <div className="nf-card-head"><h2 id="perfil-codigo">Seu código no aplicativo</h2></div>
          <p style={{ color: 'var(--nf-muted)' }}>Compartilhe este código com seus pacientes para que encontrem seu perfil e enviem uma solicitação de acompanhamento.</p>
          <div className="nf-row" style={{ alignItems: 'center' }}>
            <strong style={{ fontSize: '1.5rem', letterSpacing: '.08em', color: 'var(--nf-text)' }}>{nutritionistCode}</strong>
            <button type="button" className="nf-btn secondary" onClick={async () => {
              try { await navigator.clipboard.writeText(String(nutritionistCode)); toast.show({ tone: 'success', title: 'Código copiado', message: 'Envie este código ao seu paciente.' }); }
              catch { toast.show({ tone: 'warning', title: 'Código do nutricionista', message: `Compartilhe manualmente: ${nutritionistCode}` }); }
            }}><Icon name="clipboard" size={17} /> Copiar código</button>
          </div>
        </section>

        <section className="nf-card" aria-labelledby="perfil-dados">
          <div className="nf-card-head"><h2 id="perfil-dados">Informações profissionais</h2></div>
          <div className="nf-grid cols-2">
            <div className="nf-field">
              <label htmlFor="p-nome">Nome completo<span className="req" aria-hidden="true">*</span></label>
              <input id="p-nome" name="nome" className="nf-input" value={formData.nome} onChange={onChange} autoComplete="name" required aria-required="true" />
            </div>
            <div className="nf-field">
              <label htmlFor="p-email">E-mail<span className="req" aria-hidden="true">*</span></label>
              <input id="p-email" name="email" type="email" className="nf-input" value={formData.email} readOnly autoComplete="email" />
              <span className="help">Também é usado para entrar no sistema.</span>
            </div>
            <div className="nf-field">
              <label htmlFor="p-tel">Telefone</label>
              <input id="p-tel" name="telefone" type="tel" className="nf-input" value={formData.telefone} onChange={onChange} placeholder="(00) 00000-0000" autoComplete="tel" />
            </div>
            <div className="nf-field">
              <label htmlFor="p-esp">Especialidade</label>
              <input id="p-esp" name="especialidade" className="nf-input" value={formData.especialidade} onChange={onChange} placeholder="Ex.: Nutrição esportiva" />
            </div>
            <div className="nf-field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="p-desc">Descrição profissional</label>
              <textarea id="p-desc" name="descricao" className="nf-textarea" rows={5} value={formData.descricao} onChange={onChange}
                placeholder="Conte sobre sua experiência, abordagem de trabalho e áreas de atuação." />
              <span className="help">Aparece para os pacientes quando escolhem um nutricionista no aplicativo.</span>
            </div>
          </div>
          {error && <div style={{ marginTop: 16 }}><Notice tone="danger" role="alert">{error}</Notice></div>}
          <div className="nf-row" style={{ justifyContent: 'flex-end', marginTop: 20 }}>
            <Link to="/nutri-dashboard" className="nf-btn secondary">{dirty ? 'Cancelar' : 'Voltar ao painel'}</Link>
            <button type="submit" className="nf-btn primary" disabled={loading || !dirty}>
              {loading ? <span className="nf-spinner" aria-hidden="true" /> : <Icon name="check" size={17} />}
              {loading ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </div>
        </section>
      </form>
      <section className="nf-card nf-stack" aria-labelledby="perfil-seguranca">
        <div className="nf-card-head"><h2 id="perfil-seguranca">Seguranca da conta</h2></div>
        <form onSubmit={emailCodeSent ? saveEmail : sendEmailCode} className="nf-stack">
          <div className="nf-field"><label htmlFor="novo-email">Alterar e-mail de acesso</label><input id="novo-email" type="email" className="nf-input" value={emailDraft} onChange={(e) => { setEmailDraft(e.target.value); setEmailCodeSent(false); setEmailCode(''); }} required /></div>
          {emailCodeSent && <div className="nf-field"><label htmlFor="email-code">Codigo enviado ao novo e-mail</label><input id="email-code" className="nf-input" inputMode="numeric" autoComplete="one-time-code" value={emailCode} onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6 numeros" required /></div>}
          <button type="submit" className="nf-btn secondary" disabled={securityBusy}>{securityBusy ? 'Aguarde...' : emailCodeSent ? 'Confirmar novo e-mail' : 'Enviar codigo ao novo e-mail'}</button>
        </form>
        <form onSubmit={passwordCodeSent ? savePassword : sendPasswordCode} className="nf-stack" style={{ borderTop: '1px solid var(--nf-border)', paddingTop: 18 }}>
          <div className="nf-field"><label htmlFor="new-password">Alterar senha</label><span className="help">Enviaremos um codigo ao e-mail atual da conta.</span></div>
          {passwordCodeSent && <>
            <div className="nf-field"><label htmlFor="password-code">Codigo de verificacao</label><input id="password-code" className="nf-input" inputMode="numeric" autoComplete="one-time-code" value={passwordCode} onChange={(e) => setPasswordCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6 numeros" required /></div>
            <div className="nf-grid cols-2"><div className="nf-field"><label htmlFor="new-password">Nova senha</label><input id="new-password" type="password" className="nf-input" minLength={6} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></div><div className="nf-field"><label htmlFor="confirm-password">Confirmar nova senha</label><input id="confirm-password" type="password" className="nf-input" minLength={6} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div></div>
          </>}
          <button type="submit" className="nf-btn secondary" disabled={securityBusy}>{securityBusy ? 'Aguarde...' : passwordCodeSent ? 'Confirmar nova senha' : 'Enviar codigo para alterar senha'}</button>
        </form>
        {securityMessage && <Notice tone={securityMessage.toLowerCase().includes('nao foi') || securityMessage.toLowerCase().includes('invalido') ? 'danger' : 'info'}>{securityMessage}</Notice>}
      </section>
    </>
  );
}

export default function NutriPerfil() {
  return <NutriLayout narrow><Perfil /></NutriLayout>;
}

