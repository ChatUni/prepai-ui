import { makeAutoObservable } from 'mobx';
import { get } from '../utils/db';
import clientStore from './clientStore';
import userStore from './userStore';
import PageStore from './pageStore';
import ListStore from './listStore';
import { combineStores } from '../utils/storeUtils';
import { t } from './languageStore';

class OrderStore {
  orders = [];

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
      item => item.status === 'PAID',
    ];
  }

  // get paidOrders() {
  //   if (!userStore.user?.orders) return [];
    
  //   return userStore.user.orders
  //     .filter(order => 
  //       order.status === 'PAID' && 
  //       order.client_id == clientStore.client.id
  //     )
  //     .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
  // }

  fetchItemList = async function() {
    const orders = await get('orders', { clientId: clientStore.client.id })
    let bal = 0
    return orders
      .filter(o => o.status === 'PAID')
      .sort((a, b) => new Date(a.paidAt) - new Date(b.paidAt))
      .map(o => {
        const systemCost = o.type === 'membership'
          ? o.duration * (clientStore.client.commPerDay || import.meta.env.VITE_COMM_PER_DAY || 0.5)
          : 0;
        const net = o.amount - systemCost;
        bal += net;        
        return { ...o, title: o.body.split(' - ')[0], systemCost, net, bal };
      })
      .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))
  };

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
    if (typeof price === 'number') {
      return price.toFixed(2);
    }
    return parseFloat(price || 0).toFixed(2);
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