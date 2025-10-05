import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import fundoImage from './fundo_index.png';

const PoliticaPrivacidade = () => {
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
          <h1 className="info-title">Política de Privacidade</h1>
          
          <p className="info-text">
            <strong>Última atualização:</strong> Janeiro de 2025
          </p>
          
          <h3 style={{color: '#06b6d4', marginTop: '2rem'}}>1. Coleta de Dados</h3>
          <p className="info-text">
            Coletamos apenas dados necessários para o funcionamento do sistema: nome, email, CRN (nutricionistas) e informações de saúde básicas (pacientes).
          </p>
          
          <h3 style={{color: '#06b6d4', marginTop: '2rem'}}>2. Uso dos Dados</h3>
          <p className="info-text">
            Os dados são utilizados exclusivamente para:
            • Funcionamento do sistema
            • Comunicação entre nutricionistas e pacientes
            • Melhoria da plataforma
          </p>
          
          <h3 style={{color: '#06b6d4', marginTop: '2rem'}}>3. Compartilhamento</h3>
          <p className="info-text">
            Não compartilhamos dados pessoais com terceiros. As informações ficam restritas ao nutricionista responsável e ao paciente.
          </p>
          
          <h3 style={{color: '#06b6d4', marginTop: '2rem'}}>4. Segurança</h3>
          <p className="info-text">
            Implementamos medidas de segurança para proteger seus dados, incluindo criptografia e controle de acesso.
          </p>
          
          <h3 style={{color: '#06b6d4', marginTop: '2rem'}}>5. Seus Direitos</h3>
          <p className="info-text">
            Você pode solicitar acesso, correção ou exclusão de seus dados entrando em contato conosco através do email: contatonutrifybe@gmail.com
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PoliticaPrivacidade;