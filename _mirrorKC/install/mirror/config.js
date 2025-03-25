// Файл конфигурации
// После изменений требуется перезагрузка 
var config = {};

// Server
config.proxy = false;
config.port = '80';
config.ports = '443';
config.port_proxy = '8080';
config.ports_proxy = '8443';

// SSL
config.certs = __dirname + '/certs/';
config.LocalAuthority = 'LocalAuthority.crt';
config.Key = 'Certificate.key';
config.Certificate = 'Certificate.crt';

// LOGs
	if (/^win/.test(process.platform)) {
config.logfile = __dirname + '/logs/mkcLog.txt';
config.mirrorlog = __dirname + '/logs/mirror.log';
	} else {
config.logfile = '/var/log/mkc.log';
config.mirrorlog = '/var/log/mirror.log';
	}

// Bitdefender
config.avir_proto = 'http';
config.avir_proxy = true;
config.avir_host = '172.222.0.5';
config.avir_port = '8118';
config.avir_login = '';
config.avir_passw = '';

// Ссылки на базы MaxMind GeoLite2
config.geo_ip4_url = 'https://raw.githubusercontent.com/wyot1/GeoLite2-Unwalled/downloads/COUNTRY/CSV/GeoLite2-Country-Blocks-IPv4.csv';
config.geo_ip6_url = 'https://raw.githubusercontent.com/wyot1/GeoLite2-Unwalled/downloads/COUNTRY/CSV/GeoLite2-Country-Blocks-IPv6.csv';
config.geo_loc_url = 'https://raw.githubusercontent.com/wyot1/GeoLite2-Unwalled/downloads/COUNTRY/CSV/GeoLite2-Country-Locations-en.csv';
config.geo_github = true;

// Публичные ДНС 8.8.8.8 Google и 1.1.1.1 Cloudflare
config.public_dns1 = '8.8.8.8';
config.public_dns2 = '1.1.1.1';

// Таймаут при загрузке обновлений по умолчанию 5000 миллисекунд
config.download_timeout = 5000;

// DownloadUpdates
config.LicenseNo = '20339-1H4Z9-AKTSD';
config.IDSv1 = false;
config.IDSv2 = true;
config.IDSv3 = true;
config.IDSv4 = true;
config.IDSv5 = true;
config.IDSv6 = false;
config.WebFilter = true;

// Security
// Учетные данные для доступа к /logsmkc.php
// Используется HTTP Basic Authorization
//config.config_login = 'admin';
//config.config_passw = 'admin';
// Белый список адресов, которым разрешено подключение
// Только IPv4 адреса, IPv6 не поддерживаются.
//config.ipv4_list_file = __dirname + '/ipv4list';

module.exports = config;
