('use strict');
import { CardList } from './cards.js';

const refs = {
  activity: document.querySelector('.activity'),
  grid: document.querySelector('.grid'),
  startButton: document.querySelector('#start'),
  replayButton: document.querySelector('#replay'),
  pauseButton: document.querySelector('#pause'),
  timerElement: document.querySelector('#timer'),
};

class MatchGrid {
  constructor({ width, height, cols, rows, timeLimit, theme }) {
    this.width = width;
    this.height = height;
    this.cols = cols;
    this.rows = rows;
    this.timeLimit = timeLimit;
    this.theme = theme;

    Object.assign(this, refs);
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
    // REVIEW: using CSS custom properties is good, the same you could do for width and height
    // using CSS grid is good
    this.grid.style.setProperty('--cols', this.cols);
    this.grid.style.setProperty('--rows', this.rows);
    this.grid.style.setProperty('--width', `${this.width}px`);
    this.grid.style.setProperty('--height', `${this.height}px`);

    // REVIEW: since card have its' own behavior it would be better to have class Card here
    // in general, class MatchGrid is quite complicated,
    // except Card class it's possible to have another classes, e.g. Timer and move appropriate logic to them
    const items = new CardList(this.gridLength)?.items;
    items.forEach(card => this.grid?.append(card));
    this.items = items;
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
    // using Event Delegation is good
    this.grid.addEventListener('click', event => this.flipItem(event.target));
    document.addEventListener('mouseout', event => {
      // REVIEW: it would be better if you move this nested if logic in another method or use Guard Clause here
      // imho you should check isPaused/isGameOver state and then do calculations with boundingClientRect:
      /*
        if (!this.isPaused && !this.isGameOver) return;
        ** and then check if your mouse is out of game window **
       */
      //

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
    // REVIEW: using Guard Clauses is good
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
    // REVIEW: since you used "return" here it's not necessary to wrap another part of condition in "else" block
    // QUESTION: is this considered a critical error, because during written code not always see what can make better
    if (item1.id === item2.id) {
      return;
    }
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
  timeLimit: 100,
  theme: { colors: ['#4CAF50', '#2196F3'] },
});
