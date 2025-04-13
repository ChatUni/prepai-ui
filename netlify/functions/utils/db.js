const API = (type, doc, { agg, id } = {}) => `https://freshroad.netlify.app/.netlify/functions/api?db=prepai&type=${type}&doc=${doc}${agg ? `&agg=${encodeURIComponent(agg)}` : ''}${id ? `&id=${id}` : ''}`
export const get = doc => fetch(API('doc', doc)).then(res => res.json())
export const flat = (doc, agg) => fetch(API('flat', doc, { agg })).then(res => res.json())
export const save = (doc, obj) => fetch(API('save', doc), { method: 'POST', body: JSON.stringify(obj) }).then(res => res.json())
export const remove = (doc, id) => fetch(API('remove', doc, { id }), { method: 'DELETE' }).then(res => res.json())
export const maxId = doc => fetch(API('maxId', doc)).then(res => res.json())
