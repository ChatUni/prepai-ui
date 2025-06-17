import { observer } from 'mobx-react-lite';
import instructorsStore from '../../stores/instructorsStore';
import languageStore from '../../stores/languageStore';
import SearchBar from './SearchBar';

const InstructorSearchBar = observer(() => {
  const { t } = languageStore;

  const handleSearch = (e) => {
    instructorsStore.setSearchQuery(e.target.value);
  };

  return (
    <SearchBar
      searchValue={instructorsStore.searchQuery}
      onSearchChange={handleSearch}
      searchPlaceholder={t('instructors.search.placeholder')}
      filters={[]}
    />
  );
});

export default InstructorSearchBar;