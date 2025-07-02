import { getApiBaseUrl } from '../config.js';

/**
 * Create a WeChat Pay order and get QR code
 * @param {Object} orderData - Order information
 * @param {number} orderData.amount - Amount in yuan (will be converted to fen)
 * @param {string} orderData.body - Order description
 * @param {string} orderData.userId - User ID
 * @param {string} orderData.productId - Product ID
 * @param {string} orderData.detail - Optional order details
 * @param {string} orderData.attach - Optional additional data
 * @returns {Promise<Object>} Payment result with QR code
 */
export const createWeChatPayOrder = async (orderData) => {
  try {
    const response = await fetch(`${getApiBaseUrl()}?type=wechat_pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: orderData.amount,
        body: orderData.body || 'Course Purchase',
        userId: orderData.userId,
        productId: orderData.productId,
        detail: orderData.detail || '',
        attach: orderData.attach || '',
        clientIp: '127.0.0.1' // In production, this should be the actual client IP
      })
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create payment order');
    }

    return {
      success: true,
      orderId: result.orderId,
      qrCodeBase64: result.qrCode,
      amount: result.amount,
      expiresIn: result.expiresIn
    };
  } catch (error) {
    console.error('WeChat Pay order creation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Query WeChat Pay order status
 * @param {string} orderId - Order ID to query
 * @returns {Promise<Object>} Payment status result
 */
export const queryWeChatPayOrder = async (orderId) => {
  try {
    const response = await fetch(`${getApiBaseUrl()}?type=wechat_query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: orderId
      })
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to query payment status');
    }

    return {
      success: true,
      status: result.status,
      paid: result.paid,
      data: result.data
    };
  } catch (error) {
    console.error('WeChat Pay query failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Poll payment status until completion or timeout
 * @param {string} orderId - Order ID to monitor
 * @param {Object} options - Polling options
 * @param {number} options.maxWaitTime - Maximum wait time in milliseconds (default: 300000 = 5 minutes)
 * @param {number} options.pollInterval - Polling interval in milliseconds (default: 3000 = 3 seconds)
 * @param {Function} options.onStatusChange - Callback for status changes
 * @returns {Promise<Object>} Final payment result
 */
export const pollWeChatPayStatus = async (orderId, options = {}) => {
  const {
    maxWaitTime = 300000, // 5 minutes
    pollInterval = 3000,  // 3 seconds
    onStatusChange = () => {}
  } = options;

  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const result = await queryWeChatPayOrder(orderId);
      
      if (!result.success) {
        onStatusChange('ERROR', result.error);
        return result;
      }

      onStatusChange(result.status, result.data);

      if (result.paid) {
        return {
          success: true,
          status: 'SUCCESS',
          paid: true,
          data: result.data
        };
      }

      if (result.status === 'CLOSED' || result.status === 'REVOKED') {
        return {
          success: true,
          status: result.status,
          paid: false,
          expired: true,
          data: result.data
        };
      }

      if (result.status === 'PAYERROR') {
        return {
          success: false,
          status: 'ERROR',
          error: 'Payment error',
          data: result.data
        };
      }

      // Continue polling for NOTPAY, USERPAYING states
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
    } catch (error) {
      console.error('Polling error:', error);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  return {
    success: true,
    status: 'TIMEOUT',
    paid: false,
    timeout: true
  };
};

/**
 * Complete WeChat Pay flow with QR code display and status monitoring
 * @param {Object} orderData - Order information
 * @param {Object} options - Flow options
 * @param {Function} options.onQRCodeReady - Callback when QR code is ready
 * @param {Function} options.onStatusChange - Callback for status changes
 * @param {Function} options.onPaymentComplete - Callback when payment is complete
 * @param {Function} options.onError - Callback for errors
 * @returns {Promise<Object>} Complete flow result
 */
export const completeWeChatPayFlow = async (orderData, options = {}) => {
  const {
    onQRCodeReady = () => {},
    onStatusChange = () => {},
    onPaymentComplete = () => {},
    onError = () => {}
  } = options;

  try {
    // Step 1: Create payment order
    const orderResult = await createWeChatPayOrder(orderData);
    
    if (!orderResult.success) {
      onError(orderResult.error);
      return orderResult;
    }

    // Step 2: Display QR code
    onQRCodeReady({
      orderId: orderResult.orderId,
      qrCodeBase64: orderResult.qrCodeBase64,
      amount: orderResult.amount,
      expiresIn: orderResult.expiresIn
    });

    // Step 3: Monitor payment status
    const statusResult = await pollWeChatPayStatus(orderResult.orderId, {
      onStatusChange: (status, data) => {
        onStatusChange(status, data);
        
        if (status === 'SUCCESS') {
          onPaymentComplete({
            orderId: orderResult.orderId,
            amount: orderResult.amount,
            data: data
          });
        }
      }
    });

    return {
      success: true,
      orderId: orderResult.orderId,
      finalStatus: statusResult.status,
      paid: statusResult.paid,
      data: statusResult.data
    };

  } catch (error) {
    onError(error.message);
    return {
      success: false,
      error: error.message
    };
  }
};