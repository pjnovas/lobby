var util = require('util');

var InvalidUserOrId = module.exports = function (message) {
  this.code = "InvalidUserOrId";
  this.message = message || this.code;
};

util.inherits(InvalidUserOrId, Error);