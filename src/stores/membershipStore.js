import { makeAutoObservable } from 'mobx';
import clientStore from './clientStore';
import userStore from './userStore';
import { get, remove, save } from '../utils/db';
import EditingStore from './editingStore';
import PageStore from './pageStore';
import ListStore from './listStore';
import { combineStores } from '../utils/storeUtils';
import { t } from './languageStore';
import GroupedListStore from './groupedListStore';
import { createWeChatPayOrder } from '../utils/wechatPayHelper';

const membershipTypes = [
  "all",
  "monthly",
  "annually",
  "lifetime",
  "trial"
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

  get membershipTypes() {
    return membershipTypes.map(x => ({ value: x, label: `membership.types.${x}` }));
  }

  get editingType() {
    return membershipTypes[this.editingMembership.type];
  }

  setSelectedType = (type) => {
    this.selectedType = type;
  };

  setTypeDropdownOpen = (open) => {
    this.isTypeDropdownOpen = open;
  };

  getTypeLabel = function(type) {
    return `membership.types.${membershipTypes[type]}`
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
    await save('memberships', item);
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
        body: `${this.selectedMembership.name} - ${t(`membership.types.${membershipTypes[this.selectedMembership.type] || 'monthly'}`)}`,
        userId: userStore.user?.id || userStore.user?.phoneNumber || 'guest',
        productId: `membership_${this.selectedMembership.id}`,
        detail: this.selectedMembership.desc || '',
        attach: JSON.stringify({
          membershipId: this.selectedMembership.id,
          membershipType: membershipTypes[this.selectedMembership.type] || 'monthly',
          clientId: clientStore.client.id,
          userId: userStore.user?.id || userStore.user?.phoneNumber
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

  handlePaymentSuccess = function(paymentData) {
    console.log('Payment successful:', paymentData);
    
    // Close WeChat Pay dialog
    this.showWeChatPayDialog = false;
    this.paymentOrderData = null;
    this.selectedMembership = null;
    
    // Here you would typically:
    // 1. Update user's membership status
    // 2. Grant access to purchased content
    // 3. Send confirmation
    // 4. Refresh user data
    
    // Update user membership status
    if (userStore.user && paymentData) {
      // Add transaction record to user
      if (!userStore.user.transactions) {
        userStore.user.transactions = [];
      }
      
      userStore.user.transactions.push({
        type: 'membership',
        product_id: this.selectedMembership.id,
        membershipType: membershipTypes[this.selectedMembership.type] || 'monthly',
        amount: this.selectedMembership.price,
        orderId: paymentData.orderId || paymentData.data?.out_trade_no,
        transactionId: paymentData.data?.transaction_id,
        purchaseDate: new Date().toISOString(),
        expiresAt: this.calculateMembershipExpiry(this.selectedMembership.type)
      });
      
      // Save updated user data
      userStore.saveLoginState();
    }
    
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

  calculateMembershipExpiry = function(membershipType) {
    const now = new Date();
    const type = membershipTypes[membershipType] || 'monthly';
    
    switch (type) {
      case 'monthly':
        return new Date(now.setMonth(now.getMonth() + 1)).toISOString();
      case 'annually':
        return new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
      case 'lifetime':
        return new Date(now.setFullYear(now.getFullYear() + 100)).toISOString(); // 100 years from now
      case 'trial':
        return new Date(now.setDate(now.getDate() + 7)).toISOString(); // 7 days trial
      default:
        return new Date(now.setMonth(now.getMonth() + 1)).toISOString();
    }
  };

  closeWeChatPayDialog = function() {
    this.showWeChatPayDialog = false;
    this.paymentOrderData = null;
    this.selectedMembership = null;
    this.setPaymentError(null);
  };
}

// const listPageStore = new ListPageStore();
// const groupedListStore = new GroupedListStore();
// const editingStore = new EditingStore();
// const membershipStore = new MembershipStore();
// export default combineStores(listPageStore, groupedListStore, editingStore, membershipStore);
export default combineStores(PageStore, ListStore, GroupedListStore, EditingStore, MembershipStore);

// Filter by type
// if (this.selectedType) {
//   filtered = filtered.filter(membership =>
//     this.selectedType === 'all' || membershipTypes[membership.type] === this.selectedType
//   );
// }
