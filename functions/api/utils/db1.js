const { tap } = require('./util');

//const HOST = 'https://freshroad.netlify.app'
const HOST = 'http://localhost:701';
const API = (type, doc, { agg, id } = {}) => `${HOST}/.netlify/functions/api?db=prepai&type=${type}&doc=${doc}${agg ? `&agg=${encodeURIComponent(agg)}` : ''}${id ? `&id=${id}` : ''}`;

const get = doc => fetch(tap(API('doc', doc), 'GET')).then(res => res.json());
const flat = (doc, agg) => fetch(tap(API('flat', doc, { agg }), 'GET')).then(res => res.json());
const save = (doc, obj) => fetch(tap(API('save', doc), 'POST'), { method: 'POST', body: JSON.stringify(obj) }).then(res => res.json());
const remove = (doc, id) => fetch(tap(API('remove', doc, { id }), 'DELETE'), { method: 'DELETE' }).then(res => res.json());
const maxId = doc => fetch(tap(API('maxId', doc), 'GET')).then(res => res.json());

module.exports = {
  get,
  flat,
  save,
  remove,
  maxId
};
