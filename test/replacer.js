const test = require(`tape`)
const makeReplacer = require(`../replacer`)

test(`basic replacer`, t => {
	const replacer = makeReplacer()

	const out = replacer.replace(`things and stuff`)

	t.notEqual(out, `things and stuff`)

	t.equal(replacer.putBack(out), `things and stuff`)

	t.end()
})

test(`replacer with moustaches`, t => {
	const replacer = makeReplacer()

	const out = replacer.replace(`things {{and}} stuff`)

	t.notEqual(out, `things {{and}} stuff`)

	t.equal(replacer.putBack(out), `things {{and}} stuff`)

	t.end()
})

test(`replacer with thick moustaches`, t => {
	const replacer = makeReplacer()

	const out = replacer.replace(`things {{{and}}} stuff`)

	t.notEqual(out, `things {{{and}}} stuff`)

	t.equal(replacer.putBack(out), `things {{{and}}} stuff`)

	t.end()
})
