(() => {
  const MarseyRacingEvent = {
    CONNECT: "connect",
    UPDATE_STATE: "update-state",
    START_RACE: "start-race"
  };

  const socket = io();

  socket.on(MarseyRacingEvent.UPDATE_STATE, updateView);

  function updateView(state) {
    const container = document.getElementById("racingContainer");
    
    if (state.race_started) {
      const marseys = Array.from(document.querySelectorAll(".marsey-racer"));
      marseys.forEach(marsey => marsey.classList.add('racing'));
    }
  }

  function startRace() {
    socket.emit(MarseyRacingEvent.START_RACE);
  }

  window.startRace = startRace
})();
