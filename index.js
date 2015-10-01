var parse = require('noddity-template-parser')
var runParallel = require('run-parallel')
var dezalgo = require('dezalgo')
var Ractive = require('ractive')
var extend = require('xtend')
Ractive.DEBUG = false

module.exports = getRenderedPostWithTemplates

function getRenderedPostWithTemplates(post, options, cb) {
	if (typeof post === 'string') return loadFilename(post, options, cb)

	options.data = options.data || {}
	cb = dezalgo(cb)
	buildMapOfAllPostDependencies(post, options.linkifier, options.butler.getPost, function(err, mapOfPosts) {
		if (err) {
			cb(err)
		} else {
			augmentData(post, options.butler, function(err, data) {
				var html = getHtmlWithPartials(post, options.linkifier, mapOfPosts)
				var partials = turnPostsMapIntoPartialsObject(mapOfPosts, options.linkifier)
				var finalHtml = new Ractive({
					data: extend(data, options.data),
					template: html,
					partials: partials
				}).toHTML()

				cb(null, finalHtml)
			})
		}
	})
}

function loadFilename(filename, options, cb) {
	options.butler.getPost(filename, function(err, post) {
		if (err) {
			cb(err)
		} else {
			getRenderedPostWithTemplates(post, options, cb)
		}
	})
}

function getContainedFileNames(ast) {
	return Object.keys(ast.filter(function(chunk) {
		return chunk.type === 'template'
	}).map(function(chunk) {
		return chunk.filename
	}).reduce(function(uniqueMap, filename) {
		uniqueMap[filename] = true
		return uniqueMap
	}, {}))
}

function buildMapOfAllPostDependencies(post, linkifier, getPost, cb, map) {
	map = map || {}
	cb = dezalgo(cb)
	var ast = parse(post, linkifier)

	var needToFetch = getContainedFileNames(ast).filter(function(filename) {
		return !map[filename]
	})

	if (needToFetch.length === 0) {
		cb(null, map)
	} else {
		var postGetters = needToFetch.map(function(filename) {
			return getPost.bind(null, filename)
		})
		runParallel(postGetters, function(err, posts) {
			if (err) {
				cb(err)
			} else {
				posts = posts.filter(function(post) {
					return !map[post.filename]
				})

				posts.forEach(function(post) {
					map[post.filename] = post
				})

				var buildAllDependencies = posts.map(function(post) {
					return function(cb) {
						buildMapOfAllPostDependencies(post, linkifier, getPost, cb, map)
					}
				})

				runParallel(buildAllDependencies, function(err, results) {
					cb(err, map)
				})
			}
		})
	}
}

function getHtmlWithPartials(post, linkifier, postsMap) {
	var ast = parse(post, linkifier)

	return ast.reduce(function(html, chunk) {
		if (chunk.type === 'string') {
			return html + chunk.value
		} else if (chunk.type === 'template') {
			var filename = chunk.filename
			var args = chunk.arguments
			var metadata = postsMap[filename].metadata
			var dataOnTemplateScope = extend(metadata, args)
			return html + '{{>' + filenameToPartialName(filename) + ' ' + JSON.stringify(dataOnTemplateScope) + ' }}'
		}

		return html
	}, '')
}

function turnPostsMapIntoPartialsObject(mapOfPosts, linkifier) {
	return Object.keys(mapOfPosts).reduce(function(partialsObject, filename) {
		var post = mapOfPosts[filename]
		partialsObject[filenameToPartialName(post.filename)] = getHtmlWithPartials(post, linkifier, mapOfPosts)
		return partialsObject
	}, {})
}

function filenameToPartialName(filename) {
	return '_' + filename.replace(/\./g, '_')
}

function augmentData(post, butler, cb) {
	butler.getPosts(function(err, posts) {
		if (err) {
			cb(err)
		} else {
			cb(null, {
				postList: posts.map(function(post) {
					return extend(post, post.metadata)
				}),
				posts: posts.reduce(function(posts, post) {
					posts[post.filename] = post
					return posts
				}, {}),
				current: post.filename
			})
		}
	})
}
