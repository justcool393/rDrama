(() => {
  const MarseyRacingEvent = {
    CONNECT: "connect",
    UPDATE_STATE: "update-state",
  };

  const socket = io();
  
  socket.on(MarseyRacingEvent.UPDATE_STATE, updateView);

  function updateView(state) {
    console.log(state);
  }
})();
