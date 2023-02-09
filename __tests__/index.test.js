
import Game from '../src/js/Game.js';
import WordShip from '../src/js/WordShip';
let game = new Game();

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

  test('should correctly add an entry to Game.dictionary based on wordLength and max parameters', () => {
    game.addWordsToDic([
      {word: 'add', score: 2393 },
      {word: 'box', score: 2393 },
      {word: 'off', score: 2393 },
    ], 3);
    expect(game.dictionary[3]).toBeTruthy();
    expect(game.dictionary[3].length).toEqual(3);
  });

  test('should add an entry to Game.dictionary whose members all have length wordLength', () => {
    game.addWordsToDic([
      {word: 'add', score: 2393 },
      {word: 'box', score: 2393 },
      {word: 'off', score: 2393 },
    ], 3);
    game.addWordsToDic([
      {word: 'gala', score: 2393 },
      {word: 'frog', score: 2393 },
      {word: 'bold', score: 2393 },
    ], 4);
    expect(game.dictionary[3].every(word => word.length === 3 )).toEqual(true);
    expect(game.dictionary[4].every(word => word.length === 3 )).toEqual(false);
  });
});

describe('Game.prototype.launchWordShip', () => {

  test('should add a member to game.activeWordShips which is an instance of WordShip', () => {
    game = new Game();
    game.dictionary[3] = ['bat'];
    game.launchWordShip('bat');
    let newWordShip = game.activeWordShips[game.activeWordShips.length - 1];
    expect(newWordShip instanceof WordShip).toEqual(true);
  });
});

describe('Game.prototype.dictionaryEmpty', () => {

  test('should correctly determine if game.dictionary is empty', () => {
    game = new Game();
    game.addWordsToDic([
      {word: 'add', score: 2393 },
      {word: 'box', score: 2393 },
      {word: 'off', score: 2393 },
    ], 3);
    let emptyGame = new Game();

    expect(game.dictionaryEmpty()).toEqual(false);
    expect(emptyGame.dictionaryEmpty()).toEqual(true);
  });
});