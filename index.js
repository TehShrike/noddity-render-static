const parse = require(`noddity-template-parser`)
const Ractive = require(`ractive`)
const makeReplacer = require(`./replacer`)
const pify = require(`pify`)

const merge = (...objects) => Object.assign({}, ...objects)

module.exports = async function getRenderedPostWithTemplates(templateArg, postArg, options) {
	const convertToHtml = options.convertToHtml !== false
	const replacer = makeReplacer()
	const butler = pify(options.butler)
	const linkifier = options.linkifier

	const [ loadedTemplate, post ] = await loadPostObjects(butler, templateArg, postArg)
	const template = merge(loadedTemplate, {
		content: loadedTemplate.content.replace(`{{{html}}}`, `{{>current}}`),
	})

	const initialmapOfPosts = await buildMapOfAllPostDependencies(template, linkifier, butler.getPost)
	const mapOfPosts = await buildMapOfAllPostDependencies(post, linkifier, butler.getPost, initialmapOfPosts)
	const data = await augmentRootData(post, butler)


	let html = getHtmlWithPartials(template, linkifier, convertToHtml, mapOfPosts, replacer.replace)
	const partials = turnPostsMapIntoPartialsObject(mapOfPosts, linkifier, convertToHtml, replacer.replace)
	partials.current = getHtmlWithPartials(post, linkifier, convertToHtml, mapOfPosts, replacer.replace)

	data.removeDots = removeDots

	if (convertToHtml) {
		Object.keys(partials).forEach(key => {
			partials[key] = replacer.putBack(partials[key])
		})
		html = replacer.putBack(html)
	}

	const ractive = new Ractive({
		data: merge(data, options.data),
		template: Ractive.parse(html),
		partials,
		preserveWhitespace: true,
	})

	console.log(`convertToHtml is`, convertToHtml)

	return convertToHtml
		? ractive.toHTML()
		: replacer.putBack(ractive.toHTML())
}

async function loadPostObjects(butler, template, post) {
	return Promise.all([
		loadPostObjectFromStringOrObject(butler, template),
		loadPostObjectFromStringOrObject(butler, post),
	])
}

async function loadPostObjectFromStringOrObject(butler, postOrFilename) {
	if (!postOrFilename) {
		throw new Error(`That's not a post!`)
	} else if (typeof postOrFilename === `string`) {
		return butler.getPost(postOrFilename)
	} else {
		return postOrFilename
	}
}

function getContainedFileNames(ast) {
	return Object.keys(
		ast.filter(
			chunk => chunk.type === `template`
		).map(
			chunk => chunk.filename
		).reduce((uniqueMap, filename) => {
			uniqueMap[filename] = true
			return uniqueMap
		}, {})
	)
}

async function buildMapOfAllPostDependencies(post, linkifier, getPost, map = {}) {
	const ast = parse(post, linkifier)

	const needToFetch = getContainedFileNames(ast)
		.filter(filename => !map[filename])

	if (needToFetch.length === 0) {
		return map
	} else {
		const posts = await Promise.all(
			needToFetch.map(filename => getPost(filename))
		)
		const relevantPosts = posts.filter(post => !map[post.filename])

		relevantPosts.forEach(post => {
			map[post.filename] = post
		})

		await Promise.all(
			relevantPosts.map(
				post => buildMapOfAllPostDependencies(post, linkifier, getPost, map)
			)
		)

		return map
	}
}

function getHtmlWithPartials(post, linkifier, convertToHtml, postsMap, replace) {
	const ast = parse(post, linkifier, { convertToHtml })

	return ast.reduce((html, chunk) => {
		if (chunk.type === `string`) {
			return html + replace(chunk.value)
		} else if (chunk.type === `template`) {
			const filename = chunk.filename
			const args = chunk.arguments
			const metadata = postsMap[filename] ? postsMap[filename].metadata : {}
			const dataOnTemplateScope = merge(metadata, args)
			return html + `{{>` + filenameToPartialName(filename) + ` ` + JSON.stringify(dataOnTemplateScope) + ` }}`
		}

		return html
	}, ``)
}

function turnPostsMapIntoPartialsObject(mapOfPosts, linkifier, convertToHtml, replace) {
	return Object.keys(mapOfPosts).reduce((partialsObject, filename) => {
		const post = mapOfPosts[filename]
		partialsObject[filenameToPartialName(post.filename)] = getHtmlWithPartials(post, linkifier, convertToHtml, mapOfPosts, replace)
		return partialsObject
	}, {})
}

function filenameToPartialName(filename) {
	return `_` + filename.replace(/\./g, `_`)
}

async function augmentRootData(post, butler) {
	const posts = await butler.getPosts()

	const specialData = {
		postList: posts.filter(post => typeof post.metadata.title === `string` && post.metadata.date).map(post => merge(post, post.metadata)).reverse(),
		posts: posts.reduce((posts, post) => {
			posts[removeDots(post.filename)] = post
			return posts
		}, {}),
		current: post.filename,
	}

	return merge(
		post.metadata,
		{ metadata: post.metadata },
		specialData
	)
}

function removeDots(str) {
	return str.replace(/\./g, ``)
}
