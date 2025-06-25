import React from 'react';
import { observer } from 'mobx-react-lite';
import { t } from '../../stores/languageStore';
import DropdownFilter from './DropdownFilter';
import Button from './Button';
import useClickOutside from '../../hooks/useClickOutside';
import Icon from './Icon';

const SearchBar = observer(({
  store,
  filters = [],
  className = ''
}) => {  
  // Create refs for all dropdowns
  const dropdownRefs = useClickOutside(
    () => {
      filters.forEach(filter => {
        if (filter.onClose) filter.onClose();
      });
    },
    filters.length
  );

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
        <div key={filter.key || index} className="shrink-0">
          <DropdownFilter
            isOpen={filter.isOpen}
            onToggle={filter.onToggle}
            selectedValue={filter.selectedValue}
            displayValue={filter.displayValue}
            items={filter.items}
            onSelect={filter.onSelect}
            dropdownRef={dropdownRefs[index]}
            buttonClassName={filter.buttonClassName || "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium py-2.5 px-4 rounded-lg flex items-center whitespace-nowrap min-w-max text-base justify-between"}
          />
        </div>
      ))}

      {/* Action Buttons - only show in admin mode */}
      {store.isAdminMode && (
        <>
          {store.expandedGroups && (
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