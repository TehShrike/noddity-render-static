var render = require('noddity-renderer')
var cheerio = require('cheerio')
var each = require('async-each')
var dezalgo = require('dezalgo')
var Ractive = require('ractive')
var extend = require('xtend')
var uuid = require('random-uuid-v4')
Ractive.DEBUG = false

var VALID_NODDITY_TEMPLATE_ELEMENT = '.noddity-template[data-noddity-post-file-name][data-noddity-template-arguments]'
var ARGUMENTS_ATTRIBUTE = 'data-noddity-template-arguments'
var FILENAME_ATTRIBUTE = 'data-noddity-post-file-name'

module.exports = function getRenderedPostWithTemplates(post, options, cb) {
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

function getDom(post, linkifier) {
	var html = render(post, linkifier)
	return cheerio.load(html)
}

function getContainedFileNames($) {
	var map = {}
	$(VALID_NODDITY_TEMPLATE_ELEMENT).each(function(index, element) {
		var filename = $(element).attr(FILENAME_ATTRIBUTE)
		map[filename] = true
	})
	return Object.keys(map)
}

function buildMapOfAllPostDependencies(post, linkifier, getPost, cb, map) {
	map = map || {}
	cb = dezalgo(cb)
	var $ = getDom(post, linkifier)
	var needToFetch = getContainedFileNames($).filter(function(filename) {
		return !map[filename]
	})

	if (needToFetch.length === 0) {
		cb(null, map)
	} else {
		each(needToFetch, getPost, function(err, posts) {
			if (err) {
				cb(err)
			} else {
				posts = posts.filter(function(post) {
					return !map[post.filename]
				})

				posts.forEach(function(post) {
					map[post.filename] = post
				})

				each(posts, function(post, cb) {
					buildMapOfAllPostDependencies(post, linkifier, getPost, cb, map)
				}, function(err, whatevs) {
					cb(err, map)
				})
			}
		})
	}
}

function addPartialReferencesToTemplate($, postsMap) {
	var whatShouldReallyGoThere = {}
	$(VALID_NODDITY_TEMPLATE_ELEMENT).each(function(index, element) {
		var e = $(element)
		var argumentsJson = e.attr(ARGUMENTS_ATTRIBUTE)
		var filename = e.attr(FILENAME_ATTRIBUTE)
		var args = JSON.parse(argumentsJson)
		var metadata = postsMap[filename].metadata
		var dataOnTemplateScope = extend(metadata, args)

		var id = uuid()
		whatShouldReallyGoThere[id] = '{{>' + filenameToPartialName(filename) + ' ' + JSON.stringify(dataOnTemplateScope) + ' }}'
		e.html(id)
	})
	var html = $.html()

	Object.keys(whatShouldReallyGoThere).forEach(function(uuid) {
		html = html.replace(uuid, whatShouldReallyGoThere[uuid])
	})
	return html
}

function getHtmlWithPartials(post, linkifier, postsMap) {
	var $ = getDom(post, linkifier)
	return addPartialReferencesToTemplate($, postsMap)
}

function turnPostsMapIntoPartialsObject(mapOfPosts, linkifier) {
	return Object.keys(mapOfPosts).reduce(function(partialsObject, filename) {
		var post = mapOfPosts[filename]
		partialsObject[filenameToPartialName(post.filename)] = getHtmlWithPartials(post, linkifier, mapOfPosts)
		return partialsObject
	}, {})
}

function filenameToPartialName(filename) {
	return filename.replace(/\./g, '_')
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
