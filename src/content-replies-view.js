var $ = require('streamhub-sdk/jquery');
var inherits = require('inherits');
var ListView = require('streamhub-sdk/views/list-view');
var ContentViewFactory = require('streamhub-sdk/content/content-view-factory');
var ShowMoreButton = require('thread/show-more-button');
var View = require('view');
var Auth = require('auth');
var hasQueue = require('streamhub-sdk/views/mixins/queue-mixin');

'use strict';

/**
 * A view that displays a content item's replies
 * @param [opts] {Object}
 * @param [opts.content] {Content} The content item to be displayed
 * @param [opts.contentViewFactory] {ContentViewFactory} A factory to create
 *        ContentViews for the root and reply content
 * @param [opts.queueInitial] {number} The number of items to display before
 *        being held by queue.
 */
var ContentRepliesView = function (opts) {
    opts = opts || {};

    if (! opts.content) {
        throw 'Expected opts.content when constructing ContentRepliesView';
    }

    View.call(this, opts);

    opts.autoRender = false;
    this.createReplyView = opts.createReplyView;

    this.content = opts.content;
    this._contentViewFactory = opts.contentViewFactory || new ContentViewFactory();
    this._maxNestLevel = opts.maxNestLevel;
    this._nestLevel = opts.nestLevel;

    this._maxVisibleItems = opts.maxVisibleItems;
    this._order = opts.order || ContentRepliesView.ORDERS.CREATEDAT_DESCENDING;
    this.comparator = this._order.comparator;
    this._showQueueHeader = !!this._order.showVisibleItemsAtHead;
    this._queueInitial = opts.queueInitial;

    var listOpts = {
        comparator: this.comparator,
        autoRender: false,
        showMoreButton: opts.showMoreButton || new ShowMoreButton({
            content: opts.content
        }),
        showQueueButton: opts.showQueueButton || new ShowMoreButton({
            content: opts.content
        }),
        initial: this._maxVisibleItems,
        queueInitial: this._queueInitial
    };
    this._listView = new ListView(listOpts);
    hasQueue(this._listView, listOpts);
    this._listView.render();

    this.content.on('reply', function(reply) { this._onReply(reply); }.bind(this));
};
inherits(ContentRepliesView, View);

ContentRepliesView.prototype.elClass = 'lf-thread-replies';


/**
 * Sort orders of content
 * @enum {Object}
 */
ContentRepliesView.ORDERS = {
    CREATEDAT_DESCENDING: {
        comparator: ListView.prototype.comparators.CREATEDAT_DESCENDING,
        showVisibleItemsAtHead: true
    },
    CREATEDAT_ASCENDING: {
        comparator: ListView.prototype.comparators.CREATEDAT_ASCENDING,
        showVisibleItemsAtHead: true
    }
};

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

/**
 * Handler of the 'reply' event emitted by a Content instance
 * @param reply {Content} The content item representing the reply being added
 */
ContentRepliesView.prototype._onReply = function (reply) {
    var button,
        buttonStream,
        pushToButtonStream,
        replyView;
    if (this._isReplyAdded(reply)) {
        // Set the optimistically posted content id to 
        // the content id that streamed in
        this._contentPosted.id = reply.id;
        return;
    }
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
    pushToButtonStream.call(this, replyView);
    button.setCount(buttonStream.getSize());
};

ContentRepliesView.prototype._isReplyAdded = function (reply) {
    if (reply.id && this._contentPosted && this._contentPosted.author.id === reply.author.id) {
        return true;
    }
    return false;
};

ContentRepliesView.prototype.setContentPosted = function (reply) {
    this._contentPosted = reply;
};

/**
 * Checks whether a Content's author is the same as the user currently
 * authenticated
 * @param content {Content} The content instance to check the author against the
 *      authenticated user
 * @return {boolean} Whether the content's author is the same as the
 *      authenticated user
 */
ContentRepliesView.prototype._isContentByAuthor = function (content) {
    return content.author && content.author.id === (Auth.get('livefyre') && Auth.get('livefyre').get('id'));
};

/**
 * Insert reply view at back of more stream
 * @param replyView {ContentView} The reply view to be held in more stream
 */
ContentRepliesView.prototype.pushMore = function (replyView) {
    this._listView.more.write(replyView);
};

/**
 * Insert reply view at back of queue stream
 * @param replyView {ContentView} The reply view to be held in the queue stream
 */
ContentRepliesView.prototype.pushQueue = function (replyView) {
    this._listView.queue.write(replyView);
};

/**
 * Insert a set of replies
 * @param replies {Array.<Content>} The set of replies to add to the view
 */
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

ContentRepliesView.prototype._createReplyView = function (reply) {
    var opts = {
        content: reply,
        replyContentViewFactory: this._contentViewFactory,
        maxNestLevel: this._maxNestLevel,
        nestLevel: this._nestLevel,
        order: this._order,
        isRoot: false,
        maxVisibleItems: this._maxVisibleItems,
        queueInitial: this._queueInitial
    };
    return this.createReplyView(opts);
};

ContentRepliesView.prototype.getReplyView = function (reply) {
    for (var i=0; i < this._listView.views.length; i++) {
        var replyView = this._listView.views[i];
        if (replyView.content === reply) {
            return replyView;
        }
    }
};

ContentRepliesView.prototype.render = function () {
    this._listView.setElement(this.$el);
    this._listView.render();
    this._addReplies(this.content.replies);
};

module.exports = ContentRepliesView;
