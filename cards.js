import { createDoubleUniqueArray } from './helpers.js';

export class CardList {
  constructor(gridLength) {
    this.cards = createDoubleUniqueArray(gridLength);
    this.items = [];

    this.createCard();
  }
  createCard() {
    for (let index = 0; index < this.cards.length; index++) {
      const element = this.cards[index].number;
      const item = document.createElement('li');
      item.className = 'item';
      item.innerText = '?';
      item.id = index + 1;
      item.value = element;
      this.items.push(item);
    }
  }
}
