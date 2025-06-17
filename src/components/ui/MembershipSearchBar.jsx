import React from 'react';
import { observer } from 'mobx-react-lite';
import languageStore from '../../stores/languageStore';
import membershipStore from '../../stores/membershipStore';
import SearchBar from './SearchBar';

const MembershipSearchBar = observer(() => {
  const { t } = languageStore;

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

  const filters = [
    {
      key: 'type',
      isOpen: membershipStore.isTypeDropdownOpen,
      onToggle: toggleTypeDropdown,
      onClose: () => membershipStore.setTypeDropdownOpen(false),
      selectedValue: membershipStore.selectedType,
      displayValue: membershipStore.selectedType
        ? t(membershipStore.membershipTypes.find(type => type.value === membershipStore.selectedType)?.label)
        : t('membership.types.all'),
      items: membershipStore.membershipTypes.map(type => ({
        value: type.value,
        label: t(type.label)
      })),
      onSelect: handleTypeFilter
    }
  ];

  const newItemButton = {
    onClick: membershipStore.handleCreateNew,
    icon: "FiPlus",
    color: "blue",
    shade: 600,
    label: t('membership.createNew')
  };

  return (
    <SearchBar
      searchValue={membershipStore.searchKeyword}
      onSearchChange={handleSearch}
      searchPlaceholder={t('membership.search.placeholder')}
      filters={filters}
      isEditMode={true}
      newItemButton={newItemButton}
    />
  );
});

export default MembershipSearchBar;