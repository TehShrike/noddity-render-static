const TestRetrieval = require(`./retrieval-stub.js`)
const staticRenderer = require(`../../index.js`)
const levelmem = require(`level-mem`)
const Butler = require(`noddity-butler`)
const Linkify = require(`noddity-linkifier`)
const pify = require(`pify`)

module.exports = function testState() {
	const retrieval = new TestRetrieval()
	const db = levelmem(`no location`, {
		valueEncoding: require(`noddity-butler/test/retrieval/encoding.js`),
	})
	const butler = new Butler(retrieval, db, {
		refreshEvery: 100,
	})
	const linkifier = new Linkify(`#/prefix`)

	async function render(template, post, optionsArg) {
		const options = Object.assign({
			butler,
			linkifier,
			data: {},
		}, optionsArg)

		return staticRenderer(template, post, options)
	}

	return {
		retrieval: pify(retrieval),
		render,
	}
}
