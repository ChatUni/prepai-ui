import React from 'react';
import { observer } from 'mobx-react-lite';
import ListPage from '../../ui/ListPage';
import MembershipCard from './MembershipCard';
import { t } from '../../../stores/languageStore';
import membershipStore from '../../../stores/membershipStore';

const GenericMembershipListPage = observer(() => {
  // Define shortcut buttons for membership management
  const shortcutButtons = [
    {
      key: 'addMembership',
      onClick: () => membershipStore.openEditDialog(),
      icon: 'FaPlus',
      color: 'green',
      label: t('membership.addMembership')
    },
    {
      key: 'managePlans',
      onClick: () => membershipStore.openManagePlansDialog(),
      icon: 'FaCog',
      color: 'blue',
      label: t('membership.managePlans')
    }
  ];

  // Define filters for membership list
  const filters = [
    {
      key: 'status',
      isOpen: membershipStore.isStatusFilterOpen,
      onToggle: () => membershipStore.toggleStatusFilter(),
      selectedValue: membershipStore.selectedStatus,
      displayValue: membershipStore.selectedStatus || t('membership.allStatuses'),
      items: [
        { value: '', label: t('membership.allStatuses') },
        { value: 'active', label: t('membership.active') },
        { value: 'expired', label: t('membership.expired') },
        { value: 'pending', label: t('membership.pending') }
      ],
      onSelect: (value) => membershipStore.setStatusFilter(value)
    },
    {
      key: 'type',
      isOpen: membershipStore.isTypeFilterOpen,
      onToggle: () => membershipStore.toggleTypeFilter(),
      selectedValue: membershipStore.selectedType,
      displayValue: membershipStore.selectedType || t('membership.allTypes'),
      items: [
        { value: '', label: t('membership.allTypes') },
        { value: 'premium', label: t('membership.premium') },
        { value: 'basic', label: t('membership.basic') },
        { value: 'trial', label: t('membership.trial') }
      ],
      onSelect: (value) => membershipStore.setTypeFilter(value)
    }
  ];

  // Render item function for memberships
  const renderMembershipItem = (membership, index, group, { moveItem, isEditMode }) => (
    <MembershipCard
      key={`${group}-${membership.id}-${index}`}
      membership={membership}
      index={index}
      group={group}
      moveItem={moveItem}
      isEditMode={isEditMode}
    />
  );

  return (
    <ListPage
      // Banner props - could show promotional banners
      bannerImages={membershipStore.promotionalBanners}
      showBanner={membershipStore.promotionalBanners?.length > 0}
      
      // Title props
      title={t('membership.title')}
      
      // Search bar props
      searchValue={membershipStore.searchValue || ''}
      onSearchChange={(e) => membershipStore.setSearchValue(e.target.value)}
      searchPlaceholder={t('membership.searchPlaceholder')}
      filters={filters}
      
      // Shortcut buttons
      shortcutButtons={shortcutButtons}
      showShortcutButtons={membershipStore.isEditMode}
      
      // Main list props
      groupedItems={membershipStore.groupedMemberships}
      store={membershipStore}
      renderItem={renderMembershipItem}
      isEditMode={membershipStore.isEditMode}
      itemsContainerClassName="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-2"
      isGroupEditable={(group) => membershipStore.isEditMode && group !== t('membership.expired')}
      isGroupDanger={(group) => group === t('membership.expired')}
      onItemMove={membershipStore.moveMembershipInGroup}
      onGroupDrop={() => membershipStore.saveGroupOrder()}
      editGroupTitle={t('membership.editGroup')}
      deleteGroupTitle={t('membership.deleteGroup')}
      itemType="membership"
      
      // Dialog props
      editDialogTitle={t('membership.edit')}
      editDialogChildren={
        // This would be the edit form content for membership
        <div>Membership edit form would go here</div>
      }
      editDialogSize="md"
      showDialogs={true}
    />
  );
});

export default GenericMembershipListPage;