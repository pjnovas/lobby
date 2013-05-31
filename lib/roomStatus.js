
// Statuses for a room

module.exports = {
  EMPTY: 'empty', //room created but no users joined (default status)
  WAITING: 'waiting', // at least one user in room, waiting for more 
  FULL: 'full', // room full: all users joined
  READY: 'ready', // room ready: all users joined and connected
  STARTED: 'started' // room started
};

