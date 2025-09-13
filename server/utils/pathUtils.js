// Helper function to parse path parameters
const parsePathParams = (path, routeName) => {
  const regex = new RegExp(`\\/${routeName}\\/([^\\/]+)(?:\\/([^\\/]+))?`);
  const matches = path.match(regex);
  return matches ? { resource: matches[1], id: matches[2] } : { resource: '', id: null };
};

export {
  parsePathParams
};