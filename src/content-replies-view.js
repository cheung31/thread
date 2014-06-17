var inherits = require('inherits');
var ListView = require('streamhub-sdk/views/list-view');
var View = require('view');
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
    this._showVisibleItemsAtHead = !!opts.order.showVisibleItemsAtHead;
    this._showQueueHeader = this._showVisibleItemsAtHead;

    this.content = opts.content;
    this._contentViewFactory = opts.contentViewFactory;
    this._order = opts.order;
    this.comparator = opts.order.comparator;

    this._queueInitial = opts.queueInitial;
    this._listView = new ListView({
        comparator: this.comparator,
        autoRender: true,
        showMoreButton: opts.showMoreButton,
        showQueueButton: opts.showQueueButton,
        initial: this._maxVisibleItems,
        queueInitial: this._queueInitial
    });


    this.content.on('reply', function (reply) {
        this._onReply(reply);
    }.bind(this));
};
inherits(ContentRepliesView, View);

ContentRepliesView.prototype.elClass = 'lf-thread-replies';

ContentRepliesView.prototype.events = View.prototype.events.extended({
    'showMore.hub': function (e) {
        e.stopPropagation();
        if ($(e.target).hasClass(ListView.prototype.showMoreElClass)) {
            this._listView.showMoreButton.setCount(this.content.replies.length - this._listView.more.getSize());
        } else if ($(e.target).hasClass(ListView.prototype.showQueueElClass)) {
            this._listView.showQueueButton.setCount(this._listView.queue.getSize());
        }
    }
});

ContentRepliesView.prototype._onReply = function (reply) {
    var button,
        buttonStream,
        pushToButtonStream,
        replyView;
    if (this.comparator === ListView.prototype.comparators.CREATEDAT_ASCENDING) {
        button = this._listView.showMoreButton;
        buttonStream = this._listView.more;
        pushToButtonStream = this.pushMore;
    } else {
        button = this._listView.showQueueButton;
        buttonStream = this._listView.queue;
        pushToButtonStream = this.pushQueue;
    }

    replyView = this._createReplyView(reply);
    if (this._isContentByAuthor(reply)) {
        this._listView.add(replyView);
        return;
    }
    pushToButtonStream(replyView);
    button.setCount(buttonStream.getSize());
};

ContentRepliesView.prototype._isContentByAuthor = function (content) {
    return content.author.id === (Auth.get('livefyre') && Auth.get('livefyre').get('id')) && this._listView.queue.getSize() === 0;
};

/**
 * Insert reply at back of more stream
 */
ContentRepliesView.prototype.pushMore = function (replyView) {
    this._listView.more.write(replyView);
};

/**
 * Insert reply at back of queue stream
 */
ContentRepliesView.prototype.pushQueue = function (replyView) {
    this._listView.queue.write(replyView);
};

ContentRepliesView.prototype._addReplies = function (replies) {
    replies = replies || [];
    replies.sort(this.comparator);

    if (!this._showQueueHeader) {
        for (var i=replies.length-1; i > -1; i--) {
            var reply = replies[i];
            this.pushMore(this._createReplyView(reply));
        }
    } else {
        for (var i=0; i < replies.length; i++) {
            var reply = replies[i];
            this.pushMore(this._createReplyView(reply));
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
        contentViewFactory: this._contentViewFactory,
        queueInitial: this._queueInitial
    });
};

ContentRepliesView.prototype.render = function () {
    this._listView.setElement(this.$el);
    this._listView.render();

    this._addReplies(this.content.replies);
};

module.exports = ContentRepliesView;
