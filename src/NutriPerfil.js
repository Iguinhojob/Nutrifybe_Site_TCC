import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import NutriLayout, { PageHeader, useShell } from './ui/NutriLayout';
import { Badge, LoadingState, Notice, useToast } from './ui/feedback';
import Icon from './ui/icons';
import { nutricionistasAPI } from './services/api';
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

  useEffect(() => {
    const userId = user?.id || user?.Id;
    if (!userId) return;
    nutricionistasAPI.getById(userId)
      .then((data) => { setCurrentUser(data); setFormData(fromUser(data)); setInitial(fromUser(data)); })
      .catch((e) => {
        if (handleAuthError(e)) return;
        // Mantém o comportamento anterior: usa os dados da sessão se a API falhar.
        setCurrentUser(user); setFormData(fromUser(user)); setInitial(fromUser(user));
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
    reader.onload = (ev) => setFormData((prev) => ({ ...prev, foto: ev.target.result }));
    reader.readAsDataURL(file);
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

        <section className="nf-card" aria-labelledby="perfil-dados">
          <div className="nf-card-head"><h2 id="perfil-dados">Informações profissionais</h2></div>
          <div className="nf-grid cols-2">
            <div className="nf-field">
              <label htmlFor="p-nome">Nome completo<span className="req" aria-hidden="true">*</span></label>
              <input id="p-nome" name="nome" className="nf-input" value={formData.nome} onChange={onChange} autoComplete="name" required aria-required="true" />
            </div>
            <div className="nf-field">
              <label htmlFor="p-email">E-mail<span className="req" aria-hidden="true">*</span></label>
              <input id="p-email" name="email" type="email" className="nf-input" value={formData.email} onChange={onChange} autoComplete="email" required aria-required="true" />
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
    </>
  );
}

export default function NutriPerfil() {
  return <NutriLayout narrow><Perfil /></NutriLayout>;
}

