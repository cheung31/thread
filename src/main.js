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

    this._maxNestLevel = opts.maxNestLevel || 4;
    this._nestLevel = opts.nestLevel || 0;
    if (this._maxNestLevel < 1) {
        this._isLeaf = true;
    }

    this.content = opts.content;
    this._contentViewFactory = opts.contentViewFactory || new ContentViewFactory();
    this._rootContentView = this._contentViewFactory.createContentView(opts.content);
    this._ancestorsView = new ContentAncestorsView({
        content: opts.content,
        comparator: opts.comparator
    });
    this._isRoot = opts.isRoot === false ? false : true;

    this._repliesView = new ContentRepliesView({
        content: opts.content,
        maxNestLevel: this._maxNestLevel-1,
        nestLevel: this._nestLevel+1,
        comparator: opts.comparator,
        maxVisibleItems: opts.maxVisibleItems,
        showMoreButton: new ShowMoreButton({
            content: opts.content
        })
    });

    View.call(this, opts);
};
inherits(ContentThreadView, View);

ContentThreadView.prototype.template = template;
ContentThreadView.prototype.elTag = 'section';
ContentThreadView.prototype.elClass = 'lf-thread';

ContentThreadView.prototype.CLASSES = {
    ancestorsView: 'lf-thread-ancestors',
    rootContentView: 'lf-thread-root-content',
    repliesView: 'lf-thread-replies',
    leafNode: 'lf-thread-leaf'
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
    this._ancestorsView.setElement(
        this.$el.find('.'+this.CLASSES.ancestorsView)
    );
    this._repliesView.setElement(
        this.$el.find('.'+this.CLASSES.repliesView)
    );

    this._rootContentView.render();
    this._repliesView.render();
    this._ancestorsView.render();

    if (this._isLeaf) {
        this._repliesView.$el.addClass(this.CLASSES.leafNode);
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
