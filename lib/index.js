
var EventEmitter = require('events').EventEmitter
  , _ = require('underscore')
  , util = require('util')
  , Room = require('./Room')
  , roomStatus = require('./roomStatus');

var Lobby = module.exports = function (options) {

  //TODO: Generate an unique id - maybe from mongodb
  var roomIds = 0;
  this._getRoomId = function(){
    return ++roomIds;
  }
  
  _.defaults(options || {}, {
    
  });

  _.extend(this, options);

  this.rooms = {
    "length": 0
  };
}

util.inherits(Lobby, EventEmitter);

Lobby.prototype.create = function(roomOptions) {
  var id = this._getRoomId(); 

  roomOptions = roomOptions || {};
  roomOptions.id = id;

  var newRoom = new Room(roomOptions);
  this.rooms[id] = newRoom;
  this.rooms.length++;

  newRoom.on('room:destroy', this.destroyRoom.bind(this, newRoom.id));
  this.emit('room:create', newRoom);

  return this.rooms[id];
};

Lobby.prototype.getById = function(roomId) {
  return this.rooms[roomId];
};

Lobby.prototype.queue = function(userId, roomOptions) {
  roomOptions = roomOptions || {};
  roomOptions.owner = 'queue';
  
  var queueRoom = this.findQueueRoom(roomOptions);

  if(queueRoom){
    queueRoom.join(userId);
    return queueRoom;
  }

  var room = this.create(roomOptions);
  room.join(userId);

  return room;
};

Lobby.prototype.findQueueRoom = function(roomOptions) {
  var freeRoom, room;
  
  var roomOptionsKeys = _.keys(roomOptions);
  
  for(var key in this.rooms){
    room = this.rooms[key];

    if (room && key !== "length"){
      var rm = _.pick(room, roomOptionsKeys);
  
      if (_.isEqual(rm, roomOptions) && 
        ( room.status === roomStatus.EMPTY || 
          room.status === roomStatus.WAITING)
        ){
          freeRoom = room;
          break;
      }
    }
  }

  return freeRoom;
};

Lobby.prototype.destroy = function(room) {
  if (room){
    return this.destroyRoom(room.id);
  }

  //TODO: Destroy Lobby
  return this;
};

Lobby.prototype.destroyRoom = function(roomId) {
  delete this.rooms[roomId];
  this.rooms.length--;

  this.emit('room:destroy');
  return this;
};

Lobby.prototype.router = function(expressApp) {
  require('./router')(expressApp, this);
  return this;
};

Lobby.prototype.events = function(io) {
  require('./events')(io, this);
  return this;
};
