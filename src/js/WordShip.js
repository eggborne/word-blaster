import { randomInt } from "./util.js";

export default class WordShip {
  constructor(word) {
    this.word = word;
    this.element = document.createElement('div');
    this.element.classList.add('word-ship');
    this.element.classList.add('obscured');
    this.element.classList.add('descending');
    this.element.innerText = word;
    this.focusLayer = document.createElement('div');
    this.focusLayer.classList.add('focus-layer');
    this.element.append(this.focusLayer);
    document.querySelector('main').append(this.element);
    this.width = this.element.offsetWidth;
    console.log('width', this.width)
    this.element.style.left = randomInt(0, (window.innerWidth - this.width)) + 'px';
  }
}