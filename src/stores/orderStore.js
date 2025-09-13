import { makeAutoObservable } from 'mobx';
import { get, post } from '../utils/db';
import clientStore from './clientStore';
import userStore from './userStore';
import PageStore from './pageStore';
import ListStore from './listStore';
import { combineStores } from '../utils/storeUtils';
import { t } from './languageStore';

class OrderStore {
  selectedType = '';
  selectedStatus = '';
  selectedOrder = null;

  get name() {
    return 'order';
  }

  get pageTitle() {
    return t('order.title');
  }

  get searchableFields() {
    return ['body', 'id', 'product_id'];
  }

  get filteringFields() {
    return [
      'type',
      'status',
    ];
  }
  
  get types() {
    return ['text_member', 'video_member', 'series', 'recharge', 'withdraw'].map(x => ({ value: x, text: t(`order.types.${x}`) }));
  }

  get status() {
    return ['Paid', 'Pending'].map(x => ({ value: x, text: t(`order.status.${x.toLowerCase()}`) }));
  }

  get grossIncome() {
    return this.getTotal('amount');
  }

  get netIncome() {
    return this.getTotal('net');
  }

  get systemCost() {
    return this.getTotal('systemCost');
  }

  getTotal = function(field = 'net') {
    return this.items.reduce(
      (p, c) => this.isPaid(c) && (this.isMembership(c) || this.isSeries(c)) && (field !== 'amount' || !this.isUpgrade(c))
        ? p + (c[field] || 0)
        : p,
      0
    );
  }

  fetchItemList = async function() {
    const orders = await get('orders', { clientId: clientStore.client.id })
    return orders
      .filter(o => this.isPaid(o) || this.isWithdraw(o) || this.isPendingRefund(o))
      .sort(this.sortOrders())
      .map(o => ({ ...o, title: o.body.split(' - ')[0] }))
  };

  sortOrders = (desc = true) => (a, b) => {
    const d = x => x.paidAt || x.date_created
    return new Date(desc ? d(b) : d(a)) - new Date(desc ? d(a) : d(b));
  }

  openConfirmCompleteWithdrawDialog = function(order) {
    this.selectedOrder = order;
    this.openConfirmDialog('completeWithdraw');
  }

  confirmCompleteWithdraw = async function() {
    if (this.selectedOrder) {
      await post('complete_withdraw', {}, { orderId: this.selectedOrder.id });
      await this.fetchItems();
      this.closeConfirmDialog();
      this.openInfoDialog(t('order.complete_withdraw_success'));
      this.selectedOrder = null;
    } else {
      this.closeConfirmDialog();
    }
  }

  openConfirmRequestRefundDialog = function(order) {
    this.selectedOrder = order;
    this.openConfirmDialog('requestRefund');
  }

  confirmRequestRefund = async function() {
    if (this.selectedOrder) {
      await post('request_refund', {}, { orderId: this.selectedOrder.id });
      await this.fetchItems();
      this.closeConfirmDialog();
      this.openInfoDialog(t('order.request_refund_success'));
      this.selectedOrder = null;
    } else {
      this.closeConfirmDialog();
    }
  }

  openConfirmRefundDialog = function(order) {
    this.selectedOrder = order;
    this.openConfirmDialog('refund');
  }

  confirmRefund = async function() {
    if (this.selectedOrder) {
      await post('wechat_refund', {}, { orderId: this.selectedOrder.id });
      await this.fetchItems();
      this.closeConfirmDialog();
      this.openInfoDialog(t('order.refund_success'));
      this.selectedOrder = null;
    } else {
      this.closeConfirmDialog();
    }
  }

  isPaid = function(order) {
    return order.status.toLowerCase() === 'paid';
  }

  isPending = function(order) {
    return order.status.toLowerCase() === 'pending';
  }

  isPendingRefund = function(order) {
    return order.status.toLowerCase() === 'refunding';
  }

  isCancelled = function(order) {
    return order.status.toLowerCase() === 'cancelled';
  }

  isMembership = function(order) {
    return order.type.toLowerCase().endsWith('_member');
  }

  isSeries = function(order) {
    return order.type.toLowerCase() === 'series';
  }

  isWithdraw = function(order) {
    return order.type.toLowerCase() === 'withdraw';
  }

  isRecharge = function(order) {
    return order.type.toLowerCase() === 'recharge';
  }

  isPendingWithdraw = function(order) {
    return this.isWithdraw(order) && this.isPending(order);
  }

  isPaidWithdraw = function(order) {
    return this.isWithdraw(order) && this.isPaid(order);
  }

  isUpgrade = function(order) {
    return order.source?.toLowerCase() === 'upgrade';
  }

  hasSystemCost = function(order) {
    return this.isMembership(order);
  }

  isRefundable = function(order) {
    if (!this.isPaid(order) || this.isWithdraw(order) || this.isRecharge(order)) {
      return false;
    }

    const now = new Date();
    const paidAt = new Date(order.paidAt);
    const duration = order.duration || 0;

    if (duration > 7) {
      // If duration > 7 days, refundable when now - paidAt < 7 days
      const daysSincePaid = (now - paidAt) / (1000 * 60 * 60 * 24);
      return daysSincePaid < 7;
    } else {
      // Otherwise, refundable when now < expireDate  
      const expireDate = new Date(order.expireDate);
      return now < expireDate;
    }
  }

  formatOrderDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  formatPrice = (price) => {
    const p = parseFloat(price || 0).toFixed(2);
    return p < 0 ? '-¥' + Math.abs(p) : '¥' + p;
  };

  get typeMap() {
    return {
      'text_member': 'bg-purple-600',
      'video_member': 'bg-pink-600',
      'series': 'bg-blue-600',
      'exam': 'bg-green-600',
      'assistant': 'bg-indigo-600',
      'recharge': 'bg-emerald-600',
      'withdraw': 'bg-red-600',
    };
  }

  getOrderTypeColor = (type) => {
    return this.typeMap[type];
  };
}

export default combineStores(PageStore, ListStore, OrderStore);