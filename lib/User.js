
var EventEmitter = require('events').EventEmitter
  , _ = require('underscore')
  , util = require('util')
  , UserStatus = require('./UserStatus');

var User = module.exports = function (options) {
  
  _.defaults(options || {}, {
    _status: UserStatus.NOROOM
  });

  _.extend(this, options);
}

util.inherits(User, EventEmitter);

User.prototype.setStatus = function(status) {
  this._status = status;
  this.emit('change:status');
  return this;
};

User.prototype.getStatus = function() {
  return this._status;
};

User.prototype.is = function(status) {
  return (this._status === status);
};

User.prototype.destroy = function() {

};
