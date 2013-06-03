var util = require('util');

var RoomStatusNotAllowed = module.exports = function (message) {
  this.code = "RoomStatusNotAllowed";
  this.httpCode = 403;
  this.message = message || this.code;
};

util.inherits(RoomStatusNotAllowed, Error);