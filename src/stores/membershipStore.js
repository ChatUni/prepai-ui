import clientStore from './clientStore';
import userStore from './userStore';
import { get, remove, save } from '../utils/db';
import EditingStore from './editingStore';
import PageStore from './pageStore';
import ListStore from './listStore';
import { combineStores } from '../utils/storeUtils';
import { t } from './languageStore';
import GroupedListStore from './groupedListStore';

const membershipTypes = [
  { type: "monthly", duration: 30 },
  { type: "annually", duration: 365 },
  { type: "lifetime", duration: -1 },
  { type: "trial", duration: 3 },
]

class MembershipStore {
  selectedType = '';
  isTypeDropdownOpen = false;
  showPurchaseDialog = false;
  selectedMembership = null;
  showWeChatPayDialog = false;
  paymentOrderData = null;
  paymentLoading = false;
  paymentError = null;

  // Upgrade functionality
  upgradeSearchInput = '';
  searchedUsers = [];
  selectedUsers = [];
  isSearchingUsers = false;
  searchError = null;
  selectedProductCategory = 'membership'; // 'membership', 'course', 'exam', 'agent'

  get name() {
    return 'membership';
  }

  get pageTitle() {
    return this.isAdminMode ? t('membership.priceSettings.title') : t('membership.title');
  }

  get searchableFields() {
    return ['name', 'desc'];
  }

  get newItem() {
    return {
      client_id: clientStore.client.id,
      name: '',
      desc: '',
    };
  }

  get validator() {
    return {
      name: 1,
      type: 1,
      price: 1,
      desc: 1,
    }
  }

  get membershipTypes() {
    return membershipTypes.map((x, i) => ({ value: i, label: t(`membership.types.${x.type}`) }));
  }

  get selectedMembershipType() {
    return membershipTypes[this.selectedMembership.type] || membershipTypes[0];
  }

  get editingType() {
    return membershipTypes[this.editingItem.type].type;
  }

  setSelectedType = (type) => {
    this.selectedType = type;
  };

  setTypeDropdownOpen = (open) => {
    this.isTypeDropdownOpen = open;
  };

  getTypeLabel = function(type) {
    return `membership.types.${membershipTypes[type].type}`
  };

  fetchItemList = async function() {
    return await get('memberships', { clientId: clientStore.client.id });
  };
  
  remove = async function(membershipId) {
    await remove('memberships', membershipId);
  };

  save = async function(item) {
    item.price = parseFloat(item.price) || 0;
    item.orig_price = parseFloat(item.orig_price) || 0;
    item.type = parseInt(item.type) || 0;
    return await save('memberships', item);
  };

  isGroupDanger = function(group) {
    return group === t('membership.expired')
  }
  
  setShowPurchaseDialog = function(show) {
    this.showPurchaseDialog = show;
  };

  setSelectedMembership = function(membership) {
    this.selectedMembership = membership;
  };

  showMembershipPurchaseDialog = function(membership) {
    this.selectedMembership = membership;
    this.showPurchaseDialog = true;
  };

  setShowWeChatPayDialog = function(show) {
    this.showWeChatPayDialog = show;
  };

  setPaymentLoading = function(loading) {
    this.paymentLoading = loading;
  };

  setPaymentError = function(error) {
    this.paymentError = error;
  };

  handlePurchase = async function() {
    if (!this.selectedMembership) return;

    try {
      this.setPaymentLoading(true);
      this.setPaymentError(null);
      this.showPurchaseDialog = false;

      // Prepare order data for WeChat Pay
      const orderData = {
        amount: this.selectedMembership.price,
        duration: this.selectedMembershipType.duration,
        body: `${this.selectedMembership.name} - ${t(`membership.types.${this.selectedMembershipType.type}`)}`,
        clientId: clientStore.client.id,
        userId: userStore.user?.id || userStore.user?.phone || 'guest',
        productId: `membership_${this.selectedMembership.id}`,
        detail: this.selectedMembership.desc || '',
        attach: JSON.stringify({
          membershipId: this.selectedMembership.id,
          membershipType: this.selectedMembershipType.type,
          clientId: clientStore.client.id,
          userId: userStore.user?.id || userStore.user?.phone
        })
      };

      this.paymentOrderData = orderData;
      this.showWeChatPayDialog = true;

    } catch (error) {
      console.error('Failed to initiate payment:', error);
      this.setPaymentError(error.message);
    } finally {
      this.setPaymentLoading(false);
    }
  };

