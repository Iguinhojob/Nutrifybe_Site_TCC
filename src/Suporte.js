import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import fundoImage from './fundo_index.png';

const Suporte = () => {
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
          <h1 className="info-title">Suporte</h1>
          
          <p className="info-text">
            Precisa de ajuda com o sistema? Estamos aqui para te apoiar!
          </p>
          
          <p className="info-text">
            Caso tenha dúvidas, dificuldades no uso da plataforma ou sugestões de melhoria, entre em contato com a equipe de desenvolvimento do projeto. Nosso objetivo é garantir que sua experiência seja simples, eficiente e sem complicações.
          </p>

          <div className="contact-section">
            <h2 className="faq-title">Contato para suporte:</h2>
            <ul className="contact-list">
              <li className="contact-item">
                <i className="fas fa-envelope contact-icon"></i>
                <span className="contact-text">
                  Email: <a href="mailto:contatonutrifybe@gmail.com" className="support-link">contatonutrifybe@gmail.com</a>
                </span>
              </li>
              <li className="contact-item">
                <i className="fas fa-clock contact-icon"></i>
                <span className="contact-text">Disponível de segunda a sexta, das 7h às 13h.</span>
              </li>
            </ul>
          </div>

          <div className="faq-section">
            <h2 className="faq-title">Perguntas Frequentes:</h2>
            
            <div className="faq-item">
              <div className="faq-question">
                <span className="faq-number">1</span>
                <span>Quem pode usar este sistema?</span>
              </div>
              <div className="faq-answer">
                O sistema foi desenvolvido exclusivamente para nutricionistas e administradores do sistema.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question">
                <span className="faq-number">2</span>
                <span>Como faço meu cadastro como nutricionista?</span>
              </div>
              <div className="faq-answer">
                Na página Inicial, clique em 'Registrar', preencha seus dados profissionais e finalize o cadastro. Após isso, você será avaliado e caso suas informações sejam verdadeiras iremos informar via e-mail se seu cadastro foi realizado ou não.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question">
                <span className="faq-number">3</span>
                <span>O que posso fazer dentro da plataforma?</span>
              </div>
              <div className="faq-answer">
                Você poderá enviar recomendações personalizadas aos usuários, acompanhar o progresso dos pacientes, organizar atendimentos e manter comunicação direta com cada um deles.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question">
                <span className="faq-number">4</span>
                <span>Meus dados estão seguros?</span>
              </div>
              <div className="faq-answer">
                Sim. O sistema foi projetado com foco em segurança e privacidade, protegendo tanto os dados dos profissionais quanto os usuários.
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Suporte;