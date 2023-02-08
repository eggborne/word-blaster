import getWords from '../src/js/api.js';

export default class Game {
  constructor() {
    this.playerInput = '';
    this.score = 0;
    this.dictionary = {};
    this.activeWords = [];
  }

  async fillDictionary(wordLength, max) {
    await getWords(wordLength, max).then((response) => {
      this.addWordsToDic(response, wordLength);
    });
  }

  addWordsToDic(response, wordLength) {
    let newWords = response;
    let finalWordsArray = newWords.map(wordEntry => wordEntry = wordEntry.word);
    this.dictionary[wordLength] = finalWordsArray;
  }

  matchesSoFar(targetWord) {
    let playLen = this.playerInput.length;
    if (this.playerInput[playLen - 1] === targetWord[playLen - 1]) {
      return true;
    } else {
      return false;
    }
  }

  compareInputToTarget(targetWord) {

    if (this.playerInput.length === targetWord.length) {
      //we finished searching
    } else {
      //ok so far, but call again later
    }
  }
}

window.addEventListener('load', async () => {
  // let game = newGame();
});

