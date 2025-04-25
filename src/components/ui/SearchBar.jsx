import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import uiStore from '../../stores/uiStore';
import coursesStore from '../../stores/coursesStore';
import { useNavigate } from 'react-router-dom';
import languageStore from '../../stores/languageStore';

const SearchBar = observer(() => {
  const { t } = languageStore;
  const navigate = useNavigate();
  const [isInstructorDropdownOpen, setIsInstructorDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const handleSearch = (e) => {
    uiStore.setSearchKeyword(e.target.value);
  };

  const handleInstructorFilter = (instructorId) => {
    const parsedId = instructorId === "" ? null : parseInt(instructorId);
    uiStore.setSelectedInstructorId(parsedId);
    setIsInstructorDropdownOpen(false);
    
    // Only navigate if not on exam or series page
    if (!window.location.pathname.includes('/exam') && !window.location.pathname.includes('/series')) {
      navigate(parsedId ? `/instructor/${parsedId}` : '/');
    }
  };

  const handleCategoryFilter = (category) => {
    uiStore.setActiveCategory(category);
    setIsCategoryDropdownOpen(false);
  };

  const toggleInstructorDropdown = () => {
    setIsInstructorDropdownOpen(!isInstructorDropdownOpen);
    setIsCategoryDropdownOpen(false);
  };

  const toggleCategoryDropdown = () => {
    setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
    setIsInstructorDropdownOpen(false);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center w-full max-w-3xl gap-2 sm:gap-0">
      <div className="relative w-full sm:w-auto sm:mr-2 mb-2 sm:mb-0">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1.5 sm:py-2 px-3 sm:px-4 rounded-l flex items-center whitespace-nowrap min-w-max text-sm sm:text-base w-full sm:w-auto justify-between"
          onClick={toggleInstructorDropdown}
        >
          <span className="truncate max-w-[200px]">
            {uiStore.selectedInstructorId
              ? coursesStore.instructors.find(i => i.id === uiStore.selectedInstructorId)?.name
              : t('search.allInstructors')}
          </span>
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={isInstructorDropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
            />
          </svg>
        </button>
        
        {isInstructorDropdownOpen && (
          <div className="absolute z-10 mt-1 w-full sm:min-w-full bg-white rounded-md shadow-lg">
            <ul className="py-1 max-h-60 overflow-y-auto">
              <li
                className={`px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-blue-100 cursor-pointer text-sm sm:text-base ${!uiStore.selectedInstructorId ? 'bg-blue-50' : ''}`}
                onClick={() => handleInstructorFilter("")}
              >
                {t('search.allInstructors')}
              </li>
              {coursesStore.instructors.map(instructor => (
                <li
                  key={instructor.id}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-blue-100 cursor-pointer text-sm sm:text-base ${uiStore.selectedInstructorId === instructor.id ? 'bg-blue-50' : ''}`}
                  onClick={() => handleInstructorFilter(instructor.id)}
                >
                  {instructor.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="relative w-full sm:w-auto sm:mr-2 mb-2 sm:mb-0">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1.5 sm:py-2 px-3 sm:px-4 rounded-r flex items-center whitespace-nowrap min-w-max text-sm sm:text-base w-full sm:w-auto justify-between"
          onClick={toggleCategoryDropdown}
        >
          <span className="truncate max-w-[200px]">
            {uiStore.activeCategory || t('search.allCategories')}
          </span>
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={isCategoryDropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
            />
          </svg>
        </button>
        
        {isCategoryDropdownOpen && (
          <div className="absolute z-10 mt-1 w-full sm:min-w-full bg-white rounded-md shadow-lg">
            <ul className="py-1 max-h-60 overflow-y-auto">
              <li
                className={`px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-blue-100 cursor-pointer text-sm sm:text-base ${!uiStore.activeCategory ? 'bg-blue-50' : ''}`}
                onClick={() => handleCategoryFilter("")}
              >
                {t('search.allCategories')}
              </li>
              {coursesStore.uniqueCategories.map(category => (
                <li
                  key={category}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-blue-100 cursor-pointer text-sm sm:text-base ${uiStore.activeCategory === category ? 'bg-blue-50' : ''}`}
                  onClick={() => handleCategoryFilter(category)}
                >
                  {category}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="relative w-full flex">
        <div className="absolute top-0 bottom-0 left-0 flex items-center pl-2 sm:pl-3 pointer-events-none">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-full focus:outline-none"
          placeholder={t('search.searchPlaceholder')}
          value={uiStore.searchKeyword}
          onChange={handleSearch}
        />
      </div>
    </div>
  );
});

export default SearchBar;
