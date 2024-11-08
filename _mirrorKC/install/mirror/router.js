function route (handle, ver, request, response) {
if (ver !== 'logsmkc') console.log("About to route a request for <b>"+ver+"</b>");
	if (!/^[1-4]$/.test(ver)) {
		if (/^[\d]$/.test(ver)) {
			ver = "defaults";
		}
	}
	if (typeof handle[ver] === 'function') {
		handle[ver](request, response);
	} else {
		console.log("No request handler found for " + ver);
	}
}
exports.route = route;
