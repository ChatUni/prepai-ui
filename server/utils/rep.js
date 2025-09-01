const { getById, getLatest, flatOne } = require('./db.js');

const getClient = async (id) => {
  const client = await flatOne('clients', `m_id=${id}&f_+memberships`)
  client.latestOrder = await getLatestOrder(id)
  client.latestWithdraw = await getLatestWithdraw(id)
  return client
}

const getClientById = async (id) => {
  const client = await getById('clients', id)
  if (!client) throw new Error('Client not found')
  return client
}

const getMembershipById = async (id) => {
  const membership = await getById('memberships', id)
  if (!membership) throw new Error('Membership not found')
  return membership;
}

const getLatestOrder = clientId => getLatest('orders', { client_id: +clientId }, 'paidAt')

const getLatestWithdraw = clientId => getLatest('orders', { client_id: +clientId, type: 'withdraw' }, 'paidAt')

module.exports = {
  getClient,
  getClientById,
  getMembershipById,
  getLatestOrder,
}