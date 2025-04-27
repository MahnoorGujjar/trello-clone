"use strict";
    
const e_mainContainer = document.getElementById('main-container');
const e_cardsContainer = document.getElementById('cards-container');

const e_sidebar = document.getElementById('sidebar');
const e_sidebarButton = document.getElementById('sidebar-button');
const e_sidebarClose = document.getElementById('sidebar-close');

const e_addCardText = document.getElementById('add-card-text');
const e_addCardButton = document.getElementById('add-card-button');

const e_boardsList = document.getElementById('boards-list');
const e_addBoardText = document.getElementById('add-board-text');
const e_addBoardButton = document.getElementById('add-board-button');

const e_saveButton = document.getElementById('save-button');
const e_settingsButton = document.getElementById('settings-button');
const e_deleteButton = document.getElementById('delete-button');

const e_cardContextMenu = document.getElementById('card-context-menu');
const e_cardContextMenuDelete = document.getElementById('card-context-menu-delete');
const e_cardContextMenuClear = document.getElementById('card-context-menu-clear');
const e_cardContextMenuDuplicate = document.getElementById('card-context-menu-duplicate');

const e_title = document.getElementById('title');

let appData = {
    'boards': [],
    'settings': {
        'userName': "User",
        'dataPersistence': true
    },
    'currentBoard': 0,  // The index of the currently open board.
    'identifier': 0
};

let cardDrag_mouseDown = false;
let cardDrag_mouseDownOn = null;
let scroll_mouseDown = false;
let scroll_startX, scroll_scrollLeft;
let cardContextMenu_currentCard;
Array.prototype.move = function(from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
};

Array.prototype.insert = function(index, item) {
    this.splice(index, 0, item);
};

function uniqueID() {
    appData.identifier += 1;
    return 'b' + appData.identifier;
}

function currentCards() {
    return appData.boards[appData.currentBoard].cards;
}

function currentBoard() {
    return appData.boards[appData.currentBoard];
}

function getMouseOverCard() {
    return document.querySelectorAll('.parent-card:hover')[0];
}

function getMouseOverItem() {
    return document.querySelectorAll('.parent-card > ul > li:hover')[0];
}

function getItemFromElement(element) {
    for (let _card of currentCards()) {
        for (let _item of _card.items) {
            if (_item.id === element.id) {
                return _item;
            }
        }
    }
}

function getCardFromElement(element) {
    return currentCards().find(e => e.id === element.id);
}

function getBoardFromId(id) {
    return appData.boards.find(_b => _b.id === id);
}

function toggleHoverStyle(show) {
    if (show) {
        let _hoverStyle = document.createElement('style');
        _hoverStyle.id = "dragHover";

        _hoverStyle.innerHTML = ".parent-card:hover {background-color: #c7cbd1;}.parent-card > ul > li:hover {background-color: #d1d1d1;}";
        document.body.appendChild(_hoverStyle);
    } else {
        let _hoverStyle = document.getElementById('dragHover');
        if (_hoverStyle) {
            _hoverStyle.parentNode.removeChild(_hoverStyle);
        }
    }
}

function createBoard(name, id, settings = { theme: null }, identifier = 0) {
    return {
        name: name,
        id: id,
        settings: settings,
        cards: [],
        identifier: identifier
    };
}

function uniqueBoardID(board) {
    board.identifier += 1;
    return 'e' + board.identifier.toString();
}

function addBoard() {
    let _boardTitle = e_addBoardText.value;
    if (!_boardTitle) return alert("Type a name for the board!");  
    if (appData.boards.length >= 512) return alert("Max limit for boards reached."); 
    e_addBoardText.value = '';

    let _newBoard = createBoard(_boardTitle, uniqueID(), { 'theme': null });
    appData.boards.push(_newBoard);
    listBoards();
}

function listBoards() {
    e_boardsList.innerHTML = '';
    for (let _board of appData.boards) {
        let _boardTitle = document.createElement('li');
        _boardTitle.innerText = _board.name;
        _boardTitle.id = _board.id;
        if (_board.id === currentBoard().id) _boardTitle.classList.add('is-active');
        _boardTitle.addEventListener('click', () => {
            renderBoard(_board);
            listBoards();
        });
        e_boardsList.appendChild(_boardTitle);
    }
}

function renderBoard(board) {
    appData.currentBoard = appData.boards.indexOf(board);
    document.title = 'Kards | ' + currentBoard().name;
    e_title.innerText = currentBoard().name;
    renderCards();
}

