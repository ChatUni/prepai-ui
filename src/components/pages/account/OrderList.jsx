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
      />
    // <Page store={orderStore} title={t('order.title')}>
    //   <div className="flex flex-col bg-gray-100 w-full max-w-sm mx-auto">
    //     {/* Order list */}
    //     <div className="space-y-3 p-4">
    //       {paidOrders.length === 0 ? (
    //         <div className="text-center py-8">
    //           <div className="text-gray-500 text-lg mb-2">
    //             {t('order.noOrders')}
    //           </div>
    //           <div className="text-gray-400 text-sm">
    //             {t('order.noOrdersDesc')}
    //           </div>
    //         </div>
    //       ) : (
    //         <>
    //           <div className="text-gray-600 text-sm mb-4">
    //             {t('order.totalOrders', { count: paidOrders.length })}
    //           </div>
    //           {paidOrders.map((order, index) => (
    //             <OrderCard 
    //               key={`${order.id}-${index}`} 
    //               order={order} 
    //             />
    //           ))}
    //         </>
    //       )}
    //     </div>
    //   </div>
    // </Page>
  );
});

export default OrderList;