import { observer } from 'mobx-react-lite';
import instructorStore from '../../stores/instructorStore';
import languageStore from '../../stores/languageStore';
import SearchBar from './SearchBar';

const InstructorSearchBar = observer(() => {
  const { t } = languageStore;

  const handleSearch = (e) => {
    instructorStore.setSearchQuery(e.target.value);
  };

  return (
    <SearchBar
      searchValue={instructorStore.searchQuery}
      onSearchChange={handleSearch}
      searchPlaceholder={t('instructors.search.placeholder')}
      filters={[]}
    />
  );
});

export default InstructorSearchBar;