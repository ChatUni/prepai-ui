import { observer } from 'mobx-react-lite';
import SearchBar from './ui/SearchBar';
import coursesStore from '../stores/coursesStore';
import uiStore from '../stores/uiStore';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ExamPage = observer(() => {
  const navigate = useNavigate();
  
  useEffect(() => {
    coursesStore.fetchCourses();
    uiStore.setActiveCategory("考测");
    
    // Cleanup when component unmounts
    return () => {
      uiStore.setActiveCategory("私教"); // Reset to default
    };
  }, []);

  const handleCourseClick = (course) => {
    console.log('Course clicked:', course);
    console.log('Course ID:', course.id);
    console.log('Navigating to:', `/exam/questions/${course.id}`);
    navigate(`/exam/questions/${course.id}`);
  };

  const filteredCourses = coursesStore.filteredCourses;

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8 h-full flex flex-col">
      <div className="mb-8 flex-shrink-0">
        <SearchBar />
      </div>
      <div className="bg-white rounded-lg shadow flex-1 overflow-hidden">
        <div className="divide-y divide-gray-200 overflow-y-auto h-full">
          {filteredCourses.map(course => (
            <div 
              key={course.id} 
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => handleCourseClick(course)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{course.title}</h3>
                  <p className="text-sm text-gray-500">讲师: {course.instructor}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(course.date_added).toLocaleDateString('zh-CN')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default ExamPage;