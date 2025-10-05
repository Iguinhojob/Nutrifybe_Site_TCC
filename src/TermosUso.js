import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
const fundoImage = '/images/fundo_index.png';

const TermosUso = () => {
  const headerLinks = [
    { href: '/', text: 'Início' },
    { href: '/solicitar-consulta', text: 'Solicitar Consulta' },
    { href: '/registro', text: 'Registro' },
    { href: '/login', text: 'Entrar' },
    { href: '/sobre-nos', text: 'Sobre nós' },
    { href: '/suporte', text: 'Suporte' }
  ];

  return (
    <div className="public-theme" style={{backgroundImage: `url(${fundoImage})`}}>
      <Header theme="public" links={headerLinks} />
      
      <main className="info-section">
        <Link to="/" className="back-arrow">
          <i className="fas fa-arrow-left"></i>
        </Link>
        
        <div className="info-card">
          <h1 className="info-title">Termos de Uso</h1>
          
          <p className="info-text">
            <strong>Última atualização:</strong> Janeiro de 2025
          </p>
          
          <h3 style={{color: '#06b6d4', marginTop: '2rem'}}>1. Aceitação dos Termos</h3>
          <p className="info-text">
            Ao utilizar o Nutrifybe, você concorda com estes termos de uso. Este sistema é destinado exclusivamente para nutricionistas registrados e seus pacientes.
          </p>
          
          <h3 style={{color: '#06b6d4', marginTop: '2rem'}}>2. Uso do Sistema</h3>
          <p className="info-text">
            O Nutrifybe é uma plataforma educacional desenvolvida como projeto acadêmico. Os usuários devem fornecer informações precisas e manter a confidencialidade de suas credenciais.
          </p>
          
          <h3 style={{color: '#06b6d4', marginTop: '2rem'}}>3. Responsabilidades</h3>
          <p className="info-text">
            Os nutricionistas são responsáveis pelas orientações fornecidas. O sistema não substitui consultas presenciais nem diagnósticos médicos profissionais.
          </p>
          
          <h3 style={{color: '#06b6d4', marginTop: '2rem'}}>4. Privacidade</h3>
          <p className="info-text">
            Respeitamos sua privacidade. Os dados são utilizados apenas para o funcionamento do sistema e não são compartilhados com terceiros.
          </p>
          
          <h3 style={{color: '#06b6d4', marginTop: '2rem'}}>5. Limitações</h3>
          <p className="info-text">
            Este é um projeto acadêmico. Não nos responsabilizamos por danos decorrentes do uso do sistema. Use por sua conta e risco.
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TermosUso;