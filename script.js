
const display = document.getElementById("display");
const expressionView = document.getElementById("expression");
const keys = document.getElementById("keys");

const historyPanel = document.getElementById("historyPanel");
const backdrop = document.getElementById("backdrop");
const historyItems = document.getElementById("historyItems");
const toast = document.getElementById("toast");

let input = "";
let firstNumber = null;
let operator = null;
let waitingForNumber = false;
let justCalculated = false;
let history = loadHistory();
let toastTimer;

// Load saved history
function loadHistory() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("iphoneCalcHistory") || "[]"
    );

    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

// Save history
function saveHistory() {
  try {
    localStorage.setItem(
      "iphoneCalcHistory",
      JSON.stringify(history)
    );
  } catch {}
}

// Format number
function formatNumber(number) {
  if (!Number.isFinite(number)) return "Error";

  return String(Number(number.toPrecision(10)));
}

// Show display
function updateDisplay() {
  display.textContent = input || "0";
}

// Notification
function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 1600);
}

// Clear calculator
function clearCalculator() {
  input = "";
  firstNumber = null;
  operator = null;
  waitingForNumber = false;
  justCalculated = false;

  expressionView.textContent = "";
  updateDisplay();

  document.querySelectorAll(".operator").forEach(button => {
    button.classList.remove("selected");
  });
}

// Enter number
function enterNumber(value) {
  if (justCalculated && !operator) {
    input = "";
    expressionView.textContent = "";
    justCalculated = false;
  }

  if (waitingForNumber) {
    input = value === "." ? "0." : value;
    waitingForNumber = false;
  } else if (value === ".") {
    if (!input.includes(".")) {
      input = (input || "0") + ".";
    }
  } else {
    input = input === "0" ? value : (input || "") + value;
  }

  updateDisplay();
}

// Math operations
function calculate(a, b, op) {
  switch (op) {
    case "+":
      return a + b;

    case "−":
      return a - b;

    case "×":
      return a * b;

    case "÷":
      return b === 0 ? NaN : a / b;

    default:
      return b;
  }
}

// Select operator
function selectOperator(op) {
  const current = Number(input || "0");

  if (operator && !waitingForNumber) {
    const result = calculate(firstNumber, current, operator);

    if (!Number.isFinite(result)) {
      notify("Cannot divide by zero");
      clearCalculator();
      return;
    }

    firstNumber = result;
    input = formatNumber(result);
    updateDisplay();
  } else {
    firstNumber = current;
  }

  operator = op;
  waitingForNumber = true;
  justCalculated = false;

  expressionView.textContent =
    formatNumber(firstNumber) + " " + op;

  document.querySelectorAll(".operator").forEach(button => {
    button.classList.toggle(
      "selected",
      button.dataset.value === op
    );
  });
}

// Equal button
function calculateResult() {
  if (
    operator === null ||
    firstNumber === null ||
    waitingForNumber
  ) {
    return;
  }

  const secondNumber = Number(input || "0");
  const op = operator;
  const first = firstNumber;

  const result = calculate(first, secondNumber, op);

  if (!Number.isFinite(result)) {
    notify("Math error");
    clearCalculator();
    return;
  }

  const answer = formatNumber(result);

  const equation =
    `${formatNumber(first)} ${op} ${formatNumber(secondNumber)}`;

  expressionView.textContent = equation + " =";

  input = answer;
  display.textContent = answer;

  // Save history
  history.unshift({
    equation,
    answer,
    time: Date.now()
  });

  history = history.slice(0, 50);

  saveHistory();
  renderHistory();

  firstNumber = null;
  operator = null;
  waitingForNumber = true;
  justCalculated = true;

  document.querySelectorAll(".operator").forEach(button => {
    button.classList.remove("selected");
  });
}

// Percentage
function percentage() {
  const number = Number(input || "0");

  if (operator && firstNumber !== null) {
    input = formatNumber(firstNumber * number / 100);
  } else {
    input = formatNumber(number / 100);
  }

  updateDisplay();
}

// Positive / Negative
function toggleSign() {
  if (!input || Number(input) === 0) return;

  input = input.startsWith("-")
    ? input.slice(1)
    : "-" + input;

  updateDisplay();
}

// Delete last digit
function deleteLast() {
  if (waitingForNumber || justCalculated) return;

  input = input.slice(0, -1);
  updateDisplay();
}

// Button click
keys.addEventListener("click", event => {
  const button = event.target.closest("button");

  if (!button) return;

  const action = button.dataset.action;
  const value = button.dataset.value;

  if (action === "clear") {
    clearCalculator();
  }

  else if (action === "delete") {
    deleteLast();
  }

  else if (action === "equals") {
    calculateResult();
  }

  else if (action === "sign") {
    toggleSign();
  }

  else if (value === "%") {
    percentage();
  }

  else if (["+", "−", "×", "÷"].includes(value)) {
    selectOperator(value);
  }

  else if (/^\d$/.test(value) || value === ".") {
    enterNumber(value);
  }
});

// Keyboard support
document.addEventListener("keydown", event => {
  if (
    event.ctrlKey ||
    event.metaKey ||
    event.altKey
  ) return;

  if (/^\d$/.test(event.key) || event.key === ".") {
    event.preventDefault();
    enterNumber(event.key);
  }

  else if (event.key === "+") {
    selectOperator("+");
  }

  else if (event.key === "-") {
    selectOperator("−");
  }

  else if (event.key === "*") {
    selectOperator("×");
  }

  else if (event.key === "/") {
    event.preventDefault();
    selectOperator("÷");
  }

  else if (event.key === "%") {
    percentage();
  }

  else if (event.key === "Enter" || event.key === "=") {
    event.preventDefault();
    calculateResult();
  }

  else if (event.key === "Backspace") {
    deleteLast();
  }

  else if (event.key === "Escape") {
    closeHistory();
    clearCalculator();
  }
});

// Open history
function openHistory() {
  historyPanel.classList.add("open");
  backdrop.classList.add("open");
}

// Close history
function closeHistory() {
  historyPanel.classList.remove("open");
  backdrop.classList.remove("open");
}

document.getElementById("historyBtn")
  .addEventListener("click", openHistory);

document.getElementById("closeHistory")
  .addEventListener("click", closeHistory);

backdrop.addEventListener("click", closeHistory);

// Show history
function renderHistory() {
  historyItems.replaceChildren();

  if (history.length === 0) {
    const empty = document.createElement("p");

    empty.className = "history-empty";
    empty.textContent = "No calculation history yet.";

    historyItems.appendChild(empty);
    return;
  }

  history.forEach(item => {
    const row = document.createElement("div");
    row.className = "history-row";

    const equation = document.createElement("div");
    equation.className = "history-expression";
    equation.textContent = item.equation + " =";

    const answer = document.createElement("div");
    answer.className = "history-answer";
    answer.textContent = item.answer;

    row.append(equation, answer);

    row.addEventListener("click", () => {
      input = item.answer;
      firstNumber = null;
      operator = null;
      waitingForNumber = false;
      justCalculated = true;

      expressionView.textContent = item.equation + " =";

      updateDisplay();
      closeHistory();
    });

    historyItems.appendChild(row);
  });
}

// Clear history
document.getElementById("clearHistory")
  .addEventListener("click", () => {
    history = [];

    saveHistory();
    renderHistory();

    notify("History cleared");
  });

// Calculator mode button
document.getElementById("modeBtn")
  .addEventListener("click", () => {
    notify("Standard Calculator");
  });

// Start app
renderHistory();
updateDisplay();
