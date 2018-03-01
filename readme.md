
Render static HTML from a Noddity post.

# Usage

```js
const render = require('noddity-render-static')
const Butler = require('noddity-butler')
const Linkifier = require('noddity-linkifier')

const butler = new Butler(noddityUrlString | noddityRetrieval, levelUpDb, [options])
const linkifier = new Linkifier('#/myposts/')

const options = {
	butler: butler,
	linkifier: linkifier,
	data: {
		config: {
			configProperty: 'configValue'
		},
		arbitraryValue: 'lol'
	}
}

const html = await render('template.md', 'excellent-missive.md', options)

console.log(html)

```

# htmlPromise = render(template, post, options)

- `template`: either a Noddity post object, or file name of a post, to be used as the template into which the current post will be injected.  Should have `{{>current}}` in it somewhere - this is where the current/main post will show up.
- `post`: either a Noddity post object, or the file name of a post to be loaded
- `options`: all the other arguments
	- `butler`: a [Noddity Butler](https://www.npmjs.com/package/noddity-butler)
	- `linkifier`: a [Noddity Linkifier](https://www.npmjs.com/package/noddity-linkifier)
	- `data`: Any properties on the `data` object will be made available to the templates.
	- `convertToHtml`: don't turn the markdown into html

# Values accessible in Ractive expressions

- `postList`: an array of post objects that have dates, ordered by date descending.  Metadata is accessible on the object iself without having to use the `metadata` property
- `posts`: an object whose keys are the post file names, and whose value is the post object.  Right now the keys all have periods `.` stripped from them due to an issue with Ractive
- `removeDots`: a function that takes a string as input and returns a version with dots `.` removed
- `current`: the file name of the currently displayed post (the one specified in the url)

# License

[WTFPL](http://wtfpl2.com)
