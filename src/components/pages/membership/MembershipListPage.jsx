import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import languageStore from '../../../stores/languageStore';
import clientStore from '../../../stores/clientStore';
import membershipStore from '../../../stores/membershipStore';
import MembershipCard from './MembershipCard';
import MembershipSearchBar from '../../ui/MembershipSearchBar';
import Dialog from '../../ui/Dialog';
import BackButton from '../../ui/BackButton';

const MembershipListPage = observer(() => {
  const { t } = languageStore;

  useEffect(() => {
    clientStore.loadClient();
  }, []);

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
        
        {/* Search and Filter Bar */}
        <MembershipSearchBar />
        
        {membershipStore.filteredMemberships.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {membershipStore.searchKeyword || membershipStore.selectedType
                ? t('common.no_results')
                : t('membership.noMemberships')
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {membershipStore.filteredMemberships.map((membership, index) => (
              <MembershipCard
                key={membership.id || index}
                membership={membership}
                onEdit={membershipStore.handleEdit}
                onDelete={membershipStore.handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={membershipStore.showDeleteDialog}
        onClose={membershipStore.closeDeleteDialog}
        onConfirm={membershipStore.confirmDelete}
        title={t('membership.delete')}
        isConfirm={true}
      >
        <p>
          {membershipStore.membershipToDelete &&
            t('membership.confirmDelete', { name: membershipStore.membershipToDelete.name })
          }
        </p>
      </Dialog>
    </div>
  );
});

export default MembershipListPage;