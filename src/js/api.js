export default function getWords(wordLength, max) {
  let url = `https://api.datamuse.com/words?sp=${('?').repeat(wordLength)}&max=${max}`;
  return fetch(url).then(function (response) {
    if (!response.ok) {
      const errorMessage = `${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    } else {
      return response.json();
    }
  });
}