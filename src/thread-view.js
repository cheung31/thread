'use strict';

var View = require('streamhub-sdk/view');
var inherits = require('inherits');
var ContentViewFactory = require('streamhub-sdk/content/content-view-factory');
var threadViewTemplate = require('hgn!thread/templates/thread-view');

var NEST_LEVEL_DATA_ATTR = 'data-thread-nest-level';
var CHILDREN_VISIBLE_ATTR = 'data-thread-children-visible';
var HAS_CHILDREN_ATTR = 'data-thread-has-children';

var ThreadView = function (opts) {
    opts = opts || {};
    View.apply(this, arguments);

    this.content = opts.content;
    this._contentViewFactory = new ContentViewFactory();
    this._nestLevel = opts.nestLevel || 0;
    this._maxNestLevel = opts.maxNestLevel || 0;
    //this._labels = opts.labels || {};
    this._rootContentView = opts.rootContentView || this._createContentView(opts);
    this._childrenViewVisible = false;
    this._childrenView = opts.childrenView;
    // ._replyView will be created when needed
    //this._replyViewVisible = false;
    //this._replyView = null;
    this._autoShowReplies = opts.autoShowReplies || true;
};
inherits(ThreadView, View);

ThreadView.prototype.template = threadViewTemplate;
ThreadView.prototype.elClass = 'hub-thread';
ThreadView.prototype._rootElSelector = '.hub-thread-root';
ThreadView.prototype._childrenElSelector = '.hub-thread-children';
ThreadView.prototype._replyElSelector = '.hub-thread-reply';

ThreadView.prototype.events = {
    'toggleReplies.hub': function (e) {
        this.toggleChildrenView();
        e.stopPropagation();
    }
};

ThreadView.prototype.render = function () {
    var self = this;
    View.prototype.render.apply(this, arguments);

    this.$el.attr(NEST_LEVEL_DATA_ATTR, this._nestLevel);

    var $rootEl = this.$(this._rootElSelector);
    var rootContentView = this._rootContentView;
    rootContentView.setElement($rootEl);
    rootContentView.render();
    // Toggle reply editor on click of reply button
    rootContentView.$el.on('clickReplyButton.hub', function (e) {
        self.toggleChildrenView(true);
        //self.toggleReplyEditor();
        e.stopPropagation();
    });
    if (this._autoShowReplies) {
        this.toggleChildrenView(true);
    }
};

/**
 * Create a View to display the root Content of the thread
 */
ThreadView.prototype._createContentView = function (opts) {
    opts = opts || {};
    var contentView;
    if (opts.content) {
        return this._contentViewFactory.createContentView(opts.content);
    }
    return this._contentViewFactory.createContentView(this.content);
};

/**
 * Create a View to display the list of children of the root Content
 */
ThreadView.prototype._createChildrenView = function (opts) {
    // There is a circular dep, so we have to manually get a handle here
    var ContentList = require('./content-list');
    var childrenList = new ContentList({
        maxNestLevel: this._maxNestLevel,
        nestLevel: this._nestLevel + 1,
        // Show two subthreads initially
        initial: 2,
        showMore: 10,
        comparator: ContentList.comparators.CREATEDAT_ASCENDING,
        labels: this._labels,
        tabId: this._tabId,
        listType: "thread",
        adiContext: this._adiContext
    });
    return childrenList;
};

/**
 * Render the children view, and attach relevant listeners
 */
ThreadView.prototype._renderChildrenView = function () {
    var $childrenEl = this.$(this._childrenElSelector);
    this._childrenView.setElement($childrenEl);
    this._childrenView.render();
};

ThreadView.prototype._setRepliesCollection = function (repliesCollection) {
    var self = this;
    this.toggleChildrenView(false);
    this._repliesCollection = repliesCollection;
};

