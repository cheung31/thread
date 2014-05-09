'use strict';

var inherits = require('inherits');
var ListView = require('streamhub-sdk/views/list-view');
var View = require('streamhub-sdk/view');

var ContentRepliesView = function (opts) {
    opts = opts || {};

    if (! opts.content) {
        throw 'Expected opts.content when constructing ContentRepliesView';
    }

    View.call(this, opts);

    opts.autoRender = false;
    this._maxNestLevel = Math.max(0, opts.maxNestLevel);
    this._nestLevel = opts.nestLevel;
    this._maxVisibleItems = opts.maxVisibleItems;
    this._showVisibleItemsAtHead = opts.order.showVisibleItemsAtHead;

    this.content = opts.content;
    this._order = opts.order;
    this.comparator = opts.order.comparator;

    this._listView = new ListView({
        comparator: this.comparator,
        autoRender: true,
        showMoreButton: opts.showMoreButton,
        initial: opts.maxVisibleItems
    });

    if (this._showVisibleItemsAtHead === true) {
        this._showMoreHeader = false;
    } else {
        this._showMoreHeader = true;
    }

    this.content.on('reply', function (reply) {
        if (this._showMoreHeader) {
            this.push(reply);
        } else {
            this.unshift(reply, { stack: true });
        }

        this._listView.showMoreButton.setCount(this.content.replies.length - this._listView.views.length);
    }.bind(this));
};
inherits(ContentRepliesView, View);

ContentRepliesView.prototype.events = View.prototype.events.extended({
    'showMore.hub': function (e) {
        e.stopPropagation();
        this._listView.showMore();
    }
});

/**
 * Insert reply at back
 */
ContentRepliesView.prototype.push = function (content) {
    var replyView = this._createReplyView(content);
    this._listView.more.write(replyView);
};

/**
 * Insert reply at front
 */
ContentRepliesView.prototype.unshift =  function (content, opts) {
    opts = opts || {};

    var replyView = this._createReplyView(content);
    if (opts.stack) {
        this._listView.more.stack(replyView);
    } else {
        this._listView.more._stack.push(replyView);
    }
};

ContentRepliesView.prototype.addReply = function (content) {
    if (this._showMoreHeader) {
        this.unshift(content);
    } else {
        this.push(content);
    }
};

ContentRepliesView.prototype._addReplies = function (replies) {
    replies = replies || [];
    replies.sort(this.comparator);
    
    for (var i=0; i < replies.length; i++) {
        var reply = replies[i];
        this.addReply(reply);
    }
    this._listView.showMoreButton.setCount(this.content.replies.length - this._maxVisibleItems);
};

ContentRepliesView.prototype._createReplyView = function (content) {
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
    this._listView.setElement(this.$el);
    this._listView.render();

    if (this._showMoreHeader) {
        this.$el.find(this._listView.showMoreElSelector).insertBefore(this._listView.$listEl);
    }

    this._addReplies(this.content.replies);
};

module.exports = ContentRepliesView;
