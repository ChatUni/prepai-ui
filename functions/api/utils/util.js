const tap = (x, m) => {
  if (m) console.log(m);
  console.log(x);
  return x;
}

const add = (x, y) => x + y;

module.exports = {
  tap,
  add
}
