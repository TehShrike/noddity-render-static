var test = require('tape')
var Ractive = require('ractive')

Ractive.DEBUG = false

var makeTestState = require('./helpers/test-state')


test('embedded templates, passing in both posts as post objects', function(t) {
	var state = makeTestState()

	state.retrieval.addPost('post', { title: 'TEMPLAAAATE', markdown: false }, '{{>current}}')
	state.retrieval.addPost('file1.md', { title: 'Some title', date: new Date() }, 'This is a ::file2.md:: post that I *totally* wrote')
	state.retrieval.addPost('file2.md', { title: 'Some title', date: new Date() }, 'lol yeah ::herp|wat:: ::herp|huh::')
	state.retrieval.addPost('herp', { title: 'Some title', date: new Date(), markdown: false }, 'lookit {{1}}')

	state.retrieval.getPost('file1.md', function(err, post) {
		state.retrieval.getPost('post', function(err, template) {
			state.render(template, post, {}, function(err, html) {
				t.notOk(err, 'no error')
				t.equal(html, '<p>This is a <p>lol yeah lookit wat lookit huh</p> post that I <em>totally</em> wrote</p>')
				t.end()
			})
		})
	})
})

test('three markdown files deep', function(t) {
	var state = makeTestState()

	state.retrieval.addPost('post', { title: 'TEMPLAAAATE', markdown: false }, '{{>current}}')
	state.retrieval.addPost('file1.md', { title: 'Some title', date: new Date() }, 'This is a ::file2.md:: post that I *totally* wrote')
	state.retrieval.addPost('file2.md', { title: 'Some title', date: new Date() }, 'lol yeah ::file3.md|wat:: ::file3.md|huh::')
	state.retrieval.addPost('file3.md', { title: 'Some title', date: new Date() }, 'lookit {{1}}')

	state.retrieval.getPost('file1.md', function(err, post) {
		state.render('post', post, {}, function(err, html) {
			t.notOk(err, 'no error')
			t.equal(html, '<p>This is a <p>lol yeah <p>lookit wat</p> <p>lookit huh</p></p> post that I <em>totally</em> wrote</p>')
			t.end()
		})
	})
})

test('filename starting with a number', function(t) {
	var state = makeTestState()

	state.retrieval.addPost('post', { title: 'TEMPLAAAATE', markdown: false }, '{{>current}}')
	state.retrieval.addPost('file1.md', { title: 'Some title', date: new Date() }, 'This is a ::2.md:: post that I *totally* wrote')
	state.retrieval.addPost('2.md', { title: 'Some title', date: new Date() }, 'lol yeah')

	state.retrieval.getPost('file1.md', function(err, post) {
		state.render('post', post, {}, function(err, html) {
			t.notOk(err, 'no error')
			t.equal(html, '<p>This is a <p>lol yeah</p> post that I <em>totally</em> wrote</p>')
			t.end()
		})
	})
})

test('loading based on file name', function(t) {
	var state = makeTestState()

	state.retrieval.addPost('post', { title: 'TEMPLAAAATE', markdown: false }, '{{>current}}')
	state.retrieval.addPost('file1.md', { title: 'Some title', date: new Date() }, 'This is a ::file2.md:: post that I *totally* wrote')
	state.retrieval.addPost('file2.md', { title: 'Some title', date: new Date() }, 'lol yeah ::herp|wat:: ::herp|huh::')
	state.retrieval.addPost('herp', { title: 'Some title', date: new Date(), markdown: false }, 'lookit {{1}}')

	state.render('post', 'file1.md', {}, function(err, html) {
		t.notOk(err, 'no error')
		t.equal(html, '<p>This is a <p>lol yeah lookit wat lookit huh</p> post that I <em>totally</em> wrote</p>')
		t.end()
	})
})

test('{{{html}}} still works', function(t) {
	var state = makeTestState()

	state.retrieval.addPost('post', { title: 'TEMPLAAAATE', markdown: false }, '{{{html}}}')
	state.retrieval.addPost('file1.md', { title: 'Some title', date: new Date() }, 'yay!')

	state.render('post', 'file1.md', {}, function(err, html) {
		t.notOk(err, 'no error')
		t.equal(html, '<p>yay!</p>')
		t.end()
	})
})
