'use strict';

var inherits = require('inherits');
var ContentListView = require('streamhub-sdk/content/views/content-list-view');

var ContentRepliesView = function (opts) {
    opts = opts || {};

    if (! opts.content) {
        throw 'Expected opts.content when constructing ContentRepliesView';
    }

    opts.autoRender = false;
    opts.maxVisibleItems = 2;
    ContentListView.call(this, opts);

    this.content = opts.content;
    this.comparator = opts.comparator || ContentRepliesView.comparators.CREATEDAT_ASCENDING;
    this._maxNestLevel = Math.max(0, opts.maxNestLevel);

    if (this.comparator === ContentRepliesView.comparators.CREATEDAT_DESCENDING) {
        this._showMoreHeader = true;
    } else {
        this._showMoreHeader = false;
    }

    this.content.on('reply', function (reply) {
        this.add(reply);
    }.bind(this));
};
inherits(ContentRepliesView, ContentListView);

ContentRepliesView.comparators = {
    CREATEDAT_DESCENDING: function (a, b) {
        var aDate = a.content.createdAt || a.createdAt,
            bDate = b.content.createdAt || b.createdAt;
        return aDate - bDate;
    },
    CREATEDAT_ASCENDING: function (a, b) {
        var aDate = a.content.createdAt || a.createdAt,
            bDate = b.content.createdAt || b.createdAt;
        return bDate - aDate;
    }
}

ContentRepliesView.prototype._addReplies = function (replies) {
    replies = replies || [];
    for (var i=0; i < replies.length; i++) {
        var reply = replies[i];
        this.add(reply);
    }
};

ContentRepliesView.prototype.createContentView = function (content) {
    var ContentThreadView = require('thread');
    return new ContentThreadView({
        content: content,
        maxNestLevel: this._maxNestLevel-1,
        showMoreHeader: this._showMoreHeader
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
