const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://nutrifybe.vercel.app/api'
  : 'http://localhost:3001';

// Funções auxiliares
const handleResponse = async (response) => {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

const apiRequest = async (endpoint, options = {}) => {
  // Validar endpoint para prevenir SSRF
  if (!endpoint.startsWith('/') || endpoint.includes('..')) {
    throw new Error('Invalid endpoint');
  }
  
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': Math.random().toString(36).substring(2),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  return handleResponse(response);
};

// Nutricionistas
export const nutricionistasAPI = {
  getAll: () => apiRequest('/nutricionistas'),
  getById: (id) => apiRequest(`/nutricionistas/${id}`),
  create: (data) => apiRequest('/nutricionistas', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/nutricionistas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/nutricionistas/${id}`, {
    method: 'DELETE',
  }),
  login: async (email, crn, senha) => {
    const nutricionistas = await apiRequest('/nutricionistas');
    const user = nutricionistas.find(n => 
      n.Email === email && 
      n.CRN === crn && 
      n.Senha === senha
    );
    
    if (!user) return null;
    
    if (user.Status !== 'approved') {
      throw new Error('PENDING_APPROVAL');
    }
    
    if (user.ativo === false || user.ativo === 0) {
      throw new Error('ACCOUNT_INACTIVE');
    }
    
    return user;
  }
};

// Pacientes
export const pacientesAPI = {
  getAll: () => apiRequest('/pacientes'),
  getById: (id) => apiRequest(`/pacientes/${id}`),
  getByNutricionista: async (nutricionistaId) => {
    const pacientes = await apiRequest('/pacientes');
    return pacientes.filter(p => (p.nutricionistaId || p.NutricionistaId) === nutricionistaId && (p.status || p.Status) === 'accepted');
  },
  create: (data) => apiRequest('/pacientes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/pacientes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/pacientes/${id}`, {
    method: 'DELETE',
  })
};

// Solicitações Pendentes
export const solicitacoesAPI = {
  getAll: () => apiRequest('/solicitacoesPendentes'),
  getByNutricionista: async (nutricionistaId) => {
    const solicitacoes = await apiRequest('/solicitacoesPendentes');
    return solicitacoes.filter(s => (s.nutricionistaId || s.NutricionistaId) === nutricionistaId);
  },
  create: (data) => apiRequest('/solicitacoesPendentes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/solicitacoesPendentes/${id}`, {
    method: 'DELETE',
  }),
  acceptRequest: async (id) => {
    // Buscar todas as solicitações e encontrar a específica
    const solicitacoes = await apiRequest('/solicitacoesPendentes');
    const solicitacao = solicitacoes.find(s => (s.id || s.Id) === id);
    
    if (!solicitacao) throw new Error('Solicitação não encontrada');
    
    // Criar paciente
    const paciente = {
      nome: solicitacao.Nome || solicitacao.nome,
      email: solicitacao.Email || solicitacao.email,
      idade: solicitacao.Idade || solicitacao.idade,
      peso: solicitacao.Peso || solicitacao.peso,
      altura: solicitacao.Altura || solicitacao.altura,
      objetivo: solicitacao.Objetivo || solicitacao.objetivo,
      condicaoSaude: solicitacao.CondicaoSaude || solicitacao.condicaoSaude,
      nutricionistaId: solicitacao.NutricionistaId || solicitacao.nutricionistaId,
      status: 'accepted',
      ativo: 1
    };
    
    const newPaciente = await apiRequest('/pacientes', {
      method: 'POST',
      body: JSON.stringify(paciente),
    });
    
    // Remover da lista de pendentes
    await apiRequest(`/solicitacoesPendentes/${id}`, {
      method: 'DELETE',
    });
    
    
    return { nome: paciente.nome, ...newPaciente };
  }
};

// Admin
export const adminAPI = {
  getAll: () => apiRequest('/admin'),
  login: async (email, senha) => {
    const admins = await apiRequest('/admin');
    return admins.find(a => a.email === email && a.senha === senha);
  },
  create: (data) => apiRequest('/admin', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/admin/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/admin/${id}`, {
    method: 'DELETE',
  }),
  getActivityLog: () => apiRequest('/activityLog'),
  addActivity: (activity) => apiRequest('/activityLog', {
    method: 'POST',
    body: JSON.stringify(activity),
  }),
  clearActivityLog: () => apiRequest('/activityLog', {
    method: 'DELETE'
  })
};

const api = {
  nutricionistasAPI,
  pacientesAPI,
  solicitacoesAPI,
  adminAPI
};

export default api;