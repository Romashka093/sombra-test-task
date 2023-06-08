'use strict';

const refs = {
  activity: document.querySelector('.activity'),
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
    this.width = width;
    this.height = height;
    this.cols = cols;
    this.rows = rows;
    this.timeLimit = timeLimit;
    this.theme = theme;

    this.activity = refs.activity;
    this.grid = refs.grid;
    this.startButton = refs.startButton;
    this.replayButton = refs.replayButton;
    this.pauseButton = refs.pauseButton;
    this.timerElement = refs.timerElement;

    this.cards = [];
    this.gridLength = cols * rows;

    this.items = [];
    this.flippedItems = [];
    this.matchedItems = [];
    this.timer = null;
    this.timeLeft = this.timeLimit;

    this.isPaused = false;
    this.isGameOver = false;

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
    }
  }

  addListeners() {
    this.startButton.addEventListener('click', () => this.startGame());
    this.replayButton.addEventListener('click', () => this.replayGame());
    this.pauseButton.addEventListener('click', () => this.pauseGame());
  }

  startGame() {
    this.startButton.disabled = true;
    this.pauseButton.disabled = false;

    this.timerElement.innerText = `Time left: ${this.timeLeft}`;

    this.shuffleItems();

    this.timer = setInterval(() => this.updateTimer(), 1000);

    this.grid.addEventListener('click', event => this.flipItem(event.target));
    document.addEventListener('mouseout', event => {
      const bounds = this.activity.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      ) {
        if (!this.isPaused && !this.isGameOver) {
          this.pauseGame();
        }
      }
    });
  }

  replayGame() {
    this.resetGame();
    this.startGame();
  }

  pauseGame() {
    this.isPaused = !this.isPaused;
    this.pauseButton.innerText = this.isPaused ? 'Resume' : 'Pause';

    this.isPaused
      ? this.pauseButton.classList.add('alert')
      : this.pauseButton.classList.remove('alert');
  }

  flipItem(item) {
    if (item.nodeName !== 'LI') {
      return;
    }
    if (item.value === undefined) {
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
      anime({
        targets: item,
        translateY: ['-15', '0'],
        opacity: ['0', '1'],
        easing: 'easeInOutSine',
        duration: 223,
        complete: function (anim) {
          anim.playing = false;
        },
      });

      if (this.flippedItems.length === 2) {
        this.checkMatch();
      }
    }
    if (this.flippedItems.length > 2) {
      this.flippedItems = [];
      item.innerText = '';
      item.classList.remove('flipped');
      item.classList.add('timeout');
      anime({
        targets: item,
        translateY: ['0', '0'],
        opacity: ['1', '1'],
        easing: 'easeInOutSine',
        complete: function (anim) {
          anim.playing = false;
        },
      });
      setTimeout(() => {
        item.innerText = '?';
        item.classList.remove('timeout', 'flipped');
      }, 523);
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
          anime({
            targets: '.item',
            translateY: ['0', '0'],
            opacity: ['0', '1'],
            easing: 'easeInOutSine',
            duration: 0,
            complete: function (anim) {
              anim.playing = false;
            },
          });
          this.endGame(true);
        }
      } else {
        setTimeout(() => {
          item1.innerText = '?';
          item2.innerText = '?';
          item1.classList.remove('flipped');
          item2.classList.remove('flipped');
          this.flippedItems = [];
          anime({
            targets: (item1, item2),
            translateY: ['0', '0'],
            opacity: ['0', '1'],
            easing: 'easeInOutSine',
            duration: 223,
            complete: function (anim) {
              anim.playing = false;
            },
          });
        }, 669);
      }
    }
  }

  shuffleItems() {
    for (let i = this.items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.items[i], this.items[j]] = [this.items[j], this.items[i]];
    }

    this.items.forEach((item, index) => {
      item.style.order = index;
    });
  }

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
    clearInterval(this.timer);
    this.isGameOver = true;

    if (isWin) {
      this.timerElement.innerText = 'You win!';
      anime({
        targets: '.grid .item',
        scale: [
          { value: 0.1, easing: 'easeOutSine', duration: 500 },
          { value: 1, easing: 'easeInOutQuad', duration: 1200 },
        ],
        delay: anime.stagger(223, {
          grid: [this.rows, this.cols],
          from: 'center',
        }),
      });
    } else {
      this.timerElement.innerText = 'Time is up!';

      this.items.forEach(item => {
        if (
          item.classList.contains('matched') &&
          item.classList.contains('flipped')
        ) {
          return;
        }
        item.classList.add('timeout');
        setTimeout(() => {
          item.innerText = item.value;
        }, 669);
      });

      anime({
        targets: '.grid .item',
        scale: [
          { value: 0.1, easing: 'easeOutSine', duration: 500 },
          { value: 1, easing: 'easeInOutQuad', duration: 1200 },
        ],
        delay: anime.stagger(0, {
          grid: [this.rows, this.cols],
          from: 'center',
        }),
      });
    }

    this.replayButton.disabled = false;
    this.pauseButton.disabled = true;
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
      item.classList.remove('flipped', 'matched', 'timeout');
    });

    this.timerElement.innerText = 'Time left: 0';

    this.replayButton.disabled = true;
    this.pauseButton.disabled = true;
    this.pauseButton.innerText = 'Pause';

    this.flippedItems = [];
    this.matchedItems = [];
  }
}

new MatchGrid({
  width: 400,
  height: 400,
  cols: 3,
  rows: 4,
  timeLimit: 10,
  theme: { colors: ['#4CAF50', '#2196F3'] },
});
