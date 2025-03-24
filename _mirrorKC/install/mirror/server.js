var config = require('./config');
var certs = config.certs;
var port = config.port;
var ports = config.ports;
var proxy = config.proxy;
var port_proxy = config.port_proxy;
var ports_proxy = config.ports_proxy;
var logfile = config.logfile;
var mirrorlog = config.mirrorlog;
var avir_proto = config.avir_proto;
var avir_proxy = config.avir_proxy;
var avir_host = config.avir_host;
var avir_port = config.avir_port;
var avir_login = config.avir_login;
var avir_passw = config.avir_passw;
var config_login = config.config_login;
var config_passw = config.config_passw;
var ipv4_list_file = config.ipv4_list_file;
var public_dns1 = config.public_dns1;
var public_dns2 = config.public_dns2;
var timeout = config.download_timeout;
var LicenseNo = config.LicenseNo;
var WebFilter = config.WebFilter;
var IDSv1 = config.IDSv1;
var IDSv2 = config.IDSv2;
var IDSv3 = config.IDSv3;
var IDSv4 = config.IDSv4;
var IDSv5 = config.IDSv5;
var IDSv6 = config.IDSv6;
var geo_ip4_url = config.geo_ip4_url;
var geo_ip6_url = config.geo_ip6_url;
var geo_github = config.geo_github;
var fs = require('fs');
var ip = require('ip');
var tls = require('tls');
var url = require('url');
var dns = require ('dns');
var http = require('http');
var https = require('https');
var amrequest = require('request');
var httpProxy = require('http-proxy');
var ssdp = require('node-ssdp').Server;
var querystring = require('querystring');
var iconvlite = require('iconv-lite');
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var zlib = require('zlib');
var systemd = false;
var ipv4_list = '';
var options = {
	ca: fs.readFileSync(certs + config.LocalAuthority),
	key: fs.readFileSync(certs + config.Key),
	cert: fs.readFileSync(certs + config.Certificate),
	minVersion: 'TLSv1',
	ciphers: 'HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA',
	honorCipherOrder: true,
	ecdhCurve: 'X25519:P-256:P-384:P-521'
};

function get_date_time(data) {
	if (systemd) {
		return '';
	} else {
		let now = data ? new Date(data) : new Date();
		let gmt = -now.getTimezoneOffset();
		return '[' + 
			now.getFullYear().toString() + '.' + 
			(now.getMonth() + 1).toString().padStart(2, '0') + '.' + 
			now.getDate().toString().padStart(2, '0') + ' ' + 
			now.getHours().toString().padStart(2, '0') + ':' + 
			now.getMinutes().toString().padStart(2, '0') + ':' + 
			now.getSeconds().toString().padStart(2, '0') + ' GMT' + 
			(gmt < 0 ? '' : '+') + parseInt(gmt / 60) + ':' + 
			(gmt % 60).toString().padStart(2, '0') + ']';
	}
}

function EscapeHtml(HtmlStr) {
	var SpecialCharsMap = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	};
	return HtmlStr.replace(RegExp(Object.keys(SpecialCharsMap).join('|'), 'gi'), (matched) => {
		return SpecialCharsMap[matched];
	});
}

