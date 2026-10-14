import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from './icons';
import { solicitacoesAPI } from '../services/api';
import { getStoredUser, initialOf, pick } from './format';
import '../css/nf-ui.css';

const ShellContext = createContext({ user: null, pendingCount: null, refreshPending: () => {}, logout: () => {}, handleAuthError: () => false });
export const useShell = () => useContext(ShellContext);

const PATIENT_ROUTES = ['/ficha-paciente', '/nutri-prescricao', '/nutri-chat', '/nutri-calendario'];

function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('darkMode') === 'true');
  useEffect(() => {
    document.body.classList.toggle('dark-mode', dark);
    localStorage.setItem('darkMode', String(dark));
  }, [dark]);
  useEffect(() => {
    const sync = (event) => setDark(event.detail?.darkMode ?? localStorage.getItem('darkMode') === 'true');
    window.addEventListener('nutrifybe-theme-change', sync);
    return () => window.removeEventListener('nutrifybe-theme-change', sync);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    window.dispatchEvent(new CustomEvent('nutrifybe-theme-change', { detail: { darkMode: next } }));
  };
  return [dark, toggle];
}

/**
 * Estrutura comum de todas as telas do nutricionista: link "pular para o conteúdo",
 * barra superior com a mesma navegação em todas as páginas, alternância de tema e saída.
 */
export default function NutriLayout({ children, narrow = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useState(getStoredUser);
  const [pendingCount, setPendingCount] = useState(null);
  const [dark, toggleDark] = useDarkMode();

  const logout = useCallback((reason) => {
    localStorage.removeItem('currentUser');
    navigate(reason === 'expired' ? '/login?sessao=expirada' : '/login', { replace: true });
  }, [navigate]);

  const handleAuthError = useCallback((error) => {
    if (error?.status === 401) { logout('expired'); return true; }
    return false;
  }, [logout]);

  const refreshPending = useCallback(async () => {
    try {
      const list = await solicitacoesAPI.getByNutricionista();
      setPendingCount(Array.isArray(list) ? list.length : 0);
      return list;
    } catch (error) {
      handleAuthError(error);
      return null;
    }
  }, [handleAuthError]);

  useEffect(() => {
    if (!user || !(user.id || user.Id)) { navigate('/login', { replace: true }); return; }
    refreshPending();
  }, [user, navigate, refreshPending]);

  if (!user) return null;

  const path = location.pathname;
  const inPatientArea = PATIENT_ROUTES.some((route) => path.startsWith(route));
  const current = (href) => (path === href ? 'page' : (href === '/nutri-dashboard' && inPatientArea ? 'true' : undefined));
  const userName = pick(user, 'nome', 'Nome') || 'Nutricionista';
  const foto = pick(user, 'foto', 'Foto');

  return (
    <ShellContext.Provider value={{ user, pendingCount, refreshPending, logout, handleAuthError }}>
      <div className="nf-app">
        <a className="nf-skip-link" href="#conteudo">Pular para o conteúdo</a>
        {/* div com role="banner" evita as regras globais de "header" e "nav ul li a" das folhas legadas. */}
        <div role="banner" className="nf-topbar">
          <div className="nf-topbar-inner">
            <Link to="/nutri-dashboard" className="nf-brand" aria-label="Nutrifybe — ir para o painel">
              <span className="a">Nutri</span><span className="b">fybe</span>
              <small>Nutricionista</small>
            </Link>
            <nav className="nf-nav" aria-label="Navegação principal">
              <div className="nf-nav-links">
                  <Link to="/nutri-dashboard" aria-current={current('/nutri-dashboard')}>
                    <Icon name="home" size={18} /> Painel
                  </Link>
                  <Link to="/nutri-solicitacoes" aria-current={current('/nutri-solicitacoes')}>
                    <Icon name="inbox" size={18} /> Solicitações
                    {pendingCount > 0 && (
                      <span className="nf-nav-count">
                        {pendingCount}<span className="nf-sr-only"> pendentes</span>
                      </span>
                    )}
                  </Link>
                  <Link to="/nutri-perfil" aria-current={current('/nutri-perfil')}>
                    <Icon name="user" size={18} /> Meu perfil
                  </Link>
              </div>
            </nav>
            <div className="nf-topbar-actions">
              <span className="nf-user" title={userName}>
                <span className="nf-avatar" aria-hidden="true">
                  {foto ? <img src={foto} alt="" /> : initialOf(userName)}
                </span>
                <span>{userName}</span>
              </span>
              <button
                type="button"
                className="nf-btn ghost icon"
                onClick={toggleDark}
                aria-label={dark ? 'Usar tema claro' : 'Usar tema escuro'}
                title={dark ? 'Tema claro' : 'Tema escuro'}
              >
                <Icon name={dark ? 'sun' : 'moon'} size={19} />
              </button>
              <button type="button" className="nf-btn secondary sm" onClick={() => logout()}>
                <Icon name="logout" size={17} /> Sair
              </button>
            </div>
          </div>
        </div>
        <main id="conteudo" tabIndex={-1} className={`nf-main${narrow ? ' narrow' : ''}`}>
          {children}
        </main>
      </div>
    </ShellContext.Provider>
  );
}

export function PageHeader({ eyebrow, title, docTitle, description, actions, back }) {
  const pageTitle = docTitle || (typeof title === 'string' ? title : null);
  useEffect(() => {
    if (pageTitle) document.title = `${pageTitle} · Nutrifybe`;
  }, [pageTitle]);
  return (
    <>
      {back && (
        <Link to={back.to} className="nf-back">
          <Icon name="arrowLeft" size={17} /> {back.label}
        </Link>
      )}
      <div className="nf-page-head">
        <div className="titles">
          {eyebrow && <span className="nf-eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {description && <p className="desc">{description}</p>}
        </div>
        {actions && <div className="actions">{actions}</div>}
      </div>
    </>
  );
}
