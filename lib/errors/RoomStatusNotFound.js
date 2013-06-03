var util = require('util');

var RoomStatusNotFound = module.exports = function (message) {
  this.code = "RoomStatusNotFound";
  this.httpCode = 404;
  this.message = message || this.code;
};

util.inherits(RoomStatusNotFound, Error);