function EscapeConfigfile(ConfigfileStr) {
	return ConfigfileStr.replace(/[\$\&\+\#\"\'\\]/g, '\\$&');
}

function rules(request, response) {
	var version = querystring.parse(request.url).version;
	var ver1 = parseInt(version);
	if (ver1 > 0 && ver1 <= 6) {
		console.log(get_date_time() + ' Получен запрос на обновление версии: <b>' + version + '</b> с адреса ' + request.connection.remoteAddress);
		ver1 = ver1.toString();
		var ver2 = parseInt(version.split('.')[1]);
		if (ver2) ver2 = ver2.toString(); 
		else ver2 = '0';
		var hostname = request.headers.host.split(/\:[\d]{1,5}$/)[0];
		var path = '/control-update/';
		var ff = '';
		response.writeHead(200, {'Content-Type': 'text/plain'});
		fs.readdir(__dirname + path, (error, files) => {
			if (error) {
				console.log(get_date_time() + ' Ошибка чтения папки: ' + error.message);
				return response.end();
			} else {
				if (files.length > 0) {
					var strs = new RegExp('^full-' + ver1 + '-.+gz$');
					files.forEach((f, nf) => {
						if (f.search(strs) >= 0) {
							var vers = f.split('-');
							if (parseInt(vers[2]) > parseInt(ver2)) {
								if (ver1 == '4') {
									ver2 = vers[2];
									ff = f;
								} else if (fs.existsSync(__dirname + path + f + '.sig')) {
									ver2 = vers[2];
									ff = f;
								}
							}
						}
					});
				}
				response.write('0:' + ver1 + '.' + ver2 + '\n');
				if (ff) response.write('full:http://' + hostname + path + ff);
				return response.end();
			}
		});
	} else if (version) {
		console.log(get_date_time() + ' Получен запрос на обновления для версии: <b>' + version + '</b> с адреса ' + request.connection.remoteAddress);
		var qry = url.parse(request.url).query;
		if (/dbversion=/.test(qry)) {
			var rand = Math.floor(Math.random() * (1500 - 1) + 1);
			response.writeHead(200, {'Content-Type': 'text/plain'});
			response.write('IDEdir=kersophos/IDES/' + rand + '\n');
			response.write('VDBdir=kersophos/VDBS/' + rand + '\n');
			response.write('APIdir=kersophos/APIS/' + rand + '\n');
			response.write('CNFdir=kersophos/CNF/' + rand + '\n');
			response.end();
		} else {
			response.writeHead(200, {'Content-Type': 'text/plain', 'Cache-Control': 'no-cache, no-store, must-revalidate'});
				if (/Kerio_Updater/.test(request.headers['user-agent'])) {
			response.end('THDdir=https://bdupdate.kerio.com/./');
				} else {
			response.end('THDdir=https://bdupdate.kerio.com/../');
				}
		}
	} else {
		console.log(get_date_time() + ' Ошибка обработки URL ' + request.url + ' в запросе на обновление с адреса ' + request.connection.remoteAddress);
		return response.end();
	}
}

function download(request, response) {
	console.log(get_date_time() + ' Получен запрос на загрузку файла с адреса ' + request.connection.remoteAddress);
	if (request.url.search(/\/[\d]{1,4}\//)>=0) {
		var newurl = request.url.replace(/\/[\d]{1,4}/, '');
	} else {
		var newurl = request.url;
	}
	if (fs.existsSync(__dirname + newurl)) {
		fs.createReadStream(__dirname + newurl).pipe(response);
		console.log(get_date_time() + ' Адрес ' + request.connection.remoteAddress + ' загружает файл: ' + request.url);
	} else {
		response.writeHead(404, {'Content-Type': 'text/plain'});
		response.end('404 Not found');
		console.log(get_date_time() + ' Не найден файл: ' + request.url + ', запрошенный с адреса: ' + request.connection.remoteAddress);
	}
}

function logsmkc(request, response) {
	function files_to_html(filename, encoding, callback) {
		fs.stat(filename, (error, stats) => {
			if (error) return callback('Ошибка доступа к файлу ' + error.message);
			var fileSize = stats.size;
			var bytesToRead = 350000; 
			var position = fileSize - bytesToRead;
			if (position < 0 ) {
				position = 0;
				bytesToRead = fileSize;
			}
			fs.open(filename, 'r', (error, fd) => {
				if (error) fs.close(fd, () => {
					return callback('Ошибка при открытии файла ' + error.message);
				});
				fs.read(fd, Buffer.alloc(bytesToRead), 0, bytesToRead, position, (error, bytesRead, buffer) => {
					if (error) fs.close(fd, () => {
						return callback('Ошибка чтения файла ' + error.message);
					});
					else fs.close(fd, () => {
						if (encoding == 'cp866') var content = iconvlite.decode(buffer, 'cp866');
						else var content = buffer.toString('utf8');
						var newline_mark = '<br>';
						content = content.replace(/(?:\r?\n+)+/g, newline_mark);
						var start_br_position = content.indexOf(newline_mark) + newline_mark.length;
						if (start_br_position < 10) return callback(content);
						else return callback(content.substr(start_br_position));
					});
				});
			});
		});
	}
	function response_html(){
		fs.readFile(__dirname + '/index.html', 'utf8', (error, html) => {
			if (error) {
				response.writeHead(404, {'Content-Type': 'text/plain'});
				response.end('404 Not found');
				console.log(get_date_time() + ' Ошибка чтения index.html ' + error.message);
			} else {
				if (LicenseNo) html = html.replace(/<.*"LicenseNo".*>/i, '<input type="text" id="LicenseNo" name="LicenseNo" value="' + LicenseNo + '">');
				if (IDSv1) html = html.replace(/<.*input.*"IDSv1".*>/i, '<input type="checkbox" id="IDSv1" name="IDSv1" value="true" checked>');
				if (IDSv2) html = html.replace(/<.*input.*"IDSv2".*>/i, '<input type="checkbox" id="IDSv2" name="IDSv2" value="true" checked>');
				if (IDSv3) html = html.replace(/<.*input.*"IDSv3".*>/i, '<input type="checkbox" id="IDSv3" name="IDSv3" value="true" checked>');
				if (IDSv4) html = html.replace(/<.*input.*"IDSv4".*>/i, '<input type="checkbox" id="IDSv4" name="IDSv4" value="true" checked>');
				if (IDSv5) html = html.replace(/<.*input.*"IDSv5".*>/i, '<input type="checkbox" id="IDSv5" name="IDSv5" value="true" checked>');
				if (IDSv6) html = html.replace(/<.*input.*"IDSv6".*>/i, '<input type="checkbox" id="IDSv6" name="IDSv6" value="true" checked>');
				if (WebFilter) html = html.replace(/<.*"wfkey".*>/i, '<input type="checkbox" id="wfkey" name="wfkey" value="true" checked>');
				if (geo_github) html = html.replace(/<.*"geo_github".*>/i, '<input type="checkbox" id="geo_github" name="geo_github" value="true" checked>');
				if (avir_proxy) {
					html = html.replace(/<.*input.*"avir_proxy".*>/i, '<input type="checkbox" id="avir_proxy" name="avir_proxy" value="true" checked>');
					if (avir_host) html = html.replace(/<.*input.*"avir_host".*>/i, '<input type="text" id="avir_host" name="avir_host" value="' + avir_host + '">');
					if (avir_port) html = html.replace(/<.*input.*"avir_port".*>/i, '<input type="text" id="avir_port" name="avir_port" style="width:40px;" value="' + avir_port + '">');
					if (avir_login) html = html.replace(/<.*input.*"avir_login".*>/i, '<input type="text" id="avir_login" name="avir_login" value="' + avir_login + '">');
					if (avir_passw) html = html.replace(/<.*input.*"avir_passw".*>/i, '<input type="text" id="avir_passw" name="avir_passw" value="' + avir_passw + '">');
				}
				files_to_html(mirrorlog, 'utf8', (data) => {
					html = html.replace('<p class="mirrorkc">mirrorkc.log</p>', '<p class="mirrorkc">' + data + '</p>');
					files_to_html(logfile, (/^win/.test(process.platform) ? 'cp866' : 'utf8'), (data) => {
						html = html.replace('<p class="mkc">mkcLog.txt</p>', '<p class="mkc">' + data + '<p>');
						response.writeHeader(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'});
						response.write(html);
						response.end();
					});
				});
			}
		});
	}
	if (request.method == 'POST') {
		console.log(get_date_time() + ' В настройки внесены изменения с адреса ' + request.connection.remoteAddress);
		var body = '';
		request.on('data', (data) => {
			body += data;
			if (body.length > 1e6)
				request.connection.destroy();
		});
		request.on('end', () => {
			var post = querystring.parse(body);
			if (post['IDSv1']) IDSv1 = true;
			else IDSv1 = false;
			if (post['IDSv2']) IDSv2 = true;
			else IDSv2 = false;
			if (post['IDSv3']) IDSv3 = true;
			else IDSv3 = false;
			if (post['IDSv4']) IDSv4 = true;
			else IDSv4 = false;
			if (post['IDSv5']) IDSv5 = true;
			else IDSv5 = false;
			if (post['IDSv6']) IDSv6 = true;
			else IDSv6 = false;
			if (post['wfkey']) WebFilter = true;
			else WebFilter = false;
			if (post['geo_github']) geo_github = true;
			else geo_github = false;
			if (post['License'] && post['LicenseNo'] && post['LicenseNo'].search(/\s/) == -1) {
				LicenseNo = post['LicenseNo'].toUpperCase();
			}
			if (post['avir_proxy'] && post['avir_host'] && post['avir_port'] && 
				/^[a-z0-9\-\.]*$/i.test(post['avir_host']) && 
				/^[0-9]{1,5}$/.test(post['avir_port']) && 65536 - parseInt(post['avir_port']) > 0) {
				avir_proxy = true;
				avir_host = post['avir_host'];
				avir_port = parseInt(post['avir_port']).toString();
				avir_login = post['avir_login'];
				avir_passw = post['avir_passw'];
			} else {
				avir_proxy = false;
				avir_host = '';
				avir_port = '';
				avir_login = '';
				avir_passw = '';
			}
			response.writeHeader(302, {'Location': '/logsmkc.php#settings'});
			response.end();
			fs.readFile(__dirname + '/config.js', 'utf8', (error, configfile) => {
				if (error) {
					console.log(get_date_time() + ' Ошибка чтения config.js ' + error.message);
				} else {
					configfile = configfile.replace(/config\.LicenseNo.*/, "config.LicenseNo = '" + EscapeConfigfile(LicenseNo) + "';");
					if (IDSv1) configfile = configfile.replace(/config\.IDSv1.*/, "config.IDSv1 = true;");
					else configfile = configfile.replace(/config\.IDSv1.*/, "config.IDSv1 = false;");
					if (IDSv2) configfile = configfile.replace(/config\.IDSv2.*/, "config.IDSv2 = true;");
					else configfile = configfile.replace(/config\.IDSv2.*/, "config.IDSv2 = false;");
					if (IDSv3) configfile = configfile.replace(/config\.IDSv3.*/, "config.IDSv3 = true;");
					else configfile = configfile.replace(/config\.IDSv3.*/, "config.IDSv3 = false;");
					if (IDSv4) configfile = configfile.replace(/config\.IDSv4.*/, "config.IDSv4 = true;");
					else configfile = configfile.replace(/config\.IDSv4.*/, "config.IDSv4 = false;");
					if (IDSv5) configfile = configfile.replace(/config\.IDSv5.*/, "config.IDSv5 = true;");
					else configfile = configfile.replace(/config\.IDSv5.*/, "config.IDSv5 = false;");
					if (IDSv6) configfile = configfile.replace(/config\.IDSv6.*/, "config.IDSv6 = true;");
					else configfile = configfile.replace(/config\.IDSv6.*/, "config.IDSv6 = false;");
					if (WebFilter) configfile = configfile.replace(/config\.WebFilter.*/, "config.WebFilter = true;");
					else configfile = configfile.replace(/config\.WebFilter.*/, "config.WebFilter = false;");
					if (geo_github) configfile = configfile.replace(/config\.geo_github.*/, "config.geo_github = true;");
					else configfile = configfile.replace(/config\.geo_github.*/, "config.geo_github = false;");
					if (avir_proxy) {
						configfile = configfile.replace(/config\.avir_proxy.*/, "config.avir_proxy = true;");
						configfile = configfile.replace(/config\.avir_host.*/, "config.avir_host = '" + EscapeConfigfile(avir_host) + "';");
						configfile = configfile.replace(/config\.avir_port.*/, "config.avir_port = '" + EscapeConfigfile(avir_port) + "';");
						configfile = configfile.replace(/config\.avir_login.*/, "config.avir_login = '" + EscapeConfigfile(avir_login) + "';");
						configfile = configfile.replace(/config\.avir_passw.*/, "config.avir_passw = '" + EscapeConfigfile(avir_passw) + "';");
					} else {
						configfile = configfile.replace(/config\.avir_proxy.*/, "config.avir_proxy = false;");
						configfile = configfile.replace(/config\.avir_host.*/, "config.avir_host = '';");
						configfile = configfile.replace(/config\.avir_port.*/, "config.avir_port = '';");
						configfile = configfile.replace(/config\.avir_login.*/, "config.avir_login = '';");
						configfile = configfile.replace(/config\.avir_passw.*/, "config.avir_passw = '';");
					}
					fs.writeFile(__dirname + '/config.js', configfile, (error) => {
						if (error) {
							return console.log(get_date_time() + ' Ошибка записи config.js ' + error.message);
						}
					});
				}
			});
		});
	} else {
		if (systemd) {
			exec('/bin/journalctl -u mirrorkc >' + mirrorlog, (error, output) => {
				if (error) {
					console.log(' Ошибка journalctl ' + error.message);
				} else {
					response_html();
				}
			});
		} else {
			response_html();
		}		
	}
}

function wfkey(request, response) {
	console.log(get_date_time() + ' Получен запрос ключа Web Filter с адреса ' + request.connection.remoteAddress);
	response.writeHead(200, {'Content-Type': 'text/plain'});
	fs.readFile(__dirname + '/getkey.php', 'utf8', (error, contents) => {
		if (error) {
				console.log(get_date_time() + ' Ошибка чтения getkey.php ' + error.message);
				response.end('key not found');
		} else if (/^0:[a-z]{2}:[a-f0-9]{4,6}:[0-9]{1,}:[0-9]{5,6}$/mi.test(contents)) {
				console.log(get_date_time() + ' В файле getkey.php найден ключ ' + contents);
				response.end(contents);
		} else {
				console.log(get_date_time() + ' Ключ Web Filter в файле getkey.php не найден.');
				response.end('key not found');
		}
	});
	return;
}

function mirrorKC(request, response) {
	var nowm = new Date();
	fs.readFile(__dirname + '/lastrun', 'utf8', (error, contents) => {
		if (error || nowm.getTime() - parseInt(contents) >= '28740000') {
			console.log(get_date_time() + ' Поиск новых обновлений запущен по запросу с адреса ' + request.connection.remoteAddress);
			// response.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
			response.writeHead(307, {'Location': '/logsmkc.php#mkcLog.txt', 'Content-Type': 'text/plain; charset=utf-8'});
			response.end('OK\n');
			DownloadUpdates();
			fs.writeFile(__dirname + '/lastrun', nowm.getTime().toString(), 'utf8', (error) => {
				if(error) {
					return console.log(get_date_time() + ' Ошибка записи в файл lastrun ' + error.message);
				}
			});
		} else {
			console.log(get_date_time() + ' Отказано в запуске поиска обновлений по запросу с адреса ' + request.connection.remoteAddress);
			// response.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
			response.writeHead(307, {'Location': '/logsmkc.php#mirror.log', 'Content-Type': 'text/plain; charset=utf-8'});
			response.end('Not now\n');
		}
	});
	return;
}

function DownloadUpdates() {
	function DownloadUpdatesLog(data) {
		let now = new Date();
		let gmt = -now.getTimezoneOffset();
		var get_date_time = '[' + 
			now.getFullYear().toString() + '.' + 
			(now.getMonth() + 1).toString().padStart(2, '0') + '.' + 
			now.getDate().toString().padStart(2, '0') + ' ' + 
			now.getHours().toString().padStart(2, '0') + ':' + 
			now.getMinutes().toString().padStart(2, '0') + ':' + 
			now.getSeconds().toString().padStart(2, '0') + ' GMT' + 
			(gmt < 0 ? '' : '+') + parseInt(gmt / 60) + ':' + 
			(gmt % 60).toString().padStart(2, '0') + '] ';
		if (/^win/.test(process.platform)) {
			fs.writeFileSync(logfile, iconvlite.encode(get_date_time + data + '\r\n','cp866'), {flag: 'a'}); // 'cp866'
		} else {
			fs.writeFileSync(logfile, iconvlite.encode(get_date_time + data + '\n','utf8'), {flag: 'a'}); // 'utf8'
		}
	}

	function CleanupOldFiles(version, callback) {
		if (/^\d+\.\d+$/.test(version)) {
			version = version.toString().split('.');
			var ver1 = parseInt(version[0]).toString();
			var ver2 = parseInt(version[1]).toString();
			var path = __dirname + '/control-update/';
			fs.readdir(path, (error, files) => {
				if (error) {
					return callback('Ошибка чтения папки при очистке обновлений: ' + error.message);
				} else {
					if (files.length > 0) {
						var s1 = new RegExp('^full-' + ver1 + '-.+$');
						var s2 = new RegExp('^full-' + ver1 + '-' + ver2 + '-.+$');
						files.forEach((f, nf) => {
							if (f.search(s1) >= 0 && f.search(s2) < 0) {
								fs.unlink(path + f, (error) => {
									if (error) {
										return callback('Ошибка записи при очистке обновлений: ' + error.message);
									}
								});
							}
						});
					}
					return callback('');
				}
			});
		} else {
			return callback('Ошибка очистки обновлений - неверный номер версии: ' + version);
		}
	}

	function DownloadNewVersion(url_string, dest_string, callback) {
		if (url_string.includes('https://')) {
			var agentOptions = {host: url_string.match(/https?:\/\/([^\/]*)(.*)/)[1], port: '443', path: url_string.match(/https?:\/\/([^\/]*)(.*)/)[2], rejectUnauthorized: false, headers: {'User-Agent': 'WSLib 1.4 [3, 0, 0, 94]'}};
			var agent = new https.Agent(agentOptions);
		} else if (url_string.includes('http://')) {
			var agentOptions = {host: url_string.match(/https?:\/\/([^\/]*)(.*)/)[1], port: '80', path: url_string.match(/https?:\/\/([^\/]*)(.*)/)[2], headers: {'User-Agent': 'WSLib 1.4 [3, 0, 0, 94]'}};
			var agent = new http.Agent(agentOptions);
		} else {
			return callback('Ошибка: неверный протокол в запросе: ' + url_string);
		}
		var amrequest_options = {
			url: url_string, 
			agent: agent,
			timeout: timeout,
			lookup: (hostname, options, callback) => {
				var resolver = new dns.Resolver();
				resolver.setServers([ public_dns1, public_dns2 ]);
				resolver.resolve4(hostname, (error, addresses) => {
					if (!addresses) addresses='';
					callback(error, addresses[0], 4);
				});
			}
		}
		var PAP_code = false;
		var file = fs.createWriteStream(dest_string);
		var z = amrequest(amrequest_options);
		z.on('error', (error) => {
			PAP_code = true;
			file.close();
			return callback('Ошибка ' + error.message + ' при запросе ' + url_string);
		});
		file.on('error', (error) => {
			PAP_code = true;
			file.close();
			return callback('Ошибка ' + error.message + ' при записи в ' + dest_string);
		});
		file.on('close', () => {
			if (PAP_code) fs.unlink(dest_string, () => {})
			else return callback(dest_string);
		});
		z.on('response', (res) => {
			if (res.statusCode === 200) {
				z.pipe(file);
			} else {
				PAP_code = true;
				file.close();
				return callback(`Получен ответ ${res.statusCode} (${res.statusMessage}) при загрузке (${url_string})`);
			}
			res.on('error', (error) => {
				PAP_code = true;
				file.close();
				return callback('Ошибка ' + error.message + ' при загрузке ' + url_string);
			});
		});
	}

	function GetKerioData(url_string, callback) {
		if (url_string.includes('https://')) {
			var agentOptions = {host: url_string.match(/https?:\/\/([^\/]*)(.*)/)[1], port: '443', path: url_string.match(/https?:\/\/([^\/]*)(.*)/)[2], rejectUnauthorized: false, headers: {'User-Agent': 'WSLib 1.4 [3, 0, 0, 94]'}};
			var agent = new https.Agent(agentOptions);
		} else if (url_string.includes('http://')){
			var agentOptions = {host: url_string.match(/https?:\/\/([^\/]*)(.*)/)[1], port: '80', path: url_string.match(/https?:\/\/([^\/]*)(.*)/)[2], headers: {'User-Agent': 'WSLib 1.4 [3, 0, 0, 94]'}};
			var agent = new http.Agent(agentOptions);
		} else {
			return callback('Ошибка: неверный протокол в запросе: ' + url_string);
		}
		var amrequest_options = {
			url: url_string, 
			agent: agent,
			timeout: timeout,
			lookup: (hostname, options, callback) => {
				var resolver = new dns.Resolver();
				resolver.setServers([ public_dns1, public_dns2 ]);
				resolver.resolve4(hostname, (error, addresses) => {
					if (!addresses) addresses='';
					callback(error, addresses[0], 4);
				});
			}
		}
		var z = amrequest(amrequest_options);
		z.on('response', (res) => {
			if (res.statusCode != 200) {
				return callback(`Получен ответ ${res.statusCode}(${res.statusMessage}) при загрузке (${url_string})`);
			} else {
				let data = [];
				res.on('data', (chunk) => {
					data.push(chunk);
				});
				res.on('close', () => {
					return callback(data.toString());	
				});
			}
			res.on('error', (error) => {
				return callback('Ошибка: ', error.message + ' при загрузке ' + url_string);
			});
		});
		z.on('error', (error) => {
			return callback('Ошибка: ', error.message + ' при запросе ' + url_string);
		});
	};

	function GetSavedVersion(version, callback) {
		version = version.toString().split(/[\.-]/);
		var ver1 = parseInt(version[0]).toString();
		var ver2 = 0;
		var path = __dirname + '/control-update/';
		fs.readdir(path, (error, files) => {
			if (error) {
				return callback('Ошибка чтения папки: ' + error.message);
			} else {
				if (files.length > 0) {
					var strs = new RegExp('^full-' + ver1 + '-.+gz$');
					files.forEach((f, nf) => {
						if (f.search(strs) >= 0) {
							var vers = parseInt(f.split('-')[2]);
							if (vers > ver2) {
								if (ver1 == '4') ver2 = vers;
								else if (fs.existsSync(path + f + '.sig')) ver2 = vers;
							}
						}
					});
				}
				return callback(ver1 + '.' + ver2.toString());
			}
		});
	}

	function CreateGEOUpdate (callback) {
		var file4 = __dirname + '/control-update/v4-' + Math.random().toString(16).substr(2, 11) + Math.random().toString(16).substr(2, 11) + Math.random().toString(16).substr(2, 10);
		var file6 = __dirname + '/control-update/v6-' + Math.random().toString(16).substr(2, 11) + Math.random().toString(16).substr(2, 11) + Math.random().toString(16).substr(2, 10);
		var file4_downloaded = false;
		var file6_downloaded = false;
		var minor_version = '';
		var geoip_csv = '';
		var PAP_code = false;
		function proceedCSVfile (file_string, line_handler, callback) {
			if (fs.existsSync (file_string)) {
				var buf = '';
				var file = fs.createReadStream(file_string);
				file.on ('data', (chunk) => {
					var lines = buf.concat(chunk).split(/\r?\n+/);
					buf = lines.pop();
					lines.forEach ((line) => {
						line_handler (line.split(','));
					});
				});
				file.on ('end', () => {
					file.close();
					if (buf.length > 0) line_handler (buf.split(','));
					return callback();
				});
				file.on ('error', (error) => {
					file.close();
					return callback(new Error('Ошибка при чтении ' + file_string + ' ' + error.message ));
				});
			} else {
				return callback(new Error('Ошибка: Файл ' + file_string + ' не существует.'));
			}
		}
		function get_files (data) {
			if (/^\d+\.\d+$/.test(data)) {
				minor_version = (parseInt (data.match(/^\d+\.(\d+)$/mi)[1]) + 1).toString();
				geoip_csv = __dirname + '/control-update/full-4-' + minor_version + '-' + Math.random().toString(16).substr(2, 11) + Math.random().toString(16).substr(2, 11) + Math.random().toString(16).substr(2, 10);
			} else if (data == file4) {
				file4_downloaded = true;
			} else if (data == file6) {
				file6_downloaded = true;
			} else {
				PAP_code = true;
				fs.unlink (file4, () => {});
				fs.unlink (file6, () => {});
				return callback ('не удалось получить новую версию ' + data);
			}
			if (file4_downloaded && file6_downloaded && geoip_csv.length > 50) {
				return proceed_files();
			}
		}
		function proceed_files () {
			if (!PAP_code && fs.existsSync (file4) && fs.existsSync (file6) && geoip_csv.length > 50) {
				var file = fs.createWriteStream(geoip_csv);
				file.on ('error', (error) => {
					PAP_code = true;
					fs.unlink (file4, () => {});
					fs.unlink (file6, () => {});
					return file.close(callback('Ошибка при записи ' + geoip_csv + ' ' + error.message));
				});
				file.on ('close', () => {
					fs.unlink (file4, () => {});
					fs.unlink (file6, () => {});
					if (PAP_code) fs.unlink (geoip_csv, () => {});
					else {
						var file_geoip_csv = fs.createReadStream(geoip_csv);
						var file_geoip_gz = fs.createWriteStream(geoip_csv + '.gz');
						file_geoip_gz.on ('close', () => {
							if (PAP_code) {
								fs.unlink (geoip_csv + '.gz', () => {});
							} else {
								CleanupOldFiles('4.' + minor_version, ()=>{});
								return callback ('база GeoLite2 загружена с github: 4.' + minor_version);
							}
						});
						file_geoip_csv.on ('close', () => {
							fs.unlink (geoip_csv, () => {});
						});
						file_geoip_csv.on ('error', (error) => {
							PAP_code = true;
							file_geoip_csv.close();
							file_geoip_gz.close();
							return callback ('Ошибка при чтении ' + geoip_csv + ' ' + error.message );
						});
						file_geoip_gz.on ('error', (error) => {
							PAP_code = true;
							file_geoip_csv.close();
							file_geoip_gz.close();
							return callback ('Ошибка при записи ' + geoip_csv + '.gz ' + error.message);
						});
						file_geoip_csv.pipe(zlib.createGzip()).pipe(file_geoip_gz);
					}
				});
				proceedCSVfile (file4, (linedata) => {
					if (!PAP_code) {
						if (/^\d+$/.test(linedata[1])) file.write(linedata[0] + ',' + linedata[1] + '\n');
						else if (/^\d+$/.test(linedata[2])) file.write(linedata[0] + ',' + linedata[2] + '\n');
					}
				}, (error) => {
					fs.unlink (file4, () => {});
					if (error) {
						PAP_code = true;
						fs.unlink (file6, () => {});
						return file.close(callback(error.message));
					} else proceedCSVfile (file6, (linedata) => {
								if (!PAP_code) {
									if (/^\d+$/.test(linedata[1])) file.write(linedata[0] + ',' + linedata[1] + '\n');
									else if (/^\d+$/.test(linedata[2])) file.write(linedata[0] + ',' + linedata[2] + '\n');
								}
							}, (error) => {
								fs.unlink (file6, () => {});
								if (error) {
									PAP_code = true;
									return file.close(callback(error.message));
								} else file.close();
							}
						);
					}
				);
			}
		}
		DownloadNewVersion (geo_ip4_url, file4, (data) => {get_files(data)});
		DownloadNewVersion (geo_ip6_url, file6, (data) => {get_files(data)});
		GetSavedVersion ('4', (data) => {get_files(data)});
	}

	function DownloadIDS(ver1, LicenseNo, callback) {
		var idsupdate_url = 'https://ids-update.kerio.com/update.php?id=';
		var version_url = '&version=';
		var tag_url = '&tag=';
		var path = __dirname + '/control-update/';
		ver1 = parseInt(ver1).toString();
		GetSavedVersion(ver1, (savedversion) => {
			if (/^\d+\.\d+$/.test(savedversion)) {
				GetKerioData(idsupdate_url + LicenseNo + version_url + savedversion + tag_url, (data) => {
					if (/full:http.+gz$/mi.test(data)) {
							var ver2 = data.match(/0:\d+\.(\d+)$/mi)[1];
							var newfile_url = data.match(/full:(http.+full-\d-\d+-.+gz)$/mi)[1];
							var newfile_dest = path + data.match(/full:http.+(full-\d-\d+-.+gz)$/mi)[1];
							DownloadNewVersion(newfile_url, newfile_dest, (data) => {
								if (data == newfile_dest) {
									if (parseInt(ver1) == 4) {
										CleanupOldFiles ('4.' + ver2, (data) => {
											if (data) return callback (data);
											else return callback('загружена новая версия: 4.' + ver2);
										});
									} else {
										DownloadNewVersion(newfile_url + '.sig', newfile_dest + '.sig', (data) => {
											if (data == newfile_dest + '.sig') {
												CleanupOldFiles (ver1 + '.' + ver2, (data) => {
													if (data) return callback (data);
													else return callback('загружена новая версия: ' + ver1 + '.' + ver2);
												});
											} else {
												CleanupOldFiles(savedversion, ()=>{});
												return callback(data);
											}
										});
									}
								} else {
									CleanupOldFiles(savedversion, ()=>{});
									return callback(data);
								}
							});
					} else if (data.match(savedversion)) {
						return callback('уже есть последняя версия: ' + savedversion);
					} else if (data.match('Unknown product license')) {
						return callback('не удалось получить новую версию. Лицензия недействительна.');
					} else if (data.match('Maintenance expired')) {
						return callback('не удалось получить новую версию. Срок лицензии истек.');
					} else {
						return callback('не удалось получить новую версию.');
					}
				});
			} else {
				return callback(savedversion);
			}
		});
	}

	function GetWebFilter(LicenseNo, callback) {
		var tag_url = '&tag=';
		var wfactivation_url = 'https://wf-activation.kerio.com/getkey.php?id=';
		GetKerioData(wfactivation_url + LicenseNo + tag_url, (data) => {
			if (/0:[a-z]{2}:[a-f0-9]{4,6}:[0-9]{1,}:[0-9]{5,6}/.test(data)) {
				var wfkey = data.match(/0:[a-z]{2}:[a-f0-9]{4,6}:[0-9]{1,}:[0-9]{5,6}/mi)[0];
				var wfile = __dirname + '/getkey.php';
				fs.writeFile(wfile, wfkey, 'utf8', (error) => {
					if (error) {
						fs.unlink(wfile, () => { // try to delete the (partial) file and then return the error
							return callback('Ошибка записи ключа в файл getkey.php: ' + error.message);
						});
					} else {
						return callback('новый ключ записан в файл getkey.php');
					}
				});
			} else if (data.match('Unknown product license')) {
				return callback('не удалось получить ключ. Лицензия недействительна.');
			} else if (data.match('Maintenance expired')) {
				return callback('не удалось получить ключ. Срок лицензии истек.');
			} else {
				return callback('не удалось получить новый ключ.');
			}
		});
	}

	DownloadUpdatesLog('Зеркало обновлений v.25.03.09 by Ru-Board (nodejs edition)');
	DownloadUpdatesLog('Распространяется "как есть" на условиях https://unlicense.org/');
		if (LicenseNo) {
	DownloadUpdatesLog('Используется лицензионный ключ: ' + LicenseNo);
	DownloadUpdatesLog('----------------------------------------------------------------');
		} else {
	DownloadUpdatesLog('Для загрузки обновлений необходима действующая лицензия');
	DownloadUpdatesLog('----------------------------------------------------------------');
	return;
		}
	//формируем список загрузок
	var UpdatesToDownload = 0;
	if (IDSv1) ++UpdatesToDownload;
	if (IDSv2) ++UpdatesToDownload;
	if (IDSv3) ++UpdatesToDownload;
	if (IDSv4) ++UpdatesToDownload;
	if (IDSv5) ++UpdatesToDownload;
	if (IDSv6) ++UpdatesToDownload;
	if (WebFilter) ++UpdatesToDownload;
	// Загрузка новой версии IDS для Windows
	if (IDSv1) {
		DownloadIDS('1', LicenseNo, (data) => {
			DownloadUpdatesLog('IDSv1 - ' + data);
			--UpdatesToDownload;
		});
	}
	// Загрузка новой версии BlockList
	if (IDSv2) {
		DownloadIDS('2', LicenseNo, (data) => {
			DownloadUpdatesLog('IDSv2 - ' + data);
			--UpdatesToDownload;
		});
	}
	// Загрузка новой версии IDS для Linux до 9.5
	if (IDSv3) {
		DownloadIDS('3', LicenseNo, (data) => {
			DownloadUpdatesLog('IDSv3 - ' + data);
			--UpdatesToDownload;
		});
	}
	// Загрузка новой версии базы GeoIP
	if (IDSv4) {
		if (geo_github) CreateGEOUpdate ((data) => {
			DownloadUpdatesLog('IDSv4 - ' + data);
			--UpdatesToDownload;
		});			
		else DownloadIDS('4', LicenseNo, (data) => {
			DownloadUpdatesLog('IDSv4 - ' + data);
			--UpdatesToDownload;
		});
	}
	// Загрузка новой версии IDS для Linux с 9.5
	if (IDSv5) {
		DownloadIDS('5', LicenseNo, (data) => {
			DownloadUpdatesLog('IDSv5 - ' + data);
			--UpdatesToDownload;
		});
	}
	// Загрузка новой версии IDS ???
	if (IDSv6) {
		DownloadIDS('6', LicenseNo, (data) => {
			DownloadUpdatesLog('IDSv6 - ' + data);
			--UpdatesToDownload;
		});
	}
	// Загрузка нового ключа WebFilter
	if (WebFilter) {
		GetWebFilter(LicenseNo, (data) => {
			DownloadUpdatesLog('Web Filter - ' + data);
			--UpdatesToDownload;
		});
	}
	//Таймаут 10 минут
	waitforUpdatesToDownload(Date.now() + (10 * 60000)); // 60000 миллисекунд в одной минуте
	function waitforUpdatesToDownload(timespan) {
		if (Date.now() > timespan) {
			DownloadUpdatesLog('Максимальное время работы превышено');
			DownloadUpdatesLog('----------------------------------------------------------------');
			return;
		} else if (UpdatesToDownload > 0) {
			setTimeout(()=>{waitforUpdatesToDownload(timespan)}, 1000);
		} else {
			DownloadUpdatesLog('Работа завершена');
			DownloadUpdatesLog('----------------------------------------------------------------');
			return;
		}
	};
}

function checknew(request, response) {
	console.log(get_date_time() + ' Получен запрос на обновление дистрибутива от ' + request.connection.remoteAddress);
	var ProdVer = '800';
	var pathname = url.parse(request.url).pathname;
	var host = request.headers.host;
	var h = host.split(/\:[\d]{1,5}$/);
	var hostname = h[0];
	var body = '';
	request.setEncoding('utf-8');
	request.on('data', (data) => {
		body += data;
	});
	request.on('end', () => {
		var post = querystring.parse(body);
		var prod_build_number = JSON.stringify(post).match(/name=\\"prod_build_number\\"\\r\\n\\r\\n([\d]{1,})\\r\\n/);
		var prod_major = JSON.stringify(post).match(/name=\\"prod_major\\"\\r\\n\\r\\n([\d]{1,})\\r\\n/);
		var prod_minor = JSON.stringify(post).match(/name=\\"prod_minor\\"\\r\\n\\r\\n([\d]{1,})\\r\\n/);
		var prod_build = JSON.stringify(post).match(/name=\\"prod_build\\"\\r\\n\\r\\n([\d]{1,})\\r\\n/);
		var prod_code = JSON.stringify(post).match(/name=\\"prod_code\\"\\r\\n\\r\\n([A-Z]{1,3})\\r\\n/);
		var os_platform = JSON.stringify(post).match(/name=\\"os_platform\\"\\r\\n\\r\\n([A-Z2-8]{1,}.[A-Z2-8]{1,})\\r\\n/);
		var InstallationType = JSON.stringify(post).match(/name=\\"InstallationType\\"\\r\\n\\r\\n([a-z]{1,3})\\r\\n/);
		var ReminderId = JSON.stringify(post).match(/name=\\"ReminderId\\"\\r\\n\\r\\n([\d]{1,})\\r\\n/);
		var ReminderAuth = JSON.stringify(post).match(/name=\\"ReminderAuth\\"\\r\\n\\r\\n([\d]{1,})\\r\\n/);
		if(ReminderId && ReminderId[1] && ReminderAuth && ReminderAuth[1]) {
			if(ReminderId[1] == '0' && ReminderAuth[1] == '0') {
				ReminderId[1] = '111999';
				ReminderAuth[1] = '415815';
			}
		} else {
			var ReminderId=['111999','111999'];
			var ReminderAuth=['415815','415815'];
		}
		if(prod_code && prod_code[1] && os_platform && os_platform[1]) {
			console.log(get_date_time() + ' Запрашивается обновление для продукта: ' + prod_code[1] + ' на платформе: '+os_platform[1]);
			if (prod_code[1] == 'KWF') {
				var path = '/dwn/control/';
				get_answer(response, hostname, path, prod_build_number, prod_major, prod_minor, prod_build, prod_code, os_platform, ReminderId, ReminderAuth, 'img');
			} else if (prod_code[1] == 'KTS') {
				var path = '/dwn/operator/';
				get_answer(response, hostname, path, prod_build_number, prod_major, prod_minor, prod_build, prod_code, os_platform, ReminderId, ReminderAuth, 'img');			
			} else {
				if (os_platform[1] =='WIN64.64') {
					var path = '/dwn/connect/'; 
					get_answer(response, hostname, path, prod_build_number, prod_major, prod_minor, prod_build, prod_code, os_platform, ReminderId, ReminderAuth, 'exe');
				} else {
					if (InstallationType && InstallationType[1] == 'deb') {
						var path = '/dwn/connect/';
						get_answer(response, hostname, path, prod_build_number, prod_major, prod_minor, prod_build, prod_code, os_platform, ReminderId, ReminderAuth, 'deb');
					} else {
						var path = '/dwn/connect/';
						get_answer(response, hostname, path, prod_build_number, prod_major, prod_minor, prod_build, prod_code, os_platform, ReminderId, ReminderAuth, 'rpm');
					}
				}
			}
		} else {
			response.writeHead(200, {'Content-Type': 'text/plain; charset=iso-8859-1','Content-Encoding': 'identity', 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache', 'Front-End-Https': 'on', 'Proxy-Connection': 'keep-alive'});
 			response.write("--INFO--\n");
			response.write("ReminderId='1'\n");
			response.write("ReminderAuth='1'\n");
			response.write("Version='0'\n");
			response.end();
			console.log(get_date_time() + ' Код продукта в запросе не обнаружен.');
		}
	});
	function get_answer(response, hostname, path, prod_build_number, prod_major, prod_minor, prod_build, prod_code, os_platform, ReminderId, ReminderAuth, ext) {
		fs.readdir(__dirname + path, (error, files) => {
			if (error) return console.log(get_date_time() + 'Ошибка чтения ' + path + ' директории: ' + error.message);
			if (files.length == 0) return response.end("--INFO--\nReminderId='1'\nReminderAuth='1'\nVersion='0'\n");
			var ff = false;
			files.forEach(function(f, nf) {
				var regex = new RegExp('.' + ext + '$');
				if (f.search(regex)>=0) {
					ff = true;
					var comment = f.replace(regex,'');
					var numb=String(f.match(/[\d]{1,}.[\d]{1,}.[\d]{1,}/)).split('.');
					var PatchVer=String(f.match(/\-p[\d]{1,}\-/)).split('-');
					if (PatchVer && PatchVer[1]) {
						PatchVer[1]=PatchVer[1].substr(1);
					} else {
						var PatchVer=['0','0'];
					}
					var global_number=String(f.match(/_[\d]{1,}_/)).split('_');
					if (numb && numb[0] && numb[1] && numb[2]) {
						ProdVer = numb[0] + numb[1] + numb[2];
						console.log(get_date_time() + ' Найдено обновление до версии: ' + ProdVer);
						var PackageCode = prod_code[1] + ':' + ('00000' + numb[0]).slice(-3) + '.' + ('00000' + numb[1]).slice(-3) + '.' + ('00000' + numb[2]).slice(-5) + '.T.' + ('00000' + PatchVer[1]).slice(-3) + '.000';
						if (prod_major && prod_minor && prod_build && prod_major[1] && prod_minor[1] && prod_build[1]) {
							var CurrentVersion = prod_major[1] + prod_minor[1] + prod_build[1];
							console.log(get_date_time() + ' Запрашивается обновление для версии: ' + CurrentVersion );
							if (Math.floor(CurrentVersion.length) == Math.floor(ProdVer.length)) {
								if (Math.floor(CurrentVersion) < Math.floor(ProdVer)) {
									if (prod_code[1] == 'KWF') {
										var InfoURL = 'http://forum.ru-board.com/topic.cgi?forum=35&bm=1&topic=0011#1';
									} else if (prod_code[1] == 'KTS') {
										var InfoURL = 'http://forum.ru-board.com/topic.cgi?forum=35&topic=80136&start=0';								
									} else {
										var InfoURL = 'http://forum.ru-board.com/topic.cgi?forum=35&topic=47339&start=1';
									}
									response.writeHead(200, {'Content-Type': 'text/plain; charset=iso-8859-1','Content-Encoding': 'identity', 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache', 'Front-End-Https': 'on', 'Proxy-Connection': 'keep-alive'});
									var stats = fs.statSync(__dirname + path + f);
									var mtime = stats.mtime.getTime()/1000;
									response.write("--INFO--\n");
									response.write("ReminderId='" + ReminderId[1] + "'\n");
									response.write("ReminderAuth='" + ReminderAuth[1] + "'\n");
									response.write("Version='1'\n");
									response.write("LicenseUsageReceived='0'\n");
									response.write("--VERSION_BEGIN--\n");
									response.write("PackageCode='" + PackageCode + "'\n");
									response.write("Description='" + comment + "'\n");
									response.write("Comment='" + comment + "'\n");
									response.write("DownloadURL='http://" + hostname + path + f + "'\n");
									response.write("DownloadURLtext='Download from HERE!'\n");
									response.write("InfoURL='" + InfoURL + "'\n");
									response.write("InfoURLtext='View more information!'\n");
									response.write("--VERSION_END--\n");
									response.end();
								} else {
									if (Math.floor(CurrentVersion) == Math.floor(ProdVer)) {
										if (global_number && global_number[1]) {
											if (prod_build_number && Math.floor(prod_build_number[1]) < Math.floor(global_number[1])) {
												if (prod_code[1] == 'KWF') {
													var InfoURL = 'http://forum.ru-board.com/topic.cgi?forum=35&bm=1&topic=0011#1';
												} else {
													var InfoURL = 'http://forum.ru-board.com/topic.cgi?forum=35&topic=47339&start=1';
												}
												response.writeHead(200, {'Content-Type': 'text/plain; charset=iso-8859-1','Content-Encoding': 'identity', 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache', 'Front-End-Https': 'on', 'Proxy-Connection': 'keep-alive'});
												var stats = fs.statSync(__dirname + path + f);
												var mtime = stats.mtime.getTime()/1000;
												response.write("--INFO--\n");
												response.write("ReminderId='" + ReminderId[1] + "'\n");
												response.write("ReminderAuth='" + ReminderAuth[1] + "'\n");
												response.write("Version='1'\n");
												response.write("LicenseUsageReceived='0'\n");
												response.write("--VERSION_BEGIN--\n");
												response.write("PackageCode='" + PackageCode + "'\n");
												response.write("Description='" + comment + "'\n");
												response.write("Comment='" + comment + "'\n");
												response.write("DownloadURL='http://" + hostname + path + f + "'\n");
												response.write("DownloadURLtext='Download from HERE!'\n");
												response.write("InfoURL='" + InfoURL + "'\n");
												response.write("InfoURLtext='View more information!'\n");
												response.write("--VERSION_END--\n");
												response.end();
											} else {
												response.writeHead(200, {'Content-Type': 'text/plain; charset=iso-8859-1','Content-Encoding': 'identity', 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache', 'Front-End-Https': 'on', 'Proxy-Connection': 'keep-alive'});
												response.write("--INFO--\n");
												response.write("ReminderId='1'\n");
												response.write("ReminderAuth='1'\n");
												response.write("Version='0'\n");
												response.end();
											}
										} else {
											response.writeHead(200, {'Content-Type': 'text/plain; charset=iso-8859-1','Content-Encoding': 'identity', 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache', 'Front-End-Https': 'on', 'Proxy-Connection': 'keep-alive'});
											response.write("--INFO--\n");
											response.write("ReminderId='1'\n");
											response.write("ReminderAuth='1'\n");
											response.write("Version='0'\n");
											response.end();
											console.log(get_date_time() + ' Не распознан номер версии образа обновлений ' + f);
										}
									} else {
										response.writeHead(200, {'Content-Type': 'text/plain; charset=iso-8859-1','Content-Encoding': 'identity', 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache', 'Front-End-Https': 'on', 'Proxy-Connection': 'keep-alive'});
										response.write("--INFO--\n");
										response.write("ReminderId='1'\n");
										response.write("ReminderAuth='1'\n");
										response.write("Version='0'\n");
										response.end();
									}
								}
							} else {
								if (global_number && global_number[1]) {
									if (prod_build_number && Math.floor(prod_build_number[1]) < Math.floor(global_number[1])) {
										if (prod_code[1] == 'KWF') {
											var InfoURL = 'http://forum.ru-board.com/topic.cgi?forum=35&bm=1&topic=0011#1';
										} else {
											var InfoURL = 'http://forum.ru-board.com/topic.cgi?forum=35&topic=47339&start=1';
										}
										response.writeHead(200, {'Content-Type': 'text/plain; charset=iso-8859-1','Content-Encoding': 'identity', 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache', 'Front-End-Https': 'on', 'Proxy-Connection': 'keep-alive'});
										var stats = fs.statSync(__dirname + path + f);
										var mtime = stats.mtime.getTime() / 1000;
										response.write("--INFO--\n");
										response.write("ReminderId='" + ReminderId[1] + "'\n");
										response.write("ReminderAuth='" + ReminderAuth[1] + "'\n");
										response.write("Version='1'\n");
										response.write("LicenseUsageReceived='0'\n");
										response.write("--VERSION_BEGIN--\n");
										response.write("PackageCode='" + PackageCode + "'\n");
										response.write("Description='" + comment + "'\n");
										response.write("Comment='" + comment + "'\n");
										response.write("DownloadURL='http://" + hostname + path + f + "'\n");
										response.write("DownloadURLtext='Download from HERE!'\n");
										response.write("InfoURL='" + InfoURL + "'\n");
										response.write("InfoURLtext='View more information!'\n");
										response.write("--VERSION_END--\n");
										response.end();
									} else {
										response.writeHead(200, {'Content-Type': 'text/plain; charset=iso-8859-1','Content-Encoding': 'identity', 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache', 'Front-End-Https': 'on', 'Proxy-Connection': 'keep-alive'});
										response.write("--INFO--\n");
										response.write("ReminderId='1'\n");
										response.write("ReminderAuth='1'\n");
										response.write("Version='0'\n");
										response.end();
									}
								} else {
									response.writeHead(200, {'Content-Type': 'text/plain; charset=iso-8859-1','Content-Encoding': 'identity', 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache', 'Front-End-Https': 'on', 'Proxy-Connection': 'keep-alive'});
									response.write("--INFO--\n");
									response.write("ReminderId='1'\n");
									response.write("ReminderAuth='1'\n");
									response.write("Version='0'\n");
									response.end();
									console.log(get_date_time() + ' Не распознан номер версии образа обновлений ' + f);
								}
							}
						} else {
							response.writeHead(200, {'Content-Type': 'text/plain; charset=iso-8859-1','Content-Encoding': 'identity', 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache', 'Front-End-Https': 'on', 'Proxy-Connection': 'keep-alive'});
							response.write("--INFO--\n");
							response.write("ReminderId='1'\n");
							response.write("ReminderAuth='1'\n");
							response.write("Version='0'\n");
							response.end();
							console.log(get_date_time() + ' В запросе на обновление продукта отсутствуют необходимые параметры.');
						}
					} else {
						response.writeHead(200, {'Content-Type': 'text/plain; charset=iso-8859-1','Content-Encoding': 'identity', 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache', 'Front-End-Https': 'on', 'Proxy-Connection': 'keep-alive'});
						response.write("--INFO--\n");
						response.write("ReminderId='1'\n");
						response.write("ReminderAuth='1'\n");
						response.write("Version='0'\n");
						response.end();
						console.log(get_date_time() +' Не распознана версия образа обновлений ' + f);
					}
				} else {
					if (!ff) {
						if (Math.floor(nf) + 1 == Math.floor(files.length)) {
							response.writeHead(200, {'Content-Type': 'text/plain; charset=iso-8859-1','Content-Encoding': 'identity', 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache', 'Front-End-Https': 'on', 'Proxy-Connection': 'keep-alive'});
							response.write("--INFO--\n");
							response.write("ReminderId='1'\n");
							response.write("ReminderAuth='1'\n");
							response.write("Version='0'\n");
							response.end();
							console.log(get_date_time() + ' Файл с кодом продукта: ' + prod_code[1] + ' для платформы: ' + os_platform[1] + ' не найден.');
						}
					}
				}
			});
		});
	}
}

function bitdefender(request, response) {
	switch (true) {
		case /bdupdate\.kerio\.com/.test(request.headers.host):
			console.log(get_date_time() + ' Получен запрос на загрузку сигнатур антивируса с адреса ' + request.connection.remoteAddress);
			break;
		case /bda\-update\.kerio\.com/.test(request.headers.host):
			console.log(get_date_time() + ' Получен запрос на загрузку сигнатур антиспам с адреса ' + request.connection.remoteAddress);
			break;
		default :
			response.writeHead(404, {'Content-Type': 'text/plain'});
			response.end('404 Not found');
			console.log(get_date_time() + ' Получен неизвестный запрос на загрузку: ' + request.url + ' с адреса: ' + request.connection.remoteAddress);
			return;
	}
	request.headers.host = 'upgrade.bitdefender.com';
	var agentOptionsHost = request.headers.host;
	var agentOptionsPort = avir_proto == 'https' ? '443' : '80';
	var agentOptionsPath = '/';
	if (avir_proxy) {
		agentOptionsHost = avir_host;
		agentOptionsPort = avir_port;
		agentOptionsPath = request.headers.host;
	}
	if (avir_proto == 'https') {
		var agentOptions = {host: agentOptionsHost, port: agentOptionsPort, path: agentOptionsPath, headers: {'User-Agent': 'WSLib 1.4 [3, 0, 0, 94]'}, rejectUnauthorized: false, secureProtocol: 'TLSv1_2_method', ciphers: 'ECDHE-RSA-CHACHA20-POLY1305'};
		var agent = new https.Agent(agentOptions);
	} else {
		var agentOptions = {host: agentOptionsHost, port: agentOptionsPort, path: agentOptionsPath, headers: {'User-Agent': 'WSLib 1.4 [3, 0, 0, 94]'}};
		var agent = new http.Agent(agentOptions);
	}
	var amrequest_options = {
		url: avir_proto + '://' + request.headers.host + request.url, 
		agent: agent,
		lookup: (hostname, options, callback) => {
			var resolver = new dns.Resolver();
			resolver.setServers([ public_dns1, public_dns2 ]);
			resolver.resolve4(hostname, (error, addresses) => {
				if (!addresses) addresses='';
				callback(error, addresses[0], 4);
			});
		}
	};
	if (avir_proxy) {
		Object.assign (amrequest_options, {proxy: 'http://' + avir_host + ':' + avir_port});
		if (avir_login) Object.assign (amrequest_options, {headers: {'Proxy-Authorization': 'Basic ' + Buffer.from(avir_login + ':' + avir_passw).toString('base64')}});
	}
	var z = amrequest(amrequest_options, (error) => {
		if (error) {
			response.writeHead(404, {'Content-Type': 'text/plain'});
			response.end('404 Not found');
			console.log(get_date_time() + ' Ошибка ' + error.message + ' при загрузке файла ' + request.url + ' по запросу с адреса ' + request.connection.remoteAddress);
			return;
		}
	});
	request.pipe(z);
	z.pipe(response);
	console.log(get_date_time() + ' Адрес ' + request.connection.remoteAddress + ' загружает файл: ' + request.url);
}

function start() {
	function onRequest(request, response) {
		if (ipv4_list.length > 6 && !ipv4_list.includes(request.connection.remoteAddress)) {
			response.writeHead(403 , {'Connection': 'close', 'Content-Type': 'text/plain'});
			response.end('403 Forbidden');
			console.log(get_date_time() + ' Попытка доступа с неразрешенного адреса: ' + request.connection.remoteAddress);
			return;
		} else switch(true) {
			case /WSLib \d\.\d \[\d, \d, \d, [\d]{1,4}\]/.test(request.headers['user-agent']):
				bitdefender(request, response);
				break;
			case /\/update\.php/.test(request.url):
				rules(request, response);
				break;
			case /\/getkey\.php/.test(request.url):
				wfkey(request, response);
				break;
			case /\/checknew\.php/.test(request.url):
				checknew(request, response);
				break;
			case /\/favicon\.ico/.test(request.url):
				response.writeHead(200, {'Content-Type': 'image/x-icon'});
			case /\/kersophos\/IDES/.test(request.url):
			case /\/kersophos\/VDBS/.test(request.url):
			case /\/kersophos\/APIS/.test(request.url):
			case /\/kersophos\/CNF/.test(request.url):
			case /\/control-update/.test(request.url):
			case /\/dwn\/control\//.test(request.url):
			case /\/dwn\/connect\//.test(request.url):
			case /\/dwn\/operator\//.test(request.url):
				download(request, response);
				break;
			case /\/mirrorkc\.php/.test(request.url):
				mirrorKC(request, response);
				break;
			case /\/logsmkc\.php/.test(request.url):
				if (typeof config_login != 'undefined' && config_login && request.headers.authorization != 'Basic ' + new Buffer.from(config_login + ':' + config_passw).toString('base64')) {
					response.writeHead(401, {'WWW-Authenticate': 'Basic realm="' + request.headers.host + '"', 'Connection': 'close', 'Content-Type': 'text/plain'});
					response.end('401 Unauthorized');
					console.log(get_date_time() + ' Попытка доступа с неверными учетными данными (' + request.headers.authorization + ') с адреса: ' + request.connection.remoteAddress);
				} else {
					logsmkc(request,response);
				}
				break;
			case /\/logout\.php/.test(request.url):
				response.writeHead(401, {'WWW-Authenticate': 'Basic realm="' + request.headers.host + '"', 'Connection': 'close', 'Content-Type': 'text/plain'});
				response.end('401 Unauthorized');
				console.log(get_date_time() + ' Произведен выход из учетной записи с адреса: ' + request.connection.remoteAddress);
				break;
			case /\/robots\.txt/.test(request.url):
				response.writeHead(200, {'Content-Type': 'text/plain'});
				response.end('User-agent: *\nDisallow: /');
				break;
			default:
				if (proxy) {
					var hostname = request.headers.host.split(/\:[\d]{1,5}$/)[0];
					if (request.socket.encrypted) var target_proxy = 'https://' + hostname + ':' + ports_proxy;
					else var target_proxy = 'http://' + hostname + ':' + port_proxy;
					amrequest(target_proxy, (error) => {
						if (error) {
							response.writeHead(404, {'Content-Type': 'text/plain'});
							response.end('404 Not found');
							console.log(get_date_time() + ' Не удаётся проксировать запрос: ' + error.message);
							return;
						} else {
							var httpProxy_options = {target: target_proxy, preserveHeaderKeyCase: true};
							if (request.socket.encrypted) Object.assign (httpProxy_options, {ssl: options, secure: false});
							proxy = httpProxy.createServer({});
							proxy.web(request, response, httpProxy_options);
						}
					});
				} else {
					console.log(get_date_time() + ' Получен неизвестный запрос: ' + request.url + ' с адреса: ' + request.connection.remoteAddress);
					response.writeHead(404, {'Content-Type': 'text/plain'});
					response.end('404 Not found');
				}
		}
	}
// Начинаем подготовку к работе
	console.log('Зеркало обновлений v.25.03.16 by Ru-Board (nodejs edition)');
	console.log('Распространяется "как есть" на условиях https://unlicense.org/');
// Проверяем, является ли система systemd линукс
	if (/^win/.test(process.platform)) {
		systemd = false;
		console.log(get_date_time() + ' Используется операционная система Windows.');
	} else try {
			systemd = execSync('/bin/ps -e | /bin/grep -E systemd$ > /dev/null && /bin/echo "systemd_system" || /bin/echo "other_system"').toString().match(/systemd_system/);
			console.log(get_date_time() + ' Используется операционная система Linux: ' + ((systemd) ? 'systemd_system' : 'other_system') + '.');
		} catch (error) {
			systemd = false;
			console.log(get_date_time() + ' Ошибка выполнения команды: ' + error.message);
		}
// Проверяем каталоги
	try {
		if (!certs || !fs.existsSync(certs)) throw new Error('Не найден каталог сертификатов ' + certs);
		if (!config.LocalAuthority || !fs.existsSync(certs + config.LocalAuthority)) throw new Error('Не найден корневой сертификат ' + certs + config.LocalAuthority);
		if (!config.Certificate || !fs.existsSync(certs + config.Certificate)) throw new Error('Не найден сертификат HTTPS сервера ' + certs + config.Certificate);
		if (!config.Key || !fs.existsSync(certs + config.Key)) throw new Error('Не найден ключ сертификата HTTPS сервера ' + certs + config.Key);
		if (!fs.existsSync(__dirname + '/control-update/')) fs.mkdirSync(__dirname + '/control-update/', {recursive: true});
		if (!fs.existsSync(__dirname + '/dwn/control/')) fs.mkdirSync(__dirname + '/dwn/control/', {recursive: true});
		if (!fs.existsSync(__dirname + '/dwn/operator/')) fs.mkdirSync(__dirname + '/dwn/operator/', {recursive: true});
		if (!fs.existsSync(__dirname + '/dwn/connect/')) fs.mkdirSync(__dirname + '/dwn/connect/', {recursive: true});
	} catch (error) {
		return console.log(get_date_time() + ' Ошибка: ' + error.message); // Оповещаем и выходим
	}
// Загружаем список разрешенных ip
	if (typeof ipv4_list_file != 'undefined' && fs.existsSync(ipv4_list_file)) {
		try {
			ipv4_list = fs.readFileSync(ipv4_list_file);
			console.log(get_date_time() + ' Загружен список разрешенных IPv4 адресов: ' + ipv4_list.length.toString() + ' байт.');
		} catch (error) {
			ipv4_list = '';
			return console.log(get_date_time() + ' Ошибка загрузки списка разрешенных адресов: ' + error.message); // Оповещаем и выходим
		}
	} else {
		ipv4_list = '';
		console.log(get_date_time() + ' Ограничение доступа по списку разрешенных IPv4 адресов не установлено.');
	}
// Создаем сервер HTTP c callback function onRequest
	var server = http.createServer(onRequest).listen(port, '0.0.0.0');
	console.log(get_date_time() + ' HTTP сервер работает, используется ' + port + ' порт.');
// Создаем сервер HTTPS с callback, как у HTTP сервера.
	var servers = https.createServer(options, onRequest).listen(ports, '0.0.0.0');
	console.log(get_date_time() + ' HTTPS сервер работает, используется ' + ports + ' порт.');
// Создаем SSDP сервер для оповещения о своем присутствии в сети
	var	serverdp = new ssdp({
		location: 'http://' + ip.address() + ':' + port + '/logsmkc.php',
		ssdpSig: 'node.js/' + process.version + '/UPnP/1.1/Pyntuition-for-Kerio UPnP/0.1'
	});
	serverdp.addUSN('urn:schemas-kerio-com:service:ScalarWebAPI:1');
	process.on('exit', () => {
		serverdp.stop(); // Выключаем оповещение и прекращаем работу SSDP
	});
	serverdp.start();
	console.log(get_date_time() + ' SSDP USN urn:schemas-kerio-com:service:ScalarWebAPI:1');
}

start();
