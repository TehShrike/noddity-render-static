var TestRetrieval = require('./retrieval-stub.js')
var staticRenderer = require('../../index.js')
var levelmem = require('level-mem')
var Butler = require('noddity-butler')
var Linkify = require('noddity-linkifier')
var extend = require('xtend')

module.exports = function testState() {
	var retrieval = new TestRetrieval()
	var db = levelmem('no location', {
		valueEncoding: require('noddity-butler/test/retrieval/encoding.js')
	})
	var butler = new Butler(retrieval, db, {
		refreshEvery: 100
	})
	var linkifier = new Linkify('#/prefix')

	function render(template, post, options, cb) {
		staticRenderer(template, post, extend({
			butler: butler,
			linkifier: linkifier,
			data: {}
		}, options), cb)
	}

	return {
		retrieval: retrieval,
		render: render
	}
}
