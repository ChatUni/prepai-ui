import { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { createWeChatPayOrder, pollWeChatPayStatus } from '../../utils/wechatPayHelper.js';
import Dialog from './Dialog.jsx';
import Button from './Button.jsx';
import LoadingState from './LoadingState.jsx';
import { t } from '../../stores/languageStore.js';

const WeChatPayDialog = observer(({ 
  isOpen, 
  onClose, 
  orderData,
  onPaymentSuccess,
  onPaymentError 
}) => {
  const [paymentState, setPaymentState] = useState('idle'); // idle, creating, showing_qr, polling, success, error
  const [qrCodeData, setQrCodeData] = useState(null);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (isOpen && paymentState === 'idle') {
      handleCreatePayment();
    }
  }, [isOpen]);

  useEffect(() => {
    let interval;
    if (timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setPaymentState('error');
            setError(t('payment.expired'));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeRemaining]);

  const handleCreatePayment = async () => {
    setPaymentState('creating');
    setError(null);

    try {
      const result = await createWeChatPayOrder(orderData);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      setQrCodeData(result);
      setPaymentState('showing_qr');
      setTimeRemaining(result.expiresIn || 7200); // 2 hours default
      
      // Start polling for payment status
      startPolling(result.orderId);
      
    } catch (err) {
      setError(err.message);
      setPaymentState('error');
      onPaymentError?.(err.message);
    }
  };

  const startPolling = async (orderId) => {
    setPaymentState('polling');
    
    try {
      const result = await pollWeChatPayStatus(orderId, {
        maxWaitTime: 600000, // 10 minutes
        pollInterval: 3000,  // 3 seconds
        onStatusChange: (status, data) => {
          console.log('Payment status:', status, data);
        }
      });

      if (result.paid) {
        setPaymentState('success');
        onPaymentSuccess?.(result.data);
      } else if (result.expired || result.timeout) {
        setPaymentState('error');
        setError(t('payment.expired_or_timeout'));
        onPaymentError?.(t('payment.expired_or_timeout'));
      } else {
        setPaymentState('error');
        setError(result.error || t('payment.failed'));
        onPaymentError?.(result.error || t('payment.failed'));
      }
    } catch (err) {
      setPaymentState('error');
      setError(err.message);
      onPaymentError?.(err.message);
    }
  };

  const handleClose = () => {
    setPaymentState('idle');
    setQrCodeData(null);
    setError(null);
    setTimeRemaining(0);
    onClose();
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const renderContent = () => {
    switch (paymentState) {
      case 'creating':
        return (
          <div className="text-center py-8">
            <LoadingState />
            <p className="mt-4 text-gray-600">{t('payment.creating_order')}</p>
          </div>
        );

      case 'showing_qr':
      case 'polling':
        return (
          <div className="text-center py-6">
            <h3 className="text-lg font-semibold mb-4">{t('payment.scan_qr_code')}</h3>
            
            {qrCodeData && (
              <div className="mb-6">
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <img 
                    src={qrCodeData.qrCodeBase64} 
                    alt="WeChat Pay QR Code"
                    className="w-64 h-64"
                  />
                </div>
                
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-600">
                    {t('payment.amount')}: ¥{qrCodeData.amount}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t('payment.order_id')}: {qrCodeData.orderId}
                  </p>
                  {timeRemaining > 0 && (
                    <p className="text-sm text-orange-600">
                      {t('payment.expires_in')}: {formatTime(timeRemaining)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {paymentState === 'polling' && (
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">{t('payment.waiting_for_payment')}</span>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-4">
              {t('payment.wechat_instructions')}
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-green-600 mb-2">{t('payment.success')}</h3>
            <p className="text-gray-600">{t('payment.success_message')}</p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-600 mb-2">{t('payment.failed')}</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button 
              onClick={handleCreatePayment}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {t('payment.retry')}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      isOpen={isOpen} 
      onClose={handleClose}
      className="max-w-md"
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t('payment.wechat_pay')}</h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {renderContent()}

        {(paymentState === 'success' || paymentState === 'error') && (
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleClose}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              {t('common.close')}
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
});

export default WeChatPayDialog;