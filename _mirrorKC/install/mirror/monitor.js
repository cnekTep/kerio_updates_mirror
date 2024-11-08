var respawn = require('respawn');
//var util = require('util');
var logger = require('./logger.js');

var monitor = respawn(['node', __dirname+'/index.js'], {
    env: {ENV_VAR:'test'}, // set env vars
    cwd: '.',              // set cwd
    maxRestarts:10,        // how many restarts are allowed within 60s
    sleep:1000,            // time to sleep between restarts
});

monitor.on('spawn', function () {
  console.log('application monitor started...');
});

monitor.on('exit', function (code, signal) {
  logger.fatal({msg: 'process exited, code: ' + code + ' signal: ' + signal});
});

monitor.on('stdout', function (data) {
  console.log(data.toString());
});

monitor.on('stderr', function (data) {
  logger.error({msg: 'process error', data: data.toString()});
});

monitor.start(); // spawn and watch
