var render = require('noddity-renderer')
var cheerio = require('cheerio')
var each = require('async-each')
var dezalgo = require('dezalgo')
var Ractive = require('ractive')
var extend = require('xtend')

module.exports = function getRenderedPostWithTemplates(post, options, cb) {
	cb = dezalgo(cb)
	var html = render(post, options.linkifier)
	var $ = cheerio.load(html)
	var getPost = options.butler.getPost

	getPostsByFilename($, post, getPost, function(err, postsByFilename) {
		if (err) {
			cb(err)
		} else {
			var filenameAndArgumentsAry = cheerioMap($, '.noddity-template[data-noddity-post-file-name][data-noddity-template-arguments]',
				['data-noddity-post-file-name', 'data-noddity-template-arguments'])

			if (filenameAndArgumentsAry.length === 0) {
				cb(null, html)
			} else {
				each(filenameAndArgumentsAry, function(filenameAndArguments, next) {

					var element = filenameAndArguments.element
					var filename = filenameAndArguments['data-noddity-post-file-name']
					var childPost = postsByFilename[filename]
					var templateArguments = JSON.parse(filenameAndArguments['data-noddity-template-arguments'])
					var newData = extend(options.data, childPost.metadata, templateArguments)
					var newOptions = extend(options, {
						data: newData
					})

					getRenderedPostWithTemplates(childPost, newOptions, function(err, templateHtml) {
						if (err) {
							next(err)
						} else {
							var rendered = renderTemplate(templateHtml, newData)
							$(element).html(rendered)
							next()
						}
					})

				}, function(err) {
					if (err) {
						cb(err)
					} else {
						cb(null, sanitize($.html()))
					}
				})
			}
		}
	})
}

function renderTemplate(html, data) {
	return new Ractive({
		template: html,
		data: data
	}).toHTML()
}

function sanitize(html) {
	return cheerio.load(html).html()
}

function getPostsByFilename($, post, getPost, cb) {
	var filenames = cheerioMap($, '.noddity-template[data-noddity-post-file-name]', 'data-noddity-post-file-name')

	each(filenames, getPost, function(err, posts) {
		if (err) {
			cb(err)
		} else {
			var postsByFilename = posts.reduce(function(o, post) {
				o[post.filename] = post
				return o
			}, {})

			cb(null, postsByFilename)
		}
	})
}

function cheerioMap($, selector, attrs) {
	var ary = []
	$(selector).each(function(index, element) {
		if (Array.isArray(attrs)) {
			var o = {
				element: $(element)
			}
			attrs.forEach(function(attr) {
				o[attr] = $(element).attr(attr)
			})
			ary.push(o)
		} else {
			ary.push($(element).attr(attrs))
		}

	})
	return ary
}
