import { observer } from 'mobx-react-lite';
import SearchBar from '../ui/SearchBar';
import CourseList from '../ui/CourseList';
import coursesStore from '../../stores/coursesStore';
import uiStore from '../../stores/uiStore';
import InstructorPage from '../InstructorPage';
import ExamPage from '../ExamPage';

const MainContent = observer(() => {
  // Show exam page when in exam mode
  if (uiStore.activeNavItem === '考测') {
    return <ExamPage />;
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="mb-6">
        <SearchBar />
      </div>
      
      {/* Loading State */}
      {coursesStore.isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading courses from database...</p>
          </div>
        </div>
      )}
      
      {/* Error State */}
      {!coursesStore.isLoading && coursesStore.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
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
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No courses found in the database.</p>
        </div>
      )}
    </div>
  );
});

const MainContentCoursesSection = observer(() => {
  // Determine course type (video vs document)
  const courseType = uiStore.courseTypeFilter ? '视频' : '文档';
  
  // Determine the title based on the active category
  let mainTitle = `${courseType}课程 (${coursesStore.filteredCourses.length})`;
  
  // Change the title based on active category
  if (uiStore.activeCategory.includes('推荐')) {
    mainTitle = `${courseType}推荐 (${coursesStore.filteredCourses.length})`;
  } else if (uiStore.activeCategory.includes('收藏')) {
    mainTitle = `${courseType}收藏 (${coursesStore.filteredCourses.length})`;
  } else if (uiStore.activeCategory.includes('历史')) {
    mainTitle = `${courseType}播放历史 (${coursesStore.filteredCourses.length})`;
  }
  
  return (
    <>
      {/* All Courses Section */}
      <div className="mb-8">
        <CourseList title={mainTitle} courses={coursesStore.filteredCourses} />
      </div>
      
      {/* Most Viewed Section */}
      <div className="border-t border-gray-200 pt-6 mt-8">
        <CourseList title="最多人看" courses={coursesStore.popularCourses} />
      </div>
    </>
  );
});

export default MainContent;
