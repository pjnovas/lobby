
var EventEmitter = require('events').EventEmitter
  , _ = require('underscore')
  , util = require('util')
  , Room = require('./Room')
  , RoomStatus = require('./RoomStatus');

var RoomFactory = module.exports = function (options) {

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

util.inherits(RoomFactory, EventEmitter);

RoomFactory.prototype.create = function(roomOptions) {
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

RoomFactory.prototype.getById = function(roomId) {
  return this.rooms[roomId];
};

RoomFactory.prototype.queue = function(userId, roomOptions) {
  
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

RoomFactory.prototype.findQueueRoom = function(roomOptions) {
  var freeRoom, room;
  
  var roomOptionsKeys = _.keys(roomOptions);
  
  for(var key in this.rooms){
    room = this.rooms[key];

    if (room && key !== "length"){
      var rm = _.pick(room, roomOptionsKeys);
  
      if (_.isEqual(rm, roomOptions) && 
        ( room.status === RoomStatus.EMPTY || 
          room.status === RoomStatus.WAITING)
        ){
          freeRoom = room;
          break;
      }
    }
  }

  return freeRoom;
};

RoomFactory.prototype.destroy = function(room) {
  if (room){
    return this.destroyRoom(room.id);
  }

  //TODO: Destroy RoomFactory
};

RoomFactory.prototype.destroyRoom = function(roomId) {
  delete this.rooms[roomId];
  this.rooms.length--;

  this.emit('room:destroy');  
};
