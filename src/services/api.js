const API_BASE_URL = 'http://localhost:3001';

// Funções auxiliares
const handleResponse = async (response) => {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
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
    return nutricionistas.find(n => 
      n.email === email && 
      n.crn === crn && 
      n.senha === senha && 
      n.status === 'approved'
    );
  }
};

// Pacientes
export const pacientesAPI = {
  getAll: () => apiRequest('/pacientes'),
  getById: (id) => apiRequest(`/pacientes/${id}`),
  getByNutricionista: async (nutricionistaId) => {
    const pacientes = await apiRequest('/pacientes');
    return pacientes.filter(p => p.nutricionistaId === nutricionistaId && p.status === 'accepted');
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
    return solicitacoes.filter(s => s.nutricionistaId === nutricionistaId);
  },
  create: (data) => apiRequest('/solicitacoesPendentes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/solicitacoesPendentes/${id}`, {
    method: 'DELETE',
  }),
  acceptRequest: async (id) => {
    // Buscar a solicitação
    const solicitacao = await apiRequest(`/solicitacoesPendentes/${id}`);
    
    // Criar paciente
    const paciente = {
      ...solicitacao,
      status: 'accepted',
      prescricaoSemanal: ''
    };
    await apiRequest('/pacientes', {
      method: 'POST',
      body: JSON.stringify(paciente),
    });
    
    // Remover da lista de pendentes
    await apiRequest(`/solicitacoesPendentes/${id}`, {
      method: 'DELETE',
    });
    
    return paciente;
  }
};

// Admin
export const adminAPI = {
  login: async (email, senha) => {
    const admins = await apiRequest('/admin');
    return admins.find(a => a.email === email && a.senha === senha);
  },
  getActivityLog: () => apiRequest('/activityLog'),
  addActivity: (activity) => apiRequest('/activityLog', {
    method: 'POST',
    body: JSON.stringify({
      ...activity,
      id: Date.now(),
      timestamp: new Date().toLocaleString('pt-BR')
    }),
  }),
  clearActivityLog: async () => {
    const activities = await apiRequest('/activityLog');
    await Promise.all(activities.map(a => 
      apiRequest(`/activityLog/${a.id}`, { method: 'DELETE' })
    ));
  }
};

const api = {
  nutricionistasAPI,
  pacientesAPI,
  solicitacoesAPI,
  adminAPI
};

export default api;