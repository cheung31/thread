'use strict';

var View = require('streamhub-sdk/view');
var ContentListView = require('streamhub-sdk/content/views/content-list-view');
var inherits = require('inherits');
var threadViewTemplate = require('hgn!thread/templates/thread-view');

var ThreadView = function (opts) {
    opts = opts || {};

    this._rootView = new ContentListView();
    this._childrenView = new ContentListView();

    this._rootContentView = opts.rootContentView;
    if (opts.rootContentView) {
        this.addRootContentView(opts.rootContentView);
    }
    if (opts.childrenViews) {
        for (var i=0; i < opts.childrenViews.length; i++) {
            this.addChildContentView(opts.childrenViews[i]);
        }
    }

    View.apply(this, arguments);
};
inherits(ThreadView, View);

ThreadView.prototype.elClass += ' hub-thread';
ThreadView.prototype.template = threadViewTemplate;

ThreadView.prototype._headerElSelector = '.hub-thread-header';
ThreadView.prototype._rootElSelector = '.hub-thread-root';
ThreadView.prototype._childrenElSelector = '.hub-thread-children';
ThreadView.prototype._replyElSelector = '.hub-thread-reply';

ThreadView.prototype.events = ThreadView.prototype.events.extended({
    'showMore.hub': '_handleShowMore'
});

ThreadView.prototype.setElement = function (el) {
    View.prototype.setElement.apply(this, arguments);
    this._rootView.setElement(this.$el.find(this._rootElSelector));
    this._childrenView.setElement(this.$el.find(this._childrenElSelector));
};

ThreadView.prototype.addRootContentView = function (contentView) {
    this._rootView.add(contentView);
};

ThreadView.prototype.addChildContentView = function (contentView) {
    this._childrenView.add(contentView);
};

ThreadView.prototype.render = function () {
    View.prototype.render.apply(this, arguments);

    this._rootView.render();
    if (this._childrenView) {
        this._childrenView.render();
    }
};

ThreadView.prototype._handleShowMore = function (e) {
    ListView.prototype.events['showMore.hub'].call(this, e);
};

/**
 * Return a number indicating the number of descendants there are to the
 * root content of this threadView.
 * This only takes into account content items that have been loaded on the page
 * @return {number}
 */
ThreadView.prototype._getDescendantCount = function () {
    var content = this._rootContentView.content;
    return getDescendantCount(content);
};

function getDescendantCount(content) {
    if ( ! (content.replies && content.replies.length)) {
        return 0;
    }
    var replies = content.replies;
    return replies.length + replies.map(getDescendantCount).reduce(function (a,b) {
        return a+b;
    });
}

module.exports = ThreadView;
