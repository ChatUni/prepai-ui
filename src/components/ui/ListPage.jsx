import { observer } from 'mobx-react-lite';
import Carousel from './Carousel';
import SearchBar from './SearchBar';
import GroupedList from './GroupedList';
import Button from './Button';
import PageTitle from './PageTitle';
import { DeleteConfirmDialog, RestoreConfirmDialog, VisibilityConfirmDialog, EditDialog, ErrorDialog } from './Dialogs';
import { t } from '../../stores/languageStore';

const shortcusts = store => [
  {
    label: t(`${store.name}.groups.addGroup`),
    icon: 'FiPlus',
    color: 'green',
    onClick: () => store.openAddGroupDialog(),
    isVisible: (s, g) => s.isAdminMode && g,
  },
  {
    label: t(`${store.name}.createNew`),
    icon: 'FiPlus',
    color: 'blue',
    onClick: () => store.openAddDialog(),
    isVisible: (s, g) => s.isAdminMode,
  },
]

const ListPage = observer(({
  // Banner/Carousel props
  bannerImages = [],
  bannerIntervalDuration = 3000,
  
  showSearchBar = true,
  filters = [],

  // Shortcut buttons props
  shortcutButtons = [],
  showShortcutButtons = true,
  shortcutButtonsClassName = "flex justify-center gap-2",
  
  // List props
  store,
  renderItem,
  itemsContainerClassName = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 p-2",
  isGrouped,
  onGroupDrop,
  
  // Dialog props (from CardEditDialogs)
  editDialogSize = "md",
  showDialogs = true,
  renderEdit,
  
  // Layout props
  className = "w-full space-y-4",
  containerClassName = ""
}) => {  
  // Check if there are any items to display
  const hasItems = (store?.groupedItems && Object.keys(store.groupedItems).length > 0) ||
                   (store?.items && store.items.length > 0);
  const renderMainGroups = store?.groupedItems &&
                           (Array.isArray(store.groupedItems)
                            ? store.groupedItems.length > 0
                            : Object.keys(store.groupedItems).length > 0);
  shortcutButtons = [...shortcutButtons, ...shortcusts(store)].filter(b => !b.isVisible || b.isVisible(store, isGrouped));


  return (
    <div className={containerClassName}>
      {!store.isAdminMode && bannerImages && bannerImages.length > 0 && (
        <Carousel
          images={bannerImages}
          intervalDuration={bannerIntervalDuration}
        />
      )}
      
      <PageTitle title={store.pageTitle} />
      
      {showSearchBar && <SearchBar store={store} filters={filters} />}
      
      {!hasItems && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {store?.searchQuery
              ? t('common.no_results')
              : t(`${store.name}.noItems`)
            }
          </p>
        </div>
      )}
      
      <div className={className}>
        {/* Shortcut Buttons */}
        {showShortcutButtons && shortcutButtons.length > 0 && (
          <div className={shortcutButtonsClassName}>
            {shortcutButtons.map((button, index) => (
              <div className="grow-1">
                <Button
                  key={button.key || index}
                  onClick={button.onClick}
                  icon={button.icon}
                  color={button.color || 'blue'}
                  disabled={button.disabled}
                  className={button.className || 'w-full'}
                >
                  {button.label}
                </Button>
              </div>
            ))}
          </div>
        )}

        {renderMainGroups && (
          <GroupedList
            isGrouped={isGrouped}
            groupedItems={store.groupedItems}
            store={store}
            isEditMode={store.isAdminMode}
            itemsContainerClassName={itemsContainerClassName}
            onItemMove={(group, fromIndex, toIndex) => store?.moveItemInGroup(group, fromIndex, toIndex)}
            onGroupDrop={onGroupDrop}
            editGroupTitle={t(`${store.name}.groups.editGroup`)}
            deleteGroupTitle={t(`${store.name}.groups.deleteGroup`)}
            itemType={store.name}
            renderItem={renderItem}
          />
        )}
      </div>

      {showDialogs && (
        <>
          <DeleteConfirmDialog store={store} />
          <RestoreConfirmDialog store={store} />
          <VisibilityConfirmDialog store={store} />
          <EditDialog store={store} size={editDialogSize} renderEdit={renderEdit} />
        </>
      )}
      
      <ErrorDialog store={store} />
    </div>
  );
});

export default ListPage;