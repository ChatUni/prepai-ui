import React from 'react';
import { observer } from 'mobx-react-lite';
import languageStore from '../../stores/languageStore';
import membershipStore from '../../stores/membershipStore';
import DropdownFilter from './DropdownFilter';
import Button from './Button';
import useClickOutside from '../../hooks/useClickOutside';

const MembershipSearchBar = observer(() => {
  const { t } = languageStore;
  
  const [typeDropdownRef] = useClickOutside(
    () => membershipStore.setTypeDropdownOpen(false),
    1
  );

  const handleSearch = (e) => {
    membershipStore.setSearchKeyword(e.target.value);
  };

  const handleTypeFilter = (type) => {
    membershipStore.setSelectedType(type);
    membershipStore.setTypeDropdownOpen(false);
  };

  const toggleTypeDropdown = () => {
    membershipStore.setTypeDropdownOpen(!membershipStore.isTypeDropdownOpen);
  };

  return (
    <div className="flex items-center gap-3 mb-6">
      {/* Search Input */}
      <div className="relative flex-1">
        <div className="absolute top-0 bottom-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg
            className="w-5 h-5 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={t('membership.search.placeholder')}
          value={membershipStore.searchKeyword}
          onChange={handleSearch}
        />
      </div>

      {/* Type Filter Dropdown */}
      <div className="shrink-0">
        <DropdownFilter
          isOpen={membershipStore.isTypeDropdownOpen}
          onToggle={toggleTypeDropdown}
          selectedValue={membershipStore.selectedType}
          displayValue={membershipStore.selectedType
            ? t(membershipStore.membershipTypes.find(type => type.value === membershipStore.selectedType)?.label)
            : t('membership.types.all')}
          items={membershipStore.membershipTypes.map(type => ({
            value: type.value,
            label: t(type.label)
          }))}
          onSelect={handleTypeFilter}
          dropdownRef={typeDropdownRef}
          buttonClassName="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium py-2.5 px-4 rounded-lg flex items-center whitespace-nowrap min-w-max text-base justify-between"
        />
      </div>

      {/* Create New Membership Button */}
      <div className="shrink-0">
        <Button
          onClick={membershipStore.handleCreateNew}
          icon="FiPlus"
          color="blue"
          shade={600}
        >
          {t('membership.createNew')}
        </Button>
      </div>
    </div>
  );
});

export default MembershipSearchBar;