import { randomInt } from "./util.js";

export class WordShip {
  constructor(word) {
    this.word = word;
    this.element = document.createElement('div');
    this.element.classList.add('word-ship');
    this.element.classList.add('obscured');
    this.element.classList.add('descending');
    this.element.classList.add('bomb');
    if (randomInt(0, 1)) {
      this.element.style.transitionTimingFunction = 'ease-out';
    }
    this.element.innerText = word;
    this.focusLayer = document.createElement('div');
    this.focusLayer.classList.add('focus-layer');
    this.element.append(this.focusLayer);
    document.querySelector('main').append(this.element);
    this.width = this.element.offsetWidth;
    this.element.style.minHeight = this.width + 'px';
    this.element.style.left = randomInt(0, (window.innerWidth - this.width)) + 'px';
  }
}

export class SentenceShip extends WordShip {
  constructor() {
    super();
  }
}