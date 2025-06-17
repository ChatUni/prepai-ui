import { observer } from 'mobx-react-lite';
import assistantsStore from '../../../stores/assistantsStore';
import languageStore from '../../../stores/languageStore';
import SearchBar from '../../ui/SearchBar';

const AssistantSearchBar = observer(() => {
  const { t } = languageStore;

  const handleSearch = (e) => {
    assistantsStore.setSearchQuery(e.target.value);
  };

  return (
    <SearchBar
      searchValue={assistantsStore.searchQuery}
      onSearchChange={handleSearch}
      searchPlaceholder={t('assistants.search.placeholder')}
      filters={[]}
    />
  );
});

export default AssistantSearchBar;