var util = require('util');

var NotOwner = module.exports = function (message) {
  this.code = "NotOwner";
  this.httpCode = 403;
  this.message = message || this.code;
};

util.inherits(NotOwner, Error);