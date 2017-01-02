var each = require('agraddy.async.each');
var events = require('events');
var fs = require('fs');
var path = require('path');
var safe = require('safe-regex');

var mod = new events.EventEmitter();
mod._routes  = {};

mod.add = function(to, func) {
	// Check if unsafe regex
	if(to.slice(0,1) === '^') {
		if(!safe(to)) {
			throw new Error('A route contains an unsafe regex. Unsafe regex allow for the possibility of a denial of service attack: https://www.owasp.org/index.php/Regular_expression_Denial_of_Service_-_ReDoS');
		}
	}
	mod._routes[to] = func;
}

mod.handler = function(req, res) {
	// Need to make sure auto routes are loaded before proceeding
	// Listen for loaded event if routes are immediately needed (for example, in testing)

	var keys = Object.keys(mod._routes);
	var i;

	if(keys.indexOf(req.to) !== -1) {
		return mod._routes[req.to](req, res);
	} else {
		for(i = 0; i < keys.length; i++) {
			if(keys[i].slice(0, 1) === '^' && new RegExp(keys[i]).test(req.to)) {
				return mod._routes[keys[i]](req, res);
			}
		}

		// Reject the email if a route does not match
		return res.reject();
	}
}

mod.routes = function(obj) {
	Object.keys(obj).forEach(function(key) {
		mod.add(key, obj[key]);
	});
}

// Get routes in /routes directory on initial load
// Possibly in the future get routes from node_modules too where package.json "routes": ...
function main() {
	var routes_dir = path.join(process.cwd(), 'routes');
	fs.readdir(routes_dir, function(err, files) {
		each(files, function(file, cb) {
			var list;

			fs.stat(path.join(routes_dir, file) , function(err, stats) {
				if(stats && stats.isFile()) {
					list = require(path.join(routes_dir, file));
					if(list instanceof events.EventEmitter) {
						list.on('loaded', function(list) {
							mod.routes(list);
							cb();
						});
					} else {
						mod.routes(list);
						cb();
					}
				} else {
					cb();
				}
			});
		}, function(err) {
			mod.emit('loaded');
		});
	});
}

main();

module.exports = mod;
