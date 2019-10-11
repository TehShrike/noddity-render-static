const test = require(`./helpers/async-test.js`)
const Ractive = require(`ractive`)

Ractive.DEBUG = false

const makeTestState = require(`./helpers/test-state`)


test(`embedded templates, passing in both posts as post objects`, async t => {
	const state = makeTestState()

	state.retrieval.addPost(`post`, { title: `TEMPLAAAATE`, markdown: false }, `{{>current}}`)
	state.retrieval.addPost(`file1.md`, { title: `Some title`, date: new Date() }, `This is a ::file2.md:: post that I *totally* wrote`)
	state.retrieval.addPost(`file2.md`, { title: `Some title`, date: new Date() }, `lol yeah ::herp|wat:: ::herp|huh::`)
	state.retrieval.addPost(`herp`, { title: `Some title`, date: new Date(), markdown: false }, `lookit {{this.1}}`)

	const post = await state.retrieval.getPost(`file1.md`)
	const template = await state.retrieval.getPost(`post`)
	const html = await state.render(template, post, {})

	t.equal(html, `<p>This is a <p>lol yeah lookit wat lookit huh</p>\n post that I <em>totally</em> wrote</p>\n`)
})

test(`three markdown files deep`, async t => {
	const state = makeTestState()

	state.retrieval.addPost(`post`, { title: `TEMPLAAAATE`, markdown: false }, `{{>current}}`)
	state.retrieval.addPost(`file1.md`, { title: `Some title`, date: new Date() }, `This is a ::file2.md:: post that I *totally* wrote`)
	state.retrieval.addPost(`file2.md`, { title: `Some title`, date: new Date() }, `lol yeah ::file3.md|wat:: ::file3.md|huh::`)
	state.retrieval.addPost(`file3.md`, { title: `Some title`, date: new Date() }, `lookit {{this.1}}`)

	const post = await state.retrieval.getPost(`file1.md`)
	const html = await state.render(`post`, post, {})

	t.equal(html, `<p>This is a <p>lol yeah <p>lookit wat</p>\n <p>lookit huh</p>\n</p>\n post that I <em>totally</em> wrote</p>\n`)
})

test(`filename starting with a number`, async t => {
	const state = makeTestState()

	state.retrieval.addPost(`post`, { title: `TEMPLAAAATE`, markdown: false }, `{{>current}}`)
	state.retrieval.addPost(`file1.md`, { title: `Some title`, date: new Date() }, `This is a ::2.md:: post that I *totally* wrote`)
	state.retrieval.addPost(`2.md`, { title: `Some title`, date: new Date() }, `lol yeah`)

	const post = await state.retrieval.getPost(`file1.md`)
	const html = await state.render(`post`, post, {})

	t.equal(html, `<p>This is a <p>lol yeah</p>\n post that I <em>totally</em> wrote</p>\n`)
})

test(`loading based on file name`, async t => {
	const state = makeTestState()

	state.retrieval.addPost(`post`, { title: `TEMPLAAAATE`, markdown: false }, `{{>current}}`)
	state.retrieval.addPost(`file1.md`, { title: `Some title`, date: new Date() }, `This is a ::file2.md:: post that I *totally* wrote`)
	state.retrieval.addPost(`file2.md`, { title: `Some title`, date: new Date() }, `lol yeah ::herp|wat:: ::herp|huh::`)
	state.retrieval.addPost(`herp`, { title: `Some title`, date: new Date(), markdown: false }, `lookit {{this.1}}`)

	const html = await state.render(`post`, `file1.md`, {})
	t.equal(html, `<p>This is a <p>lol yeah lookit wat lookit huh</p>\n post that I <em>totally</em> wrote</p>\n`)
})

test(`{{{html}}} still works`, async t => {
	const state = makeTestState()

	state.retrieval.addPost(`post`, { title: `TEMPLAAAATE`, markdown: false }, `{{{html}}}`)
	state.retrieval.addPost(`file1.md`, { title: `Some title`, date: new Date() }, `yay!`)

	const html = await state.render(`post`, `file1.md`, {})
	t.equal(html, `<p>yay!</p>\n`)
})

test(`post with {{{html}}} is not mutated`, async t => {
	const state = makeTestState()

	const postTemplate = {
		metadata: { title: `TEMPLAAAATE`, markdown: false },
		content: `{{{html}}}`,
	}

	state.retrieval.addPost(`file1.md`, { title: `Some title`, date: new Date() }, `yay!`)

	const html = await state.render(postTemplate, `file1.md`, {})
	t.equal(postTemplate.content, `{{{html}}}`)
})

test(`Optionally don't convert to markdown`, async t => {
	const state = makeTestState()

	state.retrieval.addPost(`post`, { title: `TEMPLAAAATE` }, `# oh yeah\n\n{{>current}}`)
	state.retrieval.addPost(`file1.md`, { title: `Some title`, date: new Date() }, `# totally a header\n\n::file2.md::`)
	state.retrieval.addPost(`file2.md`, { title: `Some other title`, date: new Date() }, `## also a header\n\nand more text`)

	const markdown = await state.render(`post`, `file1.md`, {
		convertToHtml: false,
	})

	t.equal(markdown, [
		`# oh yeah`,
		`# totally a header`,
		`## also a header`,
		`and more text`,
	].join(`\n\n`))
})

