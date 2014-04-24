'use strict';

var ThreadView = require('thread');
var ContentViewFactory = require('streamhub-sdk/content/content-view-factory');

var ThreadViewFactory = function (opts) {
    opts = opts || {};
    this._maxNestLevel = opts.maxNestLevel || 4;
    this._nestLevel = opts.nestLevel || 0;
    this._initialReplyVisibility = 'initialReplyVisibility' in opts ? opts.initialReplyVisibility : true;
    this._contentViewFactory = opts.contentViewFactory || new ContentViewFactory();

    this._rootView;
    this._childrenView;
};

/**
 * Creates an instance of ThreadView
 * @returns {ThreadView}
 */
ThreadViewFactory.prototype.createThreadView = function (content, opts) {
    opts = opts || {};

    var nestLevel = opts.nestLevel || this._nestLevel;
    var rootView = new ThreadView({
        rootContentView: this._contentViewFactory.createContentView(content)
    });
    var childrenView;

    for (var i=0; i < content.replies.length; i++) {
        var reply = content.replies[i];
        if (nestLevel+1 === this._maxNestLevel) {
            childrenView = new ThreadView({
                rootContentView: this._contentViewFactory.createContentView(reply)
            });
        } else {
            childrenView = this.createThreadView(reply, {
                nestLevel: nestLevel+1
            });
        }
    }

    content.on('reply', function (content) {
        childrenView.add(this._contentViewFactory.createContentView(content));
    }.bind(this));

    return new ThreadView({
        rootContentView: rootView,
        childrenView: childrenView,
        autoShowReplies: this._initialReplyVisibility
    });
};

module.exports = ThreadViewFactory;
