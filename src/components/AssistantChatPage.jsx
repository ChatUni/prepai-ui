import { observer } from 'mobx-react-lite';
import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatInput from './ui/ChatInput';
import assistantsStore from '../stores/assistantsStore';
import assistantChatStore from '../stores/assistantChatStore';
import Button from './ui/Button';
import languageStore from '../stores/languageStore';

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
  const { t } = languageStore;

  // Auto-scroll to bottom when new messages arrive or when loading state changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        {t('menu.assistant.noMessages')}
      </div>
    );
  }

  return (
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
});

const AssistantChatPage = observer(() => {
  const { assistantId } = useParams();
  const navigate = useNavigate();
  const { t } = languageStore;
  
  // Fetch all assistants if needed
  useEffect(() => {
    const fetchData = async () => {
      if (!assistantsStore.assistants.length && !assistantsStore.loading) {
        await assistantsStore.fetchAssistants();
      }
    };
    
    fetchData();
  }, []);
  
  // Find the selected assistant
  useEffect(() => {
    if (assistantsStore.assistants.length && assistantId) {
      const assistant = assistantsStore.assistants.find(
        a => a.id === parseInt(assistantId)
      );
      
      if (assistant) {
        assistantChatStore.setSelectedAssistant(assistant);
      } else {
        console.error(`Assistant with ID ${assistantId} not found`);
        navigate('/assistants');
      }
    }
  }, [assistantId, assistantsStore.assistants, navigate]);
  
  // Handle message sending
  const handleSendMessage = (text) => {
    assistantChatStore.sendMessage(text);
  };
  
  // Go back to assistant selection
  const handleBack = () => {
    navigate('/assistants');
  };
  
  // Show loading state for assistants
  if (assistantsStore.loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-xl text-gray-600">{t('menu.assistant.loading')}</div>
      </div>
    );
  }
  
  // Show error state
  if (assistantsStore.error) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <div className="text-xl text-red-600 mb-4">{t('menu.assistant.loadingFailed')}</div>
        <div className="text-gray-600">{assistantsStore.error}</div>
        <button
          onClick={() => assistantsStore.fetchAssistants()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
        >
          重试
        </button>
      </div>
    );
  }
  
  // Get the selected assistant
  const assistant = assistantChatStore.selectedAssistant;
  
  if (!assistant) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-xl text-gray-600">未找到AI助理</div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full pb-12">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Button onClick={handleBack} className="mr-4">
          返回
        </Button>
        <h1 className="text-xl font-semibold">{assistant.name}</h1>
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
          placeholder="输入您的问题..."
        />
      </div>
    </div>
  );
});

export default AssistantChatPage;