test(`escaping characters it shouldn't when converting to markdown`, async t => {
	const state = makeTestState()

	state.retrieval.addPost(`post`, { title: `TEMPLAAAATE` }, `{{>current}}`)
	state.retrieval.addPost(`file1.md`, { title: `Some title`, date: new Date() }, `# oh yeah\n\n> some block quote`)
	state.retrieval.addPost(`file2.md`, { title: `Some other title`, date: new Date() }, `# totally a header\n\n&gt; not a block quote`)

	const markdownWithAngleBrackets = await state.render(`post`, `file1.md`, {
		convertToHtml: false,
	})
	t.equal(markdownWithAngleBrackets, [
		`# oh yeah`,
		`> some block quote`,
	].join(`\n\n`))

	const markdownWithHtmlEntities = await state.render(`post`, `file2.md`, {
		convertToHtml: false,
	})
	t.equal(markdownWithHtmlEntities, [
		`# totally a header`,
		`&gt; not a block quote`,
	].join(`\n\n`))
})

test(`mediawiki style links work`, async t => {
	const state = makeTestState()

	state.retrieval.addPost('post', { title: 'TEMPLAAAATE', markdown: false }, '{{>current}}')
	state.retrieval.addPost('file1.md', { title: 'Some title', date: new Date() },
		'This `[[some-page-you-want-to-link-to.md|wiki-style internal links]]` turns into [[some-page-you-want-to-link-to.md|wiki-style internal links]]')
	const expect = `<p>This <code>[[some-page-you-want-to-link-to.md|wiki-style internal links]]</code> turns into <a href="#/prefixsome-page-you-want-to-link-to.md">wiki-style internal links</a></p>`
	const html = await state.render(`post`, `file1.md`, {})
	t.equal(html, expect)
})

test(`a post on noddity.com with a link in a code block`, async t => {
	const state = makeTestState()

	state.retrieval.addPost(`post`, { title: `TEMPLAAAATE` }, `{{>current}}`)
	state.retrieval.addPost(`the-most-boring-page.md`, {}, `boring`)

	const metadata = {
		title: `Post/template documentation`,
		date: new Date(`Thu Jun 11 2015 20:16:56 GMT-0500 (CDT)`),
	}
	state.retrieval.addPost(`test`, metadata, `Posts can be [straight markdown](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet), but there are some other goodies.  To start with, you can use goodies like footnotes and tables that are supported by the [remarkable](https://www.npmjs.com/package/remarkable#syntax-extensions) parser.\n\n## Internal links\n\nYou can link to any other document on the site using a syntax similar to Wikipedia's: anything inside square brackets will turn into a link.  \`"[[noddity-backend.md]]"\` turns into "[[noddity-backend.md]]".\n\nYou can put in whatever link text you like after a \`|\` pipe: \`[[noddity-backend.md|CLICK THIS LINK]]\` turns into [[noddity-backend.md|CLICK THIS LINK]].\n\n## Embeddable templates\n\nAny page on the site can be embedded into any other page.  Take [[the-most-boring-page.md|this boring page]] for example - you can visit it by clicking it on the link, but you can also embed it by including its name inside of colons, like this: \`::the-most-boring-page.md::\`.\n\nWhen I do that in this page, you get: ::the-most-boring-page.md::\n\nIf you want your templates to not be parsed with the markdown parser (which adds paragraph tags, among other things) you can add the \`markdown: false\` property to the metadata at the top of the file.\n\n### Expressions\n\nInside templates, you can also use fancy expressions - they get inserted as [Ractive templates](http://docs.ractivejs.org/latest/mustaches), which means you can pretty much use regular JavaScript inside moustaches.\n\nInside those expressions, you have certain values available to you.  You have the parameters passed in to the template, either as numbered expressions: \`::template.md|value 1|value 2::\` or as named expressions: \`::template.md|first=value 1|first=value 2::\`.\n\nAlso available to you are:\n\n- \`current\` - the file name of the page you are current on.  Set by the noddity-renderer\n- \`postList\` - changing soon\n- all the values set in your config.js`)

	await state.render(`post`, `test`, {})
})

test(`invalid template`, async t => {
	const state = makeTestState()

	state.retrieval.addPost(`post`, { title: `TEMPLAAAATE` }, `{{>current}}`)
	state.retrieval.addPost(`invalid.md`, {}, `<p><p>wat</p></p>`)

	t.plan(1)

	try {
		await state.render(`post`, `invalid.md`, {})
	} catch (err) {
		t.ok(err)
	}
})

test(`an embedded template in the top-level template`, async t => {
	const state = makeTestState()

	state.retrieval.addPost(`post`, { title: `TEMPLAAAATE`, markdown: false }, `::2.md:: {{>current}}`)
	state.retrieval.addPost(`file1.md`, { title: `Some title`, date: new Date() }, `This is a post that I *totally* wrote`)
	state.retrieval.addPost(`2.md`, { title: `Some title`, date: new Date() }, `lol yeah`)

	const post = await state.retrieval.getPost(`file1.md`)
	const html = await state.render(`post`, post, {})

	t.equal(html, `<p>lol yeah</p>\n <p>This is a post that I <em>totally</em> wrote</p>\n`)
})

test(`HTML entities inside a code block`, async t => {
	const state = makeTestState()

	state.retrieval.addPost(`post`, { title: `TEMPLAAAATE`, markdown: false }, `{{>current}}`)
	state.retrieval.addPost(`file1.md`, { title: `Some title`, date: new Date() }, `
# This is a header

<p>This is a legit paragraph</p>

    <p>This is html inside of a code block</p>
`)

	const html = await state.render(`post`, `file1.md`, {})

	t.equal(html, `<h1 id="this-is-a-header">This is a header</h1>
<p>This is a legit paragraph</p>
<pre><code>&lt;p&gt;This is html inside of a code block&lt;/p&gt;
</code></pre>
`)
})
