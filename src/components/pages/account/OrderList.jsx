import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { t } from '../../../stores/languageStore';
import orderStore from '../../../stores/orderStore';
import userStore from '../../../stores/userStore';
import OrderCard from './OrderCard';
import Page from '../../ui/Page';
import LoadingState from '../../ui/LoadingState';
import ListPage from '../../ui/ListPage';

const OrderList = observer(() => {
  useEffect(() => {
    orderStore.fetchItems();
  }, []);

  return (
      <ListPage
        isGrouped={false}
        store={orderStore}
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