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
  // Show exam page when in exam mode
  if (uiStore.activeNavItem === t('menu.categories.testing')) {
    return <ExamPage />;
  }
  
  // Check if we're in a specific course category (video or document)
  const isVideoCourseCategory = uiStore.activeCategory.includes(t('menu.categories.video'));
  const isDocCourseCategory = uiStore.activeCategory.includes(t('menu.categories.document'));
  
  // If we're in a specific course category view, show the original course content
  if (isVideoCourseCategory || isDocCourseCategory) {
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
  
  // Otherwise, show the SeriesPage as the home page
  return <SeriesPage />;
});

const MainContentCoursesSection = observer(() => {
  const { t } = languageStore;
  
  // Determine if we're in video or document mode
  const isVideoMode = uiStore.activeCategory.includes(t('menu.categories.video'));
  
  // Get the type text
  const typeText = isVideoMode ? 'Video' : 'Document';
  
  // Get the category text
  let categoryText = 'Courses';
  if (uiStore.activeCategory.includes(t('menu.categories.recommended'))) {
    categoryText = 'Recommended';
  } else if (uiStore.activeCategory.includes(t('menu.categories.favorites'))) {
    categoryText = 'Favorites';
  } else if (uiStore.activeCategory.includes(t('menu.categories.playHistory'))) {
    categoryText = 'Play History';
  }
  
  // Construct the title directly
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
