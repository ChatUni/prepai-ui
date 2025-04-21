import { observer } from 'mobx-react-lite';
import instructorsStore from '../../stores/instructorsStore';
import languageStore from '../../stores/languageStore';

const InstructorSearchBar = observer(() => {
  const { t } = languageStore;

  const handleSearch = (e) => {
    instructorsStore.setSearchQuery(e.target.value);
  };

  return (
    <div className="relative w-full max-w-2xl">
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
        placeholder={t('instructors.search.placeholder')}
        value={instructorsStore.searchQuery}
        onChange={handleSearch}
      />
    </div>
  );
});

export default InstructorSearchBar;