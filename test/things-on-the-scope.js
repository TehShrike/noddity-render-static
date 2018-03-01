const test = require(`./helpers/async-test.js`)

require(`ractive`).DEBUG = false

const makeTestState = require(`./helpers/test-state`)

test(`post list is properly in scope and in the proper order`, async t => {
	const state = makeTestState()

	state.retrieval.addPost(`post`, { title: `TEMPLAAAATE`, markdown: false }, `{{>current}}`)
	state.retrieval.addPost(`file1.md`, { title: `Some title`, date: new Date(1442361866264) }, [ `<ol>{{#postList}}`,
		`<li><a href="{{pathPrefix}}{{pagePathPrefix}}{{filename}}">{{title}}</a></li>`,
		`{{/postList}}</ol>` ].join(`\n`))
	state.retrieval.addPost(`file2.md`, { title: `Another title`, date: new Date(1442361866266) }, `lol yeah ::herp|wat:: ::herp|huh::`)
	state.retrieval.addPost(`herp`, { title: `Even moar title`, date: new Date(1442361866265), markdown: false }, `lookit {{1}}`)

	const post = await state.retrieval.getPost(`file1.md`)

	const data = {
		pathPrefix: `#!/`,
		pagePathPrefix: `post/`,
	}
	const html = await state.render(`post`, post, { data })
	t.equal(html, [
		`<ol>`,
		`<li><a href="#!/post/file2.md">Another title</a></li>\n`,
		`<li><a href="#!/post/herp">Even moar title</a></li>\n`,
		`<li><a href="#!/post/file1.md">Some title</a></li>`,
		`</ol>`,
	].join(`\n`))
})

test(`post list is properly in scope in an embedded template, and the current filename is set at top and embedded levels`, async t => {
	const state = makeTestState()

	state.retrieval.addPost(`post`, { title: `TEMPLAAAATE`, markdown: false }, `{{>current}}`)
	state.retrieval.addPost(`file1.md`, { title: `Some title`, date: new Date(1442361866264) }, [ `<ol>{{#postList}}`,
		`<li><a href="{{pathPrefix}}{{pagePathPrefix}}{{filename}}">{{title}}</a></li>`,
		`{{/postList}}</ol>{{current}}` ].join(`\n`))
	state.retrieval.addPost(`file2.md`, { title: `Another title`, date: new Date(1442361866265) }, `lol yeah ::herp|wat:: ::herp|huh::`)
	state.retrieval.addPost(`container`, { title: `Container`, date: new Date(1442361866266), markdown: false }, `::file1.md::{{current}}`)

	const post = await state.retrieval.getPost(`container`)
	const data = {
		pathPrefix: `#!/`,
		pagePathPrefix: `post/`,
	}
	const html = await state.render(`post`, post, { data })
	t.equal(html, [
		`<ol>`,
		`<li><a href="#!/post/container">Container</a></li>\n`,
		`<li><a href="#!/post/file2.md">Another title</a></li>\n`,
		`<li><a href="#!/post/file1.md">Some title</a></li>`,
		`</ol>containercontainer`,
	].join(`\n`))
})

test(`post list and current filename is set at top and embedded levels`, async t => {
	const state = makeTestState()

	state.retrieval.addPost(`post`, { title: `TEMPLAAAATE`, markdown: false }, [ `{{title}}`,
		`<ol>{{#postList}}`,
		`<li><a href="{{pathPrefix}}{{pagePathPrefix}}{{filename}}">{{title}}</a></li>`,
		`{{/postList}}</ol>`,
		`{{current}}`,
		`{{>current}}` ].join(`\n`))
	state.retrieval.addPost(`innocuous.md`, { title: `Innocuous post`, date: new Date(1442361866264) }, `not much here!`)
	state.retrieval.addPost(`file2.md`, { title: `Another title`, date: new Date(1442361866265) }, `lol yeah ::herp|wat:: ::herp|huh::`)
	state.retrieval.addPost(`container`, { title: `Container`, date: new Date(1442361866266), markdown: false }, `::file1.md::{{current}}`)

	const data = {
		pathPrefix: `#!/`,
		pagePathPrefix: `post/`,
	}

	const html = await state.render(`post`, `innocuous.md`, { data })
	t.equal(html.replace(`\n`, ``), [
		`Innocuous post <ol>`,
		`<li><a href="#!/post/container">Container</a></li>`,
		`<li><a href="#!/post/file2.md">Another title</a></li>`,
		`<li><a href="#!/post/innocuous.md">Innocuous post</a></li>`,
		`</ol> innocuous.md <p>not much here!</p>`,
	].join(``))
})

test(`post object`, async t => {
	const state = makeTestState()

	state.retrieval.addPost(`post`, { title: `whatevs`, markdown: false }, `{{>current}}`)
	state.retrieval.addPost(`file1.md`, { title: `Some title`, date: new Date(1442361866265), otherMetadata: 999 }, `{{ posts.file2md.metadata.title}}`)
	state.retrieval.addPost(`file2.md`, { title: `Another title`, date: new Date(1442361866265) }, `{{ posts[removeDots('file1.md')].metadata.otherMetadata}}`)

	const file1Html = await state.render(`post`, `file1.md`, {})

	t.equal(file1Html, `<p>Another title</p>\n`, `properly converts file1.md`)

	const file2Html = await state.render(`post`, `file2.md`, {})
	t.equal(file2Html, `<p>999</p>\n`, `properly converts file2.md`)
})

test(`post metadata is available on the metadata object`, async t => {
	const state = makeTestState()

	state.retrieval.addPost(`post`, { title: `whatevs`, markdown: false }, `{{>current}}`)
	state.retrieval.addPost(`file1.md`, { title: `Some title`, date: new Date(1442361866265), otherMetadata: 999 }, `{{metadata.title}} {{metadata.otherMetadata}}`)

	const html = await state.render(`post`, `file1.md`, {})
	t.equal(html, `<p>Some title 999</p>\n`)
})
