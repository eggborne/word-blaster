import { getWords, getSentence } from './api.js';
import { WordShip } from './WordShip';
import { pause, randomInt, angleOfPointABFromXY, radToDeg } from './util.js';

export default class Game {
  constructor() {
    this.playerInput = '';
    this.score = 0;
    this.destroyedThisWave = 0;
    this.health = 100;
    this.level = 4;
    this.dictionary = {};
    this.activeWordShips = [];
    this.targetedWordShips = [];
    this.usedWords = [];
    this.turretAngle = 0;
    this.interval;

    this.animationSpeed = 300;

    this.levelData = [
      undefined,
      {
        wordsPerLengthInWave: 5,
        wordLengths: [3],
        shipSpeed: 5000,
        launchFrequency: 1000,
      },
      {
        wordsPerLengthInWave: 4,
        wordLengths: [3, 4],
        shipSpeed: 4000,
        launchFrequency: 900,
      },
      {
        wordsPerLengthInWave: 5,
        wordLengths: [4, 5, 6],
        shipSpeed: 3500,
        launchFrequency: 800,
      },
      {
        wordsPerLengthInWave: 6,
        wordLengths: [5, 6, 7],
        shipSpeed: 3200,
        launchFrequency: 750,
      },
    ];

    document.documentElement.style.setProperty('--animation-speed', this.animationSpeed + 'ms');

    document.getElementById('start-button').addEventListener('click', async (e) => {
      e.preventDefault();
      e.target.disabled = true; // prevents Enter key 'clicking' it when invisible
      e.target.classList.add('hidden');
      document.getElementById('intro-message').classList.add('hidden');
      document.getElementById('level-display').innerHTML = `Level ${this.level} <p>0%</p>`;
      document.getElementById('score-display').innerHTML = `Score: <p>${this.score}</p>`;
      document.getElementById('score-display').classList.remove('hidden');
      document.getElementById('level-display').classList.remove('hidden');
      await this.prepareDictionaryForLevel(this.level);
      this.startLevelSequence();
    });

    document.getElementById('next-level-button').addEventListener('click', async () => {
      await this.startNewLevel(this.level + 1);
    });

    document.getElementById('restart-button').addEventListener('click', async () => {
      this.resetGame();
      await this.startNewLevel(1);
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
              document.getElementById('main-turret').classList.add('aiming');
              this.aimTurret(ship);
              ship.element.style.setProperty('--descend-speed', (this.levelData[this.level].shipSpeed) + 'ms');
              ship.focusLayer.innerText = this.playerInput;
            }
          }
        } else {
          for (const ship of this.targetedWordShips) {
            let matches = this.matchesSoFar(ship.word);
            if (matches) {
              this.aimTurret(ship);
              ship.focusLayer.innerText = this.playerInput;
              if (this.playerInput.length === ship.word.length) {
                document.getElementById('input-display').innerText = this.playerInput;
                document.getElementById('input-display').classList.add('correct');
                ship.element.classList.add('frozen');
                let flySpeed = this.fireBullet(ship);
                await pause(flySpeed);
                this.destroyShip(ship, true);
                if (ship.lastInWave && this.dictionaryEmpty()) {
                  this.displayLevelClearModal();
                } else {
                  // this.launchWordShip();
                }
              }
            } else {
              this.targetedWordShips.splice(this.targetedWordShips.indexOf(ship), 1);
              ship.element.classList.remove('targeted');
              ship.focusLayer.classList.add('doomed');
              this.aimTurret(undefined, 0);
              this.showTypoAnimation();
              ship.focusLayer.classList.remove('doomed');
            }
          }
        }

        if (this.targetedWordShips.length === 0) {
          this.playerInput = '';
          document.getElementById('main-turret').classList.remove('aiming');
        }

