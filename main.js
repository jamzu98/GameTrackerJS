'use strict';
import './style.css';

const textfield = document.querySelector('#name');
const gamesList = document.querySelector('.ul--games');
const btnAdd = document.querySelector('.btn--add');
const btnClear = document.querySelector('.btn--clear');
const errorModal = document.querySelector('.modal--error');
const completedList = document.querySelector('.ul--completed');
const playingToggle = document.querySelector('.span--playing');
const completedToggle = document.querySelector('.span--completed');
const { localStorage } = window;

const wait = function (time) {
  return new Promise((resolve) => setTimeout(resolve, time * 1000));
};

const saveToLocalStorage = function (items) {
  localStorage.setItem('games', JSON.stringify(items));
};

const saveCompleted = function (items) {
  localStorage.setItem('completed', JSON.stringify(items));
};

const getFromLocalStorage = function () {
  const games = localStorage.getItem('games');
  return games ? JSON.parse(games) : [];
};

const getCompleted = function () {
  const completed = localStorage.getItem('completed');
  return completed ? JSON.parse(completed) : [];
};

const generateMarkup = function ({ id, name }, completed = false) {
  return `
  <div class="list--item--container" data-id="${id}">
    <li class="list--item">${name}</li>
    <buttons-container>
      <button class="btn btn--remove" title="Remove game from the list">X</ button>
      ${
        completed === true
          ? ``
          : `<button class="btn btn--complete" title="Add game to completed">
            ✓
          </button>`
      }
    </buttons-container>
  </div>
  `;
};

const renderError = async function (err) {
  errorModal.classList.remove('hidden');
  errorModal.classList.add('border-animation');
  errorModal.querySelector('.msg').textContent = err;
  await wait(4);
  errorModal.classList.add('hidden');
  errorModal.classList.remove('border-animation');
};

const addGame = function ({ id, name }, target, completed = false) {
  target.insertAdjacentHTML(
    'beforeend',
    generateMarkup({ id, name }, completed)
  );
};

const clear = function () {
  textfield.value = '';
};

const init = function init() {
  clear();

  const games = getFromLocalStorage();
  games.forEach((game) => addGame(game, gamesList));
  const completed = getCompleted();
  completed.forEach((game) => addGame(game, completedList, true));
};

init();

const clearList = function () {
  const confirmation = confirm(
    'Are you sure you want to clear local storage? ALL data will be lost.'
  );
  if (!confirmation) return;

  gamesList.innerHTML = '';
  completedList.innerHTML = '';
  saveToLocalStorage([]);
  saveCompleted([]);
};

btnClear.addEventListener('click', clearList);

btnAdd.addEventListener('click', (e) => {
  e.preventDefault();

  const name = textfield.value;
  if (!name) {
    renderError('Please enter a valid game name');
    return;
  }
  const id = Date.now();

  addGame({ id, name }, gamesList);
  saveToLocalStorage(getFromLocalStorage().concat([{ id, name }]));
  clear();
});

gamesList.addEventListener('click', function (e) {
  if (!e.target.classList.contains('btn--remove')) return;

  const id = e.target.closest('.list--item--container').getAttribute('data-id');
  const games = getFromLocalStorage().filter((game) => game.id !== Number(id));

  console.log(id);
  localStorage.removeItem(id);

  saveToLocalStorage(games);
  e.target.closest('.list--item--container').remove();
});

gamesList.addEventListener('click', function (e) {
  if (!e.target.classList.contains('btn--complete')) return;

  // Get the list item container
  const container = e.target.closest('.list--item--container');
  // Get the id of the list item
  const id = container.getAttribute('data-id');

  // Remove the list item from the gamesList
  container.remove();

  // Get the game with the specified id from localStorage
  const games = getFromLocalStorage();
  const game = games.find((game) => game.id === Number(id));
  // Add the game to the completedList
  addGame(game, completedList, true);
  localStorage.removeItem(id);
  const gamesnew = getFromLocalStorage().filter(
    (game) => game.id !== Number(id)
  );
  saveToLocalStorage(gamesnew);
  saveCompleted(getCompleted().concat([game]));
});

completedList.addEventListener('click', function (e) {
  if (e.target.classList.contains('btn--remove')) {
    const id = e.target
      .closest('.list--item--container')
      .getAttribute('data-id');
    const games = getCompleted().filter((game) => game.id !== Number(id));

    console.log(id);
    localStorage.removeItem(id);

    saveCompleted(games);
    e.target.closest('.list--item--container').remove();
  }
});

const spans = [playingToggle, completedToggle];
spans.forEach(function (element) {
  element.addEventListener('click', function (e) {
    console.log(e);
    e.target.parentElement.parentElement
      .querySelector('ul')
      .classList.toggle('hidden');
    e.target.textContent === 'show'
      ? (e.target.textContent = 'hide')
      : (e.target.textContent = 'show');
  });
});
