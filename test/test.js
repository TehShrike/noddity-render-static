var test = require('tape')
var Ractive = require('ractive')

Ractive.DEBUG = false

var matches = require('./helpers/matches-with-uuid')
var makeTestState = require('./helpers/test-state')



test('embedded templates', function(t) {
	var state = makeTestState()

	state.retrieval.addPost('file1.md', { title: 'Some title', date: new Date() }, 'This is a ::file2.md:: post that I *totally* wrote')
	state.retrieval.addPost('file2.md', { title: 'Some title', date: new Date() }, 'lol yeah ::herp|wat:: ::herp|huh::')
	state.retrieval.addPost('herp', { title: 'Some title', date: new Date(), markdown: false }, 'lookit {{1}}')

	state.retrieval.getPost('file1.md', function(err, post) {
		state.render(post, {}, function(err, html) {
			t.notOk(err)
			t.ok(matches(html, '<p>This is a <span class="noddity-template" data-noddity-post-file-name="file2.md" data-noddity-template-arguments="{}" data-noddity-partial-name="UUID_HERE"><p>lol yeah <span class="noddity-template" data-noddity-post-file-name="herp" data-noddity-template-arguments="{&quot;1&quot;:&quot;wat&quot;}" data-noddity-partial-name="UUID_HERE">lookit wat</span> <span class="noddity-template" data-noddity-post-file-name="herp" data-noddity-template-arguments="{&quot;1&quot;:&quot;huh&quot;}" data-noddity-partial-name="UUID_HERE">lookit huh</span></p></span> post that I <em>totally</em> wrote</p>'))
			t.end()
		})
	})
})

test('three markdown files deep', function(t) {
	var state = makeTestState()

	state.retrieval.addPost('file1.md', { title: 'Some title', date: new Date() }, 'This is a ::file2.md:: post that I *totally* wrote')
	state.retrieval.addPost('file2.md', { title: 'Some title', date: new Date() }, 'lol yeah ::file3.md|wat:: ::file3.md|huh::')
	state.retrieval.addPost('file3.md', { title: 'Some title', date: new Date() }, 'lookit {{1}}')

	state.retrieval.getPost('file1.md', function(err, post) {
		state.render(post, {}, function(err, html) {
			t.notOk(err)
			t.ok(matches(html, '<p>This is a <span class="noddity-template" data-noddity-post-file-name="file2.md" data-noddity-template-arguments="{}" data-noddity-partial-name="UUID_HERE"><p>lol yeah <span class="noddity-template" data-noddity-post-file-name="file3.md" data-noddity-template-arguments="{&quot;1&quot;:&quot;wat&quot;}" data-noddity-partial-name="UUID_HERE"><p>lookit wat</p></span> <span class="noddity-template" data-noddity-post-file-name="file3.md" data-noddity-template-arguments="{&quot;1&quot;:&quot;huh&quot;}" data-noddity-partial-name="UUID_HERE"><p>lookit huh</p></span></p></span> post that I <em>totally</em> wrote</p>'))
			t.end()
		})
	})
})
