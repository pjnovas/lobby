var util = require('util');

var UserAlreadyInRoom = module.exports = function (message) {
  this.code = "UserAlreadyInRoom";
  this.message = message || this.code;
};

util.inherits(UserAlreadyInRoom, Error);