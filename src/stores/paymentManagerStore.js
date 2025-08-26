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
  transactionMode = 'recharge'; // 'recharge' or 'withdraw'
  bankAccount = '';

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

  setTransactionMode = (mode) => {
    this.transactionMode = mode;
  };

  setBankAccount = (account) => {
    this.bankAccount = account;
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

  // Transaction functionality (recharge/withdraw)
  startTransaction = (mode = 'recharge') => {
    this.transactionMode = mode;
    this.showRechargeAmountDialog = true;
  };

  startRecharge = () => {
    this.startTransaction('recharge');
  };

  startWithdraw = () => {
    this.startTransaction('withdraw');
  };

  confirmTransaction = () => {
    // Validate amount first
    if (this.rechargeAmount < 1) {
      userStore.openErrorDialog(t(`${this.transactionMode}.min_amount`));
      return;
    }

    if (!this.rechargeAmount || isNaN(this.rechargeAmount)) {
      userStore.openErrorDialog(t(`${this.transactionMode}.invalid_amount`));
      return;
    }

    // For withdraw mode, validate bank account and balance
    if (this.transactionMode === 'withdraw') {
      if (!this.bankAccount || this.bankAccount.trim() === '') {
        userStore.openErrorDialog(t('withdraw.bank_account_required'));
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

  confirmRecharge = () => {
    this.confirmTransaction();
  };

  cancelTransaction = () => {
    this.showRechargeDialog = false;
    this.showRechargeAmountDialog = false;
    this.rechargeAmount = 100;
    this.bankAccount = '';
    this.transactionMode = 'recharge';
  };

  cancelRecharge = () => {
    this.cancelTransaction();
  };

  proceedWithTransaction = async () => {
    this.showRechargeDialog = false;

    if (this.transactionMode === 'withdraw') {
      // Handle withdraw - set client withdraw info and save to database
      try {
        const withdrawData = {
          amount: this.rechargeAmount,
          date: new Date().toISOString(),
          account: this.bankAccount,
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

  proceedWithRecharge = async () => {
    await this.proceedWithTransaction();
  };

  handlePaymentSuccess = async (paymentData) => {
    this.setShowWeChatDialog(false);
    
    // Handle recharge success
    if (paymentData.order.type === 'recharge') {
      await clientStore.loadClient();
      userStore.openInfoDialog(t('recharge.success_message'));
      this.rechargeAmount = 100;
    } else {
      // Handle other payment types
      await userStore.loadUser();
      userStore.openInfoDialog(t('payment.success_message'));
    }

    this.currentSeries = null;
    this.orderData = null;
    this.transactionMode = 'recharge';
    this.bankAccount = '';
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
    this.transactionMode = 'recharge';
    this.bankAccount = '';
  };
}

export default new PaymentManagerStore();
//export default combineStores(PageStore, PaymentManagerStore);