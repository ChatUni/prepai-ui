import { observer } from 'mobx-react-lite';
import uiStore from '../../stores/uiStore';
import coursesStore from '../../stores/coursesStore';
import { useNavigate } from 'react-router-dom';
import languageStore from '../../stores/languageStore';
import useClickOutside from '../../hooks/useClickOutside';
import seriesStore from '../../stores/seriesStore';
import DropdownFilter from './DropdownFilter';

const SearchBar = observer(() => {
  const { t } = languageStore;
  const navigate = useNavigate();
  
  const [instructorDropdownRef, categoryDropdownRef] = useClickOutside(
    () => uiStore.closeAllDropdowns(),
    2
  );

  const handleSearch = (e) => {
    uiStore.setSearchKeyword(e.target.value);
  };

  const handleInstructorFilter = (instructorId) => {
    const parsedId = instructorId === "" ? null : parseInt(instructorId);
    
    // Update UI store and trigger filtering
    uiStore.setSelectedInstructorId(parsedId);
    uiStore.setInstructorDropdownOpen(false);
    
    // Update courses store to trigger series filtering
    coursesStore.selectInstructor(parsedId);
    
    // Only navigate if not on exam or series page
    if (!window.location.pathname.includes('/exam') && !window.location.pathname.includes('/series')) {
      navigate(parsedId ? `/instructor/${parsedId}` : '/');
    }
  };

  const handleCategoryFilter = (category) => {
    // Update both stores to maintain consistency
    uiStore.setActiveCategory(category); // This will also close the dropdowns
  };

  const toggleInstructorDropdown = () => {
    uiStore.setInstructorDropdownOpen(!uiStore.isInstructorDropdownOpen);
  };

  const toggleCategoryDropdown = () => {
    uiStore.setCategoryDropdownOpen(!uiStore.isCategoryDropdownOpen);
  };

  return (
    <div className="flex flex-row items-center w-full max-w-3xl gap-1 sm:gap-2">
      <DropdownFilter
        isOpen={uiStore.isInstructorDropdownOpen}
        onToggle={toggleInstructorDropdown}
        selectedValue={uiStore.selectedInstructorId}
        displayValue={uiStore.selectedInstructorId
          ? coursesStore.instructors.find(i => i.id === uiStore.selectedInstructorId)?.name
          : t('search.allInstructors')}
        items={[
          { id: "", name: t('search.allInstructors') },
          ...coursesStore.instructors
        ]}
        onSelect={handleInstructorFilter}
        dropdownRef={instructorDropdownRef}
      />
      
        <DropdownFilter
          isOpen={uiStore.isCategoryDropdownOpen}
          onToggle={toggleCategoryDropdown}
          selectedValue={uiStore.activeCategory}
          displayValue={uiStore.activeCategory || t('search.allCategories')}
          items={[
            { value: "", label: t('search.allCategories') },
            ...coursesStore.uniqueCategories.map(category => ({
              value: category,
              label: category
            }))
          ]}
          onSelect={handleCategoryFilter}
          dropdownRef={categoryDropdownRef}
        />
      
      <div className="relative flex-1 flex min-w-0">
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
