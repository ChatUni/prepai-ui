import { makeAutoObservable } from 'mobx';
import userStore from './userStore';
import clientStore from './clientStore';

class PaymentManagerStore {
  showMembershipDialog = false;
  showSeriesDialog = false;
  showWeChatDialog = false;
  currentSeries = null;
  orderData = null;

  constructor() {
    makeAutoObservable(this);
  }

  setShowMembershipDialog = (show) => {
    this.showMembershipDialog = show;
  };

  setShowSeriesDialog = (show, series = null) => {
    this.showSeriesDialog = show;
    this.currentSeries = series;
  };

  setShowWeChatDialog = (show, orderData = null) => {
    this.showWeChatDialog = show;
    this.orderData = orderData;
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
        productType: 'series',
        productId: `series_${this.currentSeries.id}`,
        productName: this.currentSeries.name,
        amount: this.currentSeries.price,
        duration: this.currentSeries.duration
      };
      
      this.setShowWeChatDialog(true, orderData);
    }
  };

  handlePaymentSuccess = (paymentData) => {
    this.setShowWeChatDialog(false);
    this.currentSeries = null;
    this.orderData = null;
    // Handle successful payment (e.g., refresh user data, show success message)
  };

  handlePaymentError = (error) => {
    console.error('Payment error:', error);
    // Handle payment error (e.g., show error message)
  };

  closeAllDialogs = () => {
    this.showMembershipDialog = false;
    this.showSeriesDialog = false;
    this.showWeChatDialog = false;
    this.currentSeries = null;
    this.orderData = null;
  };
}

export default new PaymentManagerStore();