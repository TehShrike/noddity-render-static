var parse = require('noddity-template-parser')
var runParallel = require('run-parallel')
var dezalgo = require('dezalgo')
var Ractive = require('ractive')
var extend = require('xtend')
Ractive.DEBUG = false

module.exports = function getRenderedPostWithTemplates(template, post, options, cb) {
	cb = dezalgo(cb)

	var convertToHtml = options.convertToHtml !== false

	loadPostObjects(options.butler, template, post, function(err, template, post) {
		if (err) return cb(err)

		template.content = template.content.replace('{{{html}}}', '{{>current}}')

		options.data = options.data || {}
		buildMapOfAllPostDependencies(post, options.linkifier, options.butler.getPost, function(err, mapOfPosts) {
			if (err) {
				cb(err)
			} else {
				augmentRootData(post, options.butler, function(err, data) {
					var html = getHtmlWithPartials(template, options.linkifier, convertToHtml, mapOfPosts)
					var partials = turnPostsMapIntoPartialsObject(mapOfPosts, options.linkifier, convertToHtml)
					partials.current = getHtmlWithPartials(post, options.linkifier, convertToHtml, mapOfPosts)

					data.removeDots = removeDots

					var ractive = new Ractive({
						data: extend(data, options.data),
						template: Ractive.parse(html),
						partials: partials,
						preserveWhitespace: true
					})

					try {
						var finalHtml = ractive.toHTML()
					} catch (e) {
						return cb(e)
					}


					cb(null, finalHtml)
				})
			}
		})

	})
}

function loadPostObjects(butler, template, post, cb) {
	runParallel({
		template: loadPostObjectFromStringOrObject.bind(null, butler, template),
		post: loadPostObjectFromStringOrObject.bind(null, butler, post)
	}, function(err, postObjects) {
		cb(err, postObjects.template, postObjects.post)
	})
}

function loadPostObjectFromStringOrObject(butler, postOrFilename, cb) {
	if (!postOrFilename) {
		cb(new Error('That\'s not a post!'))
	} else if (typeof postOrFilename === 'string') {
		butler.getPost(postOrFilename, cb)
	} else {
		cb(null, postOrFilename)
	}
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

				runParallel(buildAllDependencies, function(err) {
					cb(err, map)
				})
			}
		})
	}
}

function getHtmlWithPartials(post, linkifier, convertToHtml, postsMap) {
	var ast = parse(post, linkifier, { convertToHtml: convertToHtml })

	return ast.reduce(function(html, chunk) {
		if (chunk.type === 'string') {
			return html + chunk.value
		} else if (chunk.type === 'template') {
			var filename = chunk.filename
			var args = chunk.arguments
			var metadata = postsMap[filename] ? postsMap[filename].metadata : {}
			var dataOnTemplateScope = extend(metadata, args)
			return html + '{{>' + filenameToPartialName(filename) + ' ' + JSON.stringify(dataOnTemplateScope) + ' }}'
		}

		return html
	}, '')
}

function turnPostsMapIntoPartialsObject(mapOfPosts, linkifier, convertToHtml) {
	return Object.keys(mapOfPosts).reduce(function(partialsObject, filename) {
		var post = mapOfPosts[filename]
		partialsObject[filenameToPartialName(post.filename)] = getHtmlWithPartials(post, linkifier, convertToHtml, mapOfPosts)
		return partialsObject
	}, {})
}

function filenameToPartialName(filename) {
	return '_' + filename.replace(/\./g, '_')
}

function augmentRootData(post, butler, cb) {
	butler.getPosts(function(err, posts) {
		if (err) {
			cb(err)
		} else {
			cb(null, extend(post.metadata, {
				postList: posts.filter(function(post) {
					return post.metadata.date
				}).map(function(post) {
					return extend(post, post.metadata)
				}),
				posts: posts.reduce(function(posts, post) {
					posts[removeDots(post.filename)] = post
					return posts
				}, {}),
				current: post.filename
			}))
		}
	})
}

function removeDots(str) {
	return str.replace(/\./g, '')
}
