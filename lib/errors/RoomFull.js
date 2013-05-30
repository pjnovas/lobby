var util = require('util');

var RoomFull = module.exports = function (message) {
  this.code = "RoomFull";
  this.message = message || this.code;
};

util.inherits(RoomFull, Error);