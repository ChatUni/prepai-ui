import { observer } from 'mobx-react-lite';
import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import assistantsStore from '../stores/assistantsStore';

const AssistantsPage = observer(() => {
  const navigate = useNavigate();
  
  // Fetch assistants data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!assistantsStore.assistants.length && !assistantsStore.loading) {
        await assistantsStore.fetchAssistants();
      }
    };
    
    fetchData();
  }, []);

  // Handle image loading errors - defined outside render function to prevent rerenders
  const handleImageError = useCallback((e) => {
    e.target.onerror = null;
    e.target.src = '/src/assets/avatar.png'; // Corrected fallback image path
  }, []);

  // Show loading state
  if (assistantsStore.loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-xl text-gray-600">正在加载AI助理...</div>
      </div>
    );
  }

  // Show error state
  if (assistantsStore.error) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <div className="text-xl text-red-600 mb-4">加载失败</div>
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

  // Show empty state
  if (!assistantsStore.assistants.length) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-xl text-gray-600">暂无AI助理</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-3 pb-20 sm:p-4 md:p-6 md:pb-6 overflow-y-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">AI助理</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assistantsStore.assistants.map(assistant => (
          <div
            key={assistant.id}
            className="bg-white rounded-lg shadow-md p-6 transition-transform hover:scale-105 cursor-pointer"
            onClick={() => navigate(`/assistants/${assistant.id}/chat`)}
          >
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden mb-4">
                <img
                  src={`/src/assets/assist/${assistant.name.replace(/\s+/g, '')}`}
                  alt={assistant.name}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              </div>
              <h2 className="text-xl font-semibold text-center">{assistant.name}</h2>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default AssistantsPage;