'use strict';

const refs = {
  grid: document.querySelector('.grid'),
  startButton: document.querySelector('#start'),
  replayButton: document.querySelector('#replay'),
  pauseButton: document.querySelector('#pause'),
  timerElement: document.querySelector('#timer'),
};

const createDoubleUniqueArray = length => {
  const uniqueArray = Array.from({ length: length / 2 }, (_, index) => ({
    number: index + 1,
  }));

  return uniqueArray
    .flatMap(card => [card, { ...card }])
    .sort(() => Math.random() - 0.5);
};

class MatchGrid {
  constructor({ width, height, cols, rows, timeLimit, theme }) {
    // 
    this.width = width;
    this.height = height;
    this.cols = cols;
    this.rows = rows;
    this.timeLimit = timeLimit;
    this.theme = theme;
    //
    this.grid = refs.grid;
    this.startButton = refs.startButton;
    this.replayButton = refs.replayButton;
    this.pauseButton = refs.pauseButton;
    this.timerElement = refs.timerElement;
    //
    this.cards = [];
    this.gridLength = cols * rows;
    //
    this.items = [];
    this.flippedItems = [];
    this.matchedItems = [];
    this.timer = null;
    this.timeLeft = timeLimit;
    //
    this.isPaused = false;
    this.isGameOver = false;
    //
    this.init();
  }

  init() {
    this.createGrid();
    this.addListeners();
  }

  createGrid() {
    this.grid.style.setProperty('--cols', this.cols);
    this.grid.style.setProperty('--rows', this.rows);
    this.grid.style.setProperty('width', `${this.width}px`);
    this.grid.style.setProperty('height', `${this.height}px`);

    this.cards = createDoubleUniqueArray(this.gridLength);

    for (let index = 0; index < this.cards.length; index++) {
      const element = this.cards[index].number;
      const item = document.createElement('li');
      item.className = 'item';
      item.innerText = '?';
      item.id = index + 1;
      item.value = element;
      this.grid.appendChild(item);
      this.items.push(item);
    }``
  }

  addListeners() {
    this.startButton.addEventListener('click', () => this.startGame());
    this.replayButton.addEventListener('click', () => this.replayGame());
    this.pauseButton.addEventListener('click', () => this.pauseGame());
    this.grid.addEventListener('click', event => this.flipItem(event.target));
  }

  startGame() {
    this.timerElement.innerText = `Time left: ${this.timeLeft}`;
    
    this.timer = setInterval(() => this.updateTimer(), 1000);
  }

  replayGame() {
    this.resetGame();
    this.startGame();
  }

  pauseGame() {
    this.isPaused = !this.isPaused;
    this.pauseButton.innerText = this.isPaused ? 'Resume' : 'Pause';
  }

  flipItem(item) {
    if (item.nodeName !== 'LI') {
      return;
    }
    if (
      item.classList.contains('flipped') ||
      item.classList.contains('matched') ||
      this.flippedItems.includes(item)
    ) {
      return;
    }

    if (!this.isPaused && !this.isGameOver) {
      item.innerText = item.value;
      item.classList.add('flipped');
      this.flippedItems.push(item);

      if (this.flippedItems.length === 2) {
        this.checkMatch();
      }
    }
  }

  checkMatch() {
    const [item1, item2] = this.flippedItems;
    if (item1.id === item2.id) {
      return;
    } else {
      if (item1.value === item2.value) {
        item1.classList.add('matched');
        item2.classList.add('matched');
        this.matchedItems.push(item1, item2);
        this.flippedItems = [];

        if (this.matchedItems.length === this.items.length) {
          this.endGame(true);
        }
      } else {
        setTimeout(() => {
          item1.innerText = '?';
          item2.innerText = '?';
          item1.classList.remove('flipped');
          item2.classList.remove('flipped');
          this.flippedItems = [];
        }, 669);
      }
    }
  }

  shuffle() {}

  updateTimer() {
    if (!this.isPaused && !this.isGameOver) {
      this.timeLeft--;
      this.timerElement.innerText = `Time left: ${this.timeLeft}`;

      if (this.timeLeft === 0) {
        this.endGame(false);
      }
    }
  }

  endGame(isWin) {
    this.isGameOver = true;
    clearInterval(this.timer);

    if (isWin) {
      alert('You win!')
    } else {
      alert('Time is up!')
    }
  }

  resetGame() {
    clearInterval(this.timer);
    this.timeLeft = this.timeLimit;
    this.isPaused = false;
    this.isGameOver = false;
    this.flippedItems = [];
    this.matchedItems = [];

    this.items.forEach(item => {
      item.innerText = '?';
      item.classList.remove('flipped', 'matched');
    });

    this.timerElement.innerText = 'Time left: 0';
    this.pauseButton.innerText = 'Pause';
    this.grid.removeEventListener('click', event =>
      this.flipItem(event.target),
    );
  }
}

new MatchGrid({
  width: 400,
  height: 400,
  cols: 4,
  rows: 4,
  timeLimit: 60,
  theme: { colors: ['#4CAF50', '#2196F3'] },
});
