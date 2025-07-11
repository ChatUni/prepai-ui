import React from 'react';
import { observer } from 'mobx-react-lite';
import { t } from '../../stores/languageStore';
import DropdownFilter from './DropdownFilter';
import Button from './Button';
import Icon from './Icon';

const buildFilterItems = (store, filter) => {
  const options = store[filter.optionsField];
  
  return [
    { value: "", label: filter.allLabel },
    ...options.map(option => {
      if (typeof option === 'string') {
        return { value: option, label: option };
      }
      return {
        value: option.id || option.value,
        label: option.name || option.label
      };
    })
  ];
};

const handleFilterSelect = (store, filter, value) => {
  const parsedValue = value === "" ? null : value;
  
  if (filter.onSelect) {
    filter.onSelect(parsedValue);
  } else {
    store[filter.selectedField] = parsedValue;
  }
};

const SearchBar = observer(({
  store,
  isGrouped = true,
  filters = [],
  className = ''
}) => (
  <div className={`flex items-center gap-3 mb-6 ${className}`}>
    {/* Search Input */}
    <div className="relative flex-1">
      <div className="absolute top-0 bottom-0 left-0 flex items-center pl-3 pointer-events-none">
        <Icon name="FiSearch" className="w-5 h-5 text-blue-500" />
      </div>
      <input
        type="text"
        className="w-full pl-10 pr-4 py-2.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder={store ? t(`${store.name}.search.placeholder`) : ''}
        value={store ? store.searchQuery : ''}
        onChange={store ? (e) => store.setSearchQuery(e.target.value) : () => {}}
      />
    </div>

    {/* Dropdown filters */}
    {filters.map((filter, index) => (
      <DropdownFilter
        key={filter.key || index}
        selectedValue={store[filter.selectedField] || ''}
        items={buildFilterItems(store, filter)}
        onSelect={(value) => handleFilterSelect(store, filter, value)}
        buttonClassName={filter.buttonClassName || ""}
      />
    ))}

    {/* Action Buttons - only show in admin mode */}
    {store && store.isAdminMode && (
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
));

export default SearchBar;