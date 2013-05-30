var util = require('util');

var UserNotFound = module.exports = function (message) {
  this.code = "UserNotFound";
  this.httpCode = 404;
  this.message = message || this.code;
};

util.inherits(UserNotFound, Error);