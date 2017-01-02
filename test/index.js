var tap = require('agraddy.test.tap')(__filename);

process.chdir('test');

var router = require('../');

function one(req, res) {
	return 'one';
}
function two(req, res) {
	return 'two';
}

router.routes({'one@example.com': one});
router.add('two@example.com', two);

router.on('loaded', function(err) {
	// Basic routing
	tap.assert.equal(router.handler({to: 'one@example.com'}, null), 'one', 'Should get the right function.');

	// Does not exist routing
	function handleReject() {
		tap.assert(true, 'Should call reject if the route does not exist.');
	}

	router.handler({to: 'does_not_exist@example.com'}, {reject: handleReject});


	// Routes directory
	tap.assert.equal(Object.keys(router._routes).length, 4, 'Should load routes from routes directory.');
	tap.assert.equal(router.handler({to: 'main@example.com'}, null), 'main', 'Should get the right function.');

	// Regex working
	tap.assert.equal(router.handler({to: 'regex@example.net'}, null), 'regex', 'Should get the right function.');


	// unsafe regex should throw an error
	// Add an unsafe regex - it should throw an error
	try {
		router.add('^/about/(a+)+$', two);
	} catch(e) {
		tap.assert.equal(e.message, 'A route contains an unsafe regex. Unsafe regex allow for the possibility of a denial of service attack: https://www.owasp.org/index.php/Regular_expression_Denial_of_Service_-_ReDoS');
	}

});

