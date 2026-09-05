import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { recuperarSenhaAPI } from './services/api';

const RecuperarSenha = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // step: 'email' | 'email-sent' | 'validating' | 'reset' | 'token-invalid' | 'success'
  const [step, setStep] = useState(token ? 'validating' : 'email');
  const [email, setEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const headerLinks = [
    { href: '/', text: 'Início' },
    { href: '/login', text: 'Entrar' },
  ];

  // Valida o token assim que a página abre com ?token=...
  useEffect(() => {
    if (!token) return;
    recuperarSenhaAPI.validarToken(token)
      .then(res => setStep(res.valid ? 'reset' : 'token-invalid'))
      .catch(() => setStep('token-invalid'));
  }, [token]);

  const handleSolicitarEmail = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setLoading(true);
    try {
      await recuperarSenhaAPI.solicitar(email);
      setStep('email-sent');
    } catch {
      setMessage({ text: 'Erro ao conectar com o servidor. Tente novamente.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRedefinir = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (novaSenha.length < 6) {
      setMessage({ text: 'A senha deve ter pelo menos 6 caracteres.', type: 'error' });
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setMessage({ text: 'As senhas não coincidem.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await recuperarSenhaAPI.redefinir(token, novaSenha);
      setStep('success');
    } catch (err) {
      setMessage({ text: err.message?.includes('400') ? 'Link expirado ou inválido. Solicite um novo.' : 'Erro ao redefinir senha.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-theme">
      <Header theme="public" links={headerLinks} />

      <main className="form-section">
        <div className="form-container">
          <div className="form-card">

            {/* ETAPA 1 — digitar e-mail */}
            {step === 'email' && (
              <>
                <h2 className="form-title">Recuperar Senha</h2>
                <p className="form-subtitle">Digite o e-mail da sua conta e enviaremos um link para redefinir sua senha.</p>
                <form className="form-body" onSubmit={handleSolicitarEmail}>
                  {message.text && <div className={`form-message ${message.type}`}>{message.text}</div>}
                  <div className="form-group">
                    <label className="form-label">E-mail</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="Digite seu e-mail cadastrado"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                      {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                    </button>
                  </div>
                </form>
                <div className="link-container">
                  <p className="link-text">Lembrou da senha?</p>
                  <Link to="/login" className="link link-highlight">Voltar ao login</Link>
                </div>
              </>
            )}

            {/* ETAPA 2 — e-mail enviado */}
            {step === 'email-sent' && (
              <>
                <h2 className="form-title">Verifique seu e-mail</h2>
                <p className="form-subtitle">
                  Enviamos um link de recuperação para <strong>{email}</strong>.<br /><br />
                  Abra o e-mail e clique no link para redefinir sua senha. O link expira em 1 hora.
                </p>
                <div className="link-container" style={{ marginTop: '2rem' }}>
                  <p className="link-text">Não recebeu?</p>
                  <button
                    onClick={() => setStep('email')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.95rem', color: 'rgba(255,255,255,0.85)' }}
                  >
                    Tentar novamente
                  </button>
                </div>
              </>
            )}

            {/* ETAPA 3 — validando token (loading) */}
            {step === 'validating' && (
              <>
                <h2 className="form-title">Verificando link...</h2>
                <p className="form-subtitle">Aguarde um momento.</p>
              </>
            )}

            {/* ETAPA 4 — token inválido/expirado */}
            {step === 'token-invalid' && (
              <>
                <h2 className="form-title">Link inválido</h2>
                <p className="form-subtitle">Este link de recuperação expirou ou já foi utilizado.</p>
                <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                  <Link to="/recuperar-senha" className="btn btn-primary btn-lg">Solicitar novo link</Link>
                </div>
              </>
            )}

            {/* ETAPA 5 — redefinir senha */}
            {step === 'reset' && (
              <>
                <h2 className="form-title">Nova Senha</h2>
                <p className="form-subtitle">Defina sua nova senha de acesso.</p>
                <form className="form-body" onSubmit={handleRedefinir}>
                  {message.text && <div className={`form-message ${message.type}`}>{message.text}</div>}
                  <div className="form-group">
                    <label className="form-label">Nova Senha</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Mínimo 6 caracteres"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirmar Nova Senha</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Repita a nova senha"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                      {loading ? 'Salvando...' : 'Redefinir Senha'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* ETAPA 6 — sucesso */}
            {step === 'success' && (
              <>
                <h2 className="form-title">Senha redefinida!</h2>
                <p className="form-subtitle">Sua senha foi alterada com sucesso. Você já pode fazer login.</p>
                <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                  <Link to="/login" className="btn btn-primary btn-lg">Ir para o Login</Link>
                </div>
              </>
            )}

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RecuperarSenha;
