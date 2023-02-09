import { getWords, getSentence } from './api.js';
import WordShip from './WordShip';
import { pause, randomInt } from './util.js';

export default class Game {
  constructor() {
    this.playerInput = '';
    this.score = 0;
    this.level = 1;
    this.dictionary = {};
    this.activeWordShips = [];
    this.targetedWordShips = [];

    this.levelData = [
      undefined,
      {
        wordsPerLengthInWave: 5,
        wordLengths: [3]
      },
      {
        wordsPerLengthInWave: 4,
        wordLengths: [3, 4, 5]
      },
    ];

    document.getElementById('start-button').addEventListener('click', async (e) => {
      e.preventDefault();
      e.target.disabled = true; // prevents Enter key 'clicking' it when invisible
      e.target.classList.add('hidden');
      document.getElementById('level-display').innerHTML = `Level ${this.level} <p>0%</p>`;
      document.getElementById('level-display').classList.remove('hidden');
      await this.prepareDictionaryForLevel(this.level);
      this.launchWordShip();
    });

    document.getElementById('next-level-button').addEventListener('click', async () => {
      await this.startNewLevel();
    });

    document.addEventListener('keydown', async (e) => {
      if ('abcdefghijklmnopqrstuvwxyz'.includes(e.key) && this.activeWordShips.length) {
        this.playerInput += e.key;

        if (this.targetedWordShips.length === 0) {
          for (const ship of this.activeWordShips) {
            let matches = this.matchesSoFar(ship.word);
            if (matches) {
              this.targetedWordShips.push(ship);
              ship.element.classList.add('targeted');
            }
          }
        } else {
          for (const ship of this.targetedWordShips) {
            let matches = this.matchesSoFar(ship.word);
            if (matches) {
              if (this.playerInput.length === ship.word.length) {
                await this.destroyShip(ship);
                if (this.dictionaryEmpty()) {
                  this.displayLevelClearModal();
                } else {
                  this.launchWordShip();
                }
              }
            } else {
              this.targetedWordShips.splice(this.targetedWordShips.indexOf(ship), 1);
              ship.element.classList.remove('targeted');
              await this.showTypoAnimation();
            }
          }
        }

        if (this.targetedWordShips.length === 0) {
          this.playerInput = '';
        }

        document.getElementById('input-display').innerText = this.playerInput;
      }
    });
  }

  getPercentageDone() {
    let totalWordsInRound = this.levelData[this.level].wordsPerLengthInWave * this.levelData[this.level].wordLengths.length;
    let totalWordsLeft = 0;
    for (const wordLength in this.dictionary) {
      totalWordsLeft += this.dictionary[wordLength].length;
    }
    return Math.floor(100 - ((totalWordsLeft / totalWordsInRound) * 100));
  }

  async showTypoAnimation() {
    document.getElementById('input-display').innerText = this.playerInput;
    document.getElementById('input-display').classList.add('incorrect');
    await pause(300);
    document.getElementById('input-display').classList.remove('incorrect');
  }

  async destroyShip(ship) {
    this.targetedWordShips.splice(this.targetedWordShips.indexOf(ship), 1);
    this.activeWordShips.splice(this.activeWordShips.indexOf(ship), 1);
    ship.element.classList.add('defeated');
    document.getElementById('input-display').innerText = this.playerInput;
    document.getElementById('input-display').classList.add('correct');
    await pause(300);
    ship.element.parentElement.removeChild(ship.element);
    document.getElementById('input-display').classList.remove('correct');
    document.getElementById('level-display').innerHTML = `Level ${this.level} <p>${this.getPercentageDone()}%</p>`;
  }

  async fillDictionary(wordLength, max) {
    await getWords(wordLength, max).then((response) => {
      this.addWordsToDic(response, wordLength);
    });
  }

  dictionaryEmpty() {
    let empty = true;
    for (const wordLength in this.dictionary) {
      if (this.dictionary[wordLength].length) {
        empty = false;
      }
    }
    return empty;
  }

  addWordsToDic(response, wordLength) {
    let newWords = response;
    let finalWordsArray = newWords.map(wordEntry => wordEntry = wordEntry.word);
    // TODO: keep track of used words and remove from pool if present before whittling
    finalWordsArray = finalWordsArray.sort(() => .5 - Math.random()).slice(0, this.levelData[this.level].wordsPerLengthInWave);
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

  launchWordShip() {
    let newWord = this.selectRandomWord();
    let newWordShip = new WordShip(newWord);
    this.activeWordShips.push(newWordShip);
    document.querySelector('main').append(this.activeWordShips[this.activeWordShips.length - 1].element);
    setTimeout(() => {
      newWordShip.element.classList.remove('obscured')
    },10)
  }

  selectRandomWord() {
    let possibleLengths = this.levelData[this.level].wordLengths;
    let randomLength = possibleLengths[randomInt(0, possibleLengths.length - 1)];
    let wordArray = [...this.dictionary[randomLength]];
    let newWord = wordArray[randomInt(0, wordArray.length - 1)];
    this.dictionary[randomLength].splice(this.dictionary[randomLength].indexOf(newWord), 1);
    if (!newWord) {
      console.log('selected newWord, possibleLengths, randomLength, wordArray', newWord, possibleLengths, randomLength, wordArray);
    }
    return newWord;
  }

  async startNewLevel() {
    document.getElementById("level-clear-modal").classList.remove("showing");
    this.level++;
    document.getElementById('level-display').innerHTML = `Level ${this.level} <p>0%</p>`;
    await this.prepareDictionaryForLevel(this.level);
    this.launchWordShip();
  }

  displayLevelClearModal() {
    document.getElementById("level-clear-modal").classList.add("showing");
    document.getElementById("level-cleared-message").innerText = `Level ${this.level} cleared!`;
    document.getElementById("next-level-button").innerText = `Start Level ${this.level + 1}?`;  // calls startNewLevel
  }

  async prepareDictionaryForLevel(level) {
    let possibleWordLengths = this.levelData[level].wordLengths;
    let startTime = Date.now();
    let wordPoolSize = 200;
    for (let i = 0; i < possibleWordLengths.length; i++) {
      await this.fillDictionary(possibleWordLengths[i], wordPoolSize);
      
    }
    console.log(`%cGot ${wordPoolSize * possibleWordLengths.length} words in ${Date.now() - startTime}ms`, `color: lightgreen;`);
    console.log('final dict is', this.dictionary)
  }
}

