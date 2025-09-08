import { observer } from 'mobx-react-lite';
import Carousel from './Carousel';
import SearchBar from './SearchBar';
import GroupedList from './GroupedList';
import Button from './Button';
import { EditDialog } from './Dialogs';
import SummaryCard from './SummaryCard';
import { t } from '../../stores/languageStore';
import Page from './Page';

const shortcusts = store => [
  {
    label: t(`common.groups.addGroup`),
    icon: 'FiPlus',
    color: 'green',
    onClick: () => store.openAddGroupDialog(),
    isVisible: (s, g) => s.isSettingRoute && g,
  },
  {
    label: t(`${store.name}.createNew`),
    icon: 'FiPlus',
    color: 'blue',
    onClick: () => store.openAddDialog(),
    isVisible: (s, g) => s.isSettingRoute,
    disabled: (s, g) => s.getGroups().length === 0,
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
  itemsContainerClassName = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4",
  isGrouped,
  onGroupDrop,
  
  // Dialog props (from CardEditDialogs)
  editDialogSize = "md",
  showDialogs = true,
  showDialogsOnly = false,
  renderEdit,
  
  // Layout props
  className = "w-full pt-4 space-y-4",
  containerClassName = "",
  
  // Summary card props
  summaryItems = null,
  children
}) => {
  shortcutButtons = [...shortcutButtons, ...shortcusts(store)].filter(b => !b.isVisible || b.isVisible(store, isGrouped));

  return (
    <Page store={store} showDialogsOnly={showDialogsOnly}>
      {!showDialogsOnly && (
        <div className={containerClassName}>
          {!store.isSettingRoute && bannerImages && bannerImages.length > 0 && (
            <Carousel
              images={bannerImages}
              intervalDuration={bannerIntervalDuration}
            />
          )}
                
          {showSearchBar && <SearchBar store={store} filters={filters} />}
          
          {/* {!hasItems && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {store?.searchQuery
                  ? t('common.no_results')
                  : t(`${store.name}.noItems`)
                }
              </p>
            </div>
          )} */}
          
          <div className={className}>
            {/* Shortcut Buttons */}
            {showShortcutButtons && shortcutButtons.length > 0 && (
              <div className={shortcutButtonsClassName}>
                {shortcutButtons.map((button, index) => (
                  <div className="grow-1" key={index}>
                    <Button
                      key={button.key || index}
                      onClick={button.onClick}
                      icon={button.icon}
                      color={button.color || 'blue'}
                      disabled={button.disabled && button.disabled(store)}
                      className={button.className || 'w-full'}
                    >
                      {button.label}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {summaryItems && <SummaryCard>{summaryItems}</SummaryCard>}

            <GroupedList
              isGrouped={isGrouped}
              groupedItems={store.groupedItems}
              store={store}
              isEditMode={store.isSettingRoute}
              itemsContainerClassName={itemsContainerClassName}
              onItemMove={(group, fromIndex, toIndex) => store?.moveItemInGroup(group, fromIndex, toIndex)}
              onGroupDrop={onGroupDrop}
              editGroupTitle={t(`common.groups.editGroup`)}
              deleteGroupTitle={t(`common.groups.deleteGroup`)}
              itemType={store.name}
              renderItem={renderItem}
            />
          </div>
        </div>
      )}
      {showDialogs && (
        <EditDialog store={store} size={editDialogSize} renderEdit={renderEdit} />
      )}        
    </Page>
  );
});

export default ListPage;