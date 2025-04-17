import { observer } from 'mobx-react-lite';
import SearchBar from '../ui/SearchBar';
import CourseList from '../ui/CourseList';
import coursesStore from '../../stores/coursesStore';
import uiStore from '../../stores/uiStore';
import InstructorPage from '../InstructorPage';
import ExamPage from '../ExamPage';
import SeriesPage from '../SeriesPage';
import languageStore from '../../stores/languageStore';

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
        
        {/* Loading State */}
        {coursesStore.isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 text-sm md:text-base">Loading courses from database...</p>
            </div>
          </div>
        )}
        
        {/* Error State */}
        {!coursesStore.isLoading && coursesStore.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 md:px-4 md:py-3 rounded relative mb-4 md:mb-6 text-sm md:text-base" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{coursesStore.error}</span>
          </div>
        )}
        
        {/* Content when loaded successfully */}
        {!coursesStore.isLoading && !coursesStore.error && coursesStore.courses.length > 0 && (
          <MainContentCoursesSection />
        )}
        
        {/* No courses found */}
        {!coursesStore.isLoading && !coursesStore.error && coursesStore.courses.length === 0 && (
          <div className="text-center py-8 md:py-12">
            <p className="text-gray-600 text-base md:text-lg">No courses found in the database.</p>
          </div>
        )}
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
