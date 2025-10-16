// Configuração automática baseada no ambiente
const CURRENT_API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://nutrifybe-backend.onrender.com'
  : 'http://localhost:3001';
const IS_JAVA_BACKEND = process.env.NODE_ENV === 'production';

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
  
  const url = `${CURRENT_API_URL}${endpoint}`;
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
  getAll: () => apiRequest(IS_JAVA_BACKEND ? '/api/nutricionistas' : '/nutricionistas'),
  getById: (id) => apiRequest(IS_JAVA_BACKEND ? `/api/nutricionistas/${id}` : `/nutricionistas/${id}`),
  create: (data) => apiRequest(IS_JAVA_BACKEND ? '/api/nutricionistas' : '/nutricionistas', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(IS_JAVA_BACKEND ? `/api/nutricionistas/${id}` : `/nutricionistas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(IS_JAVA_BACKEND ? `/api/nutricionistas/${id}` : `/nutricionistas/${id}`, {
    method: 'DELETE',
  }),
  login: async (email, crn, senha) => {
    if (IS_JAVA_BACKEND) {
      // Usar endpoint de autenticação do Spring Boot
      return apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, crn, senha }),
      });
    } else {
      // Lógica do JSON Server
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
  }
};

// Pacientes
export const pacientesAPI = {
  getAll: () => apiRequest(IS_JAVA_BACKEND ? '/api/pacientes' : '/pacientes'),
  getById: (id) => apiRequest(IS_JAVA_BACKEND ? `/api/pacientes/${id}` : `/pacientes/${id}`),
  getByNutricionista: async (nutricionistaId) => {
    const endpoint = IS_JAVA_BACKEND ? '/api/pacientes' : '/pacientes';
    const pacientes = await apiRequest(endpoint);
    return pacientes.filter(p => (p.nutricionistaId || p.NutricionistaId) === nutricionistaId && (p.status || p.Status) === 'accepted');
  },
  create: (data) => apiRequest(IS_JAVA_BACKEND ? '/api/pacientes' : '/pacientes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(IS_JAVA_BACKEND ? `/api/pacientes/${id}` : `/pacientes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(IS_JAVA_BACKEND ? `/api/pacientes/${id}` : `/pacientes/${id}`, {
    method: 'DELETE',
  })
};

// Solicitações Pendentes
export const solicitacoesAPI = {
  getAll: () => apiRequest(IS_JAVA_BACKEND ? '/api/solicitacoes-pendentes' : '/solicitacoesPendentes'),
  getByNutricionista: async (nutricionistaId) => {
    const endpoint = IS_JAVA_BACKEND ? '/api/solicitacoes-pendentes' : '/solicitacoesPendentes';
    const solicitacoes = await apiRequest(endpoint);
    return solicitacoes.filter(s => (s.nutricionistaId || s.NutricionistaId) === nutricionistaId);
  },
  create: (data) => apiRequest(IS_JAVA_BACKEND ? '/api/solicitacoes-pendentes' : '/solicitacoesPendentes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(IS_JAVA_BACKEND ? `/api/solicitacoes-pendentes/${id}` : `/solicitacoesPendentes/${id}`, {
    method: 'DELETE',
  }),
  acceptRequest: async (id) => {
    // Buscar todas as solicitações e encontrar a específica
    const endpoint = IS_JAVA_BACKEND ? '/api/solicitacoes-pendentes' : '/solicitacoesPendentes';
    const solicitacoes = await apiRequest(endpoint);
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
    
    const pacienteEndpoint = IS_JAVA_BACKEND ? '/api/pacientes' : '/pacientes';
    const newPaciente = await apiRequest(pacienteEndpoint, {
      method: 'POST',
      body: JSON.stringify(paciente),
    });
    
    // Remover da lista de pendentes
    const deleteEndpoint = IS_JAVA_BACKEND ? `/api/solicitacoes-pendentes/${id}` : `/solicitacoesPendentes/${id}`;
    await apiRequest(deleteEndpoint, {
      method: 'DELETE',
    });
    
    
    return { nome: paciente.nome, ...newPaciente };
  }
};

// Admin
export const adminAPI = {
  getAll: () => apiRequest('/admin'),
  login: async (email, senha) => {
    if (IS_JAVA_BACKEND) {
      return apiRequest('/auth/admin-login', {
        method: 'POST',
        body: JSON.stringify({ email, senha }),
      });
    } else {
      const admins = await apiRequest('/admin');
      return admins.find(a => a.email === email && a.senha === senha);
    }
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
  getActivityLog: () => apiRequest(IS_JAVA_BACKEND ? '/api/activity-log' : '/activityLog'),
  addActivity: (activity) => apiRequest(IS_JAVA_BACKEND ? '/api/activity-log' : '/activityLog', {
    method: 'POST',
    body: JSON.stringify(activity),
  }),
  clearActivityLog: () => apiRequest(IS_JAVA_BACKEND ? '/api/activity-log' : '/activityLog', {
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