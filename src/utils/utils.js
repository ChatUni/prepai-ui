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