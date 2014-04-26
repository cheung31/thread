/**
 * @fileOverview Thread controller.
 */

var $ = require('jquery');
var debug = require('streamhub-sdk/debug');
var inherits = require('inherits');
var ScriptLoader = require('scriptloader');
var Storage = require('annotations/util/storage');
var ThreadEvents = require('annotations/events').thread;
var ThreadView = require('annotations/thread/ui/thread/view');
var viewEnum = require('annotations/enums').navigableViews;
var WriteEvents = require('annotations/events').write;

var log = debug('annotations');

/**
 * Thread controller.
 * @extends {BaseController}
 * @param {Object} opts Config options.
 */
function ThreadController(opts) {
    BaseController.call(this, opts);

    // Load the thread CSS.
    this._loadCSS();

    /**
     * The active view.
     * @type {?ThreadView|BaseMenu}
     * @private
     */
    this._activeView = null;

    /**
     * Container component. This will be a container or a popover depending on
     * whether the custom container option was specified.
     * @type {Container|ThreadPopover}
     * @private
     */
    this._container = this.createContainer(opts.config);

    /**
     * Scroll top position of the thread view. This gets updated when navigation
     * is triggered and the current active view is the ThreadView.
     * @type {number}
     * @private
     */
    this._scrollTop = 0;

    /**
     * Thread view component.
     * @type {?ThreadView}
     * @private
     */
    this._threadView = null;

    /**
     * History of views that the user has visited. Keeping track of this is
     * necessary so that we can go back in time when they click back.
     * @type {Array.<View>}
     * @private
     */
    this._viewHistory = [];

    // Attempt to process the permalink to a comment.
    this._handlePermalink();
}
inherits(ThreadController, BaseController);

/** @enum {string} */
ThreadController.prototype.events = (function() {
    var events = {};
    events[CommentEvents.ACTION_SUCCESS] = '_handleCommentActionSuccess';
    events[ThreadEvents.ACTIVATE_THREAD] = '_activateThread';
    events[ThreadEvents.CHANGE_VIEW] = '_handleViewChange';
    events[ThreadEvents.DESTROY_THREAD] = '_destroyThread';
    events[ThreadEvents.NAVIGATE] = '_handleNavigate';
    events[ThreadEvents.NAVIGATE_BACK] = '_handleNavigateBack';
    events[ThreadEvents.NAVIGATE_TO_THREAD] = '_handleNavigateToThread';
    events[ThreadEvents.PERMALINK_BACK] = '_handlePermalinkBack';
    events[WriteEvents.POST_APPROVE] = '_handleNavigateToThread';
    events[WriteEvents.POST_DELETE] = '_handleNavigateToThread';
    events[WriteEvents.POST_FLAG] = '_handleNavigateToThread';
    events[WriteEvents.POST_HIDE] = '_handleNavigateToThread';
    return events;
})();

/** @type {string} */
ThreadController.prototype.threadCSS = '/css/thread.css';

/** @enum {string} */
ThreadController.prototype.VIEW_MAP = (function() {
    var map = {};
    map[viewEnum.THREAD] = ThreadView;
    return map;
})();

/**
 * Activate a thread. This loads a modal for the thread to live in and adds it.
 * @param {Event} ev
 * @param {Object=} opts=
 * @private
 */
ThreadController.prototype._activateThread = function (ev, opts) {
    if (!this._getActiveBlock()) {
        return;
    }
    if (this._container.isShowing()) {
        return;
    }

    this._destroyThread();
    // Force safari to clear the current selection
    if (userAgentUtil.isMobile()) {
        rangeUtil.clearSelectionRanges();
    }
    this._container.onHide($.proxy(function() {
        this._initThread();
        this._loadThreadContent({
            forceEmpty: !!(opts || {}).forceWriteCard
        });
    }, this));
};

/**
 * Set the scroll position back to it's original form on the ThreadView.
 * @private
 */
ThreadController.prototype._applyScrollPosition = function () {
    this._activeView.getThreadContainer().$el.scrollTop(this._scrollTop);
    this._scrollTop = 0;
};

/**
 * Destroy the thread view and hide the popover.
 * @param {jQuery.Event} ev
 * @private
 */
ThreadController.prototype._destroyThread = function (ev) {
    var callback = $.proxy(function() {
        this._threadView && this._threadView.destroy();
        $.each(this._viewHistory, function(i, view) {
            view.destroy();
        });
        this._viewHistory = [];
    }, this);
    if (this._container.isVisible()) {
        this._container.hide(callback);
        return;
    }
    callback();
};

/**
 * Fetch thread data.
 * @private
 */
ThreadController.prototype._fetchThread = function () {
    var block = this._getActiveBlock();

    this._collection.fetchThread(block.id, $.proxy(this._handleThreadFetched, this, block));
};

