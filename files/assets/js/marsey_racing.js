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

  let isBetFormOpen = false;
  window.toggleBetForm = function toggleBetForm() {
    const betForm = document.getElementById("betForm");
    const betFormOpenButton = document.getElementById("betFormOpen")
    const betFormCloseButton = document.getElementById("betFormClose")

    isBetFormOpen = !isBetFormOpen;

    if (isBetFormOpen) {
      betForm.style.display = "block";
      betFormOpenButton.style.display = "none";
      betFormCloseButton.style.display = "unset";
    } else {
      resetBet();

      betForm.style.display = "none";
      betFormOpenButton.style.display = "unset";
      betFormCloseButton.style.display = "none";
    }
  }

  window.pickBet = function pickBet(bet) {
    BET_IN_PROGRESS.kind = bet;

    const buttons = Array.from(document.querySelectorAll(".mr-bet-button"));

    buttons.forEach((button) => {
      button.classList.add("btn-primary");
      button.classList.remove("btn-success");

      if (button.dataset.bet === bet) {
        button.classList.add("btn-success");
        button.classList.remove("btn-primary");
      }
    });

    BET_IN_PROGRESS.selection = [];
    selectMarsey();
  };

  window.selectMarsey = function selectMarsey(marsey) {
    if (marsey) {
      if (BET_IN_PROGRESS.selection.includes(marsey)) {
        BET_IN_PROGRESS.selection = BET_IN_PROGRESS.selection.filter(
          (m) => m !== marsey
        );
      } else {
        BET_IN_PROGRESS.selection.push(marsey);
      }
    }

    const selectables = Array.from(
      document.querySelectorAll(".mr-selectable-marsey")
    );

    selectables.forEach((m) => {
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
  };

  window.pickAmount = function pickAmount(amount) {
    BET_IN_PROGRESS.wager.amount = amount;
  };

  window.pickCurrency = function pickCurrency(currency) {
    BET_IN_PROGRESS.wager.currency = currency;

    const coinsButton = document.getElementById("WAGER#COINS");
    const procoinsButton = document.getElementById("WAGER#PROCOINS");
    const lookup = {
      coins: coinsButton,
      procoins: procoinsButton,
    };

    [coinsButton, procoinsButton].forEach((button) => {
      button.classList.remove("btn-success");
      button.classList.add("btn-secondary");
    });

    lookup[currency].classList.remove("btn-secondary");
    lookup[currency].classList.add("btn-success");
  };

  window.placeBet = function placeBet() {
    const isValid = validateBet();

    if (isValid) {
      submitBet();
      resetBet();
    }
  };

  function validateBet() {
    BET_IN_PROGRESS.wager.amount = parseInt(
      document.getElementById("wager_amount").value
    );

    if (!BET_IN_PROGRESS.kind) {
      showErrorMessage("You must select a bet.");

      return false;
    }

    const correctMarseyCount = {
      WIN: 1,
      PLACE: 1,
      SHOW: 1,
      QUINELLA: 2,
      TRIFECTA_BOX: 3,
      TRIFECTA: 3,
      SUPERFECTA_BOX: 4,
      SUPERFECTA: 4,
    }[BET_IN_PROGRESS.kind];
    const actualMarseyCount = BET_IN_PROGRESS.selection.length;

    if (actualMarseyCount !== correctMarseyCount) {
      showErrorMessage(
        `You must select exactly ${correctMarseyCount} Marseys.`
      );

      return false;
    }

    if (BET_IN_PROGRESS.wager.amount < 5) {
      showErrorMessage(
        `You must wager at least 5 ${BET_IN_PROGRESS.wager.currency}.`
      );

      return false;
    }

    return true;
  }

  function resetBet() {
    BET_IN_PROGRESS.kind = "";
    BET_IN_PROGRESS.selection = [];

    const buttons = Array.from(document.querySelectorAll(".mr-bet-button"));

    buttons.forEach((button) => {
      button.classList.add("btn-primary");
      button.classList.remove("btn-success");
    });

    for (let i = 1; i < 5; i++) {
      document.getElementById(`SELECT_${i}`).innerHTML = "";
    }
  }

  function showErrorMessage(message) {
    const toast = document.getElementById("racing-post-error");
    const toastMessage = document.getElementById("racing-post-error-text");
    toastMessage.innerText = message;
    bootstrap.Toast.getOrCreateInstance(toast).show();
  }

  function showSuccessMessage(message) {
    const toast = document.getElementById("racing-post-success");
    const toastMessage = document.getElementById("racing-post-success-text");
    toastMessage.innerText = message;
    bootstrap.Toast.getOrCreateInstance(toast).show();
  }
  // #endregion

  // #region Sockets
  const MarseyRacingEvent = {
    CONNECT: "connect",
    UPDATE_STATE: "update-state",
    START_RACE: "start-race",
    USER_PLACED_BET: "user-placed-bet",
    BET_SUCCEEDED: "bet-succeeded",
    BET_FAILED: "bet-failed"
  };

  const socket = io();
  
  // === Incoming
  // The view updates when the state is received from the server.
  let currentState;
  function updateView(state) {
    currentState = state;

    console.log("State updated!", state);
    
    if (currentState.race_started) {
      const marseys = Array.from(document.querySelectorAll(".marsey-racer"));
      marseys.forEach((marsey) => marsey.classList.add("racing"));
    }
  }
  socket.on(MarseyRacingEvent.UPDATE_STATE, updateView);

  function receiveBetSuccess() {
    showSuccessMessage("Successfully placed a bet.");
    toggleBetForm();
  }
  socket.on(MarseyRacingEvent.BET_SUCCEEDED, receiveBetSuccess);

  function receiveBetError() {
    showErrorMessage("Unable to place that bet.");
  }
  socket.on(MarseyRacingEvent.BET_FAILED, receiveBetError);
  
  // === Outgoing
  function startRace() {
    socket.emit(MarseyRacingEvent.START_RACE);
  }

  function submitBet() {
    socket.emit(MarseyRacingEvent.USER_PLACED_BET, BET_IN_PROGRESS);
  }
  // #endregion
})();
