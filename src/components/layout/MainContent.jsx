import { observer } from 'mobx-react-lite';
import SearchBar from '../ui/SearchBar';
import CourseList from '../ui/CourseList';
import coursesStore from '../../stores/coursesStore';
import uiStore from '../../stores/uiStore';
import InstructorPage from '../InstructorPage';
import ExamPage from '../ExamPage';
import SeriesPage from '../SeriesPage';
import languageStore from '../../stores/languageStore';
import LoadingState from '../ui/LoadingState';

const MainContent = observer(() => {
  const { t } = languageStore;
  // Use location to determine what to render
  const location = window.location.pathname;

  // Show appropriate content based on route
  if (location === '/exam') {
    return <ExamPage />;
  } else if (location === '/instructor') {
    return <InstructorPage />;
  } else if (location === '/series' || location.startsWith('/series/')) {
    return <SeriesPage />;
  } else if (location === '/') {
    return (
      <div className="flex-1 p-3 pb-20 sm:p-4 md:p-6 md:pb-6 overflow-y-auto">
        <div className="mb-4 md:mb-6">
          <SearchBar />
        </div>
        
        <LoadingState
          isLoading={coursesStore.isLoading}
          isError={!!coursesStore.error}
          isEmpty={!coursesStore.isLoading && !coursesStore.error && coursesStore.courses.length === 0}
          customMessage={
            coursesStore.isLoading ? "Loading courses from database..." :
            coursesStore.error ? coursesStore.error :
            coursesStore.courses.length === 0 ? "No courses found in the database." :
            null
          }
        >
          <MainContentCoursesSection />
        </LoadingState>
      </div>
    );
  }
  
  // Default to SeriesPage for any unhandled routes
  return <SeriesPage />;
});

const MainContentCoursesSection = observer(() => {
  const { t } = languageStore;
  const location = window.location.pathname;
  
  // Determine content type based on courseTypeFilter
  const typeText = uiStore.courseTypeFilter ? 'Video' : 'Document';
  
  // Get the category text based on route
  let categoryText = 'Courses';
  if (location === '/favorites') {
    categoryText = 'Favorites';
  }
  
  // Construct the title
  const mainTitle = `${typeText} ${categoryText} (${coursesStore.filteredCourses.length})`;
  
  return (
    <>
      {/* All Courses Section */}
      <div className="mb-6 md:mb-8">
        <CourseList title={mainTitle} courses={coursesStore.filteredCourses} />
      </div>
      
      {/* Most Viewed Section */}
      <div className="border-t border-gray-200 pt-4 md:pt-6 mt-6 md:mt-8">
        <CourseList title={t('menu.categories.mostViewed')} courses={coursesStore.popularCourses} />
      </div>
    </>
  );
});

export default MainContent;
