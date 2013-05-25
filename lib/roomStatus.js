
// Statuses for a room

module.exports = {
  EMPTY: 'empty', //room created but no users joined (default status)
  WAITING: 'waiting', // at least one user in room, waiting for more 
  READY: 'ready', // room full: ready to start
  COUNTDOWN: 'countdown', // room ready on countdown to start
  INGAME: 'ingame', // a game is currently running
  ENDGAME: 'endgame' // a game just finished, showing scores
};

