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
    const betFormOpenButton = document.getElementById("betFormOpen");
    const betFormCloseButton = document.getElementById("betFormClose");

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
  };

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
      ${generateMarseyImg(selected, "SELECTED", true)}
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

  function generateMarseyImg(marsey, id, large = false) {
    return `
      <img
        id="${id}#${marsey}"
        loading="lazy"
        data-bs-toggle="tooltip"
        alt=":${marsey}:"
        title="${marsey}"
        src="/e/${marsey}.webp"
        data-bs-original-title=":${marsey}:"
        aria-label=":${marsey}:"
        onclick="selectMarsey('${marsey}')"
        ${large ? `b=""` : ""}>
    `;
  }

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

  function transformBetsForView(bets, whenEmpty) {
    if (bets.length === 0) {
      return whenEmpty;
    }

    return bets
      .map(({ amount, bet, currency, selections, user_id }) => {
        const { username } = currentState.users.by_id[user_id];
        const wager = `${amount} ${currency}`;
        const singleChoice = generateMarseyImg(selections[0], "CHOICE");
        const hyphenatedChoices = selections
          .map((selection) => generateMarseyImg(selection, "CHOICE"))
          .join("");
        const betPhrase = {
          WIN: `${wager} to win on ${singleChoice}`,
          PLACE: `${wager} to place on ${singleChoice}`,
          SHOW: `${wager} to show on ${singleChoice}`,
          QUINELLA: `${wager}, quinella, ${hyphenatedChoices}`,
          TRIFECTA_BOX: `${wager}, boxed trifecta, ${hyphenatedChoices}`,
          TRIFECTA: `${wager}, trifecta, ${hyphenatedChoices}`,
          SUPERFECTA_BOX: `${wager}, boxed superfecta, ${hyphenatedChoices}`,
          SUPERFECTA: `${wager}, superfecta, ${hyphenatedChoices}`,
        }[bet];

        return `<div class="mr-bet-log" style="margin-bottom: 1rem;">
          <a href="/@${username}">${username}</a> bet ${betPhrase}
        </div>`;
      })
      .reverse()
      .join("");
  }

  // #endregion

  // #region Sockets
  const MarseyRacingEvent = {
    CONNECT: "connect",
    UPDATE_STATE: "update-state",
    START_RACE: "start-race",
    USER_PLACED_BET: "user-placed-bet",
    BET_SUCCEEDED: "bet-succeeded",
    BET_FAILED: "bet-failed",
  };
  const ChatEvent = {
    CHAT_STATE_UPDATED: 'chat-state-updated',
    USER_TYPED: 'user-typed',
    USER_SPOKE: 'user-spoke',
    MESSAGE_FAILED: 'message-failed',
  };
  const socket = io();

  // #region Marsey Racing
  // === Incoming
  // The view updates when the state is received from the server.
  let currentState;
  function updateView(state) {
    currentState = state;

    console.log("State updated!", currentState);

    // Update the podium
    for (let i = 0; i < 4; i++) {
      const whichPodium = document.getElementById(`PODIUM#${i + 1}`);
      let html = `${i + 1}`;

      if (state.podium[i]) {
        html += generateMarseyImg(state.podium[i], "PODIUM", true);
      }

      whichPodium.innerHTML = html;
    }

    if (state.biggest_loser) {
      document.getElementById("podium").innerHTML += generateMarseyImg(
        state.biggest_loser,
        "BIGGEST_LOSER",
        true
      );
      const biggestLoser = document.getElementById(
        `BIGGEST_LOSER#${state.biggest_loser}`
      );
      biggestLoser.classList.add("mr-biggest-loser");
    }

    // Update the bets
    const playerId = document.getElementById("vid").value;
    const playerBetList = document.getElementById("playerBetList");
    const otherBetList = document.getElementById("otherBetList");
    const bets = currentState.bets.all.map((id) => currentState.bets.by_id[id]);
    const playerBets = bets.filter((bet) => bet.user_id === playerId);
    const otherBets = bets.filter((bet) => bet.user_id !== playerId);

    playerBetList.innerHTML = transformBetsForView(
      playerBets,
      "You have not place any bets."
    );
    otherBetList.innerHTML = transformBetsForView(
      otherBets,
      "No one else has placed any bets."
    );

    // Start the race?
    if (currentState.race_started) {
      const marseys = currentState.marseys.all.map(
        (id) => currentState.marseys.by_id[id]
      );

      for (const marsey of marseys) {
        const racer = document.getElementById(`RACER#${marsey.name}`);
        racer.style.animation = `racing ${marsey.speed}ms ease-in-out forwards`;
      }
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
  window.startRace = function startRace() {
    socket.emit(MarseyRacingEvent.START_RACE);
  };

  window.submitBet = function submitBet() {
    socket.emit(MarseyRacingEvent.USER_PLACED_BET, BET_IN_PROGRESS);
  };
  // #endregion

  // #region Chatting
  // == Incoming
  function handleChatUpdate(data) {
    console.log("Chat Updated", data);
  }
  socket.on(ChatEvent.CHAT_STATE_UPDATED, handleChatUpdate);

  // == Outgoing
  window.handleType = function handleType(data) {
    // 
    socket.emit(ChatEvent.USER_TYPED, data);
  }


  window.handleSpeak = function handlSpeak(data) {
    // 
    socket.emit(ChatEvent.USER_SPOKE, data);
  }

  // #endregion
  // #endregion
})();
