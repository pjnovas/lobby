var util = require('util');

var RoomFull = module.exports = function (message) {
  this.name = "RoomFull";
  this.message = message || this.name;
};

util.inherits(RoomFull, Error);