function createCard(name, id, parentBoardId) {
    return {
        name: name,
        items: [],
        id: id,
        parentBoardId: parentBoardId
    };
}

function addCardToBoard(board) {
    let _cardTitle = e_addCardText.value;
    e_addCardText.value = '';

    if (!_cardTitle) _cardTitle = `Untitled Card ${board.cards.length + 1}`;

    let _card = createCard(_cardTitle, uniqueBoardID(board), board.id);
    board.cards.push(_card);

    let _newCard = renderCardElement(_card);
    e_cardsContainer.insertBefore(_newCard, e_cardsContainer.childNodes[e_cardsContainer.childNodes.length - 2]);
}

function renderCardElement(card) {
    let _newCardHeader = document.createElement('span');
    let _newCardHeaderTitle = document.createElement('h2');
    _newCardHeaderTitle.id = card.id + '-h2';
    _newCardHeaderTitle.innerText = card.name;
    _newCardHeaderTitle.classList.add('text-fix', 'card-title');

    _newCardHeaderTitle.addEventListener('click', (e) => {
        let _input = document.createElement('input');
        _input.value = _newCardHeaderTitle.textContent;
        _input.classList.add('card-title');
        _input.maxLength = 128;
        _newCardHeaderTitle.replaceWith(_input);

        let _save = () => {
            card.name = _input.value;
            renderCards();
        };

        _input.addEventListener('blur', _save, {
            once: true,
        });
        _input.focus();
    });

    let _newCardHeaderMenu = document.createElement('i');
    _newCardHeaderMenu.ariaHidden = true;
    _newCardHeaderMenu.classList.add("fa", "fa-bars");
    _newCardHeader.append(_newCardHeaderTitle);
    _newCardHeader.append(_newCardHeaderMenu);
    _newCardHeaderMenu.addEventListener('click', cardContextMenu_show);

    let _newInput = document.createElement('input');
    _newInput.id = card.id + '-input';
    _newInput.maxLength = 256;
    _newInput.type = 'text';
    _newInput.name = "add-todo-text";
    _newInput.placeholder = "Add Task...";
    _newInput.addEventListener('keyup', (e) => {
        if (e.code === "Enter") _newButton.click();
    });

    let _newButton = document.createElement('button');
    _newButton.id = card.id + '-button';
    _newButton.classList.add("plus-button");
    _newButton.innerText = '+';
    _newButton.addEventListener('click', () => {
        let _inputValue = _newInput.value;
        if (!_inputValue) return alert("Type a name for the item!");
        let _item = createItem(_inputValue, null, uniqueBoardID(getBoardFromId(card.parentBoardId)), card.id);
        addItemToCard(card, _item);
        _newInput.value = '';
    });

    let _newCard = document.createElement('div');
    _newCard.id = card.id;
    _newCard.classList.add('parent-card');
    _newCard.appendChild(_newCardHeader);

    if (card.items && card.items.length > 0) {
let _newList = document.createElement('ul');
_newList.id = card.id + '-list';

for (let _item of card.items) {
    let _newItem = renderItemElement(_item);
    _newList.appendChild(_newItem);
}

_newCard.appendChild(_newList);
}

_newCard.appendChild(_newInput);
_newCard.appendChild(_newButton);

_newCard.setAttribute('draggable', 'true');
_newCard.addEventListener('dragstart', handleDragStart);
_newCard.addEventListener('dragover', handleDragOver);
_newCard.addEventListener('drop', handleDrop);
_newCard.addEventListener('dragend', handleDragEnd);

return _newCard;
}

function createItem(name, description, id, parentCardId) {
return {
    name: name,
    description: description,
    id: id,
    parentCardId: parentCardId
};
}

function renderItemElement(item) {
let _newItem = document.createElement('li');
_newItem.id = item.id;

let _newItemText = document.createElement('span');
_newItemText.classList.add('text-fix');

let _newItemTitle = document.createElement('textarea');
_newItemTitle.innerText = item.name;
_newItemTitle.classList.add('item-title');
_newItemTitle.readOnly = true;

_newItemTitle.addEventListener('click', (e) => {
    _newItemTitle.readOnly = false;
    _newItemTitle.focus();
});

_newItemTitle.addEventListener('blur', (e) => {
    item.name = _newItemTitle.value;
    _newItemTitle.readOnly = true;
});

_newItem.setAttribute('draggable', 'true');
_newItem.addEventListener('dragstart', handleItemDragStart);
_newItem.addEventListener('dragover', handleItemDragOver);
_newItem.addEventListener('drop', handleItemDrop);
_newItem.addEventListener('dragend', handleItemDragEnd);

_newItemText.appendChild(_newItemTitle);
_newItem.appendChild(_newItemText);

let _newItemDelete = document.createElement('i');
_newItemDelete.ariaHidden = true;
_newItemDelete.classList.add("fa", "fa-trash");
_newItemDelete.addEventListener('click', () => {
    if (confirm("Are you sure you want to delete this item?")) {
        removeItemFromCard(getCardFromElement(document.getElementById(item.parentCardId)), item);
    }
});

_newItem.appendChild(_newItemDelete);
return _newItem;
}

