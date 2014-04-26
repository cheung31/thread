/**
 * @fileOverview The stream view class. This is what all of the comments on the
 * page live within.
 */

var $ = require('jquery');
var BaseThreadContainer = require('thread/ui/basethreadcontainer');
var debug = require('streamhub-sdk/debug');
var inherits = require('inherits');
var SortingUtil = require('annotations/util/sorting');
var template = require('hgn!templates/thread/threadcontainer');
var ThreadEvents = require('annotations/events').thread;
var TopCommentView = require('thread/ui/comment/topview');
var ContentViewFactory = require('streamhub-sdk/content/content-view-factory');

var log = debug('annotations/thread/ui/threadcontainer');

/**
 * Stream view.
 * @constructor
 * @extends {BaseThreadContainer}
 * @param {Object} opts Config options.
 */
var ThreadContainer = function(opts) {
    opts = opts || {};
    opts.commentConstructor = TopCommentView;

    BaseThreadContainer.call(this, opts);
};
inherits(ThreadContainer, BaseThreadContainer);

/** @enum {string} */
ThreadContainer.CLASSES = {
    BASE: 'lf-thread-container',
    GRADIENT: 'lf-thread-gradient'
};

/** @override */
ThreadContainer.prototype.elClass = ThreadContainer.CLASSES.BASE;

/** @override */
ThreadContainer.prototype.elTag = 'section';

/** @override */
ThreadContainer.prototype.events = {
    'mouseenter': '_handleMouseEnter',
    'mouseleave': '_handleMouseLeave'
};

/**
 * Get the thread container component that lives within a comment.
 * @param {string} commentId The ID of the comment to get the container for.
 * @return {?ThreadContainer}
 * @private
 */
ThreadContainer.prototype._getParentThreadContainer = function(commentId) {
    var comment = this._comments[commentId];
    if (!comment) {
        return null;
    }
    return comment.getThreadContainer();
};

/**
 * Handle a hover (possibly unhighlight selected text).
 * @private
 */
ThreadContainer.prototype._handleMouseEnter = function () {
    this.$el.trigger(ThreadEvents.DEACTIVATE_HIGHLIGHTED_TEXT);
};

/**
 * Handle a hover (possibly highlight selected text).
 * @private
 */
ThreadContainer.prototype._handleMouseLeave = function () {
    this.$el.trigger(ThreadEvents.ACTIVATE_HIGHLIGHTED_TEXT);
};

/** @type {function()} */
ThreadContainer.prototype.comparator = SortingUtil.helpfulnessComparator;

/**
 * Initialize the thread container with a set of comments. These should all be
 * rendered prior to adding to the DOM so there is only 1 DOM write.
 * @param {Array.<Comment>} comments The set of comments to load.
 */
ThreadContainer.prototype.initialize = function(comments) {
    var el = $(template());
    var commentMap = {};
    var parent, parentId;

    $.each(comments, function(i, comment) {
        parentId = comment.parentId || 'root';
        if (!commentMap[parentId]) {
            commentMap[parentId] = [];
        }
        commentMap[parentId].push(comment);
    });

    BaseThreadContainer.prototype.initialize.call(this, commentMap['root'], el);

    delete commentMap['root'];

    for (parentId in commentMap) {  // jshint ignore:line
        if (commentMap.hasOwnProperty(parentId)) {
            parent = this._getParentThreadContainer(parentId);
            parent && parent.initialize(commentMap[parentId]);
        }
    }
};

/** @override */
ThreadContainer.prototype.processComment = function(prepend, el, i, comment) {
    if (!comment.parentId) {
        BaseThreadContainer.prototype.processComment.call(this, prepend, el, i, comment);
        return;
    }

    var threadContainer = this._getParentThreadContainer(comment.parentId);
    if (!threadContainer) {
        log('no parent');
        return;
    }
    threadContainer.addComment(comment, false);
};

module.exports = ThreadContainer;
