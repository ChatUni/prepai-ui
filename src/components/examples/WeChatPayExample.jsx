import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import WeChatPayDialog from '../ui/WeChatPayDialog.jsx';
import Button from '../ui/Button.jsx';
import { t } from '../../stores/languageStore.js';

/**
 * Example component showing how to integrate WeChat Pay
 * This can be used as a reference for implementing WeChat Pay in other components
 */
const WeChatPayExample = observer(() => {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  // Example order data - replace with actual data from your application
  const orderData = {
    amount: 99.00, // Amount in yuan
    body: 'Premium Membership Purchase', // Order description
    userId: 'user123', // Current user ID
    productId: 'membership_premium', // Product being purchased
    detail: 'Premium membership with full access to all courses',
    attach: JSON.stringify({ // Additional data that will be returned in notifications
      membershipType: 'premium',
      duration: '365days'
    })
  };

  const handlePurchaseClick = () => {
    setShowPaymentDialog(true);
    setPaymentResult(null);
  };

  const handlePaymentSuccess = (data) => {
    console.log('Payment successful:', data);
    setPaymentResult({
      success: true,
      message: 'Payment completed successfully!',
      data: data
    });
    
    // Here you would typically:
    // 1. Update user's membership status
    // 2. Grant access to purchased content
    // 3. Send confirmation email
    // 4. Update UI to reflect purchase
    
    // Example: Update membership in your store
    // membershipStore.updateUserMembership(data);
  };

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error);
    setPaymentResult({
      success: false,
      message: `Payment failed: ${error}`,
      data: null
    });
  };

  const handleCloseDialog = () => {
    setShowPaymentDialog(false);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">WeChat Pay Integration Example</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Product Details</h3>
        <div className="bg-gray-50 p-4 rounded">
          <p><strong>Product:</strong> {orderData.body}</p>
          <p><strong>Price:</strong> ¥{orderData.amount}</p>
          <p><strong>Description:</strong> {orderData.detail}</p>
        </div>
      </div>

      <Button
        onClick={handlePurchaseClick}
        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
      >
        Purchase with WeChat Pay
      </Button>

      {paymentResult && (
        <div className={`mt-4 p-4 rounded ${
          paymentResult.success 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          <p className="font-semibold">
            {paymentResult.success ? 'Success!' : 'Error!'}
          </p>
          <p className="text-sm">{paymentResult.message}</p>
          {paymentResult.data && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm">View Details</summary>
              <pre className="text-xs mt-1 overflow-auto">
                {JSON.stringify(paymentResult.data, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      <WeChatPayDialog
        isOpen={showPaymentDialog}
        onClose={handleCloseDialog}
        orderData={orderData}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
      />

      <div className="mt-8 text-sm text-gray-600">
        <h4 className="font-semibold mb-2">Integration Notes:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Set up WeChat Pay environment variables in your deployment</li>
          <li>Replace example order data with real product information</li>
          <li>Implement proper error handling and user feedback</li>
          <li>Add payment verification and order fulfillment logic</li>
          <li>Test with WeChat Pay sandbox environment first</li>
        </ul>
      </div>
    </div>
  );
});

export default WeChatPayExample;