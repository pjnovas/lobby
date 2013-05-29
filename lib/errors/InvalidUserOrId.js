var util = require('util');

var InvalidUserOrId = module.exports = function (message) {
  this.name = "InvalidUserOrId";
  this.message = message || this.name;
};

util.inherits(InvalidUserOrId, Error);