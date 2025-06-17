import { observer } from 'mobx-react-lite';
import SeriesSearchBar from './ui/SeriesSearchBar';
import coursesStore from '../stores/coursesStore';
import uiStore from '../stores/uiStore';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import languageStore from '../stores/languageStore';
import LoadingState from './ui/LoadingState';

const ExamPage = observer(() => {
  const navigate = useNavigate();
  const { t } = languageStore;
  
  useEffect(() => {
    coursesStore.fetchCourses();
    uiStore.setActiveNavItem('testing');
    
    return () => {
      uiStore.setActiveNavItem('');
    };
  }, [t]); // Add t as dependency to re-run when language changes

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
        <SeriesSearchBar />
      </div>
      <div className="bg-white rounded-lg shadow flex-1 overflow-hidden">
        <div className="divide-y divide-gray-200 overflow-y-auto h-full">
          <LoadingState
            isLoading={coursesStore.isLoading}
            isEmpty={!coursesStore.isLoading && filteredCourses.length === 0}
            customMessage={
              coursesStore.isLoading ? t('common.loading') :
              filteredCourses.length === 0 ? t('common.no_results') :
              null
            }
          >
            {filteredCourses.map(course => (
              <div
                key={course.id}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleCourseClick(course)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{course.title}</h3>
                    <p className="text-sm text-gray-500">
                      {t('menu.instructor_label')}: {
                        typeof course.instructor === 'string'
                          ? course.instructor
                          : course.instructor?.name || t('menu.categories.unknownInstructor')
                      }
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(course.date_added).toLocaleDateString(t('menu.categories.dateLocale'))}
                  </div>
                </div>
              </div>
            ))}
          </LoadingState>
        </div>
      </div>
    </div>
  );
});

export default ExamPage;