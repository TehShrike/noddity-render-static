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
				t.equal(html, '<p>This is a <p>lol yeah lookit wat lookit huh</p>\n post that I <em>totally</em> wrote</p>\n')
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
			t.equal(html, '<p>This is a <p>lol yeah <p>lookit wat</p>\n <p>lookit huh</p>\n</p>\n post that I <em>totally</em> wrote</p>\n')
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
			t.equal(html, '<p>This is a <p>lol yeah</p>\n post that I <em>totally</em> wrote</p>\n')
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
		t.equal(html, '<p>This is a <p>lol yeah lookit wat lookit huh</p>\n post that I <em>totally</em> wrote</p>\n')
		t.end()
	})
})

test('{{{html}}} still works', function(t) {
	var state = makeTestState()

	state.retrieval.addPost('post', { title: 'TEMPLAAAATE', markdown: false }, '{{{html}}}')
	state.retrieval.addPost('file1.md', { title: 'Some title', date: new Date() }, 'yay!')

	state.render('post', 'file1.md', {}, function(err, html) {
		t.notOk(err, 'no error')
		t.equal(html, '<p>yay!</p>\n')
		t.end()
	})
})

test('post with {{{html}}} is not mutated', function(t) {
	var state = makeTestState()

	const postTemplate = {
		metadata: { title: 'TEMPLAAAATE', markdown: false },
		content: '{{{html}}}'
	}

	state.retrieval.addPost('file1.md', { title: 'Some title', date: new Date() }, 'yay!')

	state.render(postTemplate, 'file1.md', {}, function(err, html) {
		t.notOk(err, 'no error')
		t.equal(postTemplate.content, '{{{html}}}')
		t.end()
	})
})

test('Optionally don\'t convert to markdown', function(t) {
	var state = makeTestState()

	state.retrieval.addPost('post', { title: 'TEMPLAAAATE' }, '# oh yeah\n\n{{>current}}')
	state.retrieval.addPost('file1.md', { title: 'Some title', date: new Date() }, '# totally a header\n\n::file2.md::')
	state.retrieval.addPost('file2.md', { title: 'Some other title', date: new Date() }, '## also a header\n\nand more text')

	state.render('post', 'file1.md', {
		convertToHtml: false
	}, function(err, markdown) {
		t.notOk(err, 'no error')
		t.equal(markdown, [
			'# oh yeah',
			'# totally a header',
			'## also a header',
			'and more text'
		].join('\n\n'))
		t.end()
	})
})

test('escaping characters it shouldn\'t when converting to markdown', function(t) {
	var state = makeTestState()

	state.retrieval.addPost('post', { title: 'TEMPLAAAATE' }, '{{>current}}')
	state.retrieval.addPost('file1.md', { title: 'Some title', date: new Date() }, '# oh yeah\n\n> some block quote')
	state.retrieval.addPost('file2.md', { title: 'Some other title', date: new Date() }, '# totally a header\n\n&gt; not a block quote')

	t.test('with angle brackets', function(t) {
		state.render('post', 'file1.md', {
			convertToHtml: false
		}, function(err, markdown) {
			t.notOk(err, 'no error')
			t.equal(markdown, [
				'# oh yeah',
				'> some block quote'
			].join('\n\n'))
			t.end()
		})
	})

	t.test('with html entities', function(t) {
		state.render('post', 'file2.md', {
			convertToHtml: false
		}, function(err, markdown) {
			t.notOk(err, 'no error')
			t.equal(markdown, [
				'# totally a header',
				'&gt; not a block quote'
			].join('\n\n'))
			t.end()

		})
	})

})

test('a post on noddity.com with a link in a code block', function(t) {
	var state = makeTestState()

	state.retrieval.addPost('post', { title: 'TEMPLAAAATE' }, '{{>current}}')
	state.retrieval.addPost('the-most-boring-page.md', {}, 'boring')

	var metadata = {
		title: 'Post/template documentation',
		date: new Date('Thu Jun 11 2015 20:16:56 GMT-0500 (CDT)')
	}
	state.retrieval.addPost('test', metadata, 'Posts can be [straight markdown](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet), but there are some other goodies.  To start with, you can use goodies like footnotes and tables that are supported by the [remarkable](https://www.npmjs.com/package/remarkable#syntax-extensions) parser.\n\n## Internal links\n\nYou can link to any other document on the site using a syntax similar to Wikipedia\'s: anything inside square brackets will turn into a link.  `"[[noddity-backend.md]]"` turns into "[[noddity-backend.md]]".\n\nYou can put in whatever link text you like after a `|` pipe: `[[noddity-backend.md|CLICK THIS LINK]]` turns into [[noddity-backend.md|CLICK THIS LINK]].\n\n## Embeddable templates\n\nAny page on the site can be embedded into any other page.  Take [[the-most-boring-page.md|this boring page]] for example - you can visit it by clicking it on the link, but you can also embed it by including its name inside of colons, like this: `::the-most-boring-page.md::`.\n\nWhen I do that in this page, you get: ::the-most-boring-page.md::\n\nIf you want your templates to not be parsed with the markdown parser (which adds paragraph tags, among other things) you can add the `markdown: false` property to the metadata at the top of the file.\n\n### Expressions\n\nInside templates, you can also use fancy expressions - they get inserted as [Ractive templates](http://docs.ractivejs.org/latest/mustaches), which means you can pretty much use regular JavaScript inside moustaches.\n\nInside those expressions, you have certain values available to you.  You have the parameters passed in to the template, either as numbered expressions: `::template.md|value 1|value 2::` or as named expressions: `::template.md|first=value 1|first=value 2::`.\n\nAlso available to you are:\n\n- `current` - the file name of the page you are current on.  Set by the noddity-renderer\n- `postList` - changing soon\n- all the values set in your config.js')

	state.render('post', 'test', {}, function(err, html) {
		t.notOk(err)
		t.end()
	})
})

test('invalid template', function(t) {
	var state = makeTestState()

	state.retrieval.addPost('post', { title: 'TEMPLAAAATE' }, '{{>current}}')
	state.retrieval.addPost('invalid.md', {}, '<p><p>wat</p></p>')

	state.render('post', 'invalid.md', {}, function(err, html) {
		t.ok(err)
		t.end()
	})
})
