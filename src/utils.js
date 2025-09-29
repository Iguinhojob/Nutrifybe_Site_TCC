// Dados simulados
export const simulatedUsers = [
  { email: "nutri@teste.com", crn: "12345", senha: "123456", nome: "Nutricionista Teste", tipo: "nutricionista" }
];

export const simulatedAdmin = {
  email: "admin@nutrifybe.com",
  senha: "admin123"
};

// Funções de LocalStorage
export const saveDataToLocalStorage = (data) => {
  try {
    localStorage.setItem('pendingRequests', JSON.stringify(data.pendingRequests || []));
    localStorage.setItem('acceptedPatients', JSON.stringify(data.acceptedPatients || []));
    localStorage.setItem('managedNutricionists', JSON.stringify(data.managedNutricionists || []));
  } catch (e) {
    console.error("Erro ao salvar dados:", e);
  }
};

export const loadDataFromLocalStorage = () => {
  const data = {
    pendingRequests: [],
    acceptedPatients: [
      {
        id: 'patient_test_1',
        nome: 'João Silva',
        email: 'joao@teste.com',
        idade: 35,
        peso: 80,
        altura: 175,
        objetivo: 'Perder peso',
        nutricionistaId: 'nutri@teste.com'
      }
    ],
    managedNutricionists: []
  };

  try {
    const storedPending = localStorage.getItem('pendingRequests');
    const storedAccepted = localStorage.getItem('acceptedPatients');
    const storedManagedNutris = localStorage.getItem('managedNutricionists');

    if (storedAccepted) data.acceptedPatients = JSON.parse(storedAccepted);
    if (storedPending) data.pendingRequests = JSON.parse(storedPending);
    
    if (storedManagedNutris) {
      data.managedNutricionists = JSON.parse(storedManagedNutris);
    } else {
      data.managedNutricionists = [];
    }
  } catch (e) {
    console.error("Erro ao carregar dados:", e);
  }

  return data;
};