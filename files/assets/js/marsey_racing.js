(() => {
  // #region Local
  window.startBetFlow = function startBetFlow() {
    console.log("Starting bet blow");
  }

  // #endregion

  // #region Sockets
  const MarseyRacingEvent = {
    CONNECT: "connect",
    UPDATE_STATE: "update-state",
    START_RACE: "start-race"
  };

  const socket = io();

  socket.on(MarseyRacingEvent.UPDATE_STATE, updateView);

  // The view updates when the state is received from the server.
  function updateView(state) {
    if (state.race_started) {
      const marseys = Array.from(document.querySelectorAll(".marsey-racer"));
      marseys.forEach(marsey => marsey.classList.add('racing'));
    }
  }

  // Socket events
  function startRace() {
    socket.emit(MarseyRacingEvent.START_RACE);
  }

  window.startRace = startRace
  // #endregion
})();
