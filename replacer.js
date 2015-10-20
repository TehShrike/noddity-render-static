var uuid = require('random-uuid-v4')

module.exports = function makeReplacer() {
	var saved = []

	var splitOn = /(\{\{\{?)(.+)(\}?\}\})/g

	function save(str) {
		var id = uuid()
		saved.push({
			id: id,
			str: str
		})
		return id
	}

	return {
		replace: function(str) {
			var outside = true

			var split = str.split(splitOn)

			var out = split.reduce(function(memo, chunk) {
				if (chunk === '{{{' || chunk === '{{') {
					outside = false
				} else if (chunk === '}}}' || chunk === '}}') {
					outside = true
				} else if (outside && chunk) {
					return memo + save(chunk)
				}

				return memo + chunk
			}, '')

			return out
		},
		putBack: function(str) {
			return saved.reduce(function(memo, chunk) {
				return memo.replace(chunk.id, chunk.str)
			}, str)
		}
	}
}
