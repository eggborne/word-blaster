import getWords from './api.js';
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
        wordsPerLengthInWave: 10,
        wordLengths: [3]
      },
      {
        wordsPerLengthInWave: 3,
        wordLengths: [3, 4]
      },
    ];

    document.getElementById('start-button').addEventListener('click', async (e) => {
      e.preventDefault();
      await this.prepareDictionaryForLevel(this.level);
      this.launchWordShip();

    });

    document.getElementById('next-level-button').addEventListener('click', async () => {
      await this.startNewLevel();
    });

    document.addEventListener('keydown', async (e) => {
      if ('abcdefghijklmnopqrstuvwxyz'.includes(e.key) && this.activeWordShips.length) {
        this.playerInput += e.key;
        if (!this.targetedWordShips.length) {
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
                this.targetedWordShips.splice(this.targetedWordShips.indexOf(ship), 1);
                this.activeWordShips.splice(this.activeWordShips.indexOf(ship), 1);
                ship.element.classList.add('defeated');
                document.getElementById('input-display').innerText = this.playerInput;
                document.getElementById('input-display').classList.add('correct');
                await pause(300);
                ship.element.parentElement.removeChild(ship.element);
                document.getElementById('input-display').classList.remove('correct');
                if (this.dictionaryEmpty()) {
                  this.displayLevelClearModal();
                } else {
                  this.launchWordShip();
                }
              }
            } else {
              this.targetedWordShips.splice(this.targetedWordShips.indexOf(ship), 1);
              ship.element.classList.remove('targeted');
              document.getElementById('input-display').innerText = this.playerInput;
              document.getElementById('input-display').classList.add('incorrect');
              await pause(300);
              document.getElementById('input-display').classList.remove('incorrect');

            }
          }
        }
        
        if (this.targetedWordShips.length) {
          //
        } else {
          this.playerInput = '';
        }

        document.getElementById('input-display').innerText = this.playerInput;
      }
    });
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
    let possibleLengths = this.levelData[this.level].wordLengths;
    let randomLength = possibleLengths[randomInt(0, possibleLengths.length - 1)];
    let wordArray = this.dictionary[randomLength];
    let newWord = wordArray[randomInt(0, wordArray.length - 1)];
    this.dictionary[randomLength].splice(this.dictionary[randomLength].indexOf(newWord), 1);
    let newWordShip = new WordShip(newWord);
    this.activeWordShips.push(newWordShip);
    document.querySelector('main').append(this.activeWordShips[this.activeWordShips.length - 1].element);
  }

  async startNewLevel() {
    document.getElementById("level-clear-modal").classList.remove("showing");
    this.level++;
    await this.prepareDictionaryForLevel(this.level);
    this.launchWordShip();
  }

  displayLevelClearModal() {
    document.getElementById("level-clear-modal").classList.add("showing");
    document.getElementById("level-cleared-message").innerText = `Level ${this.level} cleared!`;
    document.getElementById("next-level-button").innerText = `Start Level ${this.level+1}?`;

  }

  async prepareDictionaryForLevel(level) {
    let currentLevelData = this.levelData[level];
    let possibleWordLengths = currentLevelData.wordLengths;

    for (let i = 0; i < possibleWordLengths.length; i++) {
      await this.fillDictionary(possibleWordLengths[i], currentLevelData.wordsPerLengthInWave);
    }
  }
}

