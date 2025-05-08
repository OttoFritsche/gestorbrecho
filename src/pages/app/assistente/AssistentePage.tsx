import React from 'react';
import ChatbotPage from '@/pages/ia/ChatbotPage';

const AssistentePage: React.FC = () => {
  return (
    <div className="mx-auto py-4">
      {/* Container para o chat centralizado, sem cabeçalho externo */}
      <div className="mx-auto">
        <ChatbotPage />
      </div>
    </div>
  );
};

export default AssistentePage; 