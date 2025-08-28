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

  // Helper methods for complex setters that affect multiple fields
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
    navigate('/memberships');
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
    this.startTransaction('recharge');
  };

  startWithdraw = function() {
    this.startTransaction('withdraw');
  };

  confirmTransaction = function() {
    // Validate amount first
    if (this.rechargeAmount < 1) {
      userStore.openErrorDialog(t(`${this.transactionMode}.min_amount`));
      return;
    }

    if (!this.rechargeAmount || isNaN(this.rechargeAmount)) {
      userStore.openErrorDialog(t(`${this.transactionMode}.invalid_amount`));
      return;
    }

    // For withdraw mode, validate bank account, user name, bank name and balance
    if (this.transactionMode === 'withdraw') {
      if (!this.bankAccount || this.bankAccount.trim() === '') {
        userStore.openErrorDialog(t('withdraw.bank_account_required'));
        return;
      }

      if (!this.userName || this.userName.trim() === '') {
        userStore.openErrorDialog(t('withdraw.user_name_required'));
        return;
      }

      if (!this.bankName || this.bankName.trim() === '') {
        userStore.openErrorDialog(t('withdraw.bank_name_required'));
        return;
      }

      // Check if client has sufficient balance
      const currentBalance = clientStore.client.balance || 0;
      if (currentBalance < this.rechargeAmount) {
        userStore.openErrorDialog(t('withdraw.insufficient_balance'));
        return;
      }
    }

    // If all validations pass, show confirm dialog
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
          amount: this.rechargeAmount,
          date: new Date().toISOString(),
          account: this.bankAccount,
          userName: this.userName,
          bankName: this.bankName,
          status: 'pending'
        };

        // Set the withdraw info in clientStore
        clientStore.client.withdraw = withdrawData;
        
        // Also save to database for record keeping
        // const dbWithdrawData = {
        //   userId: userStore.user?.id || userStore.user?.phone,
        //   clientId: clientStore.client.id,
        //   amount: this.rechargeAmount,
        //   bankAccount: this.bankAccount,
        //   type: 'withdraw',
        //   status: 'pending',
        //   createdAt: new Date().toISOString()
        // };

        // await post('/api/save?doc=withdrawals', dbWithdrawData);
        
        // Save the updated client data
        await clientStore.save();
        
        userStore.openInfoDialog(t('withdraw.request_submitted'));
        this.cancelTransaction();
      } catch (error) {
        console.error('Withdraw request error:', error);
        userStore.openErrorDialog(t('withdraw.request_failed'));
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
    
    // Handle recharge success
    if (paymentData.order.type === 'recharge') {
      await clientStore.loadClient();
      userStore.openInfoDialog(t('recharge.success_message'));
      this.rechargeAmount = defaultRechargeAmount;
    } else {
      // Handle other payment types
      await userStore.loadUser();
      userStore.openInfoDialog(t('payment.success_message'));
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