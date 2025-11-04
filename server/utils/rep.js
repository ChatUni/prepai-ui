import { Order } from '../../common/models/order.js';
import { get, getById, getLatest, flatOne, flat, save } from './db.js';

const durations = {
  monthly: 30,
  annually: 365,
  lifetime: 730,
  trial: 1
}

// client
const getComm = (client, content) => {
  let comm = client.comm && client.comm[content];
  if (!comm) {
    if (content === 'text') comm = +process.env.TEXT_MEMBER_COMM_PER_DAY;
    else if (content === 'video') comm = +process.env.VIDEO_MEMBER_COMM_PER_DAY;
  }
  return comm || 0.3;
}

const getLimit = (client, type) => {
  let limit = client?.limits && client?.limits?.[type];
  if (!limit) {
    if (type === 'image') limit = +process.env.IMAGES_PER_DAY;
    else if (type === 'video') limit = +process.env.VIDEOS_PER_DAY;
  }
  return limit || 20;
}

const getCurrentBalance = async clientId => {
  const latestOrder = await getLatestOrder(clientId)
  return (latestOrder && latestOrder.balance) || 0
}

const getClientByHost = async (host) => {
  const client = await flatOne('clients', `m_host=regex$${`${host};`}`)
  if (!client) throw new Error(`client not found for host ${host}`)
  return client
}

const getClient = async (id) => {
  const client = await flatOne('clients', `m_id=${id}&f_+memberships`)
  client.latestOrder = await getLatestOrder(id)
  client.latestWithdraw = await getLatestWithdraw(id)
  return client
}

const getDocById = async (doc, id) => {
  const item = await getById(doc, id)
  if (!item) throw new Error(`${doc} not found`)
  return item
}

// order
const createOrder = async (order, balance) => {
  order.date_created = new Date().toISOString()

  if (order.duration) {
    if (typeof order.duration === 'string') order.duration = durations[order.duration]
    order.expireDate = new Date(Date.now() + (order.duration * 24 * 60 * 60 * 1000)).toISOString()
  }

  if (order.type === 'withdraw') await payOrder(order, balance)
  
  if (order.status?.toLowerCase() === 'pending')
    await save('orders', order)
  else
    await completeOrder(order, balance)
}

const payOrder = async (order, balance) => {
  if (!balance) balance = await getCurrentBalance(order.client_id)

  order.paidAt = new Date().toISOString()

  if (order.comm && order.duration) {
    const isUpgrade = order.source === 'upgrade'
    order.systemCost = -order.comm * order.duration
    order.net = isUpgrade ? order.systemCost : order.amount + order.systemCost;
    order.balance = balance + order.net;
  } else {
    order.net = order.amount;
    order.balance = balance + order.amount;
  }
}

const completeOrder = async (order, balance, isCancelled, transactionId) => {
  if (isCancelled) {
    order.status = 'Cancelled'
    order.cancelledAt = new Date().toISOString()
  } else {
    if (order.type !== 'withdraw') await payOrder(order, balance)
    order.status = 'Paid'
    if (transactionId) order.transactionId = transactionId
  }

  await save('orders', order)
}

const upgrade = async (client, user, membership, balance) => {
  const order = {
    amount: membership.price,
    duration: membership.type,
    comm: getComm(client, membership.content),
    client_id: user.client_id,
    user_id: user.id,
    type: `${membership.content || 'text'}_member`,
    source: "upgrade",
    product_id: membership.id,
    body: `${membership.name} - ${membership.type}`,
  }

  await createOrder(order, balance)
  return order.balance
}

const upgradeAll = async ({ userIds, membershipId, phones, clientId }) => {
  const client = await getDocById('clients', clientId)
  const membership = await getDocById('memberships', membershipId)
  if (membership.client_id !== clientId) throw new Error('membership client mismatch')

  let balance = await getCurrentBalance(clientId)
  const cost = getComm(client, membership.content) * durations[membership.type] * userIds.length
  if (balance < cost) throw new Error(`此次升级需扣款¥${cost}，当前余额为¥${balance}，请先充值`)

  const users = await flat('users', `m_client_id=${clientId}`)

  for (const userId of userIds) {
    const user = users.find(u => u.id === userId)
    if (!user) throw new Error('User not found')
  
    balance = await upgrade(client, user, membership, balance)
  }

  for (const phone of phones) {
    let user = users.find(u => u.phone === phone)
    if (!user) {
      user = {
        id: +phone * 10000 + +clientId,
        phone: phone,
        client_id: clientId,
        name: '游客',
        role: 'user',
        date_created: new Date().toISOString(),
      }
      await save('users', user)
      balance = await upgrade(client, user, membership, balance)
    }
  }

  return { success: true }
}

const withdraw = async ({ clientId, userId, amount, userName, bankAccount, bankName }) => {
  const balance = await getCurrentBalance(clientId)
  if (balance < amount) throw new Error('余额不足。')

  const order = {
    amount: -amount,
    status: "Pending",
    client_id: clientId,
    user_id: userId,
    type: "withdraw",
    body: '',
    userName,
    bankName,
    bankAccount,
  }

  await createOrder(order, balance)

  return { success: true }
}

const completeWithdraw = async ({ orderId }) => {
  const order = await getDocById('orders', orderId)
  await completeOrder(order)
  return { success: true }
}

const requestRefund = async ({ orderId }) => {
  const orders = await flat('orders', `m_id=${orderId}`);
  if (!orders || orders.length === 0) {
    throw new Error('订单未找到');
  }
  const order = new Order(orders[0])
  if (!order.isRefundable) throw new Error('订单不可退款')
  
  order.status = 'Refunding'
  await save('orders', order)
  return { success: true }
}

