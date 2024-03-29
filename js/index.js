const codeArea = document.querySelector(".codearea");
let interval;
const cursor = document.querySelector(".cursor");

const keys = {
  tab: 9,
  enter: 13,
  back: 8,
  up: 38,
  down: 40,
  right: 39,
  left: 37,
  ctrl: 17,
  dash: 191
}

let lineNumber = getLineNumber();
let currentTag;
const startCursorPoint = minimumCursorPosition();
let cursorPosition = {
  top: 0,
  left: 0
}
let shiftSizes = {
  horizontal: getShiftSizes().horizontalShift,
  vertical: getShiftSizes().verticalShift
}

function getShiftSizes () {
  const tag = document.querySelector(".tag");
  const tagLength = tag.innerText.length;
  const getRect = tag.getBoundingClientRect();
  const horizontalShift = getRect.width / tagLength;
  const verticalShift = getRect.height;

  return {
    horizontalShift,
    verticalShift
  }
}

function getLineNumber () {
  const numbers = document.querySelectorAll(".line__number");
  let lastNumber;

  for (let [i, number] of numbers.entries()) {
    if (!numbers[i+1]) {
      lastNumber = number
    }
  }

  return Number(lastNumber.textContent)
}

function minimumCursorPosition () {
  const element = document.querySelector(".line__code");
  const coords = element.getBoundingClientRect();

  return {
    top: coords.top,
    left: coords.left
  }
}



// flashing cursor
function flashUpCursor () {
  cursor.classList.toggle("cursor--hidden")
}

function startInterval (func, time) {
  interval = setInterval(func, time);
}

function stopInterval () {
  clearInterval(interval);
  interval = null;
}

function activateCursor () {
  cursor.classList.remove("cursor--hidden");
  startInterval(flashUpCursor, 500);
}

function reactivateCursor () {
  stopInterval(interval);
  cursor.classList.remove("cursor--hidden");
  startInterval(flashUpCursor, 500);
}

function activateEditor(event) {
  if (
    event.target.matches(".codearea") ||
    event.target.matches(".line__code") ||
    event.target.matches(".tag")) {

    if (interval) {
      reactivateCursor()
    } else {
      activateCursor()
    }
  } else {
    stopInterval(interval);
    cursor.classList.add("cursor--hidden");
  }
}

// cursor on mousedown
function getLetterWidth (word) {
  const coords = word.getBoundingClientRect();
  const wordWidth = coords.width;
  const wordLength = word.innerText.length;
  const letterWidth = wordWidth / wordLength;

  return letterWidth;
}

function setCursorPosition (top, left) {
  cursorPosition = {
    top,
    left
  }
  cursor.style.top = `${top}px`;
  cursor.style.left = `${left}px`;
}

function changeCursorPosition (event) {
  if (event.target.matches(".tag")) {
    const target = event.srcElement;
    const targetPosition =  target.getBoundingClientRect();
    const letterWidth = getLetterWidth(target);
    const mousePosition = event.pageX;
    const leftCorner = targetPosition.left;
    const delta = letterWidth * 0.5;
    let index = 0;
    let cursorPositionLeft;

    while ((leftCorner + ((index * letterWidth) + letterWidth) - delta) < mousePosition) {
      index += 1
    }

    cursorPositionLeft = targetPosition.left + (letterWidth * index);

    setCursorPosition(targetPosition.top, cursorPositionLeft);
  }

  else if (event.target.matches(".line__code")) {
    const lastTag = event.target.lastElementChild;
    const tagPosition = lastTag.getBoundingClientRect();
    setCursorPosition(tagPosition.top, tagPosition.right);
  }

  else if (event.target.matches(".codearea")) {
    const lastLine = event.target.lastElementChild;
    const lastTag = lastLine.querySelector(".tag:last-child");
    const tagPosition = lastTag.getBoundingClientRect();
    setCursorPosition(tagPosition.top, tagPosition.right);
  }
}

