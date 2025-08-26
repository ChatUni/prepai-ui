import { post } from '../utils/db';
import { t } from './languageStore';
import userStore from './userStore';
import clientStore from './clientStore';
import PageStore from './pageStore';
import { combineStores } from '../utils/storeUtils';
import { makeAutoObservable } from 'mobx';

class PaymentManagerStore {
  showMembershipDialog = false;
  showSeriesDialog = false;
  showRechargeDialog = false;
  showRechargeAmountDialog = false;
  showWeChatDialog = false;
  currentSeries = null;
  orderData = null;
  rechargeAmount = 100;

  constructor() {
    makeAutoObservable(this);
  }

  get name() {
    return 'paymentManager';
  }

  setShowMembershipDialog = (show) => {
    this.showMembershipDialog = show;
  };

  setShowSeriesDialog = (show, series = null) => {
    this.showSeriesDialog = show;
    this.currentSeries = series;
  };

  setShowRechargeDialog = (show) => {
    this.showRechargeDialog = show;
  };

  setShowRechargeAmountDialog = (show) => {
    this.showRechargeAmountDialog = show;
  };

  setShowWeChatDialog = (show, orderData = null) => {
    this.showWeChatDialog = show;
    this.orderData = orderData;
  };

  setRechargeAmount = (amount) => {
    this.rechargeAmount = parseFloat(amount) || 0;
  };

  handleMembershipPurchase = (navigate) => {
    this.showMembershipDialog = false;
    navigate('/memberships');
  };

  handleSeriesPurchase = () => {
    this.showSeriesDialog = false;
    
    if (this.currentSeries) {
      const orderData = {
        userId: userStore.user.id,
        clientId: clientStore.client.id,
        type: 'series',
        productId: this.currentSeries.id,
        body: this.currentSeries.name,
        amount: this.currentSeries.price,
        duration: this.currentSeries.duration
      };
      
      this.setShowWeChatDialog(true, orderData);
    }
  };

  // Recharge functionality
  startRecharge = () => {
    this.showRechargeAmountDialog = true;
  };

  confirmRecharge = () => {
    this.showRechargeAmountDialog = false;
    this.showRechargeDialog = true;
  };

  cancelRecharge = () => {
    this.showRechargeDialog = false;
    this.showRechargeAmountDialog = false;
    this.rechargeAmount = 100;
  };

  proceedWithRecharge = async () => {
    if (this.rechargeAmount < 1) {
      this.openErrorDialog(t('recharge.min_amount'));
      return;
    }

    if (!this.rechargeAmount || isNaN(this.rechargeAmount)) {
      this.openErrorDialog(t('recharge.invalid_amount'));
      return;
    }

    this.showRechargeDialog = false;

    const orderData = {
      amount: this.rechargeAmount,
      body: `${t('recharge.title')} - ¥${this.rechargeAmount}`,
      clientId: clientStore.client.id,
      userId: userStore.user?.id || userStore.user?.phone || 'guest',
      type: 'recharge',
      attach: JSON.stringify({
        type: 'recharge',
        amount: this.rechargeAmount,
        clientId: clientStore.client.id,
        userId: userStore.user?.id || userStore.user?.phone
      })
    };

    this.setShowWeChatDialog(true, orderData);
  };

  handlePaymentSuccess = async (paymentData) => {
    this.setShowWeChatDialog(false);
    
    // Handle recharge success
    if (paymentData.order.type === 'recharge') {
      await clientStore.loadClient();
      this.openInfoDialog(t('recharge.success_message'));
      this.rechargeAmount = 100;
    } else {
      // Handle other payment types
      await userStore.loadUser();
      this.openInfoDialog(t('payment.success_message'));
    }

    this.currentSeries = null;
    this.orderData = null;
  };

  handlePaymentError = (error) => {
    console.error('Payment error:', error);
    // Handle payment error (e.g., show error message)
  };

  closeAllDialogs = () => {
    this.showMembershipDialog = false;
    this.showSeriesDialog = false;
    this.showRechargeDialog = false;
    this.showRechargeAmountDialog = false;
    this.showWeChatDialog = false;
    this.currentSeries = null;
    this.orderData = null;
    this.rechargeAmount = 100;
  };
}

export default new PaymentManagerStore();
//export default combineStores(PageStore, PaymentManagerStore);