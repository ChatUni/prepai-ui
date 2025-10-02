export const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    // Generate a random index 'j' between 0 and 'i' (inclusive)
    const j = Math.floor(Math.random() * (i + 1));

    // Swap elements at indices 'i' and 'j'
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

export const range = (from, to) => [...Array(to - from).keys()].map(i => i + from)

export const omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
}

export const buildOptions = (options, first) => {
  const opts = options.map(option => {
    if (typeof option === 'string') {
      return { value: option, label: option };
    }

    let value = option.value;
    if (value === undefined) value = option.id;

    return {
      value,
      label: option.label || option.text || option.name || value,
      icon: buildUrl(option.icon),
      url: option.url
    };
  })

  return first ? [{ value: '', label: first }, ...opts] : opts;
}

const buildUrl = (url) => {
  if (!url) return undefined
  if (url.startsWith('http')) return url
  return `${window.location.origin}/${url}`
}