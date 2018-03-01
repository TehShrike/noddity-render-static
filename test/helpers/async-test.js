const tape = require(`tape`)

module.exports = (description, fn) => {
	tape(description, t => {
		fn(t).catch(err => {
			t.error(err)
			t.end()
		}).then(() => t.end())
	})
}
