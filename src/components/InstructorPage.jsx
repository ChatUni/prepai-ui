import { observer } from 'mobx-react-lite';
import coursesStore from '../stores/coursesStore';
import uiStore from '../stores/uiStore';
import { useParams, useNavigate } from 'react-router-dom';
import CourseList from './ui/CourseList';
import SearchBar from './ui/SearchBar';

const InstructorCard = ({ instructor, onClick }) => {
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
      <p className="text-gray-600 text-sm text-center mt-2 line-clamp-2">{instructor.description}</p>
    </div>
  );
};

const InstructorPage = observer(() => {
  const { instructorId } = useParams();
  const navigate = useNavigate();
  const instructor = instructorId ? coursesStore.instructors.find(instructor => instructor.id === parseInt(instructorId)) : null;
  
  // If instructorId is provided but instructor not found, show error
  if (instructorId && !instructor) {
    return <div className="p-6 text-center text-red-500">Instructor not found</div>;
  }

  // Get filtered courses based on search keyword and instructor
  const getFilteredCourses = () => {
    const searchKeyword = uiStore.searchKeyword.toLowerCase();
    
    // Start with courses filtered by instructor
    const instructorCourses = instructor
      ? coursesStore.courses.filter(course => course.instructor === instructor.name)
      : coursesStore.courses;
    
    // Then apply search filter
    if (!searchKeyword) {
      return instructorCourses;
    }
    
    return instructorCourses.filter(course =>
      course.title.toLowerCase().includes(searchKeyword) ||
      course.instructor.toLowerCase().includes(searchKeyword)
    );
  };
  
  const coursesToShow = getFilteredCourses();

  // Filter instructors based on search keyword
  const getFilteredInstructors = () => {
    const searchKeyword = uiStore.searchKeyword.toLowerCase();
    
    if (!searchKeyword) {
      return coursesStore.instructors;
    }
    
    return coursesStore.instructors.filter(instructor =>
      instructor.name.toLowerCase().includes(searchKeyword) ||
      instructor.description.toLowerCase().includes(searchKeyword)
    );
  };

  const handleInstructorClick = (selectedInstructor) => {
    uiStore.setSelectedInstructorId(selectedInstructor.id);
    navigate(`/instructor/${selectedInstructor.id}`);
  };

  return (
    <div className="flex flex-col py-4 pb-20 md:pb-6 px-4 md:px-6">
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

          {/* Instructor Courses */}
          <div className="md:w-3/4 md:p-4">
            <CourseList
              title={`${instructor.name}的课程`}
              courses={coursesToShow}
            />
          </div>
        </div>
      ) : (
        // All instructors grid view
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">老师实时语音辅导</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {getFilteredInstructors().map(instructor => (
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
