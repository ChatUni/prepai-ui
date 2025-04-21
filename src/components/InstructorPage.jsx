import { observer } from 'mobx-react-lite';
import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import instructorsStore from '../stores/instructorsStore';
import languageStore from '../stores/languageStore';

const InstructorPage = observer(() => {
  const navigate = useNavigate();
  const { t } = languageStore;
  
  // Fetch instructors data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!instructorsStore.instructors.length && !instructorsStore.loading) {
        await instructorsStore.fetchInstructors();
      }
    };
    
    fetchData();
  }, []);

  // Handle image loading errors
  const handleImageError = useCallback((e) => {
    e.target.onerror = null;
    e.target.src = '/images/avatar.png';
  }, []);

  // Show loading state
  if (instructorsStore.loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-xl text-gray-600">{t('instructors.loading')}</div>
      </div>
    );
  }

  // Show error state
  if (instructorsStore.error) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <div className="text-xl text-red-600 mb-4">{t('instructors.loadingFailed')}</div>
        <div className="text-gray-600">{instructorsStore.error}</div>
        <button
          onClick={() => instructorsStore.fetchInstructors()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
        >
          {t('instructors.retry')}
        </button>
      </div>
    );
  }

  // Show empty state
  if (!instructorsStore.instructors.length) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-xl text-gray-600">{t('instructors.notFound')}</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-3 pb-20 sm:p-4 md:p-6 md:pb-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('instructors.title')}</h1>
        <button
          onClick={() => navigate('/instructors/new')}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {t('instructors.add.button')}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instructorsStore.instructors.map(instructor => (
          <div
            key={instructor.id}
            className="bg-white rounded-lg shadow-md p-6 transition-transform hover:scale-105"
          >
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden mb-4">
                <img
                  src={instructor.iconUrl}
                  alt={instructor.name}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              </div>
              <h2 className="text-xl font-semibold text-center mb-2">{instructor.name}</h2>
              <p className="text-gray-600 text-sm text-center mb-3">{instructor.title}</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate(`/instructor/${instructor.id}/chat`)}
                  className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {t('instructors.chat')}
                  </div>
                </button>
                <button
                  onClick={() => navigate(`/instructors/${instructor.id}/edit`)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  {t('instructors.edit.button')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default InstructorPage;
