(() => {
  // #region Local
  const BET_IN_PROGRESS = {
    kind: "",
    selection: [],
    wager: {
      amount: 0,
      currency: "coins",
    },
  };
  
  window.BET_IN_PROGRESS = BET_IN_PROGRESS;

  window.pickBet = function pickBet(bet) {
    BET_IN_PROGRESS.kind = bet;

    const buttons = Array.from(document.querySelectorAll('.mr-bet-button'));

    buttons.forEach(button => {
      button.classList.add("btn-primary");
      button.classList.remove("btn-success");

      if (button.dataset.bet === bet) {
        button.classList.add("btn-success");
        button.classList.remove("btn-primary");
      }
    });

    BET_IN_PROGRESS.selection = [];
    selectMarsey();
  }

  window.selectMarsey = function selectMarsey(marsey) {
    if (marsey) {
      if (BET_IN_PROGRESS.selection.includes(marsey)) {
        BET_IN_PROGRESS.selection = BET_IN_PROGRESS.selection.filter(m => m !== marsey);
      } else {
        BET_IN_PROGRESS.selection.push(marsey);
      }
    }

    const selectables = Array.from(document.querySelectorAll('.mr-selectable-marsey'));

    selectables.forEach(m => {
      m.innerHTML = "";
    });

    for (let i = 1; i < 5; i++) {
      document.getElementById(`SELECT_${i}`).innerHTML = "";
    }

    for (let i = 0; i < BET_IN_PROGRESS.selection.length; i++) {
      const selected = BET_IN_PROGRESS.selection[i];

      document.getElementById(`SELECT_${i + 1}`).innerHTML = `
      <span>${i + 1}.</span>
      <img
        id="SELECTED#${selected}"
        loading="lazy"
        data-bs-toggle="tooltip"
        alt=":${selected}:"
        title="${selected}"
        src="/e/${selected}.webp"
        data-bs-original-title=":${selected}:"
        aria-label=":${selected}:"
        onclick="selectMarsey('${selected}')"
        b="">
      `;
    }
  }

  window.pickAmount = function pickAmount(amount) {
    BET_IN_PROGRESS.wager.amount = amount;
  }

  window.pickCurrency = function pickCurrency(currency) {
    BET_IN_PROGRESS.wager.currency = currency;

    const coinsButton = document.getElementById("WAGER#COINS");
    const procoinsButton = document.getElementById("WAGER#PROCOINS");
    const lookup = {
      coins: coinsButton,
      procoins: procoinsButton
    };

    [coinsButton, procoinsButton].forEach(button => {
      button.classList.remove("btn-success");
      button.classList.add("btn-secondary");
    });

    lookup[currency].classList.remove("btn-secondary");
    lookup[currency].classList.add("btn-success");
  }

  window.placeBet = function placeBet() {
    BET_IN_PROGRESS.wager.amount = parseInt(document.getElementById('wager_amount').value);
    console.log("Placing bet with ", BET_IN_PROGRESS);

    // Place

    // Reset
  }
  // #endregion

  // #region Sockets
  const MarseyRacingEvent = {
    CONNECT: "connect",
    UPDATE_STATE: "update-state",
    START_RACE: "start-race",
  };

  const socket = io();

  socket.on(MarseyRacingEvent.UPDATE_STATE, updateView);

  // The view updates when the state is received from the server.
  let currentState;
  function updateView(state) {
    currentState = state;

    if (currentState.race_started) {
      const marseys = Array.from(document.querySelectorAll(".marsey-racer"));
      marseys.forEach((marsey) => marsey.classList.add("racing"));
    }
  }

  // Socket events
  function startRace() {
    socket.emit(MarseyRacingEvent.START_RACE);
  }

  window.startRace = startRace;
  // #endregion
})();
