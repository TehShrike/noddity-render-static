
Render static HTML from a Noddity post.

# Usage

[![Greenkeeper badge](https://badges.greenkeeper.io/TehShrike/noddity-render-static.svg)](https://greenkeeper.io/)

```js
var render = require('noddity-render-static')
var Butler = require('noddity-butler')
var Linkifier = require('noddity-linkifier')

var butler = new Butler(noddityUrlString | noddityRetrieval, levelUpDb, [options])
var linkifier = new Linkifier('#/myposts/')

var options = {
	butler: butler,
	linkifier: linkifier,
	data: {
		config: {
			configProperty: 'configValue'
		},
		arbitraryValue: 'lol'
	}
}

render('template.md', 'excellent-missive.md', options, function(err, html) {
	console.log(html)
})

```

# render(template, post, options, cb)

- `template`: either a Noddity post object, or file name of a post, to be used as the template into which the current post will be injected.  Should have `{{>current}}` in it somewhere - this is where the current/main post will show up.
- `post`: either a Noddity post object, or the file name of a post to be loaded
- `options`: all the other arguments
	- `butler`: a [Noddity Butler](https://www.npmjs.com/package/noddity-butler)
	- `linkifier`: a [Noddity Linkifier](https://www.npmjs.com/package/noddity-linkifier)
	- `data`: Any properties on the `data` object will be made available to the templates.
	- `convertToHtml`: don't turn the markdown into html
- `cb`: a function to be called back in the error-first style with the html string

# Values accessible in Ractive expressions

- `postList`: an array of post objects that have dates, ordered by date descending.  Metadata is accessible on the object iself without having to use the `metadata` property
- `posts`: an object whose keys are the post file names, and whose value is the post object.  Right now the keys all have periods `.` stripped from them due to an issue with Ractive
- `removeDots`: a function that takes a string as input and returns a version with dots `.` removed
- `current`: the file name of the currently displayed post (the one specified in the url)

# License

[WTFPL](http://wtfpl2.com)

[![Build Status](https://travis-ci.org/TehShrike/noddity-render-static.svg)](https://travis-ci.org/TehShrike/noddity-render-static)
