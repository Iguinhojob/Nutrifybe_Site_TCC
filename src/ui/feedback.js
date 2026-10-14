import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './icons';

/* ============================== Toasts ============================== */

const ToastContext = createContext({ show: () => {} });

const TOAST_ICON = { success: 'checkCircle', error: 'alertCircle', info: 'info' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const show = useCallback((toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const item = { tone: 'success', duration: toast.tone === 'error' || toast.action ? 10000 : 6000, ...toast, id };
    setToasts((list) => [...list.slice(-2), item]);
    if (item.duration) timers.current[id] = setTimeout(() => dismiss(id), item.duration);
    return id;
  }, [dismiss]);

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="nf-toast-region" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div key={t.id} className={`nf-toast ${t.tone}`} role={t.tone === 'error' ? 'alert' : 'status'}>
            <Icon name={TOAST_ICON[t.tone] || 'info'} size={20} />
            <div className="body">
              {t.title && <strong>{t.title}</strong>}
              {t.message && <p>{t.message}</p>}
              {t.action && (
                <Link to={t.action.to} onClick={() => dismiss(t.id)}>{t.action.label}</Link>
              )}
            </div>
            <button type="button" className="close" onClick={() => dismiss(t.id)} aria-label="Fechar aviso">
              <Icon name="x" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/* ============================== Diálogo ============================== */

/**
 * Diálogo modal acessível sobre o <dialog> nativo: prende o foco, fecha com Esc
 * e devolve o foco a quem abriu.
 */
export function Dialog({ open, onClose, title, icon, tone = 'primary', children, footer, wide = false, busy = false, describedBy }) {
  const ref = useRef(null);
  const opener = useRef(null);
  const titleId = useRef(`nf-dlg-${Math.random().toString(36).slice(2, 8)}`).current;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      opener.current = document.activeElement;
      if (typeof el.showModal === 'function') el.showModal(); else el.setAttribute('open', '');
      const first = el.querySelector('[data-autofocus]') || el.querySelector('.nf-dialog-body input, .nf-dialog-body textarea, .nf-dialog-body select, .nf-dialog-foot button');
      first?.focus();
    } else if (!open && el.open) {
      el.close();
      if (opener.current && document.contains(opener.current)) opener.current.focus();
    }
  }, [open]);

  const handleCancel = (event) => {
    event.preventDefault();
    if (!busy) onClose?.();
  };

  const handleClick = (event) => {
    // Clique no fundo escurecido fecha o diálogo.
    if (event.target === ref.current && !busy) onClose?.();
  };

  return (
    <dialog
      ref={ref}
      className={`nf-dialog${wide ? ' wide' : ''}`}
      aria-labelledby={titleId}
      aria-describedby={describedBy}
      onCancel={handleCancel}
      onClick={handleClick}
    >
      {open && (
        <>
          <div className="nf-dialog-head">
            {icon && <span className={`ico ${tone}`}><Icon name={icon} size={20} /></span>}
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="nf-btn ghost sm icon x" onClick={() => !busy && onClose?.()} aria-label="Fechar" disabled={busy}>
              <Icon name="x" size={18} />
            </button>
          </div>
          <div className="nf-dialog-body">{children}</div>
          {footer && <div className="nf-dialog-foot">{footer}</div>}
        </>
      )}
    </dialog>
  );
}

/** Pede confirmação explicando o efeito da ação. */
export function ConfirmDialog({
  open, title, children, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar',
  tone = 'primary', icon, busy = false, onConfirm, onCancel, confirmDisabled = false,
}) {
  const descId = useRef(`nf-dsc-${Math.random().toString(36).slice(2, 8)}`).current;
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      icon={icon || (tone === 'danger' ? 'alert' : 'info')}
      tone={tone}
      busy={busy}
      describedBy={descId}
      footer={(
        <>
          <button type="button" className="nf-btn secondary" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
          <button
            type="button"
            className={`nf-btn ${tone === 'danger' ? 'danger' : 'primary'}`}
            onClick={onConfirm}
            disabled={busy || confirmDisabled}
            data-autofocus={tone === 'danger' ? undefined : true}
          >
            {busy && <span className="nf-spinner" aria-hidden="true" />}
            {busy ? 'Aguarde…' : confirmLabel}
          </button>
        </>
      )}
    >
      <div id={descId} style={{ display: 'grid', gap: 12 }}>{children}</div>
    </Dialog>
  );
}

/* ======================= Estados e mensagens ======================= */

export function Badge({ tone = 'neutral', icon, children }) {
  return (
    <span className={`nf-badge ${tone}`}>
      {icon && <Icon name={icon} size={14} strokeWidth={2.4} />}
      {children}
    </span>
  );
}

const NOTICE_ICON = { info: 'info', success: 'checkCircle', warning: 'alert', danger: 'alertCircle' };

export function Notice({ tone = 'info', title, children, role }) {
  return (
    <div className={`nf-notice ${tone}`} role={role}>
      <Icon name={NOTICE_ICON[tone]} size={20} />
      <div>
        {title && <strong>{title}</strong>}
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ icon = 'inbox', title, children, action, headingLevel = 3 }) {
  const H = `h${headingLevel}`;
  return (
    <div className="nf-state">
      <span className="icon"><Icon name={icon} size={26} /></span>
      <H>{title}</H>
      {children && <p>{children}</p>}
      {action && <div className="nf-row">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = 'Carregando…', lines = 3 }) {
  return (
    <div role="status" aria-live="polite" style={{ display: 'grid', gap: 12, padding: '8px 0' }}>
      <span className="nf-sr-only">{label}</span>
      <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--nf-muted)', fontSize: '.92rem' }}>
        <span className="nf-spinner" /> {label}
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="nf-skeleton" aria-hidden="true" style={{ height: 64, opacity: 1 - i * 0.2 }} />
      ))}
    </div>
  );
}

export function ErrorState({ title = 'Não foi possível carregar', children, onRetry, action }) {
  return (
    <div className="nf-state error" role="alert">
      <span className="icon"><Icon name="alertCircle" size={26} /></span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      <div className="nf-row">
        {onRetry && (
          <button type="button" className="nf-btn primary" onClick={onRetry}>
            <Icon name="refresh" size={18} /> Tentar novamente
          </button>
        )}
        {action}
      </div>
    </div>
  );
}
