var config = {};
var exec = require("child_process").exec;

// server.js
config.proxy = false;
config.port = "80";
config.ports = "443";
config.port_proxy = "8080";
config.ports_proxy = "8443";

//SSL
config.certs = __dirname+'/certs/'
config.LocalAuthority = 'LocalAuthority.crt';
config.Key = 'Certificate.key';
config.Certificate = 'Certificate.crt';

//requestHandlers
	if (/^win/.test(process.platform)) {
		var logfile = __dirname+'/logs/mkcLog.txt';
config.logfile = logfile;
config.mirrorlog = __dirname+'/logs/mirror.log'
	} else {
		var logfile = '/var/log/mkc.log';
config.logfile = logfile;
config.mirrorlog = '/var/log/mirror.log'
	}
config.avir_proto = 'http';
config.avir_proxy = true;
config.avir_host= '172.222.0.5';
config.avir_port = '8118';
config.avir_login = '';
config.avir_passw = '';

config.cmd = __dirname+"/mkc -target-root "+__dirname+" -license-no 20339-36NA7-16TIZ -wf-getkey getkey.php -target-geoip control-update -target-snort control-update >> "+logfile;

module.exports = config;
