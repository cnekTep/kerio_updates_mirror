var util = require('util');
var colors = require('colors');
var moment = require('moment');

var logger = {
  colorsMap: {
      'success': 'green',
      'warning': 'yellow',
      'err': 'red',
      'info': 'grey'
  },

  success: function (message) {
      this.log('success', message);
  },

  warning: function (message) {
      this.log('warning', message);
  },

  error: function (message) {
      this.log('err', message);
  },

  info: function (message) {
      this.log('info', message);
  },

  fatal: function (message) {
      this.log('fatal', message);
  },

  log: function (type, message) {
      var record = this.timestamptMessage(util.format('%s: %s', type.toUpperCase(), this.formatMessage(message)));
      console.log(record[this.colorsMap[type]]);
  },

  formatMessage: function (message) {
      return typeof message === 'string' ? message : JSON.stringify(message);
  },

  timestamptMessage: function (message) {
      return util.format('[%s] %s', moment(), message);
  }

};

module.exports = logger;
