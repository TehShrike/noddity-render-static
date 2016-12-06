var test = require('tape')

require('ractive').DEBUG = false

var makeTestState = require('./helpers/test-state')

test('post list is properly in scope and in the proper order', function(t) {
	var state = makeTestState()

	state.retrieval.addPost('post', { title: 'TEMPLAAAATE', markdown: false }, '{{>current}}')
	state.retrieval.addPost('file1.md', { title: 'Some title', date: new Date(1442361866264) }, ['<ol>{{#postList}}',
				'<li><a href="{{pathPrefix}}{{pagePathPrefix}}{{filename}}">{{title}}</a></li>',
			'{{/postList}}</ol>'].join('\n'))
	state.retrieval.addPost('file2.md', { title: 'Another title', date: new Date(1442361866266) }, 'lol yeah ::herp|wat:: ::herp|huh::')
	state.retrieval.addPost('herp', { title: 'Even moar title', date: new Date(1442361866265), markdown: false }, 'lookit {{1}}')

	state.retrieval.getPost('file1.md', function(err, post) {
		var data = {
			pathPrefix: '#!/',
			pagePathPrefix: 'post/'
		}
		state.render('post', post, { data: data }, function(err, html) {
			t.notOk(err)
			t.equal(html, ['<ol>',
				'<li><a href="#!/post/file2.md">Another title</a></li>\n',
				'<li><a href="#!/post/herp">Even moar title</a></li>\n',
				'<li><a href="#!/post/file1.md">Some title</a></li>',
				'</ol>'].join('\n'))
			t.end()
		})
	})
})

test('post list is properly in scope in an embedded template, and the current filename is set at top and embedded levels', function(t) {
	var state = makeTestState()

	state.retrieval.addPost('post', { title: 'TEMPLAAAATE', markdown: false }, '{{>current}}')
	state.retrieval.addPost('file1.md', { title: 'Some title', date: new Date(1442361866264) }, ['<ol>{{#postList}}',
				'<li><a href="{{pathPrefix}}{{pagePathPrefix}}{{filename}}">{{title}}</a></li>',
			'{{/postList}}</ol>{{current}}'].join('\n'))
	state.retrieval.addPost('file2.md', { title: 'Another title', date: new Date(1442361866265) }, 'lol yeah ::herp|wat:: ::herp|huh::')
	state.retrieval.addPost('container', { title: 'Container', date: new Date(1442361866266), markdown: false }, '::file1.md::{{current}}')

	state.retrieval.getPost('container', function(err, post) {
		var data = {
			pathPrefix: '#!/',
			pagePathPrefix: 'post/'
		}
		state.render('post', post, { data: data }, function(err, html) {
			t.notOk(err)
			t.equal(html, [
					'<ol>',
						'<li><a href="#!/post/container">Container</a></li>\n',
						'<li><a href="#!/post/file2.md">Another title</a></li>\n',
						'<li><a href="#!/post/file1.md">Some title</a></li>',
					'</ol>containercontainer',].join('\n'))
			t.end()
		})
	})
})

test('post list and current filename is set at top and embedded levels', function(t) {
	var state = makeTestState()

	state.retrieval.addPost('post', { title: 'TEMPLAAAATE', markdown: false }, ['{{title}}',
		'<ol>{{#postList}}',
				'<li><a href="{{pathPrefix}}{{pagePathPrefix}}{{filename}}">{{title}}</a></li>',
		'{{/postList}}</ol>',
		'{{current}}',
		'{{>current}}'].join('\n'))
	state.retrieval.addPost('innocuous.md', { title: 'Innocuous post', date: new Date(1442361866264) }, 'not much here!')
	state.retrieval.addPost('file2.md', { title: 'Another title', date: new Date(1442361866265) }, 'lol yeah ::herp|wat:: ::herp|huh::')
	state.retrieval.addPost('container', { title: 'Container', date: new Date(1442361866266), markdown: false }, '::file1.md::{{current}}')

	var data = {
		pathPrefix: '#!/',
		pagePathPrefix: 'post/'
	}

	state.render('post', 'innocuous.md', { data: data }, function(err, html) {
		t.notOk(err)
		t.equal(html.replace('\n', ''), [
				'Innocuous post <ol>',
					'<li><a href="#!/post/container">Container</a></li>',
					'<li><a href="#!/post/file2.md">Another title</a></li>',
					'<li><a href="#!/post/innocuous.md">Innocuous post</a></li>',
				'</ol> innocuous.md <p>not much here!</p> '].join(''))
		t.end()
	})
})

test('post object', function(t) {
	var state = makeTestState()

	state.retrieval.addPost('post', { title: 'whatevs', markdown: false }, '{{>current}}')
	state.retrieval.addPost('file1.md', { title: 'Some title', date: new Date(1442361866265), otherMetadata: 999 }, '{{ posts.file2md.metadata.title}}')
	state.retrieval.addPost('file2.md', { title: 'Another title', date: new Date(1442361866265) }, '{{ posts[removeDots(\'file1.md\')].metadata.otherMetadata}}')

	state.render('post', 'file1.md', {}, function(err, html) {
		t.notOk(err, 'no error')
		t.equal(html, '<p>Another title</p>\n', 'properly converts file1.md')

		state.render('post', 'file2.md', {}, function(err, html) {
			t.notOk(err, 'no error')
			t.equal(html, '<p>999</p>\n', 'properly converts file2.md')

			t.end()
		})
	})
})

test('post metadata is available on the metadata object', function(t) {
	var state = makeTestState()

	state.retrieval.addPost('post', { title: 'whatevs', markdown: false }, '{{>current}}')
	state.retrieval.addPost('file1.md', { title: 'Some title', date: new Date(1442361866265), otherMetadata: 999 }, '{{metadata.title}} {{metadata.otherMetadata}}')

	state.render('post', 'file1.md', {}, function(err, html) {
		t.notOk(err)
		t.equal(html, '<p>Some title 999</p>\n')
		t.end()
	})
})
