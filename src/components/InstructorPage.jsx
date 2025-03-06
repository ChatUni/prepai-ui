import { observer } from 'mobx-react-lite';
import coursesStore from '../stores/coursesStore';
import uiStore from '../stores/uiStore';
import { useParams } from 'react-router-dom';
import CourseCard from './ui/CourseCard';
import SearchBar from './ui/SearchBar';

const InstructorPage = observer(() => {
  const { instructorId } = useParams();
  const instructor = instructorId ? coursesStore.instructors.find(instructor => instructor.id === parseInt(instructorId)) : null;
  
  // If instructorId is provided but instructor not found, show error
  if (instructorId && !instructor) {
    return <div>Instructor not found</div>;
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

  return (
    <div className="flex flex-col py-6 pl-6">
      {/* Filter Bar */}
      <div className="mb-6">
        <SearchBar />
      </div>
      
      <div className="flex flex-col md:flex-row">
        {/* Instructor Information */}
        <div className="md:w-1/4 py-4 pr-4">
          {instructor ? (
            <>
              <img
                src={instructor.image}
                alt={instructor.name}
                className="rounded-full w-32 h-32 mx-auto mb-4"
              />
              <h2 className="text-2xl font-bold text-center mb-2">{instructor.name}</h2>
              <p className="text-gray-600 text-center">{instructor.description}</p>
            </>
          ) : (
            <>
              <div className="rounded-full w-32 h-32 mx-auto mb-4 bg-blue-100 flex items-center justify-center">
                <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-center mb-2">所有老师</h2>
              <p className="text-gray-600 text-center">查看所有课程</p>
            </>
          )}
        </div>

        {/* Instructor Courses */}
        <div className="md:w-3/4 p-4">
          <h3 className="text-xl font-bold mb-4">
            {instructor ? `Courses by ${instructor.name}` : '所有课程'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {coursesToShow.map((course, index) => (
              <CourseCard 
                key={`instructor-${instructor ? instructor.id : 'all'}-${course.id}-${index}`} 
                course={course} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default InstructorPage;
