import { observer } from 'mobx-react-lite';
import assistantsStore from '../../../stores/assistantsStore';
import languageStore from '../../../stores/languageStore';
import SearchBar from '../../ui/SearchBar';

const AssistantSearchBar = observer(() => {
  const { t } = languageStore;

  return (
    <SearchBar
      searchValue={assistantsStore.searchQuery}
      onSearchChange={(e) => assistantsStore.setSearchQuery(e.target.value)}
      searchPlaceholder={t('assistants.search.placeholder')}
      filters={[]}
      isEditMode={assistantsStore.isAdminMode}
      newGroupButton={{
        label: t('assistants.groups.addGroup'),
        onClick: () => assistantsStore.openAddGroupDialog()
      }}
      newItemButton={{
        label: t('menu.admin_page.add_assistant'),
        onClick: () => assistantsStore.handleCreateNew()
      }}
    />
  );
});

export default AssistantSearchBar;