import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './css/style.css';
import './css/responsive.css';
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
import NutriPerfil from './NutriPerfil';
import SobreNos from './SobreNos';
import Suporte from './Suporte';
import SolicitarConsulta from './SolicitarConsulta';
import TermosUso from './TermosUso';
import PoliticaPrivacidade from './PoliticaPrivacidade';
import FichaPaciente from './FichaPaciente';
import NotFound from './NotFound';

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
        <Route path="/ficha-paciente/:id" element={<FichaPaciente />} />
        <Route path="/nutri-solicitacoes" element={<NutriSolicitacoes />} />
        <Route path="/nutri-perfil" element={<NutriPerfil />} />
        <Route path="/solicitar-consulta" element={<SolicitarConsulta />} />
        <Route path="/sobre-nos" element={<SobreNos />} />
        <Route path="/suporte" element={<Suporte />} />
        <Route path="/termos-uso" element={<TermosUso />} />
        <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
