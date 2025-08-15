import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { t } from '../../../stores/languageStore';
import membershipStore from '../../../stores/membershipStore';
import userStore from '../../../stores/userStore';
import MembershipCard from './MembershipCard';
import Button from '../../ui/Button';
import { FiUpload, FiSearch, FiCheck } from 'react-icons/fi';

const Upgrade = observer(() => {
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const handleSearchUsers = async () => {
    await membershipStore.searchUsers();
  };

  const handleUpgradeUsers = async () => {
    if (membershipStore.selectedUsers.length === 0) {
      alert('Please select users to upgrade');
      return;
    }

    if (!membershipStore.selectedMembershipForUpgrade) {
      alert('Please select a membership plan');
      return;
    }

    try {
      setUpgradeLoading(true);
      await membershipStore.upgradeUsers(membershipStore.selectedMembershipForUpgrade.id);
      alert('Users upgraded successfully!');
    } catch (error) {
      alert(`Failed to upgrade users: ${error.message}`);
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleMembershipSelect = (membership) => {
    membershipStore.setSelectedMembershipForUpgrade(membership);
  };


  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8 mb-8">
        
        {/* Step 1: Input User Information */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
            <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
            {t('membership.upgrade.step1.title')}
          </h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {t('membership.upgrade.step1.memberIdOrPhone')}
            </label>
            <textarea
              value={membershipStore.upgradeSearchInput}
              onChange={(e) => membershipStore.setUpgradeSearchInput(e.target.value)}
              className="w-full h-32 px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder=""
            />
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleSearchUsers}
              disabled={membershipStore.isSearchingUsers}
              className="flex w-full items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FiSearch className="w-4 h-4" />
              {membershipStore.isSearchingUsers ? t('common.loading') : t('membership.upgrade.step1.searchUsers')}
            </Button>
          </div>

          {membershipStore.searchError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              {membershipStore.searchError}
            </div>
          )}
        </div>

        {/* Step 2: Select Users */}
        {/* {membershipStore.searchedUsers.length > 0 && ( */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
                {t('membership.upgrade.step2.title')}
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {t('membership.upgrade.step2.selectedCount', { count: membershipStore.selectedUsersCount })}
                </span>
                {/* <Button
                  variant="secondary"
                  size="sm"
                  onClick={membershipStore.isAllUsersSelected ? membershipStore.deselectAllUsers : membershipStore.selectAllUsers}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                >
                  {membershipStore.isAllUsersSelected ? t('membership.upgrade.step2.selectAll') : t('membership.upgrade.step2.selectAll')}
                </Button> */}
              </div>
            </div>

            {/* User List Header */}
            <div className="grid grid-cols-12 gap-4 mb-4 text-sm font-medium text-gray-600 border-b border-gray-200 pb-2">
              <div className="col-span-4">{t('membership.upgrade.step2.userInfo')}</div>
              <div className="col-span-4">{t('membership.upgrade.step2.registrationStatus')}</div>
              <div className="col-span-4">{t('membership.upgrade.step2.registrationTime')}</div>
            </div>

            {/* User List */}
            <div className="space-y-3">
              {membershipStore.searchedUsers.map((user) => {
                const isSelected = membershipStore.selectedUsers.some(u => u.id === user.id);
                return (
                  <div
                    key={user.id}
                    className={`grid grid-cols-12 gap-4 p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 border border-blue-300' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => membershipStore.toggleUserSelection(user)}
                  >
                    {/* <div className="col-span-1 flex items-center">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-400'
                      }`}>
                        {isSelected && <FiCheck className="w-3 h-3 text-white" />}
                      </div>
                    </div> */}
                    <div className="col-span-4">
                      <div className="font-medium text-gray-900">{userStore.getUserName(user)}</div>
                      <div className="text-sm text-gray-600">ID: {user.id}</div>
                    </div>
                    <div className="col-span-4">
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        {t('membership.upgrade.step2.registered')}
                      </span>
                    </div>
                    <div className="col-span-4 text-sm text-gray-600">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '7/22/2025'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        {/* )} */}

        {/* Step 3: Select Products */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">3</span>
            {t('membership.upgrade.step3.title')}
          </h2>

          {/* Product Category Tabs */}
          {/* <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
            {membershipStore.productCategories.map((category) => (
              <button
                key={category.value}
                onClick={() => membershipStore.setSelectedProductCategory(category.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  membershipStore.selectedProductCategory === category.value
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div> */}

          {/* Membership Products */}
          {membershipStore.selectedProductCategory === 'membership' && (
            <div className="grid grid-cols-1 gap-6">
              {membershipStore.items.map((membership) => {
                const isSelected = membershipStore.selectedMembershipForUpgrade?.id === membership.id;
                return (
                  <div
                    key={membership.id}
                    className={`relative cursor-pointer transition-all duration-200 rounded-lg ${
                      isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                    }`}
                    onClick={() => handleMembershipSelect(membership)}
                  >
                    <MembershipCard
                      membership={membership}
                      onClick={() => handleMembershipSelect(membership)}
                    />
                    {isSelected && (
                      <div className="absolute top-4 right-4">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <FiCheck className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Other product categories can be added here */}
          {membershipStore.selectedProductCategory !== 'membership' && (
            <div className="text-center py-12 text-gray-500">
              <p>Products for {membershipStore.productCategories.find(c => c.value === membershipStore.selectedProductCategory)?.label} coming soon...</p>
            </div>
          )}
        </div>
      </div>

      <div className="pb-18"></div>

      {/* Sticky Bottom Confirm Button */}
      <div className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <Button
            onClick={handleUpgradeUsers}
            disabled={upgradeLoading || !(membershipStore.selectedUsers.length > 0 && membershipStore.selectedMembershipForUpgrade)}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-lg font-medium transition-colors"
          >
            {upgradeLoading
              ? t('common.loading')
              : (membershipStore.selectedUsers.length > 0 && membershipStore.selectedMembershipForUpgrade)
                ? `为${membershipStore.selectedUsers.length}位用户开通${membershipStore.selectedMembershipForUpgrade.name}`
                : '请选择用户和产品'
            }
          </Button>
        </div>
      </div>
    </div>
  );
});

export default Upgrade;