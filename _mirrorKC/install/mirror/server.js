var config = require('./config');
var http = require("http");
var https = require("https");
var url = require("url");
var mrequest = require('request');
var querystring = require("querystring");
var fs = require("fs");
var httpProxy = require('http-proxy');
const certs = config.certs;
var port = config.port;
var ports = config.ports;
var port_proxy = config.port_proxy;
var ports_proxy = config.ports_proxy;
var proxy = config.proxy;
var tls = require('tls');
var ip = require("ip");

var ssdp = require('node-ssdp').Server
	, serverdp = new ssdp({
		location: 'http://'+ip.address()+':'+port+'/logsmkc.php',
		ssdpSig: 'node.js/'+process.version+'/UPnP/1.1/Pyntuition-for-Kerio UPnP/0.1'
});

var options = {
	ca: fs.readFileSync(certs+config.LocalAuthority),
	key: fs.readFileSync(certs+config.Key),
	cert: fs.readFileSync(certs+config.Certificate),
	minVersion: 'TLSv1',
	ciphers: "HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA",
	honorCipherOrder: true,
	ecdhCurve: "X25519:P-256:P-384:P-521"
};

function start(route, handle) {
	function onRequest(request, response) {
		if (JSON.stringify(request.headers).match(/"WSLib\ [\d]\.[\d]\ \[[\d]\,\ [\d]\,\ [\d]\,\ [\d]{1,4}\]"/)) {
			if (request.headers.host == 'bdupdate.kerio.com') {
				route(handle, "bitdefenderavir", request, response);
				return;
			} else if (request.headers.host == 'bda-update.kerio.com') {
				route(handle, "antispam", request, response);
				return;
			} else {
				console.log('Requested URL: '+request.url);
				console.log('Unknown host: '+request.headers.host);
				response.writeHead(404, {"Content-Type": "text/plain"});
				response.end("404 Not found");
				return;
			}
		}
		var pathname = url.parse(request.url).pathname;
		switch(true) {
			case /\/update.php/.test(pathname):
				var ver = 9;

				var version = querystring.parse(request.url).version;
				console.log('Requested update for version: '+version);
				if (version && parseInt(version.substring(0, 2)) < 9) ver = version.substring(0, 1);
				route(handle, ver, request, response);
				//if (querystring.parse(request.url).version) {
				//	var version = querystring.parse(request.url).version;
				//	var ver = version.substring(0, 1);
				//	route(handle, ver, request, response);
				//} else {
				//	var ver = 9;
				//	route(handle, ver, request, response);
				//}
				break;
			case /\/kersophos\/IDES/.test(pathname):
			case /\/kersophos\/VDBS/.test(pathname):
			case /\/kersophos\/APIS/.test(pathname):
			case /\/kersophos\/CNF/.test(pathname):
			case /\/control-update/.test(pathname):
			case /\/dwn\/control\//.test(pathname):
			case /\/dwn\/connect\//.test(pathname):
			case /\/dwn\/operator\//.test(pathname):
				route(handle, "download", request, response);
				break;
			case /\/getkey.php/.test(pathname):
				route(handle, "wfkey", request, response);
				break;
			case /\/checknew.php/.test(pathname):
				route(handle, "checknew", request, response);
				break;
			case /\/mirrorkc.php/.test(pathname):
				route(handle, "mirrorKC", request, response);
				break;
			case /\/logsmkc.php/.test(pathname):
				route(handle, "logsmkc",request,response);
				break;
			default:
				if (!proxy) {
					console.log('No proxy for host: '+request.headers.host);
					console.log('Requested URL: '+request.url);
					response.writeHead(200, {"Content-Type": "text/plain"});
					response.write("nothing");
					response.end();
					break;
				} else {
					if((request.connection.encrypted ? 'https': 'http')=='http'){
						var host = request.headers.host;
						var h = host.split(/\:[\d]{1,5}$/);
						var hostname = h[0];
						mrequest('http://'+hostname+':'+port_proxy, function (error) {
							if (JSON.stringify(error).match(/ECONNREFUSED/)) {
								response.writeHead(404, {"Content-Type": "text/plain"});
								response.end("404 Not found");
								console.log('HTTP Proxy Target not response: '+error);
								return;
							} else {
								proxy = httpProxy.createServer({});
								proxy.web(request, response, {
									target: 'http://'+hostname+':'+port_proxy,
									preserveHeaderKeyCase: true 
								});
							}
						});
					} else {
						var host = request.headers.host;
						var h = host.split(/\:[\d]{1,5}$/);
						var hostname = h[0];
						mrequest('https://'+hostname+':'+ports_proxy, function (error) {
							if (JSON.stringify(error).match(/ECONNREFUSED/)) {
								response.writeHead(404, {"Content-Type": "text/plain"});
								response.end("404 Not found");
								console.log('HTTPS Proxy Target not response: '+error);
								return;
							} else {
								proxy = httpProxy.createServer({});
								proxy.web(request, response, {
									ssl: options, 
									target: 'https://'+hostname+':'+ports_proxy,
									secure: false,
									preserveHeaderKeyCase: true 
								});
							}
						});
					}
				}
		}
	}
// Create an HTTP service.
	var stime = new Date();
	var server = http.createServer(onRequest).listen(port, '0.0.0.0');
	console.log(stime+' HTTP Server running on port '+port);
// Create an HTTPS service identical to the HTTP service.
	var stimes = new Date();
	var servers = https.createServer(options, onRequest).listen(ports, '0.0.0.0');
	console.log(stimes+' HTTPS Server running on port '+ports);
	serverdp.addUSN('urn:schemas-kerio-com:service:ScalarWebAPI:1');
	serverdp.start();
	process.on('exit', function(){
		serverdp.stop() // advertise shutting down and stop listening
	})
}

exports.start = start;
