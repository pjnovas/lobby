
var EventEmitter = require('events').EventEmitter
  , _ = require('underscore')
  , util = require('util')
  , roomStatus = require('./roomStatus');

var UserNotFoundError = require('./errors/UserNotFound')
  , UserAlreadyInRoomError = require('./errors/UserAlreadyInRoom')
  , InvalidUserOrIdError = require('./errors/InvalidUserOrId')
  , RoomFullError = require('./errors/RoomFull')
  , NotOwnerError = require('./errors/NotOwner');

var Room = module.exports = function (options) {
  
  _.defaults(options || {}, {
    seats: 2,
    owner: 'system',
    startOnFull: false,
    startOnReady: false,
    autoDestroy: true,
    status: roomStatus.EMPTY
  });

  _.extend(this, options);

  this.users = {
    "length": 0
  };
}

util.inherits(Room, EventEmitter);

function getUser(userOrId){
  var user = userOrId;

  if (!_.isObject(user)) {
    user = {
      id: userOrId
    };
  }

  if(!user.id){
    throw new InvalidUserOrIdError('Invalid user id ' + user.id);
  }

  if (_.isString(user.id) || _.isNumber(user.id)){
    return user;
  }
  else {
    throw new InvalidUserOrIdError('Invalid user id ' + user.id); 
  }
}

Room.prototype.join = function(userOrId) {
  if (this.isFull()){
    throw new RoomFullError('Room is Full');
  }

  var user = getUser(userOrId);

  if (this.has(user)){
    throw new UserAlreadyInRoomError('User ' + user.id + ' already joined');
  }

  this.users[user.id] = user;
  this.users.length++;

  this.emit('user:join', this.users[user.id]);

  if (this.isFull()){
    this.status = roomStatus.FULL;
    this.emit('room:full');
    if (this.startOnFull){
      this.start();
    }
  }
  else {
    this.status = roomStatus.WAITING;
  }

  return this.users[user];
};

Room.prototype.leave = function(userOrId) {

  var user = getUser(userOrId);

  if (!this.has(user)){
    throw new UserNotFoundError('User ' + user.id + ' not found');
  }

  delete this.users[user.id];
  this.users.length--;

  this.emit('user:leave', user.id);

  if (this.isEmpty()){
    this.status = roomStatus.EMPTY;
    this.emit('room:empty');
    
    if (this.autoDestroy){
      this.destroy();
    }
  }
  else {
    this.status = roomStatus.WAITING;
  }

  return this;
};

Room.prototype.start = function(){
  this.status = roomStatus.STARTED;
  this.emit('room:start');
};

Room.prototype.ready = function(){
  this.status = roomStatus.READY;
  this.emit('room:ready');
};

Room.prototype.has = function(userOrId) {
  var user = getUser(userOrId);
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

  for(var u in this.users){
    if (u !== "length"){
      delete this.users[u];
    }
  }

  this.users = {
    "length": 0
  };

  this.status = roomStatus.EMPTY;
  this.emit('room:clear');

  return this;
};

Room.prototype.destroy = function(silent) {
  if (!silent){
    this.emit('room:destroy', this.toJSON());
  }
  
  this.clear();

  this.removeAllListeners('user:join');
  this.removeAllListeners('user:leave');

  this.removeAllListeners('room:update');
  this.removeAllListeners('room:full');
  this.removeAllListeners('room:empty');
  this.removeAllListeners('room:start');
  this.removeAllListeners('room:clear');

  this.removeAllListeners('room:destroy');
};

Room.prototype.update = function(props){
  var news = _.omit(props, ['id', 'owner', 'status']);
  _.extend(this, news);
  this.emit('room:update');
};

Room.prototype.toJSON = function(){

  var xusers = [];

  for(var u in this.users){
    if (u !== "length"){
      xusers.push(this.users[u]);
    }
  }

  var functions = _.functions(this);
  functions.push('_events');

  var json = _.omit(this, functions);

  _.extend(json, {
    seats: {
      total: this.seats,
      taken: this.users.length 
    },
    users: xusers
  });

  return json;
};