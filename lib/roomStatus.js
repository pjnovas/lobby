
// Statuses for a room

module.exports = {
  EMPTY: 'empty', //room created but no users joined (default status)
  WAITING: 'waiting', // at least one user in room, waiting for more 
  READY: 'ready', // room full: ready to start
  STARTED: 'started' // room started
};

