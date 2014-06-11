var inherits = require('inherits');
var ListView = require('streamhub-sdk/views/list-view');
var View = require('streamhub-sdk/view');
var Auth = require('auth');

'use strict';

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
    this._contentViewFactory = opts.contentViewFactory;
    this._order = opts.order;
    this.comparator = opts.order.comparator;

    this._listView = new ListView({
        comparator: this.comparator,
        autoRender: true,
        showMoreButton: opts.showMoreButton,
        showQueueButton: opts.showQueueButton,
        initial: this._maxVisibleItems
    });

    this._showVisibleItemsAtHead = !!this._showVisibleItemsAtHead;
    this._showQueueHeader = this._showVisibleItemsAtHead;

    this.content.on('reply', function (reply) {
        if (this.comparator === ContentRepliesView.comparators.CREATEDAT_ASCENDING) {
            if (reply.author.id === (Auth.get('livefyre') && Auth.get('livefyre').get('id')) && this._listView.more.getSize() === 0) {
                var replyView = this._createReplyView(reply);
                this._listView.add(replyView);
                return;
            }
            this.pushMore(reply);
            this._listView.showMoreButton.setCount(this._listView.more.getSize());
        } else {
            if (reply.author.id === (Auth.get('livefyre') && Auth.get('livefyre').get('id')) && this._listView.queue.getSize() === 0) {
                var replyView = this._createReplyView(reply);
                this._listView.add(replyView);
                return;
            }
            this.pushQueue(reply);
            this._listView.showQueueButton.setCount(this._listView.queue.getSize());
        }
    }.bind(this));
};
inherits(ContentRepliesView, View);

ContentRepliesView.prototype.events = View.prototype.events.extended({
    'showMore.hub': function (e) {
        e.stopPropagation();
        if ($(e.target).hasClass(ListView.prototype.showMoreElClass)) {
            this._listView.showMoreButton.setCount(this.content.replies.length - this._listView.more.getSize());
        } else if ($(e.target).hasClass(ListView.prototype.showQueueElClass)) {
            //this._listView.showQueueButton.setCount();
        }
    }
});

ContentRepliesView.comparators = {
    CREATEDAT_ASCENDING: function (a, b) {
        var aDate = (a.content && a.content.createdAt) || a.createdAt,
            bDate = (b.content && b.content.createdAt) || b.createdAt;
        return aDate - bDate;
    },
    CREATEDAT_DESCENDING: function (a, b) {
        var aDate = (a.content && a.content.createdAt) || a.createdAt,
            bDate = (b.content && b.content.createdAt) || b.createdAt;
        return bDate - aDate;
    }
};

/**
 * Insert reply at back of more stream
 */
ContentRepliesView.prototype.pushMore = function (content) {
    var replyView = this._createReplyView(content);
    this._listView.more.write(replyView);
};

/**
 * Insert reply at back of queue stream
 */
ContentRepliesView.prototype.pushQueue = function (content) {
    var replyView = this._createReplyView(content);
    this._listView.queue.write(replyView);
};

ContentRepliesView.prototype._addReplies = function (replies) {
    replies = replies || [];
    replies.sort(this.comparator);

    if (!this._showQueueHeader) {
        for (var i=replies.length-1; i > -1; i--) {
            var reply = replies[i];
            this.pushMore(reply);
        }
    } else {
        for (var i=0; i < replies.length; i++) {
            var reply = replies[i];
            this.pushMore(reply);
        }
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
        isRoot: false,
        contentViewFactory: this._contentViewFactory
    });
};

ContentRepliesView.prototype.render = function () {
    this._listView.setElement(this.$el);
    this._listView.render();

    if (!this._showQueueHeader) {
        this.$el.find(this._listView.showMoreElSelector).insertBefore(this._listView.$listEl);
        this.$el.find(this._listView.showQueueElSelector).insertAfter(this._listView.$listEl);
    }

    this._addReplies(this.content.replies);
};

module.exports = ContentRepliesView;
