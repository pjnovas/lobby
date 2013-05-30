var util = require('util');

var InvalidRoomOrId = module.exports = function (message) {
  this.code = "InvalidRoomOrId";
  this.httpCode = 400;
  this.message = message || this.code;
};

util.inherits(InvalidRoomOrId, Error);