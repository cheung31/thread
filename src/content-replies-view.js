'use strict';

var inherits = require('inherits');
var ContentListView = require('streamhub-sdk/content/views/content-list-view');

var ContentRepliesView = function (opts) {
    opts = opts || {};

    if (! opts.content) {
        throw 'Expected opts.content when constructing ContentRepliesView';
    }

    opts.autoRender = false;
    opts.maxVisibleItems = opts.maxVisibleItems || 2;
    ContentListView.call(this, opts);

    this.content = opts.content;
    this._order = opts.order;
    this.comparator = opts.order.comparator;
    this._maxNestLevel = Math.max(0, opts.maxNestLevel);
    this._nestLevel = opts.nestLevel;
    this._showVisibleItemsAtHead = opts.order.showVisibleItemsAtHead;

    if (this._showVisibleItemsAtHead === true) {
        this._showMoreHeader = false;
    } else {
        this._showMoreHeader = true;
    }

    this.content.on('reply', function (reply) {
        this.add(reply, undefined, { tail: this._showMoreHeader });
        this.showMoreButton.setCount(this.content.replies.length - this._maxVisibleItems);
    }.bind(this));
};
inherits(ContentRepliesView, ContentListView);

ContentRepliesView.prototype.events = ContentListView.prototype.events.extended({
    'showMore.hub': function (e) {
        e.stopPropagation();
        this.showMore();
    }
});

ContentRepliesView.prototype._addReplies = function (replies) {
    replies = replies || [];
    for (var i=0; i < replies.length; i++) {
        var reply = replies[i];
        this.add(reply, undefined, { tail: this._showMoreHeader });
    }
    this.showMoreButton.setCount(this.content.replies.length - this._maxVisibleItems);
};

ContentRepliesView.prototype.createContentView = function (content) {
    var ContentThreadView = require('thread');

    return new ContentThreadView({
        content: content,
        maxNestLevel: this._maxNestLevel,
        nestLevel: this._nestLevel,
        order: this._order,
        isRoot: false
    });
};

ContentRepliesView.prototype.render = function () {
    ContentListView.prototype.render.call(this);

    if (this._showMoreHeader) {
        this.$el.find(this.showMoreElSelector).insertBefore(this.$listEl);
    }

    this._addReplies(this.content.replies);
};

module.exports = ContentRepliesView;