/**
 * Handle the comment action success event. This should show a message to the
 * user in the current popover.
 * @param {Event} ev
 * @param {Object} data
 * @private
 */
ThreadController.prototype._handleCommentActionSuccess = function (ev, data) {
    var eventName = data.event.type + '.' + data.event.namespace;
    if (!VALID_NOTIFICATION_EVENTS[eventName] || !this._activeView) {
        return;
    }

    var notification = this.createNotification({event: eventName});
    notification.decorate(this._activeView.$el);
};

/**
 * Handle new comments
 * @param {Array.<Comment>} comments
 * @private
 */
ThreadController.prototype._handleCommentBatch = function (comments) {
    var streamView = this._threadView.getThreadContainer();
    var prepend;

    $.each(comments, function(i, comment) {
        comment.origin = comment.origin || Comment.ORIGIN.STREAM;
        // Comments should only be prepended if they're from the current user
        // and if they are top level comments.
        prepend = comment.isUserAuthor() && !comment.parentId;
        streamView.addComment(comment, prepend);
    });
};

/**
 * Handle the navigate event. This moves the user forward, adding the view to
 * the history array.
 * @param {jQuery.Event} ev The event that got us here.
 * @param {Object} opts The event data.
 * @private
 */
ThreadController.prototype._handleNavigate = function (ev, opts) {
    var ViewFn = this.VIEW_MAP[opts.value];
    if (!ViewFn) {
        return;
    }

    if (this._activeView) {
        if (this._activeView instanceof ThreadView) {
            // Save the scroll top position of the thread view to be used
            // when the thread view is navigated back to.
            this._scrollTop = this._activeView.getThreadContainer().$el.scrollTop();
        }
        this._activeView.detach();
        this._viewHistory.push(this._activeView);
    }

    opts.collection = this._collection;
    this._activeView = new ViewFn(opts);
    this._activeView.render();
    this._container.setContentNode(this._activeView.$el);
    this._initializeView(this._activeView);
};

/**
 * Handle the navigate back event. This should go to the previous view.
 * @private
 */
ThreadController.prototype._handleNavigateBack = function () {
    this._activeView.destroy();
    this._activeView = this._viewHistory.pop();
    this._activeView && this._container.setContentNode(this._activeView.$el);

    if (!(this._activeView instanceof ThreadView)) {
        return;
    }
    // Scroll back to the position that was saved earlier.
    this._applyScrollPosition();
};

/**
 * Handle the navigate to thread event. This will go back to the thread view
 * and clear out the history.
 * @private
 */
ThreadController.prototype._handleNavigateToThread = function () {
    $.each(this._viewHistory, $.proxy(function(i, view) {
        if (view instanceof this._threadView.constructor) {
            return;
        }
        view.destroy();
    }, this));
    this._activeView = this._threadView;
    this._container.setContentNode(this._activeView.$el);
    this._initializeView(this._activeView);
    this._viewHistory = [];

    // Only in desktop-land
    if (!(this._activeView instanceof ThreadView)) {
        return;
    }
    this._applyScrollPosition();
};

/**
 * Handle a potential permalink in the URL. If one doesn't exist, do nothing.
 * If it does, however, do some wicked shit.
 * @private
 */
ThreadController.prototype._handlePermalink = function () {
    var contentId = permalinkUtil.getPermalink(this._collection.id);
    if (!contentId) {
        return;
    }

    var self = this;
    this._collection.getThread({contentId: contentId}, function (err, blockId, comments) {
        var block = Storage.get(blockId);
        self._collection.block = block;
        self.$antenna.trigger(ThreadEvents.ACTIVATE_BLOCK, {block: block});

        permalinkUtil.scrollToPermalink(block.el, function () {
            self._activeView = self.createPermalinkThreadContainer();
            self._loadPopover(self._activeView);
            self._activeView.initialize(comments);
        });
    });
};

/**
 * Handle the permalink back event. This should show the thread view of the same
 * block that the permalink was in.
 * @private
 */
ThreadController.prototype._handlePermalinkBack = function () {
    this._activeView.destroy();
    this._initThread();
    this._loadThreadContent();
};

/**
 * Handle thread data
 * @param {Block} block
 * @param {?Error} err
 * @private
 */
ThreadController.prototype._handleThreadFetched = function (block, err) {
    if (this._getActiveBlock().getId() !== block.id) {
        // the user may have changed threads impatiently
        return;
    }
    if (err) {
        this._threadView.handleFetchThreadFailure(err);
        return;
    }
    // Reaching into storage to get all of the comments so that streamed
    // comments are included in case they are not in bootstrap yet.
    var comments = Storage.getCommentsForBlock(block.id);
    // Update the number of annotations on the block. This will update the
    // count on the thread button.
    this.$antenna.trigger(BlockEvents.UPDATE_COUNT, {
        blockId: block.id,
        count: Storage.getNumCommentsForBlock(block.id)
    });
    this._threadView.handleFetchThreadSuccess(comments);
};

