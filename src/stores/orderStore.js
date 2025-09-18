import { get, post } from '../utils/db';
import clientStore from './clientStore';
import PageStore from './pageStore';
import ListStore from './listStore';
import { combineStores } from '../utils/storeUtils';
import { t } from './languageStore';
import { Order, orderStatuses, orderTypes } from '../../common/models/order';

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
    return orderTypes.map(x => ({ value: x, text: t(`order.types.${x}`) }));
  }

  get status() {
    return orderStatuses.map(x => ({ value: x, text: t(`order.status.${x.toLowerCase()}`) }));
  }

  get balance() {
    return (this.items || []).length > 0 ? this.items[0].balance : 0;
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
      (p, c) => p + (c.isIncludedInTotal(field) ? (c[field] || 0) : 0),
      0
    );
  }

  fetchItemList = async function() {
    const orders = await get('orders', { clientId: clientStore.client.id })
    return orders
      .map(o => new Order(o))
      .filter(o => o.isIncludedInOrderList)
      .sort(this.sortOrders())
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

  openConfirmRefundDialog = function(order) {
    this.selectedOrder = order;
    this.openConfirmDialog('refund');
  }

  refund = async function(isRequest) {
    try {
      if (this.selectedOrder) {
        const r = await post(
          isRequest ? 'request_refund' : `${this.selectedOrder.isUpgrade ? 'upgrade' : 'wechat'}_refund`,
          {},
          { orderId: this.selectedOrder.id }
        );
        this.closeConfirmDialog();
        if (r.success) {
          await this.fetchItems();
          this.openInfoDialog(t(`order.${isRequest ? 'request_' : ''}refund_success`));
        } else {
          this.openErrorDialog(r.error);
        }
        this.selectedOrder = null;
      } else {
        this.closeConfirmDialog();
      }
    } catch (error) {
      this.closeConfirmDialog();
      this.openErrorDialog(error.message);
    }
  }

  confirmRequestRefund = async function() {
    this.refund(true);
  }

  confirmRefund = async function() {
    this.refund(false);
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
      'refund': 'bg-yellow-600',
    };
  }

  getOrderTypeColor = (type) => {
    return this.typeMap[type];
  };
}

export default combineStores(PageStore, ListStore, OrderStore);