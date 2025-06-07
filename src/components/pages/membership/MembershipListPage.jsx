import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import languageStore from '../../../stores/languageStore';
import clientStore from '../../../stores/clientStore';
import MembershipCard from './MembershipCard';
import Dialog from '../../ui/Dialog';
import BackButton from '../../ui/BackButton';

const MembershipListPage = observer(() => {
  const { t } = languageStore;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [membershipToDelete, setMembershipToDelete] = useState(null);

  useEffect(() => {
    clientStore.loadClient();
  }, []);

  const handleEdit = (membership) => {
    // TODO: Navigate to edit membership page
    console.log('Edit membership:', membership);
  };

  const handleDelete = (membership) => {
    setMembershipToDelete(membership);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (membershipToDelete) {
      // TODO: Implement delete functionality
      console.log('Delete membership:', membershipToDelete);
      setShowDeleteDialog(false);
      setMembershipToDelete(null);
    }
  };

  const closeDeleteDialog = () => {
    setShowDeleteDialog(false);
    setMembershipToDelete(null);
  };

  const memberships = clientStore.client.memberships || [];

  return (
    <div className="flex flex-col bg-gray-100 w-full max-w-6xl mx-auto">
      <div className="bg-white p-4">
        <h1 className="text-2xl font-semibold">{t('membership.title')}</h1>
        {memberships.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">{t('membership.noMemberships')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memberships.map((membership, index) => (
              <MembershipCard
                key={membership.id || index}
                membership={membership}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={showDeleteDialog}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        title={t('membership.delete')}
        isConfirm={true}
      >
        <p>
          {membershipToDelete && 
            t('membership.confirmDelete', { name: membershipToDelete.name })
          }
        </p>
      </Dialog>
    </div>
  );
});

export default MembershipListPage;