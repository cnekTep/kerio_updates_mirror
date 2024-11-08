var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");

var handle = {}
handle["1"] = requestHandlers.rules;
handle["2"] = requestHandlers.rules;
handle["3"] = requestHandlers.rules;
handle["4"] = requestHandlers.rules;
handle["wfkey"] = requestHandlers.wfkey;
handle["download"] = requestHandlers.download;
handle["checknew"] = requestHandlers.checknew;
handle["mirrorKC"] = requestHandlers.mirrorKC;
handle["defaults"] = requestHandlers.defaults;
handle["logsmkc"] = requestHandlers.logsmkc;
handle["antispam"] = requestHandlers.antispam;
handle["bitdefenderavir"] = requestHandlers.bitdefenderavir;

server.start(router.route, handle);
