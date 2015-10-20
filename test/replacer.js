var test = require('tape')
var makeReplacer = require('../replacer')

test('basic replacer', function(t) {
	var replacer = makeReplacer()

	var out = replacer.replace('things and stuff')

	t.notEqual(out, 'things and stuff')

	t.equal(replacer.putBack(out), 'things and stuff')

	t.end()
})

test('replacer with moustaches', function(t) {
	var replacer = makeReplacer()

	var out = replacer.replace('things {{and}} stuff')

	t.notEqual(out, 'things {{and}} stuff')

	t.equal(replacer.putBack(out), 'things {{and}} stuff')

	t.end()
})

test('replacer with thick moustaches', function(t) {
	var replacer = makeReplacer()

	var out = replacer.replace('things {{{and}}} stuff')

	t.notEqual(out, 'things {{{and}}} stuff')

	t.equal(replacer.putBack(out), 'things {{{and}}} stuff')

	t.end()
})
