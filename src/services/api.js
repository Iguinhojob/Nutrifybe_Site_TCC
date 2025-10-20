const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://nutrifybe.vercel.app'
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
  console.log('API Request:', url);
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': Math.random().toString(36).substring(2),
      ...options.headers,
    },
    ...options,
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
      const response = await apiRequest('/api/nutricionistas/login', {
        method: 'POST',
        body: JSON.stringify({ email, crn, senha }),
      });
      
      if (response.success) {
        return response.nutricionista;
      }
      return null;
    } catch (error) {
      if (error.message.includes('401')) {
        return null;
      }
      throw error;
    }
  }
};

// Pacientes
export const pacientesAPI = {
  getAll: () => apiRequest('/api/pacientes'),
  getById: (id) => apiRequest(`/api/pacientes/${id}`),
  getByNutricionista: async (nutricionistaId) => {
    const pacientes = await apiRequest('/api/pacientes');
    return pacientes.filter(p => (p.nutricionistaId || p.NutricionistaId) === nutricionistaId && (p.status || p.Status) === 'accepted');
  },
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
  getByNutricionista: async (nutricionistaId) => {
    const solicitacoes = await apiRequest('/api/solicitacoesPendentes');
    console.log('Solicitações:', solicitacoes);
    console.log('Nutricionista ID buscado:', nutricionistaId);
    return solicitacoes.filter(s => {
      const solicitacaoNutriId = s.nutricionistaId || s.NutricionistaId;
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
    // Buscar todas as solicitações e encontrar a específica
    const solicitacoes = await apiRequest('/api/solicitacoesPendentes');
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
    
    const newPaciente = await apiRequest('/api/pacientes', {
      method: 'POST',
      body: JSON.stringify(paciente),
    });
    
    // Remover da lista de pendentes
    await apiRequest(`/api/solicitacoesPendentes/${id}`, {
      method: 'DELETE',
    });
    
    
    return { nome: paciente.nome, ...newPaciente };
  }
};

// Admin
export const adminAPI = {
  getAll: () => apiRequest('/api/admin'),
  login: async (email, senha) => {
    const admins = await apiRequest('/api/admin');
    return admins.find(a => a.email === email && a.senha === senha);
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

const api = {
  nutricionistasAPI,
  pacientesAPI,
  solicitacoesAPI,
  adminAPI
};

export default api;