ThreadView.prototype._populateChildrenView = function () {
    var self = this;
    // Be sure to add future replies
    this.content.on('reply', function (replyContent) {
        // Show replies
        self.toggleChildrenView(true);
        // Write directly into the listview so it always appears
        self._childrenView.write(replyContent);
    });
    // Set that there are visible replies the first time there is a reply
    // and the replyView exists and is visible
    this.content.once('reply', function () {
        self._setHasChildren(true);
    });
    if (this._repliesCollection) {
        this._repliesArchive = this._repliesCollection.createArchive({
            comparator: CollectionArchive.comparators.CREATED_AT_ASCENDING
        });
        this._repliesArchive.on('error', function () {
            log('Error in repliesArchive for threadView', self);
        });
        this._repliesArchive.pipe(this._childrenView.more, { end: false});

        this._repliesUpdater = this._repliesCollection.createUpdater();
        this._repliesUpdater.on('error', function () {
            log('Error in repliesUpdater for threadView', self);
        });
        this._repliesUpdater.on('data', function (content) {
            self.content.addReply(content);
        });
        return;
    }
    // We should show the real replies to this content item, not items
    // in a repliesCollection
    var knownReplies = this.content.replies;
    // Sort ascending by createdAt, so that the oldest things
    // come out of 'show more' first
    var oldestKnownReplies = knownReplies.sort(function (a, b) {
        return a.createdAt - b.createdAt;
    });
    if (oldestKnownReplies.length) {
        self._setHasChildren(true);
        // Add known replies
        oldestKnownReplies.forEach(function (replyContent) {
            // Write to 'more' to leverage show more button
            self._childrenView.more.write(replyContent);
        });
    }
};

/**
 * Add an attribute to .el indicating that this thread has children
 * @param hasChildren {boolean} Whether there are children
 */
ThreadView.prototype._setHasChildren = function (hasChildren) {
    if (hasChildren) {
        this.$el.attr(HAS_CHILDREN_ATTR, 'true');
    } else {
        this.$el.removeAttr(HAS_CHILDREN_ATTR);
    }
};

/**
 * Toggle a list of children content of the root content of the thread
 * The children view will be created the first time it's needed.
 * @param show {boolean} Whether to show or hide the children view
 */
ThreadView.prototype.toggleChildrenView = function (show) {
    // If show not passed, toggle
    if (arguments.length === 0) {
        show = ! this._childrenViewVisible;
    }
    if (show) {
        this._showChildrenView();
    } else {
        this._hideChildrenView();
    }
};

ThreadView.prototype._showChildrenView = function () {
    if ( ! this._childrenView) {
        this._childrenView = this._createChildrenView();
        this._renderChildrenView();
        this._populateChildrenView();
    }
    var toggleRepliesButton = this._rootContentView._toggleRepliesButton;
    var hideRepliesLabel = this._rootContentView._labels.hideReplies;
    this._childrenView.$el.show();
    this._childrenViewVisible = true;
    this.$el.attr(CHILDREN_VISIBLE_ATTR, 'true');
    if (toggleRepliesButton) {
        toggleRepliesButton.updateLabel(hideRepliesLabel);
    }
    this.emit('showChildrenView');
};

ThreadView.prototype._hideChildrenView = function () {
    if ( ! this._childrenView) {
        return;
    }
    var toggleRepliesButton = this._rootContentView._toggleRepliesButton;
    var showRepliesLabel = this._rootContentView._labels.showReplies;
    this._childrenView.$el.hide();
    this._childrenViewVisible = false;
    this.$el.removeAttr(CHILDREN_VISIBLE_ATTR);
    if (toggleRepliesButton) {
        toggleRepliesButton.updateLabel(showRepliesLabel);
    }
};

/**
 * Removes the content view element, and triggers 'removeContentView.hub'
 * event for the instance to be removed from its associated ListView.
 */
ThreadView.prototype.remove = function () {
    this.$el.trigger('removeContentView.hub', { contentView: this });
    this.$el.detach();
};

module.exports = ThreadView;