function addItemToCard(card, item) {
card.items.push(item);

let _list = document.getElementById(card.id + '-list');

if (!_list) {
    _list = document.createElement('ul');
    _list.id = card.id + '-list';
    
    let _card = document.getElementById(card.id);
    let _input = document.getElementById(card.id + '-input');
    _card.insertBefore(_list, _input);
}

let _newItem = renderItemElement(item);
_list.appendChild(_newItem);
}

function removeItemFromCard(card, item) {
let _itemIndex = card.items.findIndex(i => i.id === item.id);

if (_itemIndex > -1) {
    card.items.splice(_itemIndex, 1);
    
    let _itemElement = document.getElementById(item.id);
    if (_itemElement) {
        _itemElement.parentNode.removeChild(_itemElement);
    }
    
    if (card.items.length === 0) {
        let _list = document.getElementById(card.id + '-list');
        if (_list) {
            _list.parentNode.removeChild(_list);
        }
    }
}
}

function renderCards() {

let addColumnButton = document.getElementById('add-column');
e_cardsContainer.innerHTML = '';
e_cardsContainer.appendChild(addColumnButton);

for (let _card of currentCards()) {
    let _newCard = renderCardElement(_card);
    e_cardsContainer.insertBefore(_newCard, addColumnButton);
}
}

function cardContextMenu_show(e) {
e.preventDefault();

let _card = e.target.closest('.parent-card');
cardContextMenu_currentCard = getCardFromElement(_card);

e_cardContextMenu.style.left = `${e.pageX}px`;
e_cardContextMenu.style.top = `${e.pageY}px`;
e_cardContextMenu.classList.add('visible');

document.addEventListener('click', cardContextMenu_hide);
}

function cardContextMenu_hide(e) {
if (e && e_cardContextMenu.contains(e.target)) return;

e_cardContextMenu.classList.remove('visible');
document.removeEventListener('click', cardContextMenu_hide);
}

function handleDragStart(e) {
this.classList.add('dragging');
e.dataTransfer.setData('text/plain', this.id);
toggleHoverStyle(true);
}

function handleDragOver(e) {
e.preventDefault();
}

function handleDrop(e) {
e.preventDefault();
const draggedId = e.dataTransfer.getData('text/plain');
const draggedElement = document.getElementById(draggedId);

if (draggedElement && this !== draggedElement) {
    const draggedIndex = Array.from(e_cardsContainer.children).indexOf(draggedElement);
    const dropIndex = Array.from(e_cardsContainer.children).indexOf(this);
    
    currentBoard().cards.move(draggedIndex, dropIndex);
    
    renderCards();
}
}

function handleDragEnd() {
this.classList.remove('dragging');
toggleHoverStyle(false);
}

function handleItemDragStart(e) {
this.classList.add('dragging');
e.dataTransfer.setData('text/plain', this.id);
toggleHoverStyle(true);
}

function handleItemDragOver(e) {
e.preventDefault();
}

function handleItemDrop(e) {
e.preventDefault();
const draggedId = e.dataTransfer.getData('text/plain');
const draggedElement = document.getElementById(draggedId);

if (draggedElement && this !== draggedElement) {
    const draggedItem = getItemFromElement(draggedElement);
    const dropItem = getItemFromElement(this);
    
    const sourceCard = getCardFromElement(document.getElementById(draggedItem.parentCardId));
    const targetCard = getCardFromElement(document.getElementById(dropItem.parentCardId));
    
    const draggedIndex = sourceCard.items.findIndex(i => i.id === draggedItem.id);
    if (draggedIndex > -1) {
        sourceCard.items.splice(draggedIndex, 1);
    }
    
    const dropIndex = targetCard.items.findIndex(i => i.id === dropItem.id);
    draggedItem.parentCardId = targetCard.id;
    targetCard.items.splice(dropIndex, 0, draggedItem);
    
    renderCards();
}
}

function handleItemDragEnd() {
this.classList.remove('dragging');
toggleHoverStyle(false);
}

