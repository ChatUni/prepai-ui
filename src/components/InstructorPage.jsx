import { observer } from 'mobx-react-lite';
import coursesStore from '../stores/coursesStore';
import uiStore from '../stores/uiStore';
import routeStore from '../stores/routeStore';
import { useNavigate } from 'react-router-dom';
import SeriesList from './ui/SeriesList';
import SearchBar from './ui/SearchBar';

const InstructorCard = ({ instructor, onClick }) => {
  const navigate = useNavigate();
  
  const handleChatClick = (e) => {
    e.stopPropagation(); // Prevent triggering the card onClick
    navigate(`/instructor/${instructor.id}/chat`);
  };
  
  return (
    <div
      className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <img
        src={instructor.image}
        alt={instructor.name}
        className="rounded-full w-24 h-24 mb-3 object-cover"
      />
      <h3 className="text-lg font-semibold text-center">{instructor.name}</h3>
      <p className="text-gray-600 text-sm text-center mt-2 mb-3 line-clamp-2">{instructor.description}</p>
      
      <button
        onClick={handleChatClick}
        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full flex items-center text-sm"
      >
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        实时语音辅导
      </button>
    </div>
  );
};

const InstructorPage = observer(() => {
  const navigate = useNavigate();
  
  // Get current instructor from the route store
  const instructor = routeStore.currentInstructor;
  
  // If instructorId is in route but instructor not found, show error
  if (routeStore.instructorId && !instructor) {
    return <div className="p-6 text-center text-red-500">Instructor not found</div>;
  }

  const handleInstructorClick = (selectedInstructor) => {
    // Use routeStore instead of direct navigation
    routeStore.navigateToInstructor(selectedInstructor.id, navigate);
  };

  return (
    <div className="flex-1 p-3 pb-20 sm:p-4 md:p-6 md:pb-6 overflow-y-auto">
      {/* Filter Bar */}
      <div className="mb-4 md:mb-6">
        <SearchBar />
      </div>
      
      {instructor ? (
        // Single instructor view
        <div className="flex flex-col md:flex-row">
          {/* Instructor Information */}
          <div className="md:w-1/4 py-2 md:py-4 md:pr-4 mb-4 md:mb-0">
            <img
              src={instructor.image}
              alt={instructor.name}
              className="rounded-full w-24 h-24 md:w-32 md:h-32 mx-auto mb-3 md:mb-4 object-cover"
            />
            <h2 className="text-xl md:text-2xl font-bold text-center mb-1 md:mb-2">{instructor.name}</h2>
            <p className="text-gray-600 text-center text-sm md:text-base mb-4">{instructor.description}</p>
            <div className="flex justify-center mt-2">
              <button
                onClick={() => navigate(`/instructor/${instructor.id}/chat`)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full flex items-center text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                实时语音辅导
              </button>
            </div>
          </div>

          {/* Instructor Series */}
          <div className="md:w-3/4 md:p-4">
            {coursesStore.isLoadingInstructorSeries ? (
              <div className="flex justify-center items-center h-32">
                <p className="text-gray-500">Loading series...</p>
              </div>
            ) : coursesStore.instructorSeriesError ? (
              <div className="text-center py-8">
                <p className="text-red-500">Error loading series: {coursesStore.instructorSeriesError}</p>
              </div>
            ) : coursesStore.instructorSeries.length > 0 ? (
              <SeriesList
                title={`${instructor.name}的系列课程`}
                series={coursesStore.instructorSeries}
                isAllInstructors={false}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No series found for this instructor.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // All instructors grid view
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">老师实时语音辅导</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {coursesStore.filteredInstructors.map(instructor => (
                <InstructorCard
                  key={instructor.id}
                  instructor={instructor}
                  onClick={() => handleInstructorClick(instructor)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default InstructorPage;
