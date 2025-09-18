import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { t } from '../../../stores/languageStore';
import orderStore from '../../../stores/orderStore';
import OrderCard from './OrderCard';
import ListPage from '../../ui/ListPage';

const SummaryItem = ({ label, value, color = 'gray-800' }) => (
  <div className="text-center">
    <div className="text-sm text-gray-600">{label}</div>
    <div className={`text-lg font-semibold text-${color}`}>
      {value}
    </div>
  </div>
);

const OrderList = observer(() => {
  useEffect(() => {
    orderStore.fetchItems();
  }, []);

  const summaryItems = [
    <SummaryItem
      key="balance"
      label={t('order.accountBalance')}
      value={orderStore.formatPrice(orderStore.balance)}
      color="blue-600"
    />,
    <SummaryItem
      key="totalOrders"
      label={t('order.totalOrders')}
      value={orderStore.items.length}
      color="gray-800"
    />,
    <SummaryItem
      key="grossIncome"
      label={t('order.grossIncome')}
      value={orderStore.formatPrice(orderStore.grossIncome)}
      color="green-600"
    />,
    // <SummaryItem
    //   key="netIncome"
    //   label={t('order.netIncome')}
    //   value={orderStore.formatPrice(orderStore.netIncome)}
    //   color="green-600"
    // />,
    <SummaryItem
      key="systemCost"
      label={t('order.systemCost')}
      value={orderStore.formatPrice(orderStore.systemCost)}
      color="red-600"
    />,
  ];

  return (
      <ListPage
        isGrouped={false}
        store={orderStore}
        summaryItems={summaryItems}
        renderItem={(order, index) => (
          <OrderCard
            key={order.id || index}
            order={order}
            index={index}
          />
        )}
        filters={[
          {
            selectedField: 'selectedType',
            optionsField: 'types',
            allLabel: t('series.search.allCategories'),
          },
          {
            selectedField: 'selectedStatus',
            optionsField: 'status',
            allLabel: t('order.status.all'),
          },
        ]}
      />
  );
});

export default OrderList;