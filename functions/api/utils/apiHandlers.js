const { get, save, remove, flat } = require('./db.js');
const { handleUrlSigning, handleFileUpload, handleFileServing } = require('./volcHelper.js');
const { WeChatPay, utils } = require('./wechat.js');

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
      users: q => flat('users', `m_phone='${q.phone}'&m_client_id=${q.clientId}&f_+transactions`),
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
      tos_sign: (q, b) => handleUrlSigning(b.url),
      tos_upload: (q, b) => handleFileUpload(b.file, b.key),
      wechat_pay: async (q, b) => {
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
          
          // Prepare order parameters
          const orderParams = {
            body: b.body || 'Course Purchase',
            outTradeNo: outTradeNo,
            totalFee: utils.formatAmount(b.amount), // Convert yuan to fen
            productId: b.productId || outTradeNo,
            spbillCreateIp: b.clientIp || '127.0.0.1',
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
            prepayId: result.prepayId,
            codeUrl: result.codeUrl,
            amount: b.amount,
            status: 'PENDING',
            userId: b.userId,
            productId: b.productId,
            body: b.body,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7200000).toISOString() // 2 hours
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
            const orderData = await get('orders', `m_id=${b.orderId}`);
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
      }
    },
  },
  nocache: true,
}