const upgradeRefund = async ({ orderId }) => {
  const o = await getDocById('orders', orderId)
  const order = new Order(o)
  if (!order.isPendingRefund) throw new Error('订单未申请退款')
  if (!order.isUpgrade) throw new Error('不是升级订单')
  
  order.status = 'Refunded'
  await save('orders', order)

  const o1 = await getLatestOrder(order.client_id)
  const o2 = new Order({
    amount: -order.systemCost,
    status: "Paid",
    source: 'upgrade',
    client_id: order.client_id,
    user_id: order.user_id,
    type: "refund",
    body: `升级退款 - 订单号: ${order.id}`,
    systemCost: -order.systemCost,
    net: -order.systemCost,
    balance: o1.balance - order.systemCost,
    date_created: new Date().toISOString(),
    paidAt: new Date().toISOString(),
  })
  await save('orders', o2)

  return { success: true }
}

const getLatestOrder = clientId => getLatest('orders', { client_id: +clientId }, 'paidAt')

const getLatestWithdraw = clientId => getLatest('orders', { client_id: +clientId, type: 'withdraw', status: 'Pending' }, 'date_created')

const getUser = async (phone, clientId, email, withOrders) => {
  let users = await checkUser(phone, clientId, email);  
  let user;
  
  if (users.length === 1) {
    if (users[0].role === 'super' && !users[0].client_id) user = users[0];
    else if (users[0].client_id === clientId) user = users[0];
  } else if (users.length > 1) {
    user = users.find(u => u.client_id === clientId);
  }
  if (!user) throw new Error('User not found');
  
  if (user.client_id) {
    const client = await getDocById('clients', user.client_id);
    if (!user.usage) user.usage = {};
    const types = ['image', 'video'];
    types.forEach(t => {
      const m = getLimit(client, t);
      const u = user.usage[t] || {};
      if (u.date) {
        const d = new Date().toDateString();
        if (d === u.date) {
          u.remain = m - (u.used || 0);
          return user;
        }
      }
      u.date = new Date().toDateString();
      u.used = 0;
      u.remain = m;
      user.usage[t] = u;
      return user;
    });
  }

  if (withOrders) user = await flatOne('users', `m_id=${user.id}&f_+orders`);

  return user;
}

const checkUser = async (phone, clientId, email) => {
  const query = {};
  if (phone) {
    query.phone = phone;
  } else if (email) {
    query.email = email;
  } else {
    throw new Error('Phone or email is required');
  }

  let users = await get('users', query);

  const sup = users.find(u => u.role === 'super' && !u.client_id);
  if (sup) return users;

  users = users.filter(u => u.client_id === +clientId);
  if (users.length === 0) throw new Error('User not found');
  
  return users
}

const newUser = async (user) => {
  const clientId = user.client_id;
  
  // Generate ID based on phone or email
  let id;
  if (user.phone) {
    id = +user.phone * 10000 + clientId;
  } else if (user.email) {
    // Generate a unique numeric ID based on email hash and client ID
    const emailHash = user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    let hash = 0;
    for (let i = 0; i < emailHash.length; i++) {
      const char = emailHash.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    const positiveHash = Math.abs(hash);
    id = positiveHash * 10000 + clientId;
  } else {
    throw new Error('Phone or email is required');
  }
  
  const newUserData = {
    ...user,
    id,
    date_created: new Date().toISOString(),
  };
  
  await save('users', newUserData);
  return newUserData;
}

const createClient = async (clientData) => {
  // Validate required fields
  if (!clientData.name || !clientData.host || !clientData.phone) {
    throw new Error('All fields (name, host, phone) are required');
  }

  // Check if host already exists (host is semicolon-separated string)
  const hostList = clientData.host.split(';').map(h => h.trim()).filter(h => h);
  
  // Get all existing clients to check for host conflicts
  const existingClients = await get('clients');
  
  for (const existingClient of existingClients) {
    if (existingClient.host) {
      const existingHosts = existingClient.host.split(';').map(h => h.trim()).filter(h => h);
      
      // Check if any of the new hosts already exist
      for (const newHost of hostList) {
        if (existingHosts.includes(newHost)) {
          throw new Error(`域名 '${newHost}' 已存在`);
        }
      }
    }
  }

  // Create the client with basic structure
  const newClient = {
    name: clientData.name,
    host: clientData.host,
    phone: '',
    desc: '',
    logo: '',
    email: '',
    qrcode: '',
    allowFree1Day: false,
    hideSeries: false,
    hideExam: false,
    settings: {
      banners: [],
      assistantGroups: [
        "AI对话",
        "AI绘图",
        "AI视频",
        "AI配音",
        "短视频创作",
        "工作小助手"
      ],
      examGroups: [
        "推荐考试",
        "模拟考试"
      ],
      seriesGroups: [
        "精选课程",
        "热门课程"
      ],
    }
  };
  
  const result = await save('clients', newClient);
  
  // Create admin user for the client
  await save('users', {
    id: clientData.phone * 10000 + result[0].id,
    role: 'admin',
    name: '管理员',
    phone: clientData.phone,
    client: result[0].id
  });
  
  return result;
};

export {
  getClient,
  getClientByHost,
  getUser,
  checkUser,
  newUser,
  createClient,
  getDocById,
  getLatestOrder,
  upgradeAll,
  withdraw,
  createOrder,
  completeOrder,
  completeWithdraw,
  requestRefund,
  upgradeRefund,
  getComm,
  getLimit,
};