/**
 * Handle the view change event. This should load a new view and handle the
 * this display of the view. This is the start point for the navigation history.
 * @param {jQuery.Event} ev The event that got us here.
 * @param {Object} data The event data.
 * @private
 */
ThreadController.prototype._handleViewChange = function (ev, opts) {
    this._viewHistory = [];
    this._handleNavigate(ev, opts);
};

/**
 * Initialize the view if it is supported.
 * @param {ThreadView|BaseMenu} view
 * @private
 */
ThreadController.prototype._initializeView = function (view) {
    (typeof view.initialize === 'function') && view.initialize();
};

/**
 * Initialize a new block. Remove the old one and add the new one to the
 * popover.
 * @private
 */
ThreadController.prototype._initThread = function () {
    this._threadView = this._activeView = this.createThreadView();
    this._loadPopover(this._threadView);
};

/**
 * Load the CSS.
 * @private
 */
ThreadController.prototype._loadCSS = function () {
    // TODO, run time deps for threadpopover + threadview
    ScriptLoader.loadCSS(this._config.assetServer + this.threadCSS);

    // IE8 gets special
    if (userAgentUtil.isIE() && userAgentUtil.getIEVersion() === 8) {
        ScriptLoader.loadCSS(this._config.assetServer + '/css/ie8.css');
    }
};

/**
 * Load a view into the popover. Render the view, add it's element to the
 * popover and show the popover.
 * @param {ThreadContainer} view
 * @private
 */
ThreadController.prototype._loadPopover = function (view) {
    this._container.show(this._getActiveBlock().el);
    view.render();
    this._container.setContentNode(view.$el);
};

/**
 * Get the content for a thread. This checks a few different places for the data
 * or fetches it if it doesn't exist in the app yet.
 * @param {Object=} opts
 * @param {boolean=} opts.forceEmpty
 * @private
 */
ThreadController.prototype._loadThreadContent = function (opts) {
    var block = this._getActiveBlock();

    if ((opts || {}).forceEmpty) {
        this._threadView.handleFetchThreadSuccess();
        return;
    }

    if (block.getFetchedState()) {
        var comments = Storage.getCommentsForBlock(block.id);
        this._threadView.handleFetchThreadSuccess(comments);
        return;
    }
    this._fetchThread();
};

/** @return {Container|ThreadPopover} */
ThreadController.prototype.createContainer = function (opts) {
    if (this._config.threadContainerEl) {
        opts.parentEl = this._config.threadContainerEl;
        return new Container(opts);
    }
    return new ThreadPopover(opts);
};

/** @return {NotificationView} */
ThreadController.prototype.createNotification = function (opts) {
    return new NotificationView(opts);
};

/** @return {ThreadContainer} */
ThreadController.prototype.createPermalinkThreadContainer = function () {
    return new PermalinkThreadContainer();
};

/** @return {ThreadView} */
ThreadController.prototype.createThreadView = function () {
    return new ThreadView({
        assetServer: this._config.assetServer,
        blockId: this._getActiveBlock().id,
        defaultAvatar: this._config.defaultAvatar,
        isCustomNetwork: this._collection.isCustomNetwork()
    });
};

/** @override */
ThreadController.prototype.destroy = function () {
    BaseController.prototype.destroy.call(this);
    this._destroyThread();
    this._container.destroy();
    this._collection = null;
    this._config = null;
};

/**
 * Handle new data from stream (or erefs)
 */
ThreadController.prototype.handleReadable = function () {
    var activeBlock = this._getActiveBlock();
    var block;
    var comment;
    var comments = [];

    // If there isn't an active block or a thread view, we shouldn't process
    // streamed content for this block. The thread view won't exist if the user
    // has not opened it yet or if there is a permalink open, in which case they
    // haven't opened it anyway. In the permalink case, there will be an active
    // block but the thread view won't exist yet.
    var shouldProcess = activeBlock && this._threadView;

    while (comment = this._collection.read()) {
        // We need to fetch the block model for the comment. Since replies don't
        // have blockId attributes, we will need to find it on the parent
        // comment in Storage. If this is a reply that doesn't have a parent in
        // Storage yet, the block can be null.
        block = Storage.get(comment.blockId);
        if (!block) {
            log('We can\'t seem to find the block for comment: ' + comment.id);
            continue;
        }

        // Update the number of annotations on the block. This will update the
        // count on the thread button.
        this.$antenna.trigger(BlockEvents.UPDATE_COUNT, {
            blockId: block.id,
            inc: comment.calculateCountIncrement()
        });

        if (!shouldProcess) {
            continue;
        }

        // Add comment to the batched comments list that we will deal with soon...
        if (block.id === activeBlock.id) {
            comments.push(comment);
        }
    }

    shouldProcess && this._handleCommentBatch(comments);
};

module.exports = ThreadController;
