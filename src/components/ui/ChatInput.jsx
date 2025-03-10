import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import Button from './Button';

const ChatInput = observer(({ onSendMessage, disabled = false, placeholder = "输入消息..." }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        className="flex-grow px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={disabled}
      />
      <Button
        onClick={handleSubmit}
        className={!disabled && message.trim() ? 'bg-green-600' : 'bg-gray-400 cursor-not-allowed'}
        disabled={disabled || !message.trim()}
      >
        发送
      </Button>
    </form>
  );
});

export default ChatInput;