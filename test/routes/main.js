var mod = {};

mod['main@example.com'] = function(req, res) {
	return 'main';
};

mod['^.*@example.net$'] = function(req, res) {
	return 'regex';
};

module.exports = mod;
