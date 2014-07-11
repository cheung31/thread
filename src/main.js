var inherits = require('inherits');

var ListView = require('streamhub-sdk/views/list-view');
var CompositeView = require('view/composite-view');
var ContentViewFactory = require('streamhub-sdk/content/content-view-factory');
var ContentRepliesView = require('thread/content-replies-view');
var threadStyles = require('less!thread/css/thread.less');

'use strict';

/**
 * A view that displays a content item and its replies
 * @param [opts] {Object}
 * @param [opts.content] {Content} The content item to be displayed
 * @param [opts.themeClass] {string} A class name to be added to the view for theming purposes
 * @param [opts.maxNestLevel] {number} The maximum level of nesting for replies
 * @param [opts.nestLevel] {number} The current nest level
 * @param [opts.maxVisibleItems] {number}
 * @param [opts.order] {Object}
 * @param [opts.rootContentView] {ContentView} The content view to use as the
 *        root of the thread
 * @param [opts.contentViewFactory] {ContentViewFactory} A factory to create
 *        ContentViews for the root content
 */
var ContentThreadView = function (opts) {
    opts = opts || {};

    if (! opts.content) {
        throw 'No content specified for ContentThreadView';
    }
    this.content = opts.content;

    this._themeClass = opts.themeClass || 'lf-thread-default';
    this.elClass += ' '+this._themeClass;

    this._maxNestLevel = opts.maxNestLevel || 4;
    this._nestLevel = opts.nestLevel || 0;
    this._isRoot = false;
    this._isLeaf = false;

    if (!this.content.parentId) {
        this._isRoot = true;
    }
    if (this._maxNestLevel === this._nestLevel || (this._isRoot && this.content.replies.length === 0)) {
        this._isLeaf = true;
    }
    this._maxVisibleItems = opts.maxVisibleItems || 2;

    this._contentViewFactory = opts.contentViewFactory || new ContentViewFactory();
    this._rootContentView = opts.rootContentView || this._contentViewFactory.createContentView(opts.content, opts);
    this._rootContentView.$el.addClass('lf-thread-root-content');

    this._repliesView = new ContentRepliesView({
        content: opts.content,
        contentViewFactory: this._contentViewFactory,
        order: opts.order || ContentRepliesView.ORDERS.CREATEDAT_DESCENDING,
        maxVisibleItems: this._isRoot ? this._maxVisibleItems : Infinity,
        maxNestLevel: this._maxNestLevel,
        nestLevel: this._nestLevel+1,
        queueInitial: opts.queueInitial,
        isRoot: false,
        createReplyView: opts.createReplyView ? opts.createReplyView.bind(this) : function (opts) {
            opts.contentViewFactory = this._contentViewFactory;
            return new ContentThreadView(opts);
        }.bind(this)
    });

    this.content.on('reply', function (reply) {
        // A content is no longer a leaf when replied to
        this.$el.removeClass(this.CLASSES.leafNode);
    }.bind(this));

    CompositeView.call(this,
        this._rootContentView,
        this._repliesView,
        opts);
};
inherits(ContentThreadView, CompositeView);

ContentThreadView.prototype.elTag = 'section';
ContentThreadView.prototype.elClass = 'lf-thread';

/**
 * Sort orders of content
 * @enum {Object}
 */
ContentThreadView.ORDERS = {
    CREATEDAT_DESCENDING: {
        comparator: ListView.prototype.comparators.CREATEDAT_DESCENDING,
        showVisibleItemsAtHead: true
    },
    CREATEDAT_ASCENDING: {
        comparator: ListView.prototype.comparators.CREATEDAT_ASCENDING,
        showVisibleItemsAtHead: true
    }
};

/**
 * Classnames used in thread view DOM
 * @enum {string}
 */
ContentThreadView.prototype.CLASSES = {
    leafNode: 'lf-thread-leaf',
    rootNode: 'lf-thread-root'
};

/**
 * Data attributes used in thread view DOM
 * @enum {string}
 */
ContentThreadView.prototype.DATA_ATTRS = {
    nestLevel: 'data-thread-nest-level'
};

ContentThreadView.prototype.events = CompositeView.prototype.events.extended({
    'writeContent.hub': function (e, content) {
        e.stopPropagation();
        this.content.addReply(content);
        this._setContentPosted(content);
    },
    'writeFailure.hub': function (e, data) {
        e.stopPropagation();
        var postedReplyView = this._repliesView.getReplyView(this._contentPosted);
        var actions = {
            retry: data.retry,
            edit: function () {
                this._rootContentView.toggleReplies(true);
                this._rootContentView.setEditorValue(this._contentPosted.body);
                postedReplyView.destroy();
            }.bind(this)
        };
        postedReplyView.displayError(data.error, actions);
    }
});

/**
 * Return a number indicating the number of descendants there are to the
 * root content of this threadView.
 * This only takes into account content items that have been loaded on the page
 * @return {number}
 */
ContentThreadView.prototype._getDescendantCount = function () {
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

ContentThreadView.prototype.displayError = function (err, actions) {
    this._rootContentView.displayError(err, actions);
};

ContentThreadView.prototype._setContentPosted = function (reply, retry) {
    this._contentPosted = reply;
    this._repliesView.setContentPosted(reply);
};

ContentThreadView.prototype.render = function () {
    CompositeView.prototype.render.apply(this, arguments);

    if (this._isLeaf) {
        this.$el.addClass(this.CLASSES.leafNode);
    }

    if (this._isRoot) {
        this.$el.addClass(this.CLASSES.rootNode);
    }

    this.$el.attr(this.DATA_ATTRS.nestLevel, this._nestLevel);
};

/**
 * Removes the content view element, and triggers 'removeContentView.hub'
 * event for the instance to be removed from its associated ListView.
 */
ContentThreadView.prototype.remove = function () {
    /**
     * removeContentView.hub
     * @event ContentView#removeContentView.hub
     * @type {{contentView: ContentView}}
     */
    this.$el.trigger('removeContentView.hub', { contentView: this });
    this.$el.detach();
};

module.exports = ContentThreadView;
