var respawn = require('respawn');

var monitor = respawn(['node', __dirname + '/server.js'], {
    env: {ENV_VAR:'test'}, // установка переменных среды
    cwd: '.',              // установка cwd
    maxRestarts:10,        // Количество допустимых перезапусков в течение 60с
    sleep:1000,            // Промежуток времени между перезапусками
});

monitor.on('spawn', function () {
  console.log('Начало работы программы:');
});

monitor.on('exit', function (code, signal) {
  console.log('Выход из программы, code: ' + code + ' signal: ' + signal);
});

monitor.on('stdout', function (data) {
  console.log(data.toString());
});

monitor.on('stderr', function (data) {
  console.log('Ошибка программы ' + data.toString());
});

monitor.start(); // spawn and watch
