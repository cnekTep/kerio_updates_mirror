var config = require('./config');
var url = require('url');
var https = require("https");
var http = require("http");
var amrequest = require("request");
var querystring = require('querystring');
var exec = require('child_process').exec;
var fs = require('fs');
var iconvlite = require('iconv-lite');
var cmd = config.cmd;
var logfile = config.logfile;
var mirrorlog = config.mirrorlog;
var avir_proto = config.avir_proto;
var avir_proxy = config.avir_proxy;
var avir_host = config.avir_host;
var avir_port = config.avir_port;
var avir_login = config.avir_login;
var avir_passw = config.avir_passw;

function rules(request, response) {
	var nowr = new Date();
	console.log(nowr+" Request handler 'rules' from "+request.connection.remoteAddress+" was called.");
	var path = "/control-update/";
	var pathname = url.parse(request.url).pathname;
	var host = request.headers.host;
	var h = host.split(/\:[\d]{1,5}$/);
	var hostname = h[0];
	if (querystring.parse(request.url).version) {
		var version = querystring.parse(request.url).version;
		var ver = version.substring(0, 1);
	}
	var strs = "full-"+ver+"-";
	response.writeHead(200, {"Content-Type": "text/plain"});
	fs.readdir(__dirname+path, function(err, files) {
		if (err) return console.log('Error read directory : '+err);
			if (files.length == 0) return response.end();
			var ff = false;
		files.forEach(function(f, nf) {
				var vers = "";
				if (f.search(/^full-.{1,}gz$/)>=0) {
					ff = true;
					if (f.search(strs)>=0) {
						vers = f.split("-");
						response.write("0:"+vers[1]+"."+vers[2]+"\n");
						response.write("full:http://"+hostname+path+f);
						response.end();
					}
				} else {
					if (!ff) {
						if (Math.floor(nf)+1 == Math.floor(files.length)) {
							response.end();
						}
					}
				}
		});
	});
}