function findTheLatestTag (directionY, directionX) {
  const allTags = document.querySelectorAll(".tag");
  let prevTag = document.elementFromPoint(cursorPosition.left, cursorPosition.top);
  let nextTag;
  let nextTagPosition;

  // if a line was empty
  if (prevTag.matches(".line__code")) {
    prevTag = prevTag.lastElementChild;
  }

  // right key
  if (directionY === 0 && directionX === 1) {
    for (let [i, tag] of allTags.entries()) {
      if (tag == prevTag) {
        nextTag = allTags[i + 1];
      }
    }

    if (nextTag) {
      nextTagPosition = {
        top: nextTag.getBoundingClientRect().top,
        left: nextTag.getBoundingClientRect().left
      }
    }

  // left key
  } else if (directionY === 0 && directionX === -1) {
    for (let [i, tag] of allTags.entries()) {
      if (tag == prevTag) {
        nextTag = allTags[i - 1];
      }
    }

    nextTagPosition = {
      top: nextTag.getBoundingClientRect().top,
      left: nextTag.getBoundingClientRect().right
    }

  // down key
  } else if (directionY === 1 && directionX === 0) {
    const lines = document.querySelectorAll(".line");
    let currentLine;
    let nextLine;
    let returnPosition;

    if (prevTag.parentNode.matches(".line")) {
      currentLine = prevTag.parentNode
    } else {
      currentLine = prevTag.parentNode.parentNode
    }

    for (let [i, line] of lines.entries()) {
      if (line == currentLine) {
        nextLine = lines[i + 1];
      }
    }

    if (nextLine) {
      nextTag = nextLine.lastElementChild.lastElementChild;
      nextTagPosition = {
        top: nextTag.getBoundingClientRect().top,
        left: nextTag.getBoundingClientRect().right
      }

    } else {
      nextTag = currentLine.lastElementChild.lastElementChild;
      nextTagPosition = {
        top: nextTag.getBoundingClientRect().top,
        left: nextTag.getBoundingClientRect().right
      }
    }
  }

  // up key
  else if (directionY === -1 && directionX === 0) {
    const lines = document.querySelectorAll(".line");
    let currentLine;
    let nextLine;

    if (prevTag.parentNode.matches(".line")) {
      currentLine = prevTag.parentNode
    } else {
      currentLine = prevTag.parentNode.parentNode
    }

    for (let [i, line] of lines.entries()) {
      if (line == currentLine) {
        nextLine = lines[i - 1];
      }
    }

    nextTag = nextLine.lastElementChild.lastElementChild;

    nextTagPosition = {
      top: nextTag.getBoundingClientRect().top,
      left: nextTag.getBoundingClientRect().right
    }
  }

  return nextTagPosition;
}

function setCursorPositionAtKeydown (directionY, directionX) {
  const nextCursorPosition = {
    top: cursorPosition.top + (shiftSizes.vertical * directionY),
    left: cursorPosition.left + (shiftSizes.horizontal * directionX)
  }

  currentTag = document.elementFromPoint(nextCursorPosition.left, nextCursorPosition.top);

  if (currentTag) {
    if (currentTag.matches(".tag")) {
      setCursorPosition(nextCursorPosition.top, nextCursorPosition.left);

    } else {
      let nextTag = findTheLatestTag(directionY, directionX);
      setCursorPosition(nextTag.top, nextTag.left);
    }

  } else {
    setCursorPosition(startCursorPoint.top, startCursorPoint.left);
  }
}

// create new line
function createElement (tag, className, content) {
  const element = document.createElement(tag);
  element.classList.add(className);

  if (content) {
    element.textContent = content;
  }

  return element;
}

function getCurrentLine () {
  const lines = document.querySelectorAll(".line");
  let currentTag = document.elementFromPoint(cursorPosition.left, cursorPosition.top);
  let currentLine;

  // if a line was empty
  if (currentTag.matches(".line__code")) {
    currentTag = currentTag.firstElementChild;
  }

  for (let line of lines) {
    if (line === currentTag.parentNode.parentNode) {
      currentLine = line;
    }
  }

  return currentLine;
}

function changeLinesNumbers (currentLine, lineNumber) {
  const lines = document.querySelectorAll(".line");
  let nextNumber = lineNumber;
  let nextLine;

  for (let line of lines) {
    if (nextLine) {
      nextLine.firstElementChild.innerText = nextNumber;

      nextNumber += 1;
      nextLine = line.nextElementSibling;
    }
    if (line === currentLine) {
      nextLine = line.nextElementSibling;
    }
  }
}

function createNewLine () {
  const currentLine = getCurrentLine();
  let coords;
  const lineNumber = currentLine.firstElementChild.innerText;
  const nextNumber = Number.parseInt(lineNumber) + 1;

  const newLine = createElement("div", "line");
  const number = createElement("span", "line__number", nextNumber);
  const code = createElement("div", "line__code");
  const tag = createElement("span", "tag"); // if was some code: plus tabs
  currentLine.insertAdjacentElement("afterend", newLine);
  newLine.append(number);
  newLine.append(code);
  code.append(tag);

  coords = code.getBoundingClientRect();
  setCursorPosition(coords.top, coords.left);
  changeLinesNumbers(currentLine, nextNumber);
}

function changeCursorAtKeydown (event) {
  switch (event.keyCode) {
    case keys.down:
      setCursorPositionAtKeydown(1, 0);
      break;
    case keys.up:
      setCursorPositionAtKeydown(-1, 0);
      break;
    case keys.left:
      setCursorPositionAtKeydown(0, -1);
      break;
    case keys.right:
      setCursorPositionAtKeydown(0, 1);
      break;
    case keys.enter:
      createNewLine();
      break;
    default:
      break;
  }

  reactivateCursor();
}


codeArea.addEventListener("click", changeCursorPosition);
window.addEventListener("click", activateEditor);
window.addEventListener("keydown", changeCursorAtKeydown);
