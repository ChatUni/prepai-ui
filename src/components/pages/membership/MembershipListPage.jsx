import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import languageStore from '../../../stores/languageStore';
import clientStore from '../../../stores/clientStore';
import membershipStore from '../../../stores/membershipStore';
import MembershipCard from './MembershipCard';
import MembershipSearchBar from '../../ui/MembershipSearchBar';
import ListPage from '../../ui/ListPage';
import EditMembershipPage from './EditMembershipPage';

const MembershipListPage = observer(() => {
  const { t } = languageStore;

  // Transform memberships into grouped format for ListPage
  const groupedMemberships = {
    [t('membership.priceSettings.title')]: membershipStore.filteredMemberships
  };

  const renderMembershipCard = (membership, index) => (
    <MembershipCard
      key={membership.id || index}
      membership={membership}
      index={index}
      moveMembership={membershipStore.moveMembership}
      isDraggable={true}
    />
  );

  return (
    <div className="flex flex-col bg-gray-100 w-full max-w-6xl mx-auto">
      <div className="bg-white p-4">
        {/* Description Box */}
        <div className="bg-white text-gray-800 p-6 rounded-lg mb-6 border border-gray-200">
          <h1 className="text-2xl font-semibold mb-3">{t('membership.priceSettings.title')}</h1>
          <p className="text-gray-600 leading-relaxed">
            {t('membership.priceSettings.description')}
          </p>
        </div>
        
        {/* Custom Search Bar */}
        <div className="mb-6">
          <MembershipSearchBar />
        </div>
        
        <ListPage
          // List props
          groupedItems={groupedMemberships}
          store={membershipStore}
          renderItem={renderMembershipCard}
          itemsContainerClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          itemType="membership"
          
          // Dialog props
          editDialogTitle={membershipStore.isEditMode ? t('membership.edit') : t('membership.createNew')}
          editDialogChildren={<EditMembershipPage />}
          editDialogSize="md"
          
          // Layout props
          showBanner={false}
          className="w-full"
          containerClassName=""
        />
      </div>
    </div>
  );
});

export default MembershipListPage;