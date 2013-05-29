var util = require('util');

var NotOwner = module.exports = function (message) {
  this.name = "NotOwner";
  this.message = message || this.name;
};

util.inherits(NotOwner, Error);