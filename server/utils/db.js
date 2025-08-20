const { MongoClient } = require('mongodb');
const { tap } = require('./util.js');

let db = null;
let client = null;

const connectDB = async conn => {
  if (db) return db;
  
  try {
    console.log(`Connect MongoDB ${process.env.DBCS}`);
    client = await MongoClient.connect(conn);
    db = client.db();
    
    // Handle connection events
    client.on('close', () => {
      console.log('MongoDB connection closed');
      db = null;
      client = null;
    });
    
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

const connect = async dbName => {
  if (db) return db;
  await connectDB(process.env.DBCS.replace('{db}', dbName));
  return db;
};

const count = doc => db.collection(doc).count();

const get = doc =>
  db.collection(tap(doc)).find().project({ _id: 0 }).toArray();

const getById = (doc, id) =>
  db.collection(doc).findOne({ id: +id }, { projection: { _id: 0 } });

const maxId = doc =>
  db
    .collection(doc)
    .find()
    .project({ _id: 0, id: 1 })
    .sort({ id: -1 })
    .limit(1)
    .toArray()
    .then(r => (r.length > 0 ? r[0].id : 0));

// 0: prop ('$videos')
// 1: number
// 2: map ({ name: 'Fiona' })
// 3: projectMap ({ id: 1, name: 0, title: '$videos.title' })
// 4: compareMap ({ rank: -1 })
// 5: name (default to Stage name)
const Stages = {
  u: ['unwind', 0],
  l: ['limit', 1],
  k: ['skip', 1],
  m: ['match', 2],
  a: ['addFields', 2],
  r: ['sample', 2],
  p: ['project', 3],
  s: ['sort', 4],
  c: ['count', 5],
  f: ['lookup', 6],
}

const Ops = {
  in: v => v.split(';'),
  first: v => '$' + v,
  //gt: (v, k) => ['$' + k, +v],
  //lt: (v, k) => ['$' + k, +v],
}

const strNum = v => {
  if (v === 'true') return true
  if (v === 'false') return false
  if (!v) return ''
  if (Array.isArray(v)) return v.map(strNum)
  if (v.startsWith('$')) return v
  if (v.length > 2 && v[0] === "'" && v[v.length - 1] === "'") return v.slice(1, -1)
  return isNaN(+v) ? v : +v
}

const flat = async (doc, agg) => {
  // agg = 'm_id=1,code='123',firstName=in$Nan;Fiona|name=regex$fan&u_songs&p_id,name=0,img=movies.img&s_type,date=-1&r_size=20'
  console.log(agg)
  const liftUps = []
  const stages = !agg
    ? [{ $match: {} }]
    : agg.split('&').map(s => {
        const ss = s.split('_')
        const stage = ss[0]
        const props = ss.slice(1).join('_')
        const $stage = `$${Stages[stage][0]}`
        const type = Stages[stage][1]

        if (type === 0) return [{ [$stage]: `$${props}` }]
        if (type === 1) return [{ [$stage]: +props }]
        if (type === 2) {
          const ps = props.split(',').map(p => {
            const ors = p.split('|').map(o => { // 'or' separated by '|', a=1,b=2|c=3,d=4, a=1 && (b=2 || c=3) && d=4
              let [k, v] = o.split('=')
              if (v.includes('$')) {
                // prop value contains operator
                const [op, opv] = v.split('$')
                return [k, { [`$${op}`]: strNum(Ops[op] ? Ops[op](opv, k) : opv) }]
              }
              if (v.includes('.')) {
                if (stage === 'a') liftUps.push(k)
                v = '$' + v
              }
              return [k, strNum(v)]
            })
            if (ors.length > 1) return ['$or', ors.map(([k1, v1]) => ({ [k1]: v1 }))]
            else return ors[0]
          }).filter(x => x)
          return ps.length > 0 ? [{ [$stage]: Object.fromEntries(ps) }] : []
        }
        if (type === 3 || type === 4) {
          const ps = props.split(',').map(p => {
            const isMinus = p.startsWith('-')
            const k = isMinus ? p.slice(1) : p
            const v = isMinus ? (type === 3 ? 0 : -1) : 1
            return [k, v]
          })
          if (type === 3 && liftUps.length > 0) liftUps.forEach(x => ps.push([x, 1]))
          return [{ [$stage]: Object.fromEntries(ps) }]
        }
        if (type === 5) return [{ [$stage]: props || stage }]
        if (type === 6) return props.split(',').reduce((p, c) => {
          const isCollection = c.startsWith('+')
          const ps = (isCollection ? c.slice(1) : c).split('|') // foreign plural|foreign single|local single, local plural = doc
          const f_plural = ps[0]
          const f_single = ps.length > 1 ? ps[1] : f_plural.slice(0, -1)
          const l_plural = doc
          const l_single = ps.length > 2 ? ps[2] : l_plural.slice(0, -1)
          const prefix = p.length > 0 ? `${p[p.length - 3]['$lookup'].as}.` : ''
          return [
            ...p,
            { '$lookup': {
              from: f_plural,
              localField: isCollection ? 'id' : `${prefix}${f_single}_id`,
              foreignField: isCollection ? `${l_single}_id` : 'id',
              as: isCollection ? f_plural : f_single
            }},
            isCollection ? null : { '$unwind': `$${f_single}` },
            { '$project': { [`${f_single}._id`]: 0 } }
          ].filter(x => x)
        }, [])
      }).flat().filter(x => x)
  stages.push({ '$project': { _id: 0 } })
  console.log(doc, stages)
  const r = await db.collection(doc).aggregate(stages).toArray()
  console.log(r.length)
  return r
}

const add = (doc, obj) => db.collection(doc).insertMany(makeArray(obj));

const replace = async (doc, obj, id = 'id') => {
  const list = makeArray(obj);

  if (id === 'id' && list.some(o => !o.id)) {
    const id1 = await maxId(doc);
    if (typeof id1 == 'number') {
      const id = Math.max(...list.map(o => o.id || 0), id1) + 1;
      list.filter(o => !o.id).forEach((o, i) => (o.id = id + i));
    }
  }

  await Promise.all(
    list.map(o => {
      delete o._id;
      return db.collection(doc).replaceOne({ [id]: o[id] }, o, { upsert: true });
    })
  );

  return list;
};

const save = replace;

const addToList = (doc, id, list, obj) =>
  db.collection(doc).updateOne({ id: +id }, { $addToSet: { [list]: obj } });

const replaceList = (doc, id, list, obj) =>
  db
    .collection(doc)
    .updateOne(
      { id: +id, [list + '.id']: obj.id },
      { $set: { [list + '.$']: obj } }
    );

const update = (doc, obj) =>
  db.collection(tap(doc)).updateOne({ id: tap(obj.id) }, { $set: obj });

const remove = (doc, id) => db.collection(doc).deleteOne({ id: +id });

const removeAll = doc => db.collection(doc).deleteMany({});

const makeArray = x => (Array.isArray(x) ? x : [x]);

const closeDB = async () => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
    db = null;
    client = null;
  }
};

module.exports = {
  connectDB,
  connect,
  closeDB,
  count,
  get,
  getById,
  maxId,
  flat,
  add,
  replace,
  save,
  addToList,
  replaceList,
  update,
  remove,
  removeAll
};
