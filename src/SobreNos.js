import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import fundoImage from './fundo_index.png';

const SobreNos = () => {
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
          <h1 className="info-title">Sobre Nós</h1>
          
          <p className="info-text">
            Somos um grupo de estudantes do ITB Brasílio Flores de Azevedo FIEB, comprometidos em desenvolver soluções digitais que contribuam com a área da saúde, com foco especial na nutrição.
          </p>
          
          <p className="info-text">
            Este projeto foi criado como parte do nosso Trabalho de Conclusão de Curso (TCC), com o objetivo de facilitar o dia a dia do nutricionista, oferecendo uma plataforma moderna, prática e segura para o acompanhamento de pacientes.
          </p>
          
          <p className="info-text">
            Acreditamos que a tecnologia pode ser uma aliada no cuidado com a saúde, e por isso criamos um sistema que valoriza o trabalho do profissional e promove uma experiência mais ágil, organizada e eficaz.
          </p>

          <div className="team-section">
            <h2 className="team-title">Participantes do Projeto</h2>
            <ul className="team-list">
              <li className="team-member">Ana Luiza Curcini Da Silva</li>
              <li className="team-member">Igor José Ferreira Pinto</li>
              <li className="team-member">João Vithor Veiga Silva</li>
              <li className="team-member">Camila Isidio dos Santos Silva</li>
              <li className="team-member">Yasmin Vitória Zuco Ferreira Gonçalves</li>
            </ul>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SobreNos;