function download(request, response) {
	var nowd = new Date();
	console.log(nowd+" Request handler 'download' from "+request.connection.remoteAddress+" was called.");
	console.log(nowd+" Request url for download "+request.url);
	if (request.url.search(/\/[\d]{1,4}\//)>=0) {
		var newurl = request.url.replace(/\/[\d]{1,4}/, "");
	} else {
		var newurl = request.url;
	}
	if (fs.existsSync(__dirname+newurl)) {
		fs.createReadStream(__dirname+newurl).pipe(response);
	} else {
		response.writeHead(404, {"Content-Type": "text/plain"});
		response.end("404 Not found");
	}
}

function logsmkc(request, response) {
//	var nowd = new Date();
//	console.log(nowd+" Request handler 'logsmkc' from "+request.connection.remoteAddress+" was called.");
	function readFileSync_encoding(filename, encoding) {
		var content = fs.readFileSync(filename);
		return iconvlite.decode(content, encoding);
	}
	function files_to_html (file) {
		if (file) {
			mirror = JSON.stringify(file);
			mirror = mirror.replace(/(^"|"$)/g,"");
			mirror = mirror.replace(/(\\n\\n\\n|\\n\\n)/g,"<br>");
			mirror = mirror.replace(/(\\r\\n|\\n)/g,"<br>");
			var newline_mark = '<br>';
			var last_br_position = mirror.lastIndexOf(newline_mark);
			var start_br_position = mirror.lastIndexOf(newline_mark, last_br_position-1);
			var step;
			for (step = 0; step < 2000; step++) {
				var start_br_position = mirror.lastIndexOf(newline_mark, start_br_position-1);
			}
			if (last_br_position == -1)
				mirror = mirror;
			else
				mirror = mirror.substr(start_br_position + newline_mark.length);
		} else {
			if (fs.existsSync(mirrorlog)) {
				var mirror = readFileSync_encoding(mirrorlog, 'utf8');
				mirror = JSON.stringify(mirror);
				mirror = mirror.replace(/(^"|"$)/g,"");
				mirror = mirror.replace(/(\\n\\n\\n|\\n\\n)/g,"<br>");
				mirror = mirror.replace(/(\\r\\n|\\n)/g,"<br>");
				var newline_mark = '<br>';
				var last_br_position = mirror.lastIndexOf(newline_mark);
				var start_br_position = mirror.lastIndexOf(newline_mark, last_br_position-1);
				var step;
				for (step = 0; step < 2000; step++) {
					var start_br_position = mirror.lastIndexOf(newline_mark, start_br_position-1);
				}
				if (last_br_position == -1)
					mirror = mirror;
				else
					mirror = mirror.substr(start_br_position + newline_mark.length);
			} else {
				mirror = 'file '+mirrorlog+' not found';
			}
		}
			if (fs.existsSync(logfile)) {
				if (/^win/.test(process.platform)) {
					var mkc = readFileSync_encoding(logfile, 'cp866');
				} else {
					var mkc = readFileSync_encoding(logfile, 'utf8');
				}
				mkc = JSON.stringify(mkc);
				mkc = mkc.replace(/(^"|"$)/g,"");
				mkc = mkc.replace(/\\"/g,"\"");
				mkc = mkc.replace(/(\\n\\n\\n|\\n\\n)/g,"<br>");
				mkc = mkc.replace(/(\\r\\n|\\n)/g,"<br>");
				var last_br_position = mkc.lastIndexOf(newline_mark);
				var start_br_position = mkc.lastIndexOf(newline_mark, last_br_position-1);
				for (step = 0; step < 2000; step++) {
					var start_br_position = mkc.lastIndexOf(newline_mark, start_br_position-1);
				}
				if (last_br_position == -1)
					mkc = mkc;
				else
					mkc = mkc.substr(start_br_position + newline_mark.length);
			} else {
				mkc = 'file '+logfile+' not found';
			}
			if (fs.existsSync(__dirname+'/index.html')) {
				var html = fs.readFileSync(__dirname+'/index.html', 'utf8');
				html = html.replace('<p class="mirrorkc">mirrorkc.log</p>', '<p class="mirrorkc">'+mirror+'</p>');
				html = html.replace('<p class="mkc">mkcLog.txt</p>', '<p class="mkc">'+mkc+'<p>');
				response.writeHeader(200, {"Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store"});
				response.write(html);
				response.end();
			} else {
				response.writeHead(404, {"Content-Type": "text/plain"});
				response.end("404 Not found");
			}
	}
	if (request.method == 'POST') {
		var body = '';

		request.on('data', function (data) {
			body += data;
			if (body.length > 1e6)
				request.connection.destroy();
		});

		request.on('end', function () {
			var post = querystring.parse(body);
			if (fs.existsSync(__dirname+"/config.js")) {
				var configfile = fs.readFileSync(__dirname+"/config.js", 'utf8');
			}
			if (fs.existsSync(__dirname+"/index.html")) {
				var indexfile = fs.readFileSync(__dirname+"/index.html", 'utf8');
			}
			var pos =__dirname+"/mkc -target-root "+__dirname+" ";
			var posc ='/mkc -target-root';
			var sophoskey = ' -target-sophos kersophos';
			var snortkey = ' -target-snort control-update';
			var geoipkey = ' -target-geoip control-update';
			var wfkeykey = ' -wf-getkey getkey.php';
			var controlkey = ' -control-dist ya';
			var connectkey = ' -connect-dist ya';
			var operatorkey = ' -operator-dist ya';
			var Licensekey = ' -license-no'+" ";
			if (post['sophos']) {
				if (cmd.search(sophoskey) == -1)
					cmd = cmd.substring(parseInt(cmd.search(pos)), (parseInt(cmd.search(pos)) + parseInt(pos.length)))+sophoskey+cmd.substring(parseInt(cmd.search(pos)) + parseInt(pos.length));
				if (configfile) {
					if (configfile.search(sophoskey) == -1)
						configfile = configfile.substring(0, (parseInt(configfile.search(posc)) + parseInt(posc.length) +14))+sophoskey+configfile.substring(parseInt(configfile.search(posc)) + parseInt(posc.length)+14);
				}
				if (indexfile)
					indexfile = indexfile.replace('<input type="checkbox" id="sophos" name="sophos" value="true">', '<input type="checkbox" id="sophos" name="sophos" value="true" checked>');
			} else {
				cmd = cmd.replace(sophoskey, '');
				if(configfile)
					configfile = configfile.replace(sophoskey, '');
				if(indexfile)
					indexfile = indexfile.replace('<input type="checkbox" id="sophos" name="sophos" value="true" checked>', '<input type="checkbox" id="sophos" name="sophos" value="true">');
			}
			if (post['snort']) {
				if (cmd.search(snortkey) == -1)
					cmd = cmd.substring(parseInt(cmd.search(pos)), (parseInt(cmd.search(pos)) + parseInt(pos.length)))+snortkey+cmd.substring(parseInt(cmd.search(pos)) + parseInt(pos.length));
				if (configfile) {
					if (configfile.search(snortkey) == -1)
						configfile = configfile.substring(0, (parseInt(configfile.search(posc)) + parseInt(posc.length) +14))+snortkey+configfile.substring(parseInt(configfile.search(posc)) + parseInt(posc.length)+14);
				}
				if (indexfile)
					indexfile = indexfile.replace('<input type="checkbox" id="snort" name="snort" value="true">', '<input type="checkbox" id="snort" name="snort" value="true" checked>');
			} else {
				cmd = cmd.replace(snortkey, '');
				if(configfile)
					configfile = configfile.replace(snortkey, '');
				if(indexfile)
					indexfile = indexfile.replace('<input type="checkbox" id="snort" name="snort" value="true" checked>', '<input type="checkbox" id="snort" name="snort" value="true">');
			}
			if (post['geoip']) {
				if (cmd.search(geoipkey) == -1)
					cmd = cmd.substring(parseInt(cmd.search(pos)), (parseInt(cmd.search(pos)) + parseInt(pos.length)))+geoipkey+cmd.substring(parseInt(cmd.search(pos)) + parseInt(pos.length));
				if (configfile) {
					if (configfile.search(geoipkey) == -1)
						configfile = configfile.substring(0, (parseInt(configfile.search(posc)) + parseInt(posc.length) +14))+geoipkey+configfile.substring(parseInt(configfile.search(posc)) + parseInt(posc.length)+14);
				}
				if (indexfile)
					indexfile = indexfile.replace('<input type="checkbox" id="geoip" name="geoip" value="true">', '<input type="checkbox" id="geoip" name="geoip" value="true" checked>');
			} else {
				cmd = cmd.replace(geoipkey, '');
				if(configfile)
					configfile = configfile.replace(geoipkey, '');
				if(indexfile)
					indexfile = indexfile.replace('<input type="checkbox" id="geoip" name="geoip" value="true" checked>', '<input type="checkbox" id="geoip" name="geoip" value="true">');
			}
			if (post['wfkey']) {
				if (cmd.search(wfkeykey) == -1)
					cmd = cmd.substring(parseInt(cmd.search(pos)), (parseInt(cmd.search(pos)) + parseInt(pos.length)))+wfkeykey+cmd.substring(parseInt(cmd.search(pos)) + parseInt(pos.length));
				if (configfile) {
					if (configfile.search(wfkeykey) == -1)
						configfile = configfile.substring(0, (parseInt(configfile.search(posc)) + parseInt(posc.length) +14))+wfkeykey+configfile.substring(parseInt(configfile.search(posc)) + parseInt(posc.length)+14);
				}
				if (indexfile)
					indexfile = indexfile.replace('<input type="checkbox" id="wfkey" name="wfkey" value="true">', '<input type="checkbox" id="wfkey" name="wfkey" value="true" checked>');
			} else {
				cmd = cmd.replace(wfkeykey, '');
				if(configfile)
					configfile = configfile.replace(wfkeykey, '');
				if(indexfile)
					indexfile = indexfile.replace('<input type="checkbox" id="wfkey" name="wfkey" value="true" checked>', '<input type="checkbox" id="wfkey" name="wfkey" value="true">');
			}
			if (post['control']) {
				if (cmd.search(controlkey) == -1)
					cmd = cmd.substring(parseInt(cmd.search(pos)), (parseInt(cmd.search(pos)) + parseInt(pos.length)))+controlkey+cmd.substring(parseInt(cmd.search(pos)) + parseInt(pos.length));
				if (configfile) {
					if (configfile.search(controlkey) == -1)
						configfile = configfile.substring(0, (parseInt(configfile.search(posc)) + parseInt(posc.length) +14))+controlkey+configfile.substring(parseInt(configfile.search(posc)) + parseInt(posc.length)+14);
				}
				if (indexfile)
					indexfile = indexfile.replace('<input type="checkbox" id="control" name="control" value="true">', '<input type="checkbox" id="control" name="control" value="true" checked>');
			} else {
				cmd = cmd.replace(controlkey, '');
				if(configfile)
					configfile = configfile.replace(controlkey, '');
				if(indexfile)
					indexfile = indexfile.replace('<input type="checkbox" id="control" name="control" value="true" checked>', '<input type="checkbox" id="control" name="control" value="true">');
			}
			if (post['connect']) {
				if (cmd.search(connectkey) == -1)
					cmd = cmd.substring(parseInt(cmd.search(pos)), (parseInt(cmd.search(pos)) + parseInt(pos.length)))+connectkey+cmd.substring(parseInt(cmd.search(pos)) + parseInt(pos.length));
				if (configfile) {
					if (configfile.search(connectkey) == -1)
						configfile = configfile.substring(0, (parseInt(configfile.search(posc)) + parseInt(posc.length) +14))+connectkey+configfile.substring(parseInt(configfile.search(posc)) + parseInt(posc.length)+14);
				}
				if (indexfile)
					indexfile = indexfile.replace('<input type="checkbox" id="connect" name="connect" value="true">', '<input type="checkbox" id="connect" name="connect" value="true" checked>');
			} else {
				cmd = cmd.replace(connectkey, '');
				if(configfile)
					configfile = configfile.replace(connectkey, '');
				if(indexfile)
					indexfile = indexfile.replace('<input type="checkbox" id="connect" name="connect" value="true" checked>', '<input type="checkbox" id="connect" name="connect" value="true">');
			}
			if (post['operator']) {
				if (cmd.search(operatorkey) == -1)
					cmd = cmd.substring(parseInt(cmd.search(pos)), (parseInt(cmd.search(pos)) + parseInt(pos.length)))+operatorkey+cmd.substring(parseInt(cmd.search(pos)) + parseInt(pos.length));
				if (configfile) {
					if (configfile.search(operatorkey) == -1)
						configfile = configfile.substring(0, (parseInt(configfile.search(posc)) + parseInt(posc.length) +14))+operatorkey+configfile.substring(parseInt(configfile.search(posc)) + parseInt(posc.length)+14);
				}
				if (indexfile)
					indexfile = indexfile.replace('<input type="checkbox" id="operator" name="operator" value="true">', '<input type="checkbox" id="operator" name="operator" value="true" checked>');
			} else {
				cmd = cmd.replace(operatorkey, '');
				if(configfile)
					configfile = configfile.replace(operatorkey, '');
				if(indexfile)
					indexfile = indexfile.replace('<input type="checkbox" id="operator" name="operator" value="true" checked>', '<input type="checkbox" id="operator" name="operator" value="true">');
			}
			if (post['License'] && post['LicenseNo']  && post['LicenseNo'].search(/\s/) == -1) {
				if (cmd.search(Licensekey) == -1) {
					cmd = cmd.substring(parseInt(cmd.search(pos)), (parseInt(cmd.search(pos)) + parseInt(pos.length)))+Licensekey+post['LicenseNo']+cmd.substring(parseInt(cmd.search(pos)) + parseInt(pos.length));
				} else {
					cmd = cmd.replace(/\s-license-no.+?(?=\s)/i, Licensekey+post['LicenseNo']);
				}
				if (configfile) {
					if (configfile.search(Licensekey) == -1) {
						configfile = configfile.substring(0, (parseInt(configfile.search(posc)) + parseInt(posc.length) +14))+Licensekey+EscapeConfigfile(post['LicenseNo'])+configfile.substring(parseInt(configfile.search(posc)) + parseInt(posc.length)+14);
					} else {
						configfile = configfile.replace(/\s-license-no.+?(?=\s)/i, Licensekey+EscapeConfigfile(post['LicenseNo']));
					}
				}
				if (indexfile) {
					indexfile = indexfile.replace('<input type="checkbox" id="License" name="License" value="true">', '<input type="checkbox" id="License" name="License" value="true" checked>');
					indexfile = indexfile.replace(/<input type="text" id="LicenseNo" name="LicenseNo" value=".*/,'<input type="text" id="LicenseNo" name="LicenseNo" value="'+EscapeHtml(post['LicenseNo'])+'">');
				}
			} else {
				cmd = cmd.replace(/\s-license-no.+?(?=\s)/i, '');
				if(configfile)
					configfile = configfile.replace(/\s-license-no.+?(?=\s)/i, '');
				if(indexfile) {
					indexfile = indexfile.replace('<input type="checkbox" id="License" name="License" value="true" checked>', '<input type="checkbox" id="License" name="License" value="true">');
					indexfile = indexfile.replace(/<input type="text" id="LicenseNo" name="LicenseNo" value=".*/, '<input type="text" id="LicenseNo" name="LicenseNo" value="">');
				}
			}
			if (post['avir_proxy'] && post['avir_host'] && post['avir_port']) {
				avir_proxy = true;
				if (/^[a-z0-9\-\.]*$/i.test(post['avir_host'])) avir_host = post['avir_host'];
				if (/^[0-9]*$/.test(post['avir_port']) && 65536 - parseInt(post['avir_port']) > 0) avir_port = post['avir_port'];
				avir_login = post['avir_login'];
				avir_passw = post['avir_passw'];
				if (configfile) {
					configfile = configfile.replace(/config\.avir_proxy.*/, "config.avir_proxy = true;");
					configfile = configfile.replace(/config\.avir_host.*/, "config.avir_host= '"+EscapeConfigfile(avir_host)+"';");
					configfile = configfile.replace(/config\.avir_port.*/, "config.avir_port = '"+EscapeConfigfile(avir_port)+"';");
					configfile = configfile.replace(/config\.avir_login.*/, "config.avir_login = '"+EscapeConfigfile(avir_login)+"';");
					configfile = configfile.replace(/config\.avir_passw.*/, "config.avir_passw = '"+EscapeConfigfile(avir_passw)+"';");
				}
				if (indexfile) {
					indexfile = indexfile.replace('<input type="checkbox" id="avir_proxy" name="avir_proxy" value="true">', '<input type="checkbox" id="avir_proxy" name="avir_proxy" value="true" checked>');
					indexfile = indexfile.replace(/<input type="text" id="avir_host" name="avir_host" value=".*/, '<input type="text" id="avir_host" name="avir_host" value="'+avir_host+'">');
					indexfile = indexfile.replace(/<input type="text" id="avir_port" name="avir_port" style="width:40px;" value=".*/, '<input type="text" id="avir_port" name="avir_port" style="width:40px;" value="'+avir_port+'">');
					indexfile = indexfile.replace(/<input type="text" id="avir_login" name="avir_login" value=".*/, '<input type="text" id="avir_login" name="avir_login" value="'+EscapeHtml(avir_login)+'">');
					indexfile = indexfile.replace(/<input type="text" id="avir_passw" name="avir_passw" value=".*/, '<input type="text" id="avir_passw" name="avir_passw" value="'+EscapeHtml(avir_passw)+'">');
				}
			} else {
				avir_proxy = false;
				avir_host = '';
				avir_port = '';
				avir_login = '';
				avir_passw = '';
				if (configfile) {
					configfile = configfile.replace(/config\.avir_proxy.*/, "config.avir_proxy = false;");
					configfile = configfile.replace(/config\.avir_host.*/, "config.avir_host= '';");
					configfile = configfile.replace(/config\.avir_port.*/, "config.avir_port = '';");
					configfile = configfile.replace(/config\.avir_login.*/, "config.avir_login = '';");
					configfile = configfile.replace(/config\.avir_passw.*/, "config.avir_passw = '';");
				}
				if (indexfile) {
					indexfile = indexfile.replace('<input type="checkbox" id="avir_proxy" name="avir_proxy" value="true" checked>', '<input type="checkbox" id="avir_proxy" name="avir_proxy" value="true">');
					indexfile = indexfile.replace(/<input type="text" id="avir_host" name="avir_host" value=".*/, '<input type="text" id="avir_host" name="avir_host" value="">');
					indexfile = indexfile.replace(/<input type="text" id="avir_port" name="avir_port" style="width:40px;" value=".*/, '<input type="text" id="avir_port" name="avir_port" style="width:40px;" value="">');
					indexfile = indexfile.replace(/<input type="text" id="avir_login" name="avir_login" value=".*/, '<input type="text" id="avir_login" name="avir_login" value="">');
					indexfile = indexfile.replace(/<input type="text" id="avir_passw" name="avir_passw" value=".*/, '<input type="text" id="avir_passw" name="avir_passw" value="">');
				}
			}
			if (configfile) {
				fs.writeFile(__dirname+"/config.js", configfile, function(err) {
		    			if(err) {
        					return console.log(err);
    					}
				});
			}
			if (indexfile) {
				fs.writeFile(__dirname+"/index.html", indexfile, function(err) {
		    			if(err) {
        					return console.log(err);
    					}
				});
			}
			response.writeHeader(302, {"Location": "/logsmkc.php#settings"});
			response.end();
		});
	} else {
		if (/^win/.test(process.platform)) {
			files_to_html ('');
		} else {
			exec('/bin/ps -e | /bin/grep -E systemd$ > /dev/null && /bin/echo "systemd_system" || /bin/echo "other_system"', function (error, stdout) {
				if (error) {
					console.log('error shell command '+error);
					files_to_html('error shell command '+JSON.stringify(error));
				} else {
					var systemd = stdout.match(/systemd_system/);
					if (systemd) {
						exec('/bin/journalctl -u mirrorkc >'+mirrorlog, function (err, output) {
							if (error) {
								console.log('journalctl error '+error);
								files_to_html('journalctl error '+JSON.stringify(error));
							} else {
								files_to_html('');
							}
						});
					} else {
						files_to_html ('');
					}
				}
			});
		}
	}
}

function wfkey(request, response) {
	var nowk = new Date();
	console.log(nowk+" Request handler 'wfkey' from "+request.connection.remoteAddress+" was called.");
	console.log('We will search for the key in the file');
	if (fs.existsSync(__dirname+"/getkey.php")) {
		var contents = fs.readFileSync(__dirname+"/getkey.php", 'utf8');
		response.writeHead(200, {"Content-Type": "text/plain"});
		if (contents.replace(/\s*\n\s*/g,"").match(/0:[a-z]{2}:[a-f0-9]{4,6}:[0-9]{1,}:[0-9]{5,6}/)) {
			console.log('The key found is '+contents.replace(/\s*\n\s*/g,"").match(/0:[a-z]{2}:[a-f0-9]{4,6}:[0-9]{1,}:[0-9]{5,6}/).toString());
			response.end(contents.replace(/\s*\n\s*/g,"").match(/0:[a-z]{2}:[a-f0-9]{4,6}:[0-9]{1,}:[0-9]{5,6}/).toString());
			return
		} else {
			console.log('File does not contain a key. Key not found');
			response.end('key not found');
			return
		}
	} else {
		response.writeHead(200, {"Content-Type": "text/plain"});
		console.log('File containing the key does not exist. Key not found');
		response.end('key not found');
		return
	}
}

function mirrorKC(request, response) {
	var nowm = new Date();
	console.log(nowm+" Request handler 'mirrorKC' from "+request.connection.remoteAddress+" was called.");
	if (fs.existsSync(__dirname+"/lastrun")) {
		var contents = fs.readFileSync(__dirname+"/lastrun", 'utf8');
		if (nowm.getTime()-contents >= '28740000') {
			fs.writeFile(__dirname+"/lastrun", nowm.getTime().toString(), function(err) {
				if(err) {
					return console.log(err);
				}
			});
			response.writeHead(200, {"Content-Type": "text/plain; charset=utf-8"});
			response.end('ok\n');
			exec(cmd, function (error) {
				if(error) {
					return console.log(error);
				}
			});
		} else {
			response.writeHead(200, {"Content-Type": "text/plain; charset=utf-8"});
			var diff = nowm.getTime()-contents;
			response.end("not now\n");
		}
	} else {
		fs.writeFile(__dirname+"/lastrun", nowm.getTime().toString(), function(err) {
		    	if(err) {
        			return console.log(err);
    			}
		});
		response.writeHead(200, {"Content-Type": "text/plain; charset=utf-8"});
		response.end('ok\n');
		exec(cmd, function (error) {
		    if(error) {
        		return console.log(error);
    		}
		});
	}
}

function checknew(request, response) {
	var nown = new Date();
	console.log(nown+" Request handler 'checknew' from "+request.connection.remoteAddress+" was called.");
	var ProdVer = "800";
	var pathname = url.parse(request.url).pathname;
	var host = request.headers.host;
	var h = host.split(/\:[\d]{1,5}$/);
	var hostname = h[0];
	var body = '';
	request.setEncoding("utf-8");
	request.on('data', function (data) {
		body += data;
	});
	request.on('end', function () {
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
			console.log('prod_code: '+prod_code[1]+' os_platform: '+os_platform[1]);
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
			console.log('No product code found in the request');
		}
	});

	function get_answer(response, hostname, path, prod_build_number, prod_major, prod_minor, prod_build, prod_code, os_platform, ReminderId, ReminderAuth, ext) {
		fs.readdir(__dirname+path, function(err, files) {
			if (err) return console.log('Error read '+path+' folder: '+err);
			if (files.length == 0) return response.end("--INFO--\nReminderId='1'\nReminderAuth='1'\nVersion='0'\n");
			var ff = false;
			files.forEach(function(f, nf) {
				var regex = new RegExp('.'+ext+'$');
				if (f.search(regex)>=0) {
					ff = true;
					var comment = f.replace(regex,'');
					var numb=String(f.match(/[\d]{1,}.[\d]{1,}.[\d]{1,}/)).split(".");
					var PatchVer=String(f.match(/\-p[\d]{1,}\-/)).split("-");
					if (PatchVer && PatchVer[1]) {
						PatchVer[1]=PatchVer[1].substr(1);
					} else {
						var PatchVer=['0','0'];
					}
					var global_number=String(f.match(/_[\d]{1,}_/)).split("_");
					if (numb && numb[0] && numb[1] && numb[2]) {
						ProdVer = numb[0]+numb[1]+numb[2];
						console.log("Current version found is: "+ProdVer);
						var PackageCode = prod_code[1]+":"+('00000'+numb[0]).slice(-3)+"."+('00000'+numb[1]).slice(-3)+"."+('00000'+numb[2]).slice(-5)+".T."+('00000'+PatchVer[1]).slice(-3)+".000";
						if (prod_major && prod_minor && prod_build && prod_major[1] && prod_minor[1] && prod_build[1]) {
							var CurrentVersion = prod_major[1]+prod_minor[1]+prod_build[1];
							console.log("Request Version is: "+CurrentVersion);
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
									var stats = fs.statSync(__dirname+path+f);
									var mtime = stats.mtime.getTime()/1000;
									response.write("--INFO--\n");
									response.write("ReminderId='"+ReminderId[1]+"'\n");
									response.write("ReminderAuth='"+ReminderAuth[1]+"'\n");
									response.write("Version='1'\n");
									response.write("LicenseUsageReceived='0'\n");
									response.write("--VERSION_BEGIN--\n");
									response.write("PackageCode='"+PackageCode+"'\n");
									response.write("Description='"+comment+"'\n");
									response.write("Comment='"+comment+"'\n");
									response.write("DownloadURL='http://"+hostname+path+f+"'\n");
									response.write("DownloadURLtext='Download from HERE!'\n");
									response.write("InfoURL='"+InfoURL+"'\n");
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
												var stats = fs.statSync(__dirname+path+f);
												var mtime = stats.mtime.getTime()/1000;
												response.write("--INFO--\n");
												response.write("ReminderId='"+ReminderId[1]+"'\n");
												response.write("ReminderAuth='"+ReminderAuth[1]+"'\n");
												response.write("Version='1'\n");
												response.write("LicenseUsageReceived='0'\n");
												response.write("--VERSION_BEGIN--\n");
												response.write("PackageCode='"+PackageCode+"'\n");
												response.write("Description='"+comment+"'\n");
												response.write("Comment='"+comment+"'\n");
												response.write("DownloadURL='http://"+hostname+path+f+"'\n");
												response.write("DownloadURLtext='Download from HERE!'\n");
												response.write("InfoURL='"+InfoURL+"'\n");
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
											console.log("The subversion of the update image file "+f+" was not found");
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
										var stats = fs.statSync(__dirname+path+f);
										var mtime = stats.mtime.getTime()/1000;
										response.write("--INFO--\n");
										response.write("ReminderId='"+ReminderId[1]+"'\n");
										response.write("ReminderAuth='"+ReminderAuth[1]+"'\n");
										response.write("Version='1'\n");
										response.write("LicenseUsageReceived='0'\n");
										response.write("--VERSION_BEGIN--\n");
										response.write("PackageCode='"+PackageCode+"'\n");
										response.write("Description='"+comment+"'\n");
										response.write("Comment='"+comment+"'\n");
										response.write("DownloadURL='http://"+hostname+path+f+"'\n");
										response.write("DownloadURLtext='Download from HERE!'\n");
										response.write("InfoURL='"+InfoURL+"'\n");
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
									console.log("The subversion of the update image file "+f+" was not found");
								}								
							}
						} else {
							response.writeHead(200, {'Content-Type': 'text/plain; charset=iso-8859-1','Content-Encoding': 'identity', 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache', 'Front-End-Https': 'on', 'Proxy-Connection': 'keep-alive'});
							response.write("--INFO--\n");
							response.write("ReminderId='1'\n");
							response.write("ReminderAuth='1'\n");
							response.write("Version='0'\n");
							response.end();
							console.log("Missing required query parameters");
						}
					} else {
						response.writeHead(200, {'Content-Type': 'text/plain; charset=iso-8859-1','Content-Encoding': 'identity', 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache', 'Front-End-Https': 'on', 'Proxy-Connection': 'keep-alive'});
						response.write("--INFO--\n");
						response.write("ReminderId='1'\n");
						response.write("ReminderAuth='1'\n");
						response.write("Version='0'\n");
						response.end();
						console.log("The version of the update image file "+f+" was not found");
					}
				} else {
					if (!ff) {
						if (Math.floor(nf)+1 == Math.floor(files.length)) {
							response.writeHead(200, {'Content-Type': 'text/plain; charset=iso-8859-1','Content-Encoding': 'identity', 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache', 'Front-End-Https': 'on', 'Proxy-Connection': 'keep-alive'});
							response.write("--INFO--\n");
							response.write("ReminderId='1'\n");
							response.write("ReminderAuth='1'\n");
							response.write("Version='0'\n");
							response.end();
							console.log("The file with prod_code: "+prod_code[1]+" and os_platform: "+os_platform[1]+" was not found");
						}
					}
				}
			});
		});
	}
}

function defaults(request, response) {
	var nowd = new Date();
	console.log(nowd+" Request handler 'defaults' from "+request.connection.remoteAddress+" was called.");
	var qry = url.parse(request.url).query;
	if (/dbversion=/.test(qry)) {
		var rand = Math.floor(Math.random() * (1500 - 1) + 1);
		response.writeHead(200, {"Content-Type": "text/plain"});
		response.write("IDEdir=kersophos/IDES/"+rand+"\n");
		response.write("VDBdir=kersophos/VDBS/"+rand+"\n");
		response.write("APIdir=kersophos/APIS/"+rand+"\n");
		response.write("CNFdir=kersophos/CNF/"+rand+"\n");
		response.end();
	} else {
		response.writeHead(200, {'Content-Type': 'text/plain', 'Cache-Control': 'no-cache, no-store, must-revalidate'});
		if (JSON.stringify(request.headers).match(/\"Kerio_Updater\"/)) {
			response.end('THDdir=https://bdupdate.kerio.com/./');
		} else {
			response.end('THDdir=https://bdupdate.kerio.com/../');
		}
	}
}

function antispam(request, response) {
	var nows = new Date();
	console.log(nows+" Request handler 'antispam' from "+request.connection.remoteAddress+" was called.");
	var anthst = request.headers.host.replace("bda-update.kerio.com", "upgrade.bitdefender.com");
	request.headers.host = request.headers.host.replace("bda-update.kerio.com", "upgrade.bitdefender.com");
	var agentOptionsHost = anthst;
	var agentOptionsPort = '80';
	var agentOptionsPath = '/';
	if (avir_proxy) {
		agentOptionsHost = avir_host;
		agentOptionsPort = avir_port;
		agentOptionsPath = anthst;
	}
	if (avir_proto == 'https') {
		var agentOptions = {host: anthst, port: '443', path: '/', rejectUnauthorized: false, secureProtocol: 'TLSv1_2_method', ciphers: 'ECDHE-RSA-CHACHA20-POLY1305', headers: {'User-Agent': 'WSLib 1.4 [3, 0, 0, 94]'}};
		var agent = new https.Agent(agentOptions);
	} else {
		var agentOptions = {host: agentOptionsHost, port: agentOptionsPort, path: agentOptionsPath, headers: {'User-Agent': 'WSLib 1.4 [3, 0, 0, 94]'}};
		var agent = new http.Agent(agentOptions);
	}
	var amrequest_options = {
		url: avir_proto+'://'+anthst+request.url, 
		agent: agent
	}
	if (avir_proxy) {
		Object.assign (amrequest_options, {proxy: 'http://'+avir_host+':'+avir_port});
		if (avir_login) Object.assign (amrequest_options, {headers: {'Proxy-Authorization': 'Basic ' + Buffer.from(avir_login+':'+avir_passw).toString('base64')}});
	}
	var z = amrequest(amrequest_options, function (error) {
		if (error) {
			response.writeHead(404, {"Content-Type": "text/plain"});
			response.end("404 Not found");
			console.log('Antispam request error: '+error);
			return;
		}
	});
	request.pipe(z);
	z.pipe(response);
	console.log('Antispam module fetch update for '+request.url);
}

function bitdefenderavir(request, response) {
	var nows = new Date();
	console.log(nows+" Request handler 'bitdefenderavir' from "+request.connection.remoteAddress+" was called.");
	var anthst = request.headers.host.replace('bdupdate.kerio.com', "upgrade.bitdefender.com");
	request.headers.host = request.headers.host.replace('bdupdate.kerio.com', "upgrade.bitdefender.com");
	var agentOptionsHost = anthst;
	var agentOptionsPort = '80';
	var agentOptionsPath = '/';
	if (avir_proxy) {
		agentOptionsHost = avir_host;
		agentOptionsPort = avir_port;
		agentOptionsPath = anthst;
	}
	if (avir_proto == 'https') {
		var agentOptions = {host: anthst, port: '443', path: '/', rejectUnauthorized: false, secureProtocol: 'TLSv1_2_method', ciphers: 'ECDHE-RSA-CHACHA20-POLY1305', headers: {'User-Agent': 'WSLib 1.4 [3, 0, 0, 94]'}};
		var agent = new https.Agent(agentOptions);
	} else {
		var agentOptions = {host: agentOptionsHost, port: agentOptionsPort, path: agentOptionsPath, headers: {'User-Agent': 'WSLib 1.4 [3, 0, 0, 94]'}};
		var agent = new http.Agent(agentOptions);
	}
	var amrequest_options = {
		url: avir_proto+'://'+anthst+request.url, 
		agent: agent
	}
	if (avir_proxy) {
		Object.assign (amrequest_options, {proxy: 'http://'+avir_host+':'+avir_port});
		if (avir_login) Object.assign (amrequest_options, {headers: {'Proxy-Authorization': 'Basic ' + Buffer.from(avir_login+':'+avir_passw).toString('base64')}});
	}
	var z = amrequest(amrequest_options, function (error) {
		if (error) {
			response.writeHead(404, {"Content-Type": "text/plain"});
			response.end("404 Not found");
			console.log('Kerio Antivirus request error: '+error);
			return;
		}
	});
	request.pipe(z);
	z.pipe(response);
	console.log('Kerio Antivirus module fetch update using protocol '+avir_proto+' for '+request.url);
}

function EscapeHtml(HtmlStr) {
	var SpecialCharsMap = {
		 '&':  '&amp;',
		 '<':  '&lt;',
		 '>':  '&gt;',
		 '"':  '&quot;',
		 '\'': '&#039;'
	};
	return HtmlStr.replace(RegExp(Object.keys(SpecialCharsMap).join('|'), 'gi'), function(matched) {
		return SpecialCharsMap[matched];
	});
}

function EscapeConfigfile(ConfigfileStr) {
	return ConfigfileStr.replace(/[\$\&\+\#\"\'\\]/g, '\\$&');
}

exports.rules = rules;
exports.download = download;
exports.logsmkc = logsmkc;
exports.wfkey = wfkey;
exports.checknew = checknew;
exports.mirrorKC = mirrorKC;
exports.defaults = defaults;
exports.antispam = antispam;
exports.bitdefenderavir = bitdefenderavir;
