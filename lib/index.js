
var EventEmitter = require('events').EventEmitter
  , _ = require('underscore')
  , util = require('util')
  , Room = require('./Room')
  , roomStatus = require('./roomStatus');

var InvalidRoomOrIdError = require('./errors/InvalidRoomOrId')

var Lobby = module.exports = function (options) {

  this._getRoomId = function(){
    return (+new Date()).toString(36);
  }

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

  newRoom.on('room:destroy', this.removeRoom.bind(this, newRoom.id));
  this.emit('room:create', newRoom);

  return this.rooms[id];
};

Lobby.prototype.getById = function(roomId) {
  if (!_.isString(roomId)){
    throw new InvalidRoomOrIdError('Invalid room id ' + roomId); 
  }

  return this.rooms[roomId];
};

Lobby.prototype.queue = function(roomOptions) {
  roomOptions = roomOptions || {};
  roomOptions.owner = 'queue';
  
  var queueRoom = this.findQueueRoom(roomOptions);

  if(queueRoom){
    return queueRoom;
  }

  return this.create(roomOptions);
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

  if (room && room.id){
    var rid = room.id;
    if (this.rooms[rid]){
      this.rooms[rid].destroy(true);
      this.removeRoom(rid);
    }
    return;
  }

  var roomIds = _.keys(this.rooms);
  _.each(roomIds, function(rid){
    if (rid !== 'length' && this.rooms[rid]){
      this.rooms[rid].destroy(true);
      this.removeRoom(rid);
    }
  }, this);

  delete this.rooms;

  this.removeAllListeners('room:create');
  this.removeAllListeners('room:destroy');
};

Lobby.prototype.removeRoom = function(roomId) {

  if (this.rooms.hasOwnProperty(roomId)){
    delete this.rooms[roomId];
    this.rooms.length--;
    this.emit('room:destroy', roomId);
  }

  return this;
};

Lobby.prototype.router = function(expressApp, prevMethod) {
  if (!_.isFunction(prevMethod)){
    throw new Error('expected a function as second parameter of Lobby.router()');
  }

  require('./router')(expressApp, this, prevMethod);
  return this;
};

Lobby.prototype.events = function(io) {
  require('./events')(io, this);
  return this;
};

Lobby.error = {
    UserNotFound: require('./errors/UserNotFound')
  , RoomNotFound: require('./errors/RoomNotFound')
  , UserAlreadyInRoom: require('./errors/UserAlreadyInRoom')
  , InvalidUserOrId: require('./errors/InvalidUserOrId')
  , InvalidRoomOrId: require('./errors/InvalidRoomOrId')
  , RoomFull: require('./errors/RoomFull')
  , NotOwner: require('./errors/NotOwner')
};