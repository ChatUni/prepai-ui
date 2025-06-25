import { observer } from 'mobx-react-lite';
import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatInput from '../../ui/ChatInput';
import assistantStore from '../../../stores/assistantStore';
import assistantChatStore from '../../../stores/assistantChatStore';
import Button from '../../ui/Button';
import { t } from '../../../stores/languageStore';
import LoadingState from '../../ui/LoadingState';

// Loading indicator with animated dots
const TypingIndicator = () => {
  return (
    <div className="flex justify-start mb-4 pl-4">
      <div className="px-4 py-3 rounded-lg bg-gray-200 text-gray-800 rounded-bl-none">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></div>
        </div>
      </div>
    </div>
  );
};

// Custom chat messages component for assistants
const AssistantChatMessages = observer(() => {
  const messagesEndRef = useRef(null);
  const messages = assistantChatStore.messages;
  const isLoading = assistantChatStore.loading;

  // Auto-scroll to bottom when new messages arrive or when loading state changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isLoading]);

  const chatContent = (
    <div className="space-y-4 pt-4">
      {messages.map((message, index) => (
        <div
          key={message.id || index}
          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
        >
          <div className="pl-4">
            <div className={`inline-block px-4 py-3 rounded-lg max-w-[80%] ${
              message.sender === 'user'
                ? 'bg-blue-500 text-white rounded-br-none'
                : 'bg-gray-200 text-gray-800 rounded-bl-none'
            }`}>
              <div className="text-sm whitespace-pre-wrap">{message.text}</div>
              <div className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* Show typing indicator when waiting for assistant response */}
      {isLoading && <TypingIndicator />}
      
      <div ref={messagesEndRef} />
    </div>
  );

  return (
    <LoadingState
      isEmpty={messages.length === 0}
      customMessage={messages.length === 0 ? t('menu.assistant.noMessages') : null}
    >
      {chatContent}
    </LoadingState>
  );
});

const AssistantChatPage = observer(() => {
  const { assistantId } = useParams();
  const navigate = useNavigate();
  
  // Find the selected assistant
  useEffect(() => {
    if (assistantStore.items.length && assistantId) {
      const assistant = assistantStore.items.find(
        a => a.id === parseInt(assistantId)
      );
      
      if (assistant) {
        assistantChatStore.setSelectedAssistant(assistant);
      } else {
        console.error(`Assistant with ID ${assistantId} not found`);
        navigate('/assistants');
      }
    }
  }, [assistantId, assistantStore.assistants, navigate]);
  
  // Handle message sending
  const handleSendMessage = (text) => {
    assistantChatStore.sendMessage(text);
  };
  
  // Go back to assistant selection
  const handleBack = () => {
    navigate('/assistants');
  };

  const errorContent = assistantStore.error && (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <div className="text-gray-600 mt-2">{assistantStore.error}</div>
      <button
        onClick={() => assistantStore.fetchAssistants()}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
      >
        {t('menu.categories.assistant.retry')}
      </button>
    </div>
  );

  const mainContent = assistantChatStore.selectedAssistant && (
    <div className="flex flex-col h-full pb-12">
      {/* Header */}
      <div
        className="flex items-center p-4 border-b cursor-pointer hover:bg-gray-50"
        onClick={handleBack}
      >
        <img
          src={assistantChatStore.selectedAssistant.image}
          alt={assistantChatStore.selectedAssistant.name}
          className="w-8 h-8 rounded-full mr-4 object-cover"
        />
        <h1 className="text-xl font-semibold">{assistantChatStore.selectedAssistant.name}</h1>
      </div>
      
      {/* Chat messages area */}
      <div className="flex-grow overflow-y-auto">
        <AssistantChatMessages />
      </div>
      
      {/* Input area */}
      <div className="p-4 border-t">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          disabled={assistantChatStore.loading}
          placeholder={t('menu.categories.assistant.inputQuestion')}
        />
      </div>
    </div>
  );
  
  return (
    <LoadingState
      isLoading={assistantStore.loading}
      isError={!!assistantStore.error}
      isEmpty={!assistantStore.loading && !assistantStore.error && !assistantChatStore.selectedAssistant}
      customMessage={
        assistantStore.loading ? t('menu.assistant.loading') :
        assistantStore.error ? t('menu.assistant.loadingFailed') :
        !assistantChatStore.selectedAssistant ? t('menu.categories.assistant.notFound') :
        null
      }
    >
      {assistantStore.error ? errorContent : mainContent}
    </LoadingState>
  );
});

export default AssistantChatPage;