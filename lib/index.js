
var EventEmitter = require('events').EventEmitter
  , _ = require('underscore')
  , util = require('util')
  , Room = require('./Room');

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

  var newRoom = new Room(roomOptions);
  this.rooms[id] = newRoom;
  this.rooms[id].id = id;
  this.rooms.length++;

  this.emit('room:create', newRoom);

  return newRoom;
};

RoomFactory.prototype.destroy = function(room) {
  if (room){
    return destroyRoom(room);
  }

  //TODO: Destroy RoomFactory
};

RoomFactory.prototype.destroyRoom = function(room) {
  delete this.rooms[room.id];
  this.rooms.length--;

  this.emit('room:destroy');  
};
