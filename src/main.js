'use strict';

var inherits = require('inherits');

var View = require('streamhub-sdk/view');
var ContentViewFactory = require('streamhub-sdk/content/content-view-factory');
var ContentAncestorsView = require('thread/content-ancestors-view');
var ContentRepliesView = require('thread/content-replies-view');
var ShowMoreButton = require('thread/show-more-button');
var template = require('hgn!thread/templates/content-thread-view');

var ContentThreadView = function (opts) {
    opts = opts || {};

    if (! opts.content) {
        throw 'No content specified for ContentThreadView';
    }

    this._themeClass = opts.themeClass || 'lf-thread-default';
    this.elClass += ' '+this._themeClass;

    this.content = opts.content;

    this._maxNestLevel = opts.maxNestLevel || 4;
    this._nestLevel = opts.nestLevel || 0;
    if (!this.content.parentId) {
        this._isRoot = true;
    }
    if (this.content.body === '<p>asdf</p>') {
        debugger;
    }
    if (this._maxNestLevel === this._nestLevel) {
        this._isLeaf = true;
    }
    if ((this._isRoot && this.content.replies.length === 0)) {
        this._isLeaf = true;
    }
    this._maxVisibleItems = opts.maxVisibleItems || 2;

    this._rootContentViewFactory = opts.rootContentViewFactory || new ContentViewFactory();
    this._rootContentView = this._rootContentViewFactory.createContentView(opts.content, opts);

    this._ancestorsView = new ContentAncestorsView({
        content: opts.content,
        comparator: opts.comparator
    });

    this._repliesView = new ContentRepliesView({
        content: opts.content,
        maxNestLevel: this._maxNestLevel,
        nestLevel: this._nestLevel+1,
        maxVisibleItems: this._maxVisibleItems,
        order: opts.order || this.order.NEWEST_HEAD,
        showMoreButton: new ShowMoreButton({
            content: opts.content
        }),
        contentViewFactory: opts.replyContentViewFactory || new ContentViewFactory()
    });

    View.call(this, opts);
};
inherits(ContentThreadView, View);

ContentThreadView.prototype.template = template;
ContentThreadView.prototype.elTag = 'section';
ContentThreadView.prototype.elClass = 'lf-thread';

ContentThreadView.comparators = {
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
}

ContentThreadView.prototype.order = {
    NEWEST_HEAD: {
        comparator: ContentThreadView.comparators.CREATEDAT_DESCENDING,
        showVisibleItemsAtHead: true,
    },
    NEWEST_TAIL: {
        comparator: ContentThreadView.comparators.CREATEDAT_DESCENDING,
        showVisibleItemsAtHead: false
    },
    OLDEST_HEAD: {
        comparator: ContentThreadView.comparators.CREATEDAT_ASCENDING,
        showVisibleItemsAtHead: true
    },
    OLDEST_TAIL: {
        comparator: ContentThreadView.comparators.CREATEDAT_ASCENDING,
        showVisibleItemsAtHead: false
    }
}

ContentThreadView.prototype.CLASSES = {
    ancestorsView: 'lf-thread-ancestors',
    rootContentView: 'lf-thread-root-content',
    repliesView: 'lf-thread-replies',
    leafNode: 'lf-thread-leaf',
    rootNode: 'lf-thread-root'
};

ContentThreadView.prototype.DATA_ATTRS = {
    nestLevel: 'data-thread-nest-level'
};

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

ContentThreadView.prototype.render = function () {
    View.prototype.render.apply(this, arguments);

    this._rootContentView.setElement(
        this.$el.find('.'+this.CLASSES.rootContentView)
    );
    this._rootContentView.render();

    this._ancestorsView.setElement(
        this.$el.find('.'+this.CLASSES.ancestorsView)
    );
    this._ancestorsView.render();

    this._repliesView.setElement(
        this.$el.find('.'+this.CLASSES.repliesView)
    );
    this._repliesView.render();

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
