var util = require('util');

var RoomNotFound = module.exports = function (message) {
  this.code = "RoomNotFound";
  this.httpCode = 404;
  this.message = message || this.code;
};

util.inherits(RoomNotFound, Error);