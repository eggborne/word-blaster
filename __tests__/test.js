
import Game from '../src/index.js';
let game;

describe('Game.prototype.matchesSoFar', () => {

  beforeEach(() => {
    game = new Game();
    game.playerInput = 'a';
    
  });

  test('should correctly determine if the first letter of two strings are equal', () => {
    let matching = game.matchesSoFar('a');
    let notMatching = game.matchesSoFar('b');
    expect(matching).toEqual(true);
    expect(notMatching).toEqual(false);
  });
  
  test('should correctly determine if a shorter string exists in a longer string at position 0', () => {
    
    let matching = game.matchesSoFar('ab');
    let notMatching = game.matchesSoFar('ba');
    
    expect(matching).toEqual(true);
    expect(notMatching).toEqual(false);
    
  });
});

describe('Game.prototype.addWordsToDic', () => {

  beforeEach(() => {
    game = new Game();    
  });

  test('should correctly add an entry to Game.dictionary based on wordLength and max parameters', async () => {
    game.addWordsToDic([
      {word: 'add', score: 2393 },
      {word: 'box', score: 2393 },
      {word: 'off', score: 2393 },
    ], 3);
    expect(game.dictionary[3]).toBeTruthy();
    expect(game.dictionary[3].length).toEqual(3);
  });

  test('should add an entry to Game.dictionary whose members all have length wordLength', async () => {
    game.addWordsToDic([
      {word: 'add', score: 2393 },
      {word: 'box', score: 2393 },
      {word: 'off', score: 2393 },
    ], 3);
    expect(game.dictionary[3].every(word => { 
      return word.length === 3;
    })).toEqual(true);
  });
});