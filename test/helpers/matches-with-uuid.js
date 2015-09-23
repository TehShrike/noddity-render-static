var quotemeta = require('quotemeta')
var UUID_V4_REGEX = '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}'

module.exports = function matches(input, str) {
	return new RegExp(quotemeta(str).replace(/UUID_HERE/g, UUID_V4_REGEX)).test(input)
}
