import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import NutriLayout, { PageHeader, useShell } from './ui/NutriLayout';
import ChatPanel from './nutri/ChatPanel';
import { ErrorState } from './ui/feedback';
import { pacientesAPI } from './services/api';
import { friendlyError, nameOf } from './ui/format';

function ChatPage() {
  const { id } = useParams();
  const { handleAuthError } = useShell();
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    pacientesAPI.getById(id)
      .then((p) => { if (active) setPatient(p); })
      .catch((e) => { if (active && !handleAuthError(e)) setError(friendlyError(e, 'Paciente não encontrado ou sem vínculo ativo com você.')); });
    return () => { active = false; };
  }, [id, handleAuthError]);

  const name = nameOf(patient, 'Paciente');

  return (
    <>
      <PageHeader
        back={{ to: `/ficha-paciente/${id}`, label: 'Voltar à ficha do paciente' }}
        eyebrow="Conversa privada"
        title={patient ? `Conversa com ${name}` : 'Conversa'}
      />
      {error ? (
        <div className="nf-card"><ErrorState title="Conversa indisponível">{error}</ErrorState></div>
      ) : (
        <ChatPanel patientId={id} patientName={patient ? name : 'o paciente'} onAuthError={handleAuthError} />
      )}
    </>
  );
}

export default function NutriChat() {
  return <NutriLayout narrow><ChatPage /></NutriLayout>;
}
