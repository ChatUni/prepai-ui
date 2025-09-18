import crypto from 'crypto';
import https from 'https';
import fs from 'fs';
import path from 'path';
import xml2js from 'xml2js';
import qrcode from 'qrcode';
import { get, getById, save, flat } from './db.js';
import { getDocById, createOrder, completeOrder, getComm, getLatestOrder } from './rep.js';
import { Order } from '../../common/models/order.js';

class WeChatPay {
  constructor(config) {
    this.appId = config.appId;
    this.mchId = config.mchId;
    this.apiKey = config.apiKey;
    this.notifyUrl = config.notifyUrl;
    this.baseUrl = 'https://api.mch.weixin.qq.com';
  }

  // Generate random string
  generateNonceStr(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Generate signature
  generateSign(params, signType = 'MD5') {
    // Sort parameters
    const sortedKeys = Object.keys(params).sort();
    const stringA = sortedKeys
      .filter(key => params[key] !== undefined && params[key] !== '' && key !== 'sign')
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    const stringSignTemp = `${stringA}&key=${this.apiKey}`;
    
    if (signType === 'MD5') {
      return crypto.createHash('md5').update(stringSignTemp, 'utf8').digest('hex').toUpperCase();
    } else if (signType === 'HMAC-SHA256') {
      return crypto.createHmac('sha256', this.apiKey).update(stringSignTemp, 'utf8').digest('hex').toUpperCase();
    }
    
    throw new Error('Unsupported sign type');
  }

  // Verify signature
  verifySign(params, signType = 'MD5') {
    const sign = params.sign;
    const calculatedSign = this.generateSign(params, signType);
    return sign === calculatedSign;
  }

  // Convert object to XML
  objectToXml(obj) {
    const builder = new xml2js.Builder({
      rootName: 'xml',
      headless: true,
      renderOpts: { pretty: false }
    });
    return builder.buildObject(obj);
  }

  // Convert XML to object
  async xmlToObject(xml) {
    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: true
    });
    
