'use strict';

var inherits = require('inherits');

var View = require('streamhub-sdk/view');
var ContentViewFactory = require('streamhub-sdk/content/content-view-factory');
var ContentAncestorsView = require('thread/content-ancestors-view');
var ContentRepliesView = require('thread/content-replies-view');
var template = require('hgn!thread/templates/content-thread-view');

var ContentThreadView = function (opts) {
    opts = opts || {};

    if (! opts.content) {
        throw 'No content specified for ContentThreadView';
    }

    this._maxNestLevel = opts.maxNestLevel || 1;

    this.content = opts.content;
    this._contentViewFactory = opts.contentViewFactory || new ContentViewFactory();
    this._rootContentView = this._contentViewFactory.createContentView(opts.content);
    this._ancestorsView = new ContentAncestorsView({
        content: opts.content,
        comparator: opts.comparator
    });
    this._repliesView = new ContentRepliesView({
        content: opts.content,
        maxNestLevel: this._maxNestLevel-1,
        comparator: opts.comparator
    });

    View.call(this, opts);
};
inherits(ContentThreadView, View);

ContentThreadView.prototype.template = template;
ContentThreadView.prototype.elTag = 'section';



ContentThreadView.CLASSES = {
    ancestorsView: 'lf-thread-ancestors',
    rootContentView: 'lf-thread-root-content',
    repliesView: 'lf-thread-replies'
}

ContentThreadView.prototype.render = function () {
    View.prototype.render.apply(this, arguments);

    this._rootContentView.setElement(
        this.$el.find('.'+ContentThreadView.CLASSES.rootContentView)
    );
    this._ancestorsView.setElement(
        this.$el.find('.'+ContentThreadView.CLASSES.ancestorsView)
    );
    this._repliesView.setElement(
        this.$el.find('.'+ContentThreadView.CLASSES.repliesView)
    );

    this._rootContentView.render();
    this._repliesView.render();
    this._ancestorsView.render();
};

/**
 * Removes the content view element, and triggers 'removeContentView.hub'
 * event for the instance to be removed from its associated ListView.
 */
ContentThreadView.prototype.remove = function() {
    /**
     * removeContentView.hub
     * @event ContentView#removeContentView.hub
     * @type {{contentView: ContentView}}
     */
    this.$el.trigger('removeContentView.hub', { contentView: this });
    this.$el.detach();
};

module.exports = ContentThreadView;
