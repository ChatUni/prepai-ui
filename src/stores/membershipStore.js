import clientStore from './clientStore';
import userStore from './userStore';
import { get, post, remove, save } from '../utils/db';
import EditingStore from './editingStore';
import PageStore from './pageStore';
import ListStore from './listStore';
import { combineStores } from '../utils/storeUtils';
import { t } from './languageStore';
import GroupedListStore from './groupedListStore';

class MembershipStore {
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
  selectedProductCategory = 'membership'; // 'membership', 'course', 'exam', 'agent'

  get name() {
    return 'membership';
  }

  get pageTitle() {
    return this.isSettingRoute ? t('membership.priceSettings.title') : t('membership.title');
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
    return Object.keys(durations).map(k => ({ value: k, label: t(`membership.types.${k}`) }));
  }

  fetchItemList = async function() {
    return await get('memberships', { clientId: clientStore.client.id });
  };
  
  remove = async function(membershipId) {
    await remove('memberships', membershipId);
  };

  save = async function(item) {
    item.price = parseFloat(item.price) || 0;
    item.orig_price = parseFloat(item.orig_price) || 0;
    return await save('memberships', item);
  };

  isGroupDanger = function(group) {
    return group === t('membership.expired')
  }
  
  handleItemClick = function(item) {
    if (item.name.includes(t('membership.trial')) && userStore.isTrialUsed) {
      this.openErrorDialog(t('membership.trialMembershipOnlyOnce'));
    } else
      this.showMembershipPurchaseDialog(item);
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
        duration: this.selectedMembership.type,
        body: `${this.selectedMembership.name} - ${this.selectedMembership.type}`,
        clientId: clientStore.client.id,
        userId: userStore.user?.id || userStore.user?.phone || 'guest',
        type: 'membership',
        productId: this.selectedMembership.id,
        detail: this.selectedMembership.desc || '',
        attach: JSON.stringify({
          membershipId: this.selectedMembership.id,
          membershipType: this.selectedMembership.type,
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

    await clientStore.loadClient();
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
    this.openInfoDialog(t('payment.success_message'));
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
      this.openErrorDialog(t('membership.upgrade.errors.emptyInput'));
      return;
    }

    try {
      this.setIsSearchingUsers(true);

      // Parse input - split by comma or newline
      const inputs = this.upgradeSearchInput
        .split(/[,\n]/)
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length > 0);

      // Search for users by ID or phone
      const users = inputs.map(id => userStore.items.find(user => user.id === id || user.phone === id) || { phone: id });

      this.setSearchedUsers(users);
      
      if (!users || users.length === 0) {
        this.openErrorDialog(t('membership.upgrade.errors.noUsersFound'));
      } else {
        // Auto-select all found users by default
        this.setSelectedUsers([...users]);
      }

    } catch (error) {
      console.error('Failed to search users:', error);
      this.openErrorDialog(t('membership.upgrade.errors.searchFailed'));
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
        userIds: this.selectedUsers.filter(u => u.id).map(u => u.id),
        phones: this.selectedUsers.filter(u => !u.id).map(u => u.phone) ,
        membershipId: membershipId,
        clientId: clientStore.client.id
      };

      const result = await post('upgrade', {}, upgradeData);
      
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
