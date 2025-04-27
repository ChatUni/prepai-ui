import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import realtimeSessionStore from '../../../stores/realtimeSessionStore';
import chatStore from '../../../stores/chatStore';
import instructorChatStore from '../../../stores/instructorChatStore';
import ChatInput from '../../ui/ChatInput';
import SessionControls from '../../ui/SessionControls';
import languageStore from '../../../stores/languageStore';

const InstructorChatPage = observer(() => {
  const { t } = languageStore;
  const instructor = instructorChatStore.currentInstructor;
  const isSessionActive = realtimeSessionStore.isSessionActive;
  const messages = chatStore.messages;
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  useEffect(() => {
    return () => {
      // Clear messages when component unmounts
      chatStore.clearMessages();
    };
  }, []);

  const handleSendMessage = (text) => {
    chatStore.sendMessage(text);
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full p-3 pb-12 sm:p-4 md:p-6 md:pb-6 overflow-y-auto">
      {/* Header with instructor info */}
      <div className="flex items-center py-4 border-b">
        <div className="flex items-center w-full">
          <img
            src={instructor?.image}
            alt={instructor?.name}
            className="rounded-full w-12 h-12 object-cover mr-4"
          />
          <div className='flex-grow'>
            <h2 className="text-xl font-bold">{instructor?.name}</h2>
            <p className="text-sm text-gray-600">{t('menu.categories.instructor.chat.realTimeChat')}</p>
          </div>
          <div className="bg-white">
            <SessionControls />
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-col flex-grow h-full overflow-hidden">
        {/* Messages display */}
        <div className="flex-grow overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                >
                  <div className={`px-4 py-3 rounded-lg max-w-[80%] ${
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
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Chat Input */}
        <div className="p-4 border-t bg-white">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={!isSessionActive}
            placeholder={t('menu.categories.instructor.chat.inputMessage')}
          />
        </div>
      </div>
    </div>
  );
});

export default InstructorChatPage;