// #region Betting Functionality

/**
 * @desc
 * Tracks the active bet to be submitted.
 */
const BET_IN_PROGRESS = {
  active: false,
  kind: "",
  selection: [],
  wager: {
    amount: 0,
    currency: "coins",
  },
};

/**
 * @desc
 * Reset the bet; keep the wager for convenience.
 */
function clearBetInProgress() {
  const buttons = Array.from(document.querySelectorAll(".mr-bet-button"));

  BET_IN_PROGRESS.active = false;
  BET_IN_PROGRESS.kind = "";
  BET_IN_PROGRESS.selection = [];

  // Cleanup bets
  for (const button of buttons) {
    button.classList.add("btn-primary");
    button.classList.remove("btn-success");
  }

  // Cleanup selection
  Array.from(
    { length: 4 },
    (_, index) => (document.getElementById(`SELECT_${index + 1}`).innerHTML = "")
  );
}

/**
 * @desc
 * Lightly checks for client-side errors before sending.
 * @returns {boolean}
 */
function validateBetInProgress() {
  const wagerAmountField = document.getElementById("wager_amount");
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

  BET_IN_PROGRESS.wager.amount = parseInt(wagerAmountField.value);

  if (!BET_IN_PROGRESS.kind) {
    showErrorMessage("You must select a bet.");
    return false;
  }

  if (actualMarseyCount !== correctMarseyCount) {
    showErrorMessage(`You must select exactly ${correctMarseyCount} Marseys.`);
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

/**
 * @desc
 * If the bet form is closed, reveal it and swap the clicked button.
 * Otherwise, clear the bet and swap the button back.
 */
function toggleBetForm() {
  const betForm = document.getElementById("betForm");
  const betFormOpenButton = document.getElementById("betFormOpen");
  const betFormCloseButton = document.getElementById("betFormClose");

  BET_IN_PROGRESS.active = !BET_IN_PROGRESS.active;

  if (BET_IN_PROGRESS.active) {
    betForm.style.display = "block";
    betFormOpenButton.style.display = "none";
    betFormCloseButton.style.display = "unset";
  } else {
    betForm.style.display = "none";
    betFormOpenButton.style.display = "unset";
    betFormCloseButton.style.display = "none";

    clearBetInProgress();
  }
}

/**
 *
 * @param {string} kind - WIN, PLACE, SHOW, QUINELLA, TRIFECTA_BOX, TRIFECTA, SUPERFECTA_BOX, SUPERFECTA
 * @desc
 * Update the active bet's kind and indicate so via changing its button.
 */
function selectBetKind(kind) {
  const buttons = Array.from(document.querySelectorAll(".mr-bet-button"));

  BET_IN_PROGRESS.kind = kind;

  for (const button of buttons) {
    button.classList.add("btn-primary");
    button.classList.remove("btn-success");

    if (button.dataset.bet === kind) {
      button.classList.add("btn-success");
      button.classList.remove("btn-primary");
    }
  }
}

/**
 *
 * @param {string} marsey - Any marsey name.
 * @desc
 * Updates current bet selection and either
 *  - adds the selected Marsey to the displayed selection
 *  - removes it
 */
function selectMarseyForBet(marsey) {
  const { selection } = BET_IN_PROGRESS;

  BET_IN_PROGRESS.selection = selection.includes(marsey)
    ? selection.filter((each) => each !== marsey)
    : [...selection, marsey];

  Array.from({ length: 4 }, (_, index) => {
    const place = index + 1;
    const selectionSquare = document.getElementById(`SELECT_${place}`);
    const inSelection = BET_IN_PROGRESS.selection[index];

    selectionSquare.innerHTML = inSelection
      ? `<span>${place}.</span> ${buildMarseyImg(
          inSelection,
          "SELECTED",
          true
        )}`
      : "";
  });
}

/**
 *
 * @param {string} currency - 'coins' or 'procoins'
 * @desc
 * Update the current bet's currency in which to pay and be paid.
 */
function selectBetCurrency(currency) {
  BET_IN_PROGRESS.wager.currency = currency;

  const lookup = {
    coins: document.getElementById("WAGER#COINS"),
    procoins: document.getElementById("WAGER#PROCOINS"),
  };

  const selected = currency === "coins" ? lookup.coins : lookup.procoins;
  const notSelected = currency === "coins" ? lookup.procoins : lookup.coins;

  selected.classList.add("btn-primary");
  selected.classList.remove("btn-secondary");

  notSelected.classList.add("btn-secondary");
  notSelected.classList.remove("btn-primary");
}
// #endregion

// ===

// #region Toast Functionality

/**
 *
 * @param {string} message - What to show.
 * @desc
 * Show the negative, red error popunder.
 */
function showErrorMessage(message) {
  const toast = document.getElementById("racing-post-error");
  const toastMessage = document.getElementById("racing-post-error-text");
  toastMessage.innerText = message;
  bootstrap.Toast.getOrCreateInstance(toast).show();
}

/**
 *
 * @param {string} message - What to show.
 * @desc
 * Show the positive, green success popunder.
 */
function showSuccessMessage(message) {
  const toast = document.getElementById("racing-post-success");
  const toastMessage = document.getElementById("racing-post-success-text");
  toastMessage.innerText = message;
  bootstrap.Toast.getOrCreateInstance(toast).show();
}
// #endregion

// ===

// #region HTML Builders

/**
 *
 * @param {string} marsey - The Marsey's name.
 * @param {string|number} id - What to prepend to the <img>'s id.
 * @param {boolean?} large - Make the Marsey slightly bigger.
 * @desc
 * Given a Marsey, create an <img> element's HTML.
 * @returns
 */
function buildMarseyImg(marsey, id, large = false) {
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

/**
 *
 * @param {Bet[]} bets - { id: string; user_id: string; bet: string; selection: string[]; amount: number; currency: 'coins' | 'procoins' }
 * @param {string} whenEmpty - What to show when no bets have been made.
 * @desc
 * Construct a series of visualizations for the race's bets.
 * @returns {string} - Bet view HTML
 */
function buildBetsView(state, bets, whenEmpty) {
  if (bets.length === 0) {
    return whenEmpty;
  } else {
    return bets
      .map(({ amount, bet, currency, selections, user_id }) => {
        const { username } = state.users.by_id[user_id];
        const wager = `${amount} ${currency}`;
        const singleChoice = buildMarseyImg(selections[0], "CHOICE");
        const hyphenatedChoices = selections
          .map((selection) => buildMarseyImg(selection, "CHOICE"))
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
}
// #endregion

// ===

// #region Socket Handling
const MarseyRacingEvent = {
  UPDATE_STATE: "update-state",
  START_RACE: "start-race",
  USER_PLACED_BET: "user-placed-bet",
  BET_SUCCEEDED: "bet-succeeded",
  BET_FAILED: "bet-failed",
};

const ChatEvent = {
  CHAT_STATE_UPDATED: "chat-state-updated",
  USER_TYPED: "user-typed",
  USER_SPOKE: "user-spoke",
  MESSAGE_FAILED: "message-failed",
};

/**
 *
 * @param {MarseyRacingState} state - {
 *      marseys: { all: string[]; by_id: Record<string, Marsey> },
 *      bets: { all: string[]; by_id: Record<string, Bet> },
 *      users: { all: string[]; by_id: Record<string, User> },
 *      payouts: { all: string[]; by_id: Record<string, Payout> },
 *      betting_open: boolean,
 *      race_started: boolean,
 *      podium: Array<null | string>,
 *      biggest_loser: null | string,
 *      odds: Record<string, number>
 * }
 * @desc
 * When a new racing state is received from the server, update all relevant elements.
 */
function handleUpdateRacingView(state) {
  console.info("Racing State Updated");
  console.table(state);

  // Podium
  const podium = document.getElementById("podium");

  Array.from({ length: 4 }, (_, index) => {
    const place = index + 1;
    const onPodium = state.podium[index];
    const podiumSquare = document.getElementById(`PODIUM#${place}`);

    podiumSquare.innerHTML = `
      ${place}
      ${onPodium ? buildMarseyImg(onPodium, "PODIUM", true) : ""}
    `;
  });

  // Biggest Loser
  if (state.biggest_loser) {
    podium.innerHTML += buildMarseyImg(
      state.biggest_loser,
      "BIGGEST_LOSER",
      true
    );
  }

  // Bet Lists
  const playerId = document.getElementById("vid").value;
  const playerBetList = document.getElementById("playerBetList");
  const otherBetList = document.getElementById("otherBetList");
  const allBets = state.bets.all.map((id) => state.bets.by_id[id]);
  const playerBets = allBets.filter((bet) => bet.user_id === playerId);
  const otherBets = allBets.filter((bet) => bet.user_id !== playerId);

  playerBetList.innerHTML = buildBetsView(
    state,
    playerBets,
    "You have not placed any bets."
  );
  otherBetList.innerHTML = buildBetsView(
    state,
    otherBets,
    "No one else has placed any bets."
  );

  // Race
  if (state.race_started) {
    const marseys = state.marseys.all.map((id) => state.marseys.by_id[id]);

    for (const marsey of marseys) {
      const racer = document.getElementById(`RACER#${marsey.name}`);
      racer.style.animation = `racing ${marsey.speed}ms ease-in-out forwards`;
    }
  }
}

/**
 *
 * @param {ChatState} state - {
 *      messages: Array<{
 *        avatar: string;
 *        hat: string;
 *        username: string;
 *        namecolor: string;
 *        text: string;
 *        text_html: string;
 *        text_censored: string;
 *        time: number;
 *      }>,
 *      online: string[],
 *      total: number,
 *      typing: string[]
 * }
 * @desc
 * When a new chat state is received from the server, update all relevant elements.
 */
function handleUpdateChatView(state) {
  console.info("Chat State Updated");
  console.table(state);
}

/**
 * @desc
 * Show a toast when the bet fails.
 */
function handleBetError() {
  showErrorMessage("Unable to place that bet.");
}

/**
 * @desc
 * Show a toast when the bet succeeds.
 */
function handleBetSuccess() {
  showSuccessMessage("Successfully placed a bet.");
  clearBetInProgress();
}

const socket = io();
socket.on(MarseyRacingEvent.UPDATE_STATE, handleUpdateRacingView);
socket.on(MarseyRacingEvent.BET_FAILED, handleBetError);
socket.on(MarseyRacingEvent.BET_SUCCEEDED, handleBetSuccess);
socket.on(ChatEvent.CHAT_STATE_UPDATED, handleUpdateChatView);

function emitStartRace() {
  socket.emit(MarseyRacingEvent.START_RACE);
}

function emitUserPlacedBet() {
  if (validateBetInProgress()) {
    socket.emit(MarseyRacingEvent.USER_PLACED_BET, BET_IN_PROGRESS);
    clearBetInProgress();
  }
}

function emitUserTyped(text) {
  socket.emit(ChatEvent.USER_TYPED, text);
}

function emitUserSpoke(text) {
  socket.emit(ChatEvent.USER_SPOKE, text);
}
// #endregion
