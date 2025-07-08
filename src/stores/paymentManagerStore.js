import { makeAutoObservable } from 'mobx';

class PaymentManagerStore {
  showMembershipDialog = false;

  constructor() {
    makeAutoObservable(this);
  }

  setShowMembershipDialog = (show) => {
    this.showMembershipDialog = show;
  };

  handleMembershipPurchase = (navigate) => {
    this.showMembershipDialog = false;
    navigate('/memberships');
  };
}

export default new PaymentManagerStore();