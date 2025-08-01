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

export const omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
}

export const buildOptions = (options) => options.map(option => {
  if (typeof option === 'string') {
    return { value: option, label: option };
  }

  let value = option.value;
  if (value === undefined) value = option.id;

  return { value, label: option.label || option.text || option.name };
})
