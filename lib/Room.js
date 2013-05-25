
var EventEmitter = require('events').EventEmitter
  , _ = require('underscore')
  , util = require('util')
  , roomStatus = require('./roomStatus');

var Room = module.exports = function (options) {
  
  _.defaults(options || {}, {
    seats: 2,
    owner: 'system',
    status: roomStatus.EMPTY
  });

  _.extend(this, options);

  this.users = {
    "length": 0
  };
}

util.inherits(Room, EventEmitter);

Room.prototype.join = function(userId) {
  if (this.isFull()){
    throw Error('Room is Full');
  }

  if(userId){
    if (this.users.hasOwnProperty(userId)){
      throw Error('User with id ' + userId + ' already joined');
    }
  }
  else {
    throw Error('Invalid UserId: ' + userId);
  }

  this.users[userId] = {};
  this.users[userId].id = userId;
  this.users.length++;

  this.emit('user:join', this.users[userId]);

  if (this.isFull()){
    this.status = roomStatus.READY;
    this.emit('room:full');
  }
  else {
    this.status = roomStatus.WAITING;
  }

  return this.users[userId];
};

Room.prototype.leave = function(userOrUserId) {

  if(userOrUserId && _.isObject(userOrUserId)){
    userOrUserId = userOrUserId.id;
  }
  else if (!userOrUserId){
    throw new Error('Room leave expected a RoomUser or a UserID, but got a ' + 
      userOrUserId);
  }

  if (!this.users.hasOwnProperty(userOrUserId)){
    throw new Error('User not found');
  }

  delete this.users[userOrUserId];
  this.users.length--;
    
  this.emit('user:leave');

  if (this.isEmpty()){
    this.status = roomStatus.EMPTY;
    this.emit('room:empty');
  }
  else {
    this.status = roomStatus.WAITING;
  }

  return this;
};

Room.prototype.has = function(user) {
  return this.users.hasOwnProperty(user.id);
};

Room.prototype.isFull = function() {
  return (this.users.length === this.seats);
};

Room.prototype.isEmpty = function() {
  return (this.users.length === 0);
};

Room.prototype.freeSeats = function() {
  return this.seats - this.users.length;
};

Room.prototype.clear = function() {
  _.each(this.users, function(user, key, list){
    if (user && key !== "length"){
      delete this.users[user.id];
    }
  }, this);

  this.users = {
    "length": 0
  };

  this.status = roomStatus.EMPTY;

  this.emit('room:clear');

  return this;
};

Room.prototype.destroy = function() {
  this.emit('room:destroy', this.toJSON());

  this.clear();

  this.removeAllListeners('user:join');
  this.removeAllListeners('user:leave');

  this.removeAllListeners('room:full');
  this.removeAllListeners('room:empty');

  this.removeAllListeners('room:destroy');
};

Room.prototype.toJSON = function(){

  var xusers = _.clone(this.users);
  delete xusers.length;

  return {
    id: this.id,
    owner: this.owner,
    status: this.status,
    seats: {
      total: this.seats,
      taken: this.users.length 
    },
    users: _.pluck(xusers, "id")
  };
};