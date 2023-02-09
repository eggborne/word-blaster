export function getWords(wordLength, max) {
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
export function getSentence() {
  let url = `https://api.api-ninjas.com/v1/quotes?category=computers`;
  return fetch(url, {
    headers: { 'X-Api-Key': '+l/6Qhz/0J0PLhuk26U1Ag==6jqv7A8uoE0H1mZz'},
  }).then(function (response) {
    if (!response.ok) {
      const errorMessage = `${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    } else {
      return response.json();
    }
  });
}