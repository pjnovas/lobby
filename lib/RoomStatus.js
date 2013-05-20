
// Status for a room

module.exports = {
  AVAILABLE: 'available', // default - no players
  UNAVAILABLE: 'unavailable', // room deactivated for playing
  WAITING: 'waiting', // at least one user in room, waiting for more 
  COUNTDOWN: 'countdown', // room full starting countdown to start
  INGAME: 'ingame', // a game is currently running
  ENDGAME: 'endgame' // a game just finished, showing scores
};