function saveData() {
if (appData.settings.dataPersistence) {
    try {
        localStorage.setItem('kards-data', JSON.stringify(appData));
        alert("Boards saved successfully!");
    } catch (error) {
        console.error("Error saving data:", error);
        alert("Error saving data. Please try again.");
    }
}
}

function loadData() {
try {
    const savedData = localStorage.getItem('kards-data');
    if (savedData) {
        appData = JSON.parse(savedData);
        
        if (appData.boards.length === 0) {
            createDefaultBoard();
        }
        
        renderBoard(currentBoard());
        listBoards();
    } else {
        createDefaultBoard();
        renderBoard(currentBoard());
        listBoards();
    }
} catch (error) {
    console.error("Error loading data:", error);
    createDefaultBoard();
    renderBoard(currentBoard());
    listBoards();
}
}

function createDefaultBoard() {
let defaultBoard = createBoard("My First Board", uniqueID(), { theme: null });
appData.boards.push(defaultBoard);

let todoCard = createCard("To Do", uniqueBoardID(defaultBoard), defaultBoard.id);
let inProgressCard = createCard("In Progress", uniqueBoardID(defaultBoard), defaultBoard.id);
let doneCard = createCard("Done", uniqueBoardID(defaultBoard), defaultBoard.id);

let item1 = createItem("Create a Kanban board", null, uniqueBoardID(defaultBoard), todoCard.id);
let item2 = createItem("Learn about drag and drop", null, uniqueBoardID(defaultBoard), todoCard.id);
let item3 = createItem("Building the user interface", null, uniqueBoardID(defaultBoard), inProgressCard.id);
let item4 = createItem("Setup project structure", null, uniqueBoardID(defaultBoard), doneCard.id);

todoCard.items.push(item1, item2);
inProgressCard.items.push(item3);
doneCard.items.push(item4);

defaultBoard.cards.push(todoCard, inProgressCard, doneCard);
}

function deleteCurrentBoard() {
if (appData.boards.length <= 1) {
    return alert("You cannot delete the last board.");
}

if (confirm("Are you sure you want to delete this board?")) {
    appData.boards.splice(appData.currentBoard, 1);
    appData.currentBoard = 0;
    renderBoard(currentBoard());
    listBoards();
}
}

document.addEventListener('DOMContentLoaded', function() {
e_sidebarButton.addEventListener('click', function() {
    e_sidebar.classList.toggle('open');
    document.body.classList.toggle('sidebar-open');
});

e_sidebarClose.addEventListener('click', function() {
    e_sidebar.classList.remove('open');
    document.body.classList.remove('sidebar-open');
});

e_addCardButton.addEventListener('click', function() {
    addCardToBoard(currentBoard());
});

e_addCardText.addEventListener('keyup', function(e) {
    if (e.code === "Enter") e_addCardButton.click();
});

e_addBoardButton.addEventListener('click', addBoard);
e_addBoardText.addEventListener('keyup', function(e) {
    if (e.code === "Enter") e_addBoardButton.click();
});

e_saveButton.addEventListener('click', saveData);

e_deleteButton.addEventListener('click', deleteCurrentBoard);

e_settingsButton.addEventListener('click', function() {
    alert("Settings feature coming soon!");
});

e_cardContextMenuDelete.addEventListener('click', function() {
    if (confirm("Are you sure you want to delete this card?")) {
        let cardIndex = currentCards().findIndex(c => c.id === cardContextMenu_currentCard.id);
        if (cardIndex > -1) {
            currentCards().splice(cardIndex, 1);
            renderCards();
        }
    }
    cardContextMenu_hide();
});

e_cardContextMenuClear.addEventListener('click', function() {
    if (confirm("Clear all items from this card?")) {
        cardContextMenu_currentCard.items = [];
        renderCards();
    }
    cardContextMenu_hide();
});

e_cardContextMenuDuplicate.addEventListener('click', function() {
    let newCard = JSON.parse(JSON.stringify(cardContextMenu_currentCard));
    newCard.id = uniqueBoardID(currentBoard());
    newCard.name += " (Copy)";
    
    for (let item of newCard.items) {
        item.id = uniqueBoardID(currentBoard());
        item.parentCardId = newCard.id;
    }
    
    currentCards().push(newCard);
    renderCards();
    cardContextMenu_hide();
});

document.getElementById('add-column').addEventListener('click', function() {
    let columnName = prompt("Enter column name:");
    if (columnName) {
        let newCard = createCard(columnName, uniqueBoardID(currentBoard()), currentBoard().id);
        currentCards().push(newCard);
        renderCards();
    }
});

loadData();
});