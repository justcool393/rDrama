(() => {
  const MarseyRacingEvent = {
    CONNECT: "connect",
    UPDATE_STATE: "update-state",
  };

  const socket = io();
  
  socket.on(MarseyRacingEvent.UPDATE_STATE, (...args) => {
    console.log({ args });
  });
})();
