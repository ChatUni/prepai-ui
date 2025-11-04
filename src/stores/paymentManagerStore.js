import { post } from '../utils/db';
import { t } from './languageStore';
import userStore from './userStore';
import clientStore from './clientStore';
import PageStore from './pageStore';
import { combineStores } from '../utils/storeUtils';
import { makeAutoObservable } from 'mobx';
import EditingStore from './editingStore';

const defaultRechargeAmount = 500;

class PaymentManagerStore {
  showMembershipDialog = false;
  showSeriesDialog = false;
  showRechargeDialog = false;
  showRechargeAmountDialog = false;
  showWeChatDialog = false;
  memberContent = null;
  currentSeries = null;
  orderData = null;
  rechargeAmount = defaultRechargeAmount;
  transactionMode = 'recharge'; // 'recharge' or 'withdraw'
  bankAccount = '';
  userName = '';
  bankName = '';

  // constructor() {
  //   makeAutoObservable(this);
  // }

  get name() {
    return 'paymentManager';
  }

  get isCRUD() {
    return false;
  }

  get isWithdrawMode() {
    return this.transactionMode === 'withdraw';
  }

  get isRechargeMode() {
    return this.transactionMode === 'recharge';
  }

  get validator() {
    return {
      rechargeAmount: 1,
      userName: () => this.isWithdrawMode && this.userName.trim() === '' ? t('withdraw.user_name_required') : null,
      bankName: () => this.isWithdrawMode && this.bankName.trim() === '' ? t('withdraw.bank_name_required') : null,
      bankAccount: () => this.isWithdrawMode && this.bankAccount.trim() === '' ? t('withdraw.bank_account_required') : null,
    };
  }

  setShowMembershipDialog = function(show, item, content) {
    this.showMembershipDialog = show;
    this.editingItem = show ? item : null;
    this.memberContent = show ? content : null;
  };

  setShowSeriesDialog = function(show, series = null) {
    this.showSeriesDialog = show;
    this.currentSeries = series;
  };

  setShowWeChatDialog = function(show, orderData = null) {
    this.showWeChatDialog = show;
    this.orderData = orderData;
  };

  handleMembershipPurchase = function(navigate) {
    this.showMembershipDialog = false;
    navigate(`/memberships?content=${this.memberContent}`);
  };

  handleSeriesPurchase = function() {
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

  // Transaction functionality (recharge/withdraw)
  startTransaction = function(mode = 'recharge') {
    this.transactionMode = mode;
    this.showRechargeAmountDialog = true;
  };

  startRecharge = function() {
    this.rechargeAmount = defaultRechargeAmount;
    this.startTransaction('recharge');
  };

  startWithdraw = function() {
    this.rechargeAmount = clientStore.client.balance;
    this.startTransaction('withdraw');
  };

  confirmTransaction = async function() {
    const err = await this.validate();
    if (err.length > 0) {
      userStore.openErrorDialog(err);
      return;
    }

    this.showRechargeAmountDialog = false;
    this.showRechargeDialog = true;
  };

  confirmRecharge = function() {
    this.confirmTransaction();
  };

  cancelTransaction = function() {
    this.showRechargeDialog = false;
    this.showRechargeAmountDialog = false;
    this.rechargeAmount = defaultRechargeAmount;
    this.bankAccount = '';
    this.userName = '';
    this.bankName = '';
    this.transactionMode = 'recharge';
  };

  cancelRecharge = function() {
    this.cancelTransaction();
  };

  proceedWithTransaction = async function() {
    this.showRechargeDialog = false;

    if (this.transactionMode === 'withdraw') {
      // Handle withdraw - set client withdraw info and save to database
      try {
        const withdrawData = {
          userId: userStore.user.id,
          clientId: clientStore.client.id,
          amount: this.rechargeAmount,
          bankAccount: this.bankAccount,
          userName: this.userName,
          bankName: this.bankName,
        };

        await post('withdraw', {}, withdrawData);
        await clientStore.loadClient();
        userStore.openInfoDialog(t('withdraw.request_submitted'));
        this.cancelTransaction();
      } catch (error) {
        console.error('Withdraw request error:', error);
        userStore.openErrorDialog(`${error.message} ${t('withdraw.request_failed')}`);
      }
    } else {
      // Handle recharge - proceed with WeChat payment
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
    }
  };

  proceedWithRecharge = async function() {
    await this.proceedWithTransaction();
  };

  handlePaymentSuccess = async function(paymentData) {
    this.setShowWeChatDialog(false);
    
    await clientStore.loadClient();
    // Handle recharge success

    if (paymentData.order.type === 'recharge') {
      userStore.openInfoDialog(t('recharge.success_message'));
      this.rechargeAmount = defaultRechargeAmount;
    } else {
      // Handle other payment types
      await userStore.loadUser();
      // userStore.openInfoDialog(t('payment.success_message'));
      alert(t('payment.success_message'));
    }

    this.currentSeries = null;
    this.orderData = null;
    this.transactionMode = 'recharge';
    this.bankAccount = '';
    this.userName = '';
    this.bankName = '';
  };

  handlePaymentError = function(error) {
    console.error('Payment error:', error);
    // Handle payment error (e.g., show error message)
  };

  closeAllDialogs = function() {
    this.showMembershipDialog = false;
    this.showSeriesDialog = false;
    this.showRechargeDialog = false;
    this.showRechargeAmountDialog = false;
    this.showWeChatDialog = false;
    this.currentSeries = null;
    this.orderData = null;
    this.rechargeAmount = defaultRechargeAmount;
    this.transactionMode = 'recharge';
    this.bankAccount = '';
    this.userName = '';
    this.bankName = '';
  };
}

//export default new PaymentManagerStore();
export default combineStores(EditingStore, PaymentManagerStore);