        document.getElementById('input-display').innerText = this.playerInput;
      } else if (e.code === 'Space' || e.key === ' ') {
        if (!document.getElementById('start-button').classList.contains('hidden')) {
          document.getElementById('start-button').click();
        } else if (!document.getElementById('next-level-button').classList.contains('hidden')) {
          document.getElementById('next-level-button').click();
        }
      }
    });
  }

  resetGame() {
    this.playerInput = '';
    this.score = 0;
    this.destroyedThisWave = 0;
    this.health = 100;
    this.level = 1;
    this.dictionary = {};
    this.activeWordShips = [];
    this.targetedWordShips = [];
    document.getElementById('health-bar').style.scale = 1;
  }

  startLevelSequence() {
    this.launchWordShip();
    this.interval = setInterval(() => {
      if (!this.dictionaryEmpty()) {
        this.launchWordShip();
      } else {
        clearInterval(this.interval);
      }
    }, this.levelData[this.level].launchFrequency);
  }

  getPercentageDone() {
    let totalWordsInRound = this.levelData[this.level].wordsPerLengthInWave * this.levelData[this.level].wordLengths.length;
    let totalWordsLeft = 0;
    for (const wordLength in this.dictionary) {
      totalWordsLeft += this.dictionary[wordLength].length;
    }
    return Math.floor(100 - ((totalWordsLeft / totalWordsInRound) * 100));
  }

  async aimTurret(targetShip, forceAngle) {
    let turretElement = document.getElementById('main-turret');
    let newAngle;
    if (forceAngle !== undefined) {
      newAngle = forceAngle;
    } else {
      let targetElement = targetShip.element;
      let turretPosition = {
        x: turretElement.offsetLeft,
        y: turretElement.offsetTop,
      };
      let targetPosition = {
        x: targetElement.offsetLeft + (targetShip.width / 2),
        y: targetElement.offsetTop,
      };
      console.log('aiming from', turretPosition, 'to', targetPosition);
      newAngle = radToDeg(angleOfPointABFromXY(
        targetPosition.x,
        targetPosition.y,
        turretPosition.x,
        turretPosition.y
      ));
    }
    turretElement.style.rotate = `${newAngle}deg`;
    this.turretAngle = newAngle;
  }

  fireBullet(targetShip) {
    let turretElement = document.getElementById('main-turret');
    let bullet = document.createElement('div');
    let pointBlank = false;
    bullet.classList.add('bullet');
    document.querySelector('main').append(bullet);
    let targetElement = targetShip.element;
    let turretPosition = {
      x: turretElement.offsetLeft,
      y: turretElement.offsetTop + (turretElement.offsetHeight / 2),
    };
    let targetPosition = {
      x: targetElement.offsetLeft + (targetShip.width / 2),
      y: targetElement.offsetTop + (targetElement.offsetHeight / 2),
    };
    bullet.style.rotate = `${this.turretAngle}deg`;
    bullet.style.left = (turretPosition.x - (bullet.offsetWidth / 2)) + 'px';
    bullet.style.top = (turretPosition.y - (bullet.offsetHeight / 2)) + 'px';
    let moveXAmount = targetPosition.x - turretPosition.x;
    let moveYAmount = targetPosition.y - turretPosition.y;
    bullet.style.translate = `${moveXAmount}px ${moveYAmount}px`;
    if (Math.abs(moveYAmount) < window.innerHeight / 2) {
      console.log('closer bullet moves faster!')
      bullet.style.transitionDuration = '300ms';
      pointBlank = true;
    }
    bullet.addEventListener('transitionend', (e) => {
      e.target.parentElement.removeChild(e.target);
    });
    return pointBlank ? 300 : 600;
  }

  async showTypoAnimation() {
    document.getElementById('input-display').innerText = this.playerInput;
    document.getElementById('input-display').classList.add('incorrect');
    await pause(200);
    document.getElementById('input-display').classList.remove('incorrect');
  }

  async destroyShip(ship, creditPlayer) {
    this.targetedWordShips.splice(this.targetedWordShips.indexOf(ship), 1);
    this.activeWordShips.splice(this.activeWordShips.indexOf(ship), 1);
    document.getElementById('input-display').innerText = this.playerInput;
    document.getElementById('input-display').classList.add('correct');
    if (creditPlayer) {
      this.destroyedThisWave++;
      this.score += ship.word.length * this.level;
      document.getElementById('score-display').innerHTML = `Score: <p>${this.score}</p>`;
      ship.element.classList.add('defeated');
    } else {
      ship.element.classList.add('detonated');
    }
    await pause(300);
    ship.element.parentElement.removeChild(ship.element);
    document.getElementById('input-display').classList.remove('correct');
    document.getElementById('level-display').innerHTML = `Level ${this.level} <p>${this.getPercentageDone()}%</p>`;

  }

  async fillDictionary(wordLength, max) {
    await getWords(wordLength, max).then((response) => {
      this.addWordsToDictionary(response, wordLength);
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

  addWordsToDictionary(response, wordLength) {
    let newWords = response;
    let finalWordsArray = newWords.map(wordEntry => wordEntry = wordEntry.word);
    finalWordsArray = finalWordsArray.filter(word => {
      let alpha = true;
      let used = this.usedWords.includes(word);
      for (const letter of word) {
        if (!'abcdefghijklmnopqrstuvwxyz'.includes(letter)) {
          alpha = false;
        }
      }
      return !used && alpha;
    });
    finalWordsArray = finalWordsArray.sort(() => .5 - Math.random()).slice(0, this.levelData[this.level].wordsPerLengthInWave);
    this.dictionary[wordLength] = finalWordsArray;
    this.usedWords.push(...finalWordsArray);
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
    newWordShip.element.style.setProperty('--descend-speed', this.levelData[this.level].shipSpeed + 'ms');
    this.activeWordShips.push(newWordShip);
    if (this.dictionaryEmpty()) {
      newWordShip.lastInWave = true;
    }
    setTimeout(() => {
      newWordShip.element.classList.remove('obscured');
    }, 10);
    newWordShip.element.addEventListener('animationend', (e) => {
      this.destroyShip(newWordShip);
      if (this.health - (newWordShip.word.length * 10) > 0) {
        this.health -= newWordShip.word.length * 2;
        document.getElementById('health-bar').style.scale = `${this.health}% 1`;
      } else {
        document.getElementById('health-bar').style.scale = `0 1`;
        this.dictionary = {};
        this.clearWordShips();
        this.displayGameOverModal();
      }
      if (newWordShip.lastInWave) {
        this.displayLevelClearModal();
      }
    });
  }

  clearWordShips() {
    [...document.getElementsByClassName('word-ship')].forEach(shipElement => {
      shipElement.parentElement.removeChild(shipElement);
    });
  }

  selectRandomWord() {
    let possibleLengths = [...this.levelData[this.level].wordLengths];
    for (const wordLengthIndex in possibleLengths) {
      if (this.dictionary[possibleLengths[wordLengthIndex]].length === 0) {
        console.log('removing length', possibleLengths[wordLengthIndex], 'from random choices because empty');
        possibleLengths.splice(wordLengthIndex, 1);
      }
    }
    let randomLength = possibleLengths[randomInt(0, possibleLengths.length - 1)];
    let wordArray = [...this.dictionary[randomLength]];
    let newWord = wordArray[randomInt(0, wordArray.length - 1)];
    this.dictionary[randomLength].splice(this.dictionary[randomLength].indexOf(newWord), 1);
    if (!newWord) {
      console.log('selected undefined newWord with args: possibleLengths, randomLength, wordArray', possibleLengths, randomLength, wordArray);
    }
    return newWord;
  }

  async startNewLevel(newLevel) {
    [...document.getElementsByClassName('modal')].forEach(modal => modal.classList.remove('showing'));
    this.level = newLevel;
    document.getElementById('level-display').innerHTML = `Level ${this.level} <p>0%</p>`;
    this.destroyedThisWave = 0;
    await this.prepareDictionaryForLevel(this.level);
    this.startLevelSequence();
  }

  displayLevelClearModal() {
    document.getElementById("level-clear-modal").classList.add("showing");
    document.querySelector("#level-clear-modal > .modal-message").innerText = `Level ${this.level} cleared!`;
    let totalWordsInRound = this.levelData[this.level].wordsPerLengthInWave * this.levelData[this.level].wordLengths.length;
    document.querySelector("#level-clear-modal > .modal-details").innerText = `${this.destroyedThisWave}/${totalWordsInRound} words defeated`;
    document.getElementById("next-level-button").innerText = `Start Level ${this.level + 1}`;  // calls startNewLevel
  }
  displayGameOverModal() {
    document.getElementById("game-over-modal").classList.add("showing");
    document.querySelector("#game-over-modal > .modal-message").innerText = `GAME OVER`;
    document.getElementById("restart-button").innerText = `Restart`;
  }

  async prepareDictionaryForLevel(level) {
    let possibleWordLengths = this.levelData[level].wordLengths;
    let startTime = Date.now();
    let wordPoolSize = 200;
    for (let i = 0; i < possibleWordLengths.length; i++) {
      await this.fillDictionary(possibleWordLengths[i], wordPoolSize);

    }
    console.log(`%cGot ${wordPoolSize * possibleWordLengths.length} words in ${Date.now() - startTime}ms`, `color: lightgreen;`);
    console.log('final dict is', this.dictionary);
  }
}

