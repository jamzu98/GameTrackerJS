'use strict';
import spinner from './spinner.svg';

const appMain = document.querySelector('#app');
const textfield = document.querySelector('#name');
const gamesList = document.querySelector('.ul--games');
const btnAdd = document.querySelector('.btn--add');
const btnClear = document.querySelector('.btn--clear');
const errorModal = document.querySelector('.modal--error');
const completedList = document.querySelector('.ul--completed');
const playingToggle = document.querySelector('.span--playing');
const completedToggle = document.querySelector('.span--completed');
const spanTotal = document.querySelector('.span--total');
const btnExport = document.querySelector('.btn--export');
const modalExport = document.querySelector('.modal--export');
const textExport = document.querySelector('.p--export');
const spinnerModal = document.querySelector('.spinner--modal');
const { localStorage } = window;

const wait = function (time) {
  return new Promise((resolve) => setTimeout(resolve, time * 1000));
};

const getJSON = async function (url) {
  const response = await Promise.race([fetch(url), wait(6)]);
  const data = await response.json();
  if (!data) return console.log('took too long');
  return data;
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

const calculateTotal = async function () {
  if (getFromLocalStorage().length === 0) return 0;
  let total = 0;
  const gamesItem = localStorage.getItem('games');
  const allGames = JSON.parse(gamesItem);

  await Promise.all(
    allGames.map(async (x) => {
      const data = await getJSON(
        `https://api.jamimakkonen.com/api/hltb/${x.name}`
      );
      if (data[0] === undefined) return;
      const playtime = data[0].gameplayMain;
      total += playtime;
    })
  );
  return getFromLocalStorage().length === 0 ? 0 : total;
};

const setTotal = async function () {
  const total = await calculateTotal();
  spanTotal.textContent =
    total === 0 ? 'add games to calculate total' : `${total}h`;
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
  setTotal();
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
  setTotal();
};

const createGameModal = function (game) {
  return `
  <div class="modal--game">
    <div class="modal--header">
      <header class="header--game ${
        game.name.length > 22 ? 'smaller--text' : ''
      }">${game.name}</header>
      <button class="btn btn--close-modal">close</button>
    </div>
    <img src="${game.imageUrl}" alt="cover">
    <div class="information--container">
      <h3>Game Length</h3>
      <div class="time--container">
        Normal playthrough: ${game.timeMain}h <br>
        Normal + extra: ${game.timePlus}h <br>
        Completionist: ${game.timeComplete}h <br>
      </div>
    </div>
  </div>
  `;
};

const openGameModal = async function (game) {
  try {
    const gameNameClean = game.trim();
    const gameData = await getJSON(
      `https://api.jamimakkonen.com/api/hltb/${gameNameClean}`
    );
    if (gameData.length === 0)
      throw new Error('it brokey ;[ Try again with a different game');
    const {
      name,
      imageUrl,
      gameplayMain,
      gameplayMainExtra,
      gameplayCompletionist,
    } = gameData[0];
    const gameObj = {
      name: name,
      imageUrl: imageUrl,
      timeMain: gameplayMain,
      timePlus: gameplayMainExtra,
      timeComplete: gameplayCompletionist,
    };
    appMain.insertAdjacentHTML('afterend', createGameModal(gameObj));
    document
      .querySelector('.btn--close-modal')
      .addEventListener('click', function (e) {
        e.target.parentElement.parentElement.remove();
      });
  } catch (err) {
    console.error(err.message);
    renderError(err.message);
  }
};

const exportData = async function () {
  let data = [[], [], []];
  getFromLocalStorage().forEach((x) => data[0].push(x.name));
  getCompleted().forEach((x) => data[1].push(x.name));
  const total = await calculateTotal();
  data[2].push(total);
  console.log(data);
  return data;
};

const openExportModal = async function () {
  spinnerModal.classList.remove('hidden');
  modalExport.classList.remove('hidden');
  const data = await exportData();
  if (data[2][0] == 0 && data[1].length === 0) {
    spinnerModal.classList.add('hidden');
    return (textExport.textContent =
      'Nothing to export, add games to your list');
  }
  if (data[0].length === 0 && data[1].length >= 1) {
    spinnerModal.classList.add('hidden');
    return (textExport.textContent = `Completed: ${data[1]}`);
  }
  textExport.textContent = `Playing: ${data[0]}, It would take: ${
    data[2]
  } hours to complete ${data[0].length === 1 ? 'it' : 'them all'}. ${
    data[1].length === 0 ? '' : `Completed: ${data[1]}`
  }`;
  spinnerModal.classList.add('hidden');
};

modalExport.addEventListener('click', function (e) {
  if (!e.target.classList.contains('btn--close-export')) return;
  modalExport.classList.add('hidden');
  textExport.textContent = ``;
});

btnExport.addEventListener('click', openExportModal);

btnClear.addEventListener('click', clearList);

btnAdd.addEventListener('click', (e) => {
  e.preventDefault();

  const name = textfield.value;
  if (!name || !/^[a-zA-Z0-9 :]+$/.test(name)) {
    renderError('Please enter a valid game name');
    return;
  }
  const id = Date.now();

  addGame({ id, name }, gamesList);
  saveToLocalStorage(getFromLocalStorage().concat([{ id, name }]));
  clear();
  setTotal();
});

gamesList.addEventListener('click', function (e) {
  if (!e.target.classList.contains('btn--remove')) return;

  const id = e.target.closest('.list--item--container').getAttribute('data-id');
  const games = getFromLocalStorage().filter((game) => game.id !== Number(id));

  localStorage.removeItem(id);

  saveToLocalStorage(games);
  e.target.closest('.list--item--container').remove();
  setTotal();
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
  setTotal();
});

completedList.addEventListener('click', function (e) {
  if (e.target.classList.contains('btn--remove')) {
    const id = e.target
      .closest('.list--item--container')
      .getAttribute('data-id');
    const games = getCompleted().filter((game) => game.id !== Number(id));

    localStorage.removeItem(id);

    saveCompleted(games);
    e.target.closest('.list--item--container').remove();
  }
});

const spans = [playingToggle, completedToggle];
spans.forEach(function (element) {
  element.addEventListener('click', function (e) {
    e.target.parentElement.parentElement
      .querySelector('ul')
      .classList.toggle('hidden');
    e.target.textContent === 'show'
      ? (e.target.textContent = 'hide')
      : (e.target.textContent = 'show');
  });
});

const containers = [gamesList, completedList];

containers.forEach(function (element) {
  element.addEventListener('click', function (e) {
    if (!e.target.classList.contains('list--item')) return;
    const query = e.target.textContent;
    openGameModal(query);
  });
});