  handlePaymentSuccess = async function(paymentData) {
    console.log('Payment successful:', paymentData);
    
    // Close WeChat Pay dialog
    this.showWeChatPayDialog = false;
    this.paymentOrderData = null;
    this.selectedMembership = null;

    await userStore.loadUser();

    // Here you would typically:
    // 1. Update user's membership status
    // 2. Grant access to purchased content
    // 3. Send confirmation
    // 4. Refresh user data
    
    // Update user membership status
    // if (userStore.user && paymentData) {
    //   // Add transaction record to user
    //   if (!userStore.user.transactions) {
    //     userStore.user.transactions = [];
    //   }
      
    //   userStore.user.transactions.push({
    //     type: 'membership',
    //     product_id: this.selectedMembership.id,
    //     membershipType: membershipTypes[this.selectedMembership.type] || 'monthly',
    //     amount: this.selectedMembership.price,
    //     orderId: paymentData.orderId || paymentData.data?.out_trade_no,
    //     transactionId: paymentData.data?.transaction_id,
    //     purchaseDate: new Date().toISOString(),
    //     expiresAt: this.calculateMembershipExpiry(this.selectedMembership.type)
    //   });
      
    //   // Save updated user data
    //   userStore.saveLoginState();
    // }
    
    // Show success message or redirect
    alert(t('payment.success_message'));
  };

  handlePaymentError = function(error) {
    console.error('Payment failed:', error);
    this.setPaymentError(error);
    
    // Keep WeChat Pay dialog open so user can retry
    // Or close it based on your UX preference
    // this.showWeChatPayDialog = false;
  };

  closeWeChatPayDialog = function() {
    this.showWeChatPayDialog = false;
    this.paymentOrderData = null;
    this.selectedMembership = null;
    this.setPaymentError(null);
  };

  // Upgrade functionality methods
  setUpgradeSearchInput = function(input) {
    this.upgradeSearchInput = input;
  };

  setSearchedUsers = function(users) {
    this.searchedUsers = users;
  };

  setSelectedUsers = function(users) {
    this.selectedUsers = users;
  };

  setIsSearchingUsers = function(searching) {
    this.isSearchingUsers = searching;
  };

  setSearchError = function(error) {
    this.searchError = error;
  };

  setSelectedProductCategory = function(category) {
    this.selectedProductCategory = category;
  };

  toggleUserSelection = function(user) {
    const index = this.selectedUsers.findIndex(u => u.id === user.id);
    if (index >= 0) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(user);
    }
  };

  selectAllUsers = function() {
    this.selectedUsers = [...this.searchedUsers];
  };

  deselectAllUsers = function() {
    this.selectedUsers = [];
  };

  get selectedUsersCount() {
    return this.selectedUsers.length;
  };

  get isAllUsersSelected() {
    return this.searchedUsers.length > 0 && this.selectedUsers.length === this.searchedUsers.length;
  };

  searchUsers = async function() {
    if (!this.upgradeSearchInput.trim()) {
      this.setSearchError('Please enter user ID or phone number');
      return;
    }

    try {
      this.setIsSearchingUsers(true);
      this.setSearchError(null);

      // Parse input - split by comma or newline
      const inputs = this.upgradeSearchInput
        .split(/[,\n]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Search for users by ID or phone
      const users = await get('users', {
        clientId: clientStore.client.id,
        searchTerms: inputs
      });

      this.setSearchedUsers(users || []);
      
      if (!users || users.length === 0) {
        this.setSearchError('No users found matching the search criteria');
      } else {
        // Auto-select all found users by default
        this.setSelectedUsers([...users]);
      }

    } catch (error) {
      console.error('Failed to search users:', error);
      this.setSearchError(error.message || 'Failed to search users');
    } finally {
      this.setIsSearchingUsers(false);
    }
  };

  upgradeUsers = async function(membershipId) {
    if (this.selectedUsers.length === 0) {
      throw new Error('No users selected for upgrade');
    }

    if (!membershipId) {
      throw new Error('No membership selected');
    }

    try {
      const upgradeData = {
        userIds: this.selectedUsers.map(u => u.id),
        membershipId: membershipId,
        clientId: clientStore.client.id
      };

      const result = await save('user-upgrades', upgradeData);
      
      // Clear selections after successful upgrade
      this.selectedUsers = [];
      this.searchedUsers = [];
      this.upgradeSearchInput = '';
      
      return result;

    } catch (error) {
      console.error('Failed to upgrade users:', error);
      throw error;
    }
  };

  get productCategories() {
    return [
      { value: 'membership', label: t('membership.upgrade.step3.membershipProducts') },
      { value: 'course', label: t('membership.upgrade.step3.courseProducts') },
      { value: 'exam', label: t('membership.upgrade.step3.examProducts') },
      { value: 'agent', label: t('membership.upgrade.step3.agentProducts') }
    ];
  };
}

export default combineStores(PageStore, ListStore, GroupedListStore, EditingStore, MembershipStore);