    try {
      const result = await parser.parseStringPromise(xml);
      return result.xml;
    } catch (error) {
      throw new Error(`XML parsing failed: ${error.message}`);
    }
  }

  // Make HTTP request
  async makeRequest(url, data) {
    return new Promise((resolve, reject) => {
      const postData = this.objectToXml(data);

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(url, options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', async () => {
          try {console.log(responseData)
            const result = await this.xmlToObject(responseData);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  // Make secure HTTP request with SSL certificates (for refund and other secure APIs)
  async makeSecureRequest(url, data) {
    return new Promise((resolve, reject) => {
      const postData = this.objectToXml(data);

      // Load SSL certificates
      let cert, key, ca;
      try {
        const certPath = process.env.WECHAT_CERT_PATH;
        const keyPath = process.env.WECHAT_KEY_PATH;
        const caPath = process.env.WECHAT_CA_PATH;

        if (!certPath || !keyPath) {
          throw new Error('SSL certificate paths not configured. Please set WECHAT_CERT_PATH and WECHAT_KEY_PATH in environment variables.');
        }

        // Check if certificate files exist
        if (!fs.existsSync(certPath)) {
          throw new Error(`SSL certificate file not found: ${certPath}`);
        }
        if (!fs.existsSync(keyPath)) {
          throw new Error(`SSL key file not found: ${keyPath}`);
        }

        cert = fs.readFileSync(certPath);
        key = fs.readFileSync(keyPath);
        
        // CA certificate is optional
        if (caPath && fs.existsSync(caPath)) {
          ca = fs.readFileSync(caPath);
        }
      } catch (error) {
        reject(new Error(`SSL certificate loading failed: ${error.message}`));
        return;
      }

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
          'Content-Length': Buffer.byteLength(postData)
        },
        cert: cert,
        key: key,
        ca: ca,
        // Disable certificate verification for development (remove in production)
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      };

      const req = https.request(url, options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', async () => {
          try {
            console.log('Secure request response:', responseData);
            const result = await this.xmlToObject(responseData);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Secure request failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  // Unified order (create payment)
  async unifiedOrder(params) {
    const requiredParams = {
      appid: this.appId,
      mch_id: this.mchId,
      nonce_str: this.generateNonceStr(),
      body: params.body,
      out_trade_no: params.outTradeNo,
      total_fee: params.totalFee,
      spbill_create_ip: params.spbillCreateIp || '127.0.0.1',
      notify_url: params.notifyUrl || this.notifyUrl,
      trade_type: params.tradeType || 'JSAPI'
    };

    // Add optional parameters
    if (params.openid) requiredParams.openid = params.openid;
    if (params.attach) requiredParams.attach = params.attach;
    if (params.detail) requiredParams.detail = params.detail;
    if (params.feeType) requiredParams.fee_type = params.feeType;
    if (params.timeStart) requiredParams.time_start = params.timeStart;
    if (params.timeExpire) requiredParams.time_expire = params.timeExpire;
    if (params.goodsTag) requiredParams.goods_tag = params.goodsTag;
    if (params.productId) requiredParams.product_id = params.productId;
    if (params.limitPay) requiredParams.limit_pay = params.limitPay;

    // Generate signature
    requiredParams.sign = this.generateSign(requiredParams);

    const url = `${this.baseUrl}/pay/unifiedorder`;
    const result = await this.makeRequest(url, requiredParams);

    if (result.return_code !== 'SUCCESS') {
      throw new Error(`WeChat Pay API Error: ${result.return_msg}`);
    }

    if (result.result_code !== 'SUCCESS') {
      throw new Error(`WeChat Pay Business Error: ${result.err_code} - ${result.err_code_des}`);
    }

    return result;
  }

  // Query order
  async orderQuery(params) {
    const requiredParams = {
      appid: this.appId,
      mch_id: this.mchId,
      nonce_str: this.generateNonceStr()
    };

    if (params.transactionId) {
      requiredParams.transaction_id = params.transactionId;
    } else if (params.outTradeNo) {
      requiredParams.out_trade_no = params.outTradeNo;
    } else {
      throw new Error('Either transaction_id or out_trade_no is required');
    }

    requiredParams.sign = this.generateSign(requiredParams);

    const url = `${this.baseUrl}/pay/orderquery`;
    const result = await this.makeRequest(url, requiredParams);

    if (result.return_code !== 'SUCCESS') {
      throw new Error(`WeChat Pay API Error: ${result.return_msg}`);
    }

    return result;
  }

  // Close order
  async closeOrder(outTradeNo) {
    const params = {
      appid: this.appId,
      mch_id: this.mchId,
      out_trade_no: outTradeNo,
      nonce_str: this.generateNonceStr()
    };

    params.sign = this.generateSign(params);

    const url = `${this.baseUrl}/pay/closeorder`;
    const result = await this.makeRequest(url, params);

    if (result.return_code !== 'SUCCESS') {
      throw new Error(`WeChat Pay API Error: ${result.return_msg}`);
    }

    return result;
  }

  // Refund
  async refund(params) {
    const requiredParams = {
      appid: this.appId,
      mch_id: this.mchId,
      nonce_str: this.generateNonceStr(),
      out_refund_no: params.outRefundNo,
      total_fee: params.totalFee,
      refund_fee: params.refundFee
    };

    if (params.transactionId) {
      requiredParams.transaction_id = params.transactionId;
    } else if (params.outTradeNo) {
      requiredParams.out_trade_no = params.outTradeNo;
    } else {
      throw new Error('Either transaction_id or out_trade_no is required');
    }

    // Add optional parameters
    if (params.refundFeeType) requiredParams.refund_fee_type = params.refundFeeType;
    if (params.refundDesc) requiredParams.refund_desc = params.refundDesc;
    if (params.refundAccount) requiredParams.refund_account = params.refundAccount;
    if (params.notifyUrl) requiredParams.notify_url = params.notifyUrl;

    requiredParams.sign = this.generateSign(requiredParams);

    const url = `${this.baseUrl}/secapi/pay/refund`;
    const result = await this.makeSecureRequest(url, requiredParams);

    if (result.return_code !== 'SUCCESS') {
      throw new Error(`WeChat Pay API Error: ${result.return_msg}`);
    }

    if (result.result_code !== 'SUCCESS') {
      throw new Error(`WeChat Pay Business Error: ${result.err_code} - ${result.err_code_des}`);
    }

    return result;
  }

  // Query refund
  async refundQuery(params) {
    const requiredParams = {
      appid: this.appId,
      mch_id: this.mchId,
      nonce_str: this.generateNonceStr()
    };

    if (params.transactionId) {
      requiredParams.transaction_id = params.transactionId;
    } else if (params.outTradeNo) {
      requiredParams.out_trade_no = params.outTradeNo;
    } else if (params.outRefundNo) {
      requiredParams.out_refund_no = params.outRefundNo;
    } else if (params.refundId) {
      requiredParams.refund_id = params.refundId;
    } else {
      throw new Error('One of transaction_id, out_trade_no, out_refund_no, or refund_id is required');
    }

    requiredParams.sign = this.generateSign(requiredParams);

    const url = `${this.baseUrl}/pay/refundquery`;
    const result = await this.makeRequest(url, requiredParams);

    if (result.return_code !== 'SUCCESS') {
      throw new Error(`WeChat Pay API Error: ${result.return_msg}`);
    }

    return result;
  }

  // Generate JSAPI payment parameters
  generateJSAPIParams(prepayId) {
    const params = {
      appId: this.appId,
      timeStamp: Math.floor(Date.now() / 1000).toString(),
      nonceStr: this.generateNonceStr(),
      package: `prepay_id=${prepayId}`,
      signType: 'MD5'
    };

    params.paySign = this.generateSign(params);
    return params;
  }

  // Generate APP payment parameters
  generateAPPParams(prepayId) {
    const params = {
      appid: this.appId,
      partnerid: this.mchId,
      prepayid: prepayId,
      package: 'Sign=WXPay',
      noncestr: this.generateNonceStr(),
      timestamp: Math.floor(Date.now() / 1000).toString()
    };

    params.sign = this.generateSign(params);
    return params;
  }

  // Handle payment notification
  async handleNotification(xmlData) {
    try {
      const data = await this.xmlToObject(xmlData);
      
      // Verify signature
      if (!this.verifySign(data)) {
        throw new Error('Invalid signature');
      }

      // Check return code
      if (data.return_code !== 'SUCCESS') {
        throw new Error(`Notification error: ${data.return_msg}`);
      }

      // Check result code
      if (data.result_code !== 'SUCCESS') {
        throw new Error(`Payment failed: ${data.err_code} - ${data.err_code_des}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Notification handling failed: ${error.message}`);
    }
  }

  // Generate success response for notification
  generateSuccessResponse() {
    return this.objectToXml({
      return_code: 'SUCCESS',
      return_msg: 'OK'
    });
  }

  // Generate failure response for notification
  generateFailureResponse(msg = 'FAIL') {
    return this.objectToXml({
      return_code: 'FAIL',
      return_msg: msg
    });
  }

  // Download bill
  async downloadBill(params) {
    const requiredParams = {
      appid: this.appId,
      mch_id: this.mchId,
      nonce_str: this.generateNonceStr(),
      bill_date: params.billDate,
      bill_type: params.billType || 'ALL'
    };

    if (params.tarType) requiredParams.tar_type = params.tarType;

    requiredParams.sign = this.generateSign(requiredParams);

    const url = `${this.baseUrl}/pay/downloadbill`;
    const result = await this.makeRequest(url, requiredParams);

    return result;
  }

  // Create Native payment order and generate QR code
  async createNativePayment(params) {
    const orderParams = {
      ...params,
      tradeType: 'NATIVE'
    };

    // Create unified order
    const orderResult = await this.unifiedOrder(orderParams);
    
    if (!orderResult.code_url) {
      throw new Error('Failed to get code_url from WeChat Pay');
    }

    return {
      prepayId: orderResult.prepay_id,
      codeUrl: orderResult.code_url,
      orderId: orderResult.out_trade_no || params.outTradeNo
    };
  }

  // Generate QR code image from code_url
  async generateQRCode(codeUrl, options = {}) {
    const defaultOptions = {
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256,
      ...options
    };

    try {
      if (options.format === 'base64') {
        return await qrcode.toDataURL(codeUrl, defaultOptions);
      } else if (options.format === 'buffer') {
        return await qrcode.toBuffer(codeUrl, defaultOptions);
      } else {
        // Return SVG string by default
        return await qrcode.toString(codeUrl, { type: 'svg', ...defaultOptions });
      }
    } catch (error) {
      throw new Error(`QR code generation failed: ${error.message}`);
    }
  }

  // Handle Native payment notification (scan callback)
  async handleNativeNotification(xmlData) {
    try {
      const data = await this.xmlToObject(xmlData);
      
      // Verify signature
      if (!this.verifySign(data)) {
        return this.generateNativeErrorResponse('FAIL', 'Invalid signature');
      }

      // Check return code
      if (data.return_code !== 'SUCCESS') {
        return this.generateNativeErrorResponse('FAIL', data.return_msg);
      }

      // For Native payments, this is the scan notification
      // You need to create a unified order and return the prepay_id
      const productId = data.product_id;
      const openid = data.openid;

      // This should be implemented by the merchant
      // Return the order creation parameters
      return {
        productId,
        openid,
        needCreateOrder: true,
        data
      };
    } catch (error) {
      return this.generateNativeErrorResponse('FAIL', error.message);
    }
  }

  // Generate Native scan response (when user scans QR code)
  generateNativeScanResponse(prepayId) {
    return this.objectToXml({
      return_code: 'SUCCESS',
      return_msg: 'OK',
      appid: this.appId,
      mch_id: this.mchId,
      nonce_str: this.generateNonceStr(),
      prepay_id: prepayId,
      result_code: 'SUCCESS'
    });
  }

  // Generate Native error response
  generateNativeErrorResponse(returnCode = 'FAIL', returnMsg = 'FAIL') {
    return this.objectToXml({
      return_code: returnCode,
      return_msg: returnMsg
    });
  }

  // Complete Native payment flow helper
  async completeNativePaymentFlow(orderParams, qrCodeOptions = {}) {
    try {
      // Step 1: Create Native payment order
      const paymentResult = await this.createNativePayment(orderParams);
      
      // Step 2: Generate QR code
      const qrCodeData = await this.generateQRCode(paymentResult.codeUrl, qrCodeOptions);
      
      return {
        success: true,
        prepayId: paymentResult.prepayId,
        codeUrl: paymentResult.codeUrl,
        orderId: paymentResult.orderId,
        qrCode: qrCodeData,
        expiresIn: 7200 // 2 hours default expiry
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Poll payment status for Native payments
  async pollPaymentStatus(outTradeNo, maxAttempts = 60, intervalMs = 5000) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const result = await this.orderQuery({ outTradeNo });
        
        if (result.trade_state === 'SUCCESS') {
          return {
            success: true,
            paid: true,
            data: result
          };
        } else if (result.trade_state === 'CLOSED' || result.trade_state === 'REVOKED') {
          return {
            success: true,
            paid: false,
            expired: true,
            data: result
          };
        } else if (result.trade_state === 'PAYERROR') {
          return {
            success: false,
            error: 'Payment error',
            data: result
          };
        }
        
        // Continue polling for NOTPAY, USERPAYING states
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          return {
            success: false,
            error: error.message
          };
        }
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
    
    return {
      success: true,
      paid: false,
      timeout: true
    };
  }

  // Generate QR code for Native payment (legacy method for backward compatibility)
  generateNativePayUrl(productId) {
    const params = {
      appid: this.appId,
      mch_id: this.mchId,
      time_stamp: Math.floor(Date.now() / 1000).toString(),
      nonce_str: this.generateNonceStr(),
      product_id: productId
    };

    params.sign = this.generateSign(params);

    const queryString = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');

    return `weixin://wxpay/bizpayurl?${queryString}`;
  }
}

// Utility functions
const utils = {
  // Format amount (convert yuan to fen)
  formatAmount: (amount) => Math.round(amount * 100),

  // Parse amount (convert fen to yuan)
  parseAmount: (amount) => amount / 100,

  // Generate order number
  generateOrderNo: (prefix = 'WX') => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${timestamp}${random}`;
  },

  // Validate order number format
  validateOrderNo: (orderNo) => {
    return /^[a-zA-Z0-9_\-|*@]{1,32}$/.test(orderNo);
  },

  // Format time for WeChat Pay
  formatTime: (date = new Date()) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    const second = date.getSeconds().toString().padStart(2, '0');
    
    return `${year}${month}${day}${hour}${minute}${second}`;
  },

  // Parse WeChat Pay time format
  parseTime: (timeStr) => {
    if (!timeStr || timeStr.length !== 14) return null;
    
    const year = parseInt(timeStr.substr(0, 4));
    const month = parseInt(timeStr.substr(4, 2)) - 1;
    const day = parseInt(timeStr.substr(6, 2));
    const hour = parseInt(timeStr.substr(8, 2));
    const minute = parseInt(timeStr.substr(10, 2));
    const second = parseInt(timeStr.substr(12, 2));
    
    return new Date(year, month, day, hour, minute, second);
  },

  // Trade type constants
  TRADE_TYPES: {
    JSAPI: 'JSAPI',     // WeChat Mini Program/Official Account
    NATIVE: 'NATIVE',   // QR Code
    APP: 'APP',         // Mobile App
    MWEB: 'MWEB'        // Mobile Web
  },

  // Trade state constants
  TRADE_STATES: {
    SUCCESS: 'SUCCESS',           // Payment successful
    REFUND: 'REFUND',            // Refunded
    NOTPAY: 'NOTPAY',            // Not paid
    CLOSED: 'CLOSED',            // Closed
    REVOKED: 'REVOKED',          // Revoked
    USERPAYING: 'USERPAYING',    // User paying
    PAYERROR: 'PAYERROR'         // Payment error
  },

  // Native payment helper functions
  native: {
    // Create complete Native payment flow
    createPayment: async (wechatPay, orderParams, qrOptions = {}) => {
      return await wechatPay.completeNativePaymentFlow(orderParams, qrOptions);
    },

    // Handle scan notification from WeChat
    handleScanNotification: async (wechatPay, xmlData) => {
      return await wechatPay.handleNativeNotification(xmlData);
    },

    // Poll payment status until completion
    waitForPayment: async (wechatPay, outTradeNo, options = {}) => {
      const { maxWaitTime = 300000, pollInterval = 5000 } = options; // 5 minutes default
      const maxAttempts = Math.floor(maxWaitTime / pollInterval);
      
      return await wechatPay.pollPaymentStatus(outTradeNo, maxAttempts, pollInterval);
    },

    // Generate QR code with custom styling
    generateStyledQRCode: async (wechatPay, codeUrl, style = {}) => {
      const defaultStyle = {
        format: 'base64',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        ...style
      };
      
      return await wechatPay.generateQRCode(codeUrl, defaultStyle);
    },

    // Validate Native payment parameters
    validateParams: (params) => {
      const required = ['body', 'outTradeNo', 'totalFee', 'productId'];
      const missing = required.filter(field => !params[field]);
      
      if (missing.length > 0) {
        throw new Error(`Missing required parameters: ${missing.join(', ')}`);
      }

      if (!utils.validateOrderNo(params.outTradeNo)) {
        throw new Error('Invalid order number format');
      }

      if (params.totalFee <= 0) {
        throw new Error('Total fee must be greater than 0');
      }

      return true;
    }
  }
};

// Native payment workflow examples
const nativeExamples = {
  // Complete Native payment setup
  setupNativePayment: async (wechatPay, orderData) => {
    try {
      // Validate parameters
      utils.native.validateParams(orderData);

      // Create payment and QR code
      const result = await utils.native.createPayment(wechatPay, orderData, {
        format: 'base64',
        width: 256
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return {
        success: true,
        orderId: result.orderId,
        qrCodeBase64: result.qrCode,
        codeUrl: result.codeUrl,
        expiresAt: new Date(Date.now() + result.expiresIn * 1000)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Handle WeChat scan callback
  handleScanCallback: async (wechatPay, xmlData, createOrderCallback) => {
    try {
      const scanResult = await utils.native.handleScanNotification(wechatPay, xmlData);
      
      if (scanResult.needCreateOrder) {
        // Call merchant's order creation logic
        const orderParams = await createOrderCallback(scanResult.productId, scanResult.openid);
        
        // Create unified order
        const orderResult = await wechatPay.unifiedOrder({
          ...orderParams,
          tradeType: 'NATIVE',
          openid: scanResult.openid
        });

        // Return prepay_id to WeChat
        return wechatPay.generateNativeScanResponse(orderResult.prepay_id);
      }
      
      return wechatPay.generateNativeErrorResponse('FAIL', 'Order creation failed');
    } catch (error) {
      return wechatPay.generateNativeErrorResponse('FAIL', error.message);
    }
  },

  // Monitor payment status
  monitorPayment: async (wechatPay, outTradeNo, onStatusChange) => {
    const result = await utils.native.waitForPayment(wechatPay, outTradeNo, {
      maxWaitTime: 600000, // 10 minutes
      pollInterval: 3000   // 3 seconds
    });

    if (result.paid) {
      onStatusChange('SUCCESS', result.data);
      return { status: 'SUCCESS', data: result.data };
    } else if (result.expired) {
      onStatusChange('EXPIRED', result.data);
      return { status: 'EXPIRED', data: result.data };
    } else if (result.timeout) {
      onStatusChange('TIMEOUT', null);
      return { status: 'TIMEOUT', data: null };
    } else {
      onStatusChange('ERROR', result.error);
      return { status: 'ERROR', error: result.error };
    }
  }
};

// WeChat Pay handlers
const wechat_pay = async (q, b, req) => {
  try {
    // Initialize WeChat Pay with configuration
    const wechatPay = new WeChatPay({
      appId: process.env.WECHAT_APP_ID,
      mchId: process.env.WECHAT_MCH_ID,
      apiKey: process.env.WECHAT_API_KEY,
      notifyUrl: process.env.WECHAT_NOTIFY_URL || 'https://your-domain.com/api/wechat/notify'
    });

    // Generate unique order number
    const outTradeNo = utils.generateOrderNo('ORDER');
    
    // Get client IP from request
    const clientIp = req.ip ||
                    req.connection.remoteAddress ||
                    req.socket.remoteAddress ||
                    (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                    req.headers['x-real-ip'] ||
                    '127.0.0.1';
    
    // Prepare order parameters
    const orderParams = {
      body: b.body || 'Course Purchase',
      outTradeNo: outTradeNo,
      totalFee: utils.formatAmount(b.amount), // Convert yuan to fen
      productId: b.productId || outTradeNo,
      spbillCreateIp: clientIp,
      attach: b.attach || '',
      detail: b.detail || ''
    };

    // Validate required parameters
    if (!b.amount || b.amount <= 0) {
      throw new Error('Invalid amount');
    }

    // Create Native payment and generate QR code
    const result = await wechatPay.completeNativePaymentFlow(orderParams, {
      format: 'base64',
      width: 256,
      margin: 2
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    const client = await getDocById('clients',b.clientId);

    // Save order to database
    await createOrder({
      id: outTradeNo,
      prepay_id: result.prepayId,
      code_url: result.codeUrl,
      amount: b.amount,
      duration: b.duration,
      status: 'Pending',
      user_id: b.userId,
      client_id: b.clientId,
      type: b.type,
      product_id: b.productId,
      body: b.body,
      comm: b.type.endsWith('_member') ? getComm(client, b.type.slice(0, -7)) : null,
      expires: new Date(Date.now() + 7200000).toISOString() // 2 hours
    });

    return {
      success: true,
      orderId: result.orderId,
      qrCode: result.qrCode,
      amount: b.amount,
      expiresIn: result.expiresIn
    };

  } catch (error) {
    console.error('WeChat Pay error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const wechat_query = async (q, b) => {
  try {
    const wechatPay = new WeChatPay({
      appId: process.env.WECHAT_APP_ID,
      mchId: process.env.WECHAT_MCH_ID,
      apiKey: process.env.WECHAT_API_KEY,
      notifyUrl: process.env.WECHAT_NOTIFY_URL || 'https://your-domain.com/api/wechat/notify'
    });

    const result = await wechatPay.orderQuery({
      outTradeNo: b.orderId
    });

    if (process.env.FAKE_PAYMENT == 1) result.trade_state = 'SUCCESS';

    let order = {}
    if (result.trade_state === 'SUCCESS') {
      const orders = await flat('orders', `m_id=${b.orderId}`);
      if (orders && orders.length > 0) {
        order = orders[0];
        await completeOrder(order, 0, false, result.transaction_id);
      }
    }

    return {
      success: true,
      status: result.trade_state,
      paid: result.trade_state === 'SUCCESS',
      data: result,
      order,
    };

  } catch (error) {
    console.error('WeChat Pay query error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const wechat_refund = async (q, b) => {
  try {
    const wechatPay = new WeChatPay({
      appId: process.env.WECHAT_APP_ID,
      mchId: process.env.WECHAT_MCH_ID,
      apiKey: process.env.WECHAT_API_KEY,
      notifyUrl: process.env.WECHAT_NOTIFY_URL || 'https://your-domain.com/api/wechat/notify'
    });

    // Get order information from database, use flat since id is string
    const orders = await flat('orders', `m_id=${b.orderId}`);
    if (!orders || orders.length === 0) {
      throw new Error('订单未找到');
    }

    const order = orders[0];
    
    // Validate order status
    if (order.status !== 'Refunding') {
      throw new Error('订单未申请付款');
    }

    const o1 = await getLatestOrder(order.client_id)
    if (order.net > o1.balance) {
      throw new Error('余额不足');
    }

    // Generate unique refund number
    const outRefundNo = utils.generateOrderNo('REFUND');
    
    // Prepare refund parameters
    const refundParams = {
      outTradeNo: b.orderId,
      outRefundNo: outRefundNo,
      totalFee: utils.formatAmount(order.amount), // Convert yuan to fen
      refundFee: utils.formatAmount(b.refundAmount || order.amount), // Full refund if not specified
      refundDesc: b.refundDesc || 'Order refund'
    };

    // Add transaction_id if available (more reliable than outTradeNo)
    if (order.transaction_id) {
      refundParams.transactionId = order.transaction_id;
    }

    // Add optional parameters
    if (b.refundFeeType) refundParams.refundFeeType = b.refundFeeType;
    if (b.refundAccount) refundParams.refundAccount = b.refundAccount;
    if (b.notifyUrl) refundParams.notifyUrl = b.notifyUrl;

    // Process refund with WeChat Pay
    const result = await wechatPay.refund(refundParams);

    order.status = 'Refunded'
    await save('orders', order)

    const o2 = new Order({
      refund_id: result.refund_id,
      refund_no: outRefundNo,
      amount: -order.amount,
      status: "Paid",
      client_id: order.client_id,
      user_id: order.user_id,
      type: "refund",
      body: `退款 - 订单号: ${order.id}`,
      systemCost: order.systemCost ? -order.systemCost : null,
      net: -order.net,
      balance: o1.balance - order.net,
      date_created: new Date().toISOString(),
      paidAt: new Date().toISOString(),
    })
    await save('orders', o2)

    return {
      success: true,
      refundId: result.refund_id,
      refundNo: outRefundNo,
      refundAmount: b.refundAmount || order.amount,
      orderId: b.orderId,
      data: result
    };

  } catch (error) {
    console.error('WeChat Pay refund error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const wechat_refund_query = async (q, b) => {
  try {
    const wechatPay = new WeChatPay({
      appId: process.env.WECHAT_APP_ID,
      mchId: process.env.WECHAT_MCH_ID,
      apiKey: process.env.WECHAT_API_KEY,
      notifyUrl: process.env.WECHAT_NOTIFY_URL || 'https://your-domain.com/api/wechat/notify'
    });

    // Query refund status
    const queryParams = {};
    
    if (b.refundId) {
      queryParams.refundId = b.refundId;
    } else if (b.outRefundNo) {
      queryParams.outRefundNo = b.outRefundNo;
    } else if (b.orderId) {
      queryParams.outTradeNo = b.orderId;
    } else {
      throw new Error('Either refundId, outRefundNo, or orderId is required');
    }

    const result = await wechatPay.refundQuery(queryParams);

    // Parse refund status
    const refundStatus = result.refund_status_0 || result.refund_status;
    const refundAmount = result.refund_fee_0 || result.refund_fee;
    const refundTime = result.refund_success_time_0 || result.refund_success_time;

    return {
      success: true,
      refundStatus: refundStatus,
      refundAmount: utils.parseAmount(refundAmount),
      refundTime: refundTime ? utils.parseTime(refundTime) : null,
      data: result
    };

  } catch (error) {
    console.error('WeChat Pay refund query error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export {
  WeChatPay,
  utils,
  nativeExamples,
  wechat_pay,
  wechat_query,
  wechat_refund,
  wechat_refund_query
};
