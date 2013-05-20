
var EventEmitter = require('events').EventEmitter
  , _ = require('underscore')
  , util = require('util')
  , User = require('./User');

var Room = module.exports = function (options) {
  
  //TODO: Generate an unique id - maybe from mongodb
  var userIds = 0;
  this._getUserId = function(){
    return ++userIds;
  }

  _.defaults(options || {}, {
    seats: 2
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
    userId = this._getUserId();
  }

  this.users[userId] = new User();
  this.users[userId].id = userId;
  this.users.length++;

  this.emit('user:join', this.users[userId]);

  if (this.isFull()){
    this.emit('room:full');
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

  delete this.users[userOrUserId];
  this.users.length--;
  
  this.emit('user:leave');

  if (this.isEmpty()){
    this.emit('room:empty');
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
      list[user.id].destroy();
    }
  }, this);

  this.users = {
    "length": 0
  };

  this.emit('room:clear');

  return this;
};

Room.prototype.destroy = function() {

};
