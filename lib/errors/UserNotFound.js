var util = require('util');

var UserNotFound = module.exports = function (message) {
  this.name = "UserNotFound";
  this.httpCode = 404;
  this.message = message || this.name;
};

util.inherits(UserNotFound, Error);