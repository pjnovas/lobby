var util = require('util');

var UserAlreadyInRoom = module.exports = function (message) {
  this.name = "UserAlreadyInRoom";
  this.message = message || this.name;
};

util.inherits(UserAlreadyInRoom, Error);