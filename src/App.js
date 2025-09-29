import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './css/style.css';
import Home from './Home';
import Login from './Login';
import Register from './Register';
import RecuperarSenha from './RecuperarSenha';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import NutriDashboard from './NutriDashboard';
import NutriCalendario from './NutriCalendario';
import NutriPrescricao from './NutriPrescricao';
import NutriSolicitacoes from './NutriSolicitacoes';
import SobreNos from './SobreNos';
import Suporte from './Suporte';
import SolicitarConsulta from './SolicitarConsulta';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/nutri-dashboard" element={<NutriDashboard />} />
        <Route path="/nutri-calendario/:id" element={<NutriCalendario />} />
        <Route path="/nutri-prescricao/:id" element={<NutriPrescricao />} />
        <Route path="/nutri-solicitacoes" element={<NutriSolicitacoes />} />
        <Route path="/solicitar-consulta" element={<SolicitarConsulta />} />
        <Route path="/sobre-nos" element={<SobreNos />} />
        <Route path="/suporte" element={<Suporte />} />
      </Routes>
    </Router>
  );
}

export default App;
