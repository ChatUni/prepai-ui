import { observer } from 'mobx-react-lite';
import Carousel from './Carousel';
import SearchBar from './SearchBar';
import GroupedList from './GroupedList';
import Button from './Button';
import PageTitle from './PageTitle';
import { DeleteConfirmDialog, RestoreConfirmDialog, VisibilityConfirmDialog, EditDialog, ErrorDialog } from './Dialogs';
import { t } from '../../stores/languageStore';

const ListPage = observer(({
  // Banner/Carousel props
  bannerImages = [],
  bannerIntervalDuration = 3000,
  
  filters = [],

  // Shortcut buttons props
  shortcutButtons = [],
  showShortcutButtons = false,
  shortcutButtonsClassName = "grid grid-cols-3 gap-4 mt-8",
  
  // List props
  store,
  renderItem,
  itemsContainerClassName = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 p-2",
  isGrouped,
  onGroupDrop,
  
  // Dialog props (from CardEditDialogs)
  editDialogChildren,
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

  return (
    <div className={containerClassName}>
      {!store.isAdminMode && bannerImages && bannerImages.length > 0 && (
        <Carousel
          images={bannerImages}
          intervalDuration={bannerIntervalDuration}
        />
      )}
      
      <PageTitle title={store.pageTitle} />
      
      <SearchBar store={store} isGrouped={isGrouped} filters={filters} />
      
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
              <Button
                key={button.key || index}
                onClick={button.onClick}
                icon={button.icon}
                color={button.color || 'blue'}
                shade={button.shade}
                disabled={button.disabled}
                className={button.className}
              >
                {button.label}
              </Button>
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