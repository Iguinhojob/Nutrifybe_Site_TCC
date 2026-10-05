const isCodespaces = typeof window !== 'undefined' && window.location.hostname.includes('app.github.dev');
const configuredApiBaseUrl = process.env.REACT_APP_API_URL?.trim().replace(/\/+$/, '');

const API_BASE_URL = configuredApiBaseUrl || (isCodespaces
  ? `https://${window.location.hostname.replace('-3000', '-3001')}`
  : process.env.NODE_ENV === 'production'
    ? 'https://backend-tcc-web.onrender.com'
    : 'http://localhost:8080');

const isJsonServer = false;

const endpoint = (path) => path;

// Funções auxiliares
const handleResponse = async (response) => {
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw ? { message: raw } : null; }
  if (!response.ok) {
    const error = new Error(data?.message || `HTTP error! status: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
};

const apiRequest = async (path, options = {}) => {
  if (!path.startsWith('/') || path.includes('..')) {
    throw new Error('Invalid endpoint');
  }

  const url = `${API_BASE_URL}${endpoint(path)}`;
  console.log('API Request:', url);
  
  let storedUser = null;
  try { storedUser = JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch { storedUser = null; }
  const isMultipart = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const config = {
    ...options,
    headers: {
      ...(!isMultipart ? { 'Content-Type': 'application/json' } : {}),
      'X-CSRF-Token': Math.random().toString(36).substring(2),
      ...(storedUser?.token ? { Authorization: `Bearer ${storedUser.token}` } : {}),
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  console.log('API Response:', response.status, response.statusText);
  return handleResponse(response);
};

// Nutricionistas
export const nutricionistasAPI = {
  getAll: () => apiRequest('/api/nutricionistas'),
  getById: (id) => apiRequest(`/api/nutricionistas/${id}`),
  create: (data) => apiRequest('/api/nutricionistas', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/api/nutricionistas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/api/nutricionistas/${id}`, {
    method: 'DELETE',
  }),
  login: async (email, crn, senha) => {
    try {
      if (isJsonServer) {
        const nutris = await apiRequest('/api/nutricionistas');
        const nutri = nutris.find(n => n.email === email && n.crn === crn && n.senha === senha);
        if (!nutri) return null;
        if (nutri.status !== 'approved') throw new Error('PENDING_APPROVAL');
        if (nutri.ativo === false || nutri.ativo === 0) throw new Error('ACCOUNT_INACTIVE');
        return nutri;
      }
      const response = await apiRequest('/api/nutricionistas/login', {
        method: 'POST',
        body: JSON.stringify({ email, crn, senha }),
      });
      if (response.success) return { ...response.nutricionista, token: response.token };
      return null;
    } catch (error) {
      if (error.message === 'PENDING_APPROVAL' || error.message === 'ACCOUNT_INACTIVE') throw error;
      if (error.status === 401 || error.message.includes('401')) return null;
      throw error;
    }
  }
};

// Pacientes
export const pacientesAPI = {
  getAll: () => apiRequest('/api/pacientes'),
  getById: (id) => apiRequest(`/api/nutri/pacientes/${id}`),
  getByNutricionista: () => apiRequest('/api/nutri/pacientes'),
  updateClinical: (id, data) => apiRequest(`/api/nutri/pacientes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  transfer: (id, nutricionistaId) => apiRequest(`/api/nutri/pacientes/${id}/transferir`, { method: 'POST', body: JSON.stringify({ nutricionistaId }) }),
  endService: (id) => apiRequest(`/api/nutri/pacientes/${id}/vinculo`, { method: 'DELETE' }),
  create: (data) => apiRequest('/api/pacientes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/api/pacientes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/api/pacientes/${id}`, {
    method: 'DELETE',
  })
};

// Solicitações Pendentes
export const solicitacoesAPI = {
  getAll: () => apiRequest('/api/solicitacoesPendentes'),
  getByNutricionista: () => apiRequest('/api/nutri/solicitacoes'),
  acceptScoped: (id) => apiRequest(`/api/nutri/solicitacoes/${id}/aceitar`, { method: 'PUT', body: JSON.stringify({}) }),
  denyScoped: (id) => apiRequest(`/api/nutri/solicitacoes/${id}`, { method: 'DELETE' }),
  getByNutricionistaLegacy: async (nutricionistaId) => {
    const solicitacoes = await apiRequest('/api/solicitacoesPendentes');
    console.log('Solicitações:', solicitacoes);
    console.log('Nutricionista ID buscado:', nutricionistaId);
    return solicitacoes.filter(s => {
      const solicitacaoNutriId = s.nutricionistaId || s.NutricionistaId || s.nutricionista_id;
      console.log('Comparando:', solicitacaoNutriId, 'com', nutricionistaId);
      return String(solicitacaoNutriId) === String(nutricionistaId);
    });
  },
  create: (data) => apiRequest('/api/solicitacoesPendentes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/api/solicitacoesPendentes/${id}`, {
    method: 'DELETE',
  }),
  acceptRequest: async (id) => {
    const solicitacoes = await apiRequest('/api/solicitacoesPendentes');
    const solicitacao = solicitacoes.find(s => String(s.id || s.Id) === String(id));
    if (!solicitacao) throw new Error('Solicitação não encontrada');
    const nutricionistaId = solicitacao.nutricionistaId || solicitacao.NutricionistaId || solicitacao.nutricionista_id;
    if (!nutricionistaId) throw new Error('A solicitação não tem nutricionista associado');
    return apiRequest(`/api/solicitacoesPendentes/${id}/accept`, {
      method: 'PUT',
      body: JSON.stringify({ nutricionistaId: Number(nutricionistaId) }),
    });
  }
};

export const chatAPI = {
  messages: (pacienteId) => apiRequest(`/api/chat/mensagens?pacienteId=${encodeURIComponent(pacienteId)}`),
  send: (pacienteId, formData) => apiRequest(`/api/chat/mensagens?pacienteId=${encodeURIComponent(pacienteId)}`, { method: 'POST', body: formData }),
  attachmentUrl: (id, pacienteId) => `${API_BASE_URL}/api/chat/mensagens/${id}/arquivo?pacienteId=${encodeURIComponent(pacienteId)}`,
};

// Admin
export const adminAPI = {
  getAll: () => apiRequest('/api/admin'),
  login: async (email, senha) => {
    const admins = await apiRequest('/api/admin');
    return admins.find(a => a.email === email && a.senha === senha) || null;
  },
  create: (data) => apiRequest('/api/admin', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/api/admin/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/api/admin/${id}`, {
    method: 'DELETE',
  }),
  getActivityLog: () => apiRequest('/api/activityLog'),
  addActivity: (activity) => apiRequest('/api/activityLog', {
    method: 'POST',
    body: JSON.stringify(activity),
  }),
  clearActivityLog: () => apiRequest('/api/activityLog', {
    method: 'DELETE'
  })
};

// Recuperação de Senha
export const recuperarSenhaAPI = {
  solicitar: (email) => apiRequest('/api/recuperar-senha/solicitar', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  validarToken: (token) => apiRequest(`/api/recuperar-senha/validar?token=${encodeURIComponent(token)}`),
  redefinir: (token, novaSenha) => apiRequest('/api/recuperar-senha/redefinir', {
    method: 'POST',
    body: JSON.stringify({ token, novaSenha }),
  }),
};

const api = {
  nutricionistasAPI,
  pacientesAPI,
  solicitacoesAPI,
  adminAPI
};

export default api;
