export default class WordShip {
  constructor(word) {
    this.word = word;
    this.element = document.createElement('div');
    this.element.classList.add('word-ship');
    this.element.innerText = word;
    
  }
}