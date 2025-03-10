import { observer } from 'mobx-react-lite';
import CourseCard from './CourseCard';

const CourseList = observer(({ title, courses }) => {
  // Better mobile optimization
  return (
    <div className="w-full">
      {title && (
        <h2 className="text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4">{title}</h2>
      )}
      
      {/* Adjusted grid for better mobile display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {courses.map((course, index) => (
          <CourseCard key={`${title}-${course.id}-${index}`} course={course} />
        ))}
      </div>
      
      {/* Course count indicator */}
      <div className="mt-3 md:mt-4 text-gray-500 text-xs md:text-sm">
        Showing {courses.length} {courses.length === 1 ? 'course' : 'courses'}
      </div>
    </div>
  );
});

export default CourseList;
