thread
======

[![Build Status](https://travis-ci.org/cheung31/thread.png)](https://travis-ci.org/cheung31/thread)

A module to be used in conjunction with Streamhub SDK to display replies of a Content.

## Usage
Construct a ```ContentThreadView``` with the root Content item. The ```content``` options is required.

```
var ContentThreadView = require('thread');
var Content = require('streamhub-sdk/content');

// A content with a reply
var myContent = new Content({ body: 'Hello!' });
var reply = new Content({ body: 'Goodbye!' });
myContent.addReply(reply);

var threadView = new ContentThreadView({
  content: myContent
});
threadView.render();
```

### Options

#### ```maxNestLevel```
Specify the number of nested replies the thread view should support (Defaults to 4).

```
var threadView = new ContentThreadView({
  content: myContent,
  maxNestLevel: 1
});
```

#### ```comparator```
Specify a comparator function to control the sort order of replies (Defaults to ascending ```created_at```). ```ContentRepliesView``` has some pre-defined comparators:

* ```ContentRepliesView.comparators.CREATEDAT_ASCENDING``` - Ascending ```created_at```
* ```ContentRepliesView.comparators.CREATEDAT_DESCENDING``` - Descending ```created_at```

```
var ContentRepliesView = require('thread/content-replies-view');

var threadView = new ContentThreadView({
  content: myContent,
  comparator: ContentRepliesView.comparators.CREATEDAT_DESCENDING
});
```

#### ```contentViewFactory```
Specify a content view factory to render the replies in a customized view. (Defaults to the ```ContentViewFactory``` provided by Streamhub SDK).


## UML Diagram
![alt text](http://i.imgur.com/4CWOkqY.png)
