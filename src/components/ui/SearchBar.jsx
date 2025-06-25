import React from 'react';
import { observer } from 'mobx-react-lite';
import { t } from '../../stores/languageStore';
import DropdownFilter from './DropdownFilter';
import Button from './Button';
import Icon from './Icon';

const SearchBar = observer(({
  store,
  isGrouped = true,
  filters = [],
  className = ''
}) => {

  return (
    <div className={`flex items-center gap-3 mb-6 ${className}`}>
      {/* Search Input */}
      <div className="relative flex-1">
        <div className="absolute top-0 bottom-0 left-0 flex items-center pl-3 pointer-events-none">
          <Icon name="FiSearch" className="w-5 h-5 text-blue-500" />
        </div>
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={t(`${store.name}.search.placeholder`)}
          value={store.searchQuery}
          onChange={(e) => store.setSearchQuery(e.target.value)}
        />
      </div>

      {/* Dropdown filters */}
      {filters.map((filter, index) => (
        <DropdownFilter
          key={filter.key || index}
          selectedValue={filter.selectedValue}
          items={filter.items}
          onSelect={filter.onSelect}
          buttonClassName={filter.buttonClassName || "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium py-2.5 px-4 rounded-lg text-base appearance-none cursor-pointer"}
        />
      ))}

      {/* Action Buttons - only show in admin mode */}
      {store.isAdminMode && (
        <>
          {isGrouped && (
            <div className="shrink-0">
              <Button
                onClick={() => store.openAddGroupDialog()}
                icon="FiPlus"
                color="green"
              >
                {t(`${store.name}.groups.addGroup`)}
              </Button>
            </div>
          )}
          
          <div className="shrink-0">
            <Button
              onClick={() => store.openAddDialog()}
              icon="FiPlus"
              color="blue"
            >
              {t(`${store.name}.createNew`)}
            </Button>
          </div>
        </>
      )}
    </div>
  );
});

export default SearchBar;