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
    return ['membership', 'series', 'recharge', 'withdraw'].map(x => ({ value: x, text: t(`order.types.${x}`) }));
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
      .filter(o => this.isPaid(o) || this.isWithdraw(o))
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

  isPaid = function(order) {
    return order.status.toLowerCase() === 'paid';
  }

  isPending = function(order) {
    return order.status.toLowerCase() === 'pending';
  }

  isCancelled = function(order) {
    return order.status.toLowerCase() === 'cancelled';
  }

  isMembership = function(order) {
    return order.type.toLowerCase() === 'membership';
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
      'membership': {
        label: t('order.types.membership'),
        color: 'bg-purple-600'
      },
      'series': {
        label: t('order.types.series'),
        color: 'bg-blue-600'
      },
      'exam': {
        label: t('order.types.exam'),
        color: 'bg-green-600'
      },
      'assistant': {
        label: t('order.types.assistant'),
        color: 'bg-indigo-600'
      },
      'recharge': {
        label: t('order.types.recharge'),
        color: 'bg-emerald-600'
      },
      'withdraw': {
        label: t('order.types.withdraw'),
        color: 'bg-red-600'
      }
    };
  }

  getOrderTypeLabel = (type) => {
    return this.typeMap[type]?.label || type;
  };

  getOrderTypeColor = (type) => {
    return this.typeMap[type]?.color || 'bg-gray-600';
  };
}

export default combineStores(PageStore, ListStore, OrderStore);