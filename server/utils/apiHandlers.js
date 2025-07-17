const { get, save, remove, flat } = require('./db.js');
const { handleUrlSigning, handleFileUpload, handleFileServing, handleFileDelete } = require('./volcHelper.js');
const { WeChatPay, utils } = require('./wechat.js');
const { sendSms } = require('./sms.js');
const { chat } = require('../openai.js');

module.exports = {
  db_handlers: {
    get: {
      clients: q => flat('clients', `m_id=${q.id}&f_+memberships`),
      courses: q => flat('courses', `${q.seriesId ? `m_series_id=${q.seriesId}&` : ''}f_series|series&f_instructors`),
      instructors: q => flat('instructors', `m_client_id=${q.clientId}`),
      platform_assistants: q => flat('assistants', `m_type=1`),
      client_assistants: q => flat('assistants', `m_client_id=${q.clientId}`),
      memberships: q => flat('memberships', `m_client_id=${q.clientId}`),
      exams: q => flat('exams', `m_client_id=${q.clientId}`),
      models: q => flat('models', `m_enabled=true&p_id,name,pricing`),
      series: q => flat('series', `m_client_id=${q.clientId}&f_+courses|course|series`),
      user: q => flat('users', `m_phone='${q.phone}'&m_client_id=${q.clientId}&f_+orders`),
      users: q => flat('users', `m_client_id=${q.clientId}`),
      questions: q => flat('questions', `m_course_id=${q.courseId}&r_size=10`),
      favorites: q => flat('favorites', `m_user_id=${q.userId}`),
    },
    post: {
      save: (q, b) => save(q.doc, b),
      remove: (q, b) => remove(q.doc, b.id),
    },
  },
  handlers: {
    get: {
      tos_file: (q) => handleFileServing(q.key),
    },
    post: {
      chat: (q, b) => chat(q.api, b, false),
      tos_sign: (q, b) => handleUrlSigning(b.url),
      tos_upload: (q, b) => handleFileUpload(b.file, b.key),
      tos_delete: (q, b) => handleFileDelete(b.key),
      wechat_pay: async (q, b, req) => {
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

          // Save order to database
          const orderData = {
            id: outTradeNo,
            prepay_id: result.prepayId,
            code_url: result.codeUrl,
            amount: b.amount,
            duration: b.duration,
            expireDate: b.duration ? new Date(Date.now() + (b.duration * 24 * 60 * 60 * 1000)).toISOString() : null,
            status: 'PENDING',
            user_id: b.userId,
            client_id: b.clientId,
            product_id: b.productId,
            body: b.body,
            date_created: new Date().toISOString(),
            expires: new Date(Date.now() + 7200000).toISOString() // 2 hours
          };

          await save('orders', orderData);

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
      },
      wechat_query: async (q, b) => {
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

          // Update order status in database
          if (result.trade_state === 'SUCCESS') {
            const orderData = await flat('orders', `m_id=${b.orderId}`);
            if (orderData && orderData.length > 0) {
              const updatedOrder = {
                ...orderData[0],
                status: 'PAID',
                paidAt: new Date().toISOString(),
                transactionId: result.transaction_id
              };
              await save('orders', updatedOrder);
            }
          }

          return {
            success: true,
            status: result.trade_state,
            paid: result.trade_state === 'SUCCESS',
            data: result
          };

        } catch (error) {
          console.error('WeChat Pay query error:', error);
          return {
            success: false,
            error: error.message
          };
        }
      },
      send_sms: async (q, b) => {
        try {
          // Validate required parameters
          if (!b.phone) {
            return {
              success: false,
              error: 'Phone number is required'
            };
          }

          // Set default country code if not provided
          const countryCode = b.countryCode || '+86';
          
          // Generate 6-digit verification code
          const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

          // Send SMS
          await sendSms(b.phone, countryCode, verificationCode);
          
          // Store verification code in database for later verification
          // Using a temporary collection with expiration
          const verificationData = {
            id: `${countryCode}${b.phone}`,
            phone: b.phone,
            countryCode: countryCode,
            code: verificationCode,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 300000).toISOString(), // 5 minutes expiration
            verified: false
          };
          
          await save('sms_verifications', verificationData);
          
          return {
            success: true,
            message: 'SMS verification code sent successfully',
            expiresIn: 300 // 5 minutes in seconds
          };
          
        } catch (error) {
          console.error('SMS sending error:', error);
          return {
            success: false,
            error: error.message || 'Failed to send SMS verification code'
          };
        }
      },
      verify_sms: async (q, b) => {
        try {
          // Validate required parameters
          if (!b.phone || !b.code) {
            return {
              success: false,
              error: 'Phone number and verification code are required'
            };
          }

          const countryCode = b.countryCode || '+86';
          const verificationId = `${countryCode}${b.phone}`;
          
          // Get verification record from database
          const verifications = await get('sms_verifications', `m_id=${verificationId}`);
          
          if (!verifications || verifications.length === 0) {
            return {
              success: false,
              error: 'No verification code found for this phone number'
            };
          }
          
          const verification = verifications[0];
          
          // Check if code has expired
          if (new Date() > new Date(verification.expiresAt)) {
            return {
              success: false,
              error: 'Verification code has expired'
            };
          }
          
          // Check if code has already been used
          if (verification.verified) {
            return {
              success: false,
              error: 'Verification code has already been used'
            };
          }
          
          // Verify the code
          if (verification.code !== b.code) {
            return {
              success: false,
              error: 'Invalid verification code'
            };
          }
          
          // Mark as verified
          const updatedVerification = {
            ...verification,
            verified: true,
            verifiedAt: new Date().toISOString()
          };
          
          await save('sms_verifications', updatedVerification);
          
          return {
            success: true,
            message: 'Phone number verified successfully'
          };
          
        } catch (error) {
          console.error('SMS verification error:', error);
          return {
            success: false,
            error: error.message || 'Failed to verify SMS code'
          };
        }
      }
    },
  },
  nocache: true,
}
