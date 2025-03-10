import { observer } from "mobx-react-lite";
import instructorChatStore from "../../stores/instructorChatStore";
import { useEffect, useRef } from 'react';

// Individual chat message bubble component
const MessageBubble = ({ message, isUser }) => {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`px-4 py-3 rounded-lg max-w-[80%] ${
        isUser 
          ? 'bg-blue-500 text-white rounded-br-none' 
          : 'bg-gray-200 text-gray-800 rounded-bl-none'
      }`}>
        <div className="text-sm whitespace-pre-wrap">{message.text}</div>
        <div className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

const ChatMessages = observer(({ instructorId }) => {
  const messagesEndRef = useRef(null);
  const messages = instructorChatStore.instructorChats.get(parseInt(instructorId)) || [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        没有消息历史记录
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <MessageBubble 
          key={message.id || index}
          message={message}
          isUser={message.sender === 'user'}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
});

export default ChatMessages;