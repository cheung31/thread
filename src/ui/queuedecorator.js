/**
 * @fileOverview Decorates a BaseThreadContaienr instance with new functions
 * and function overrides to support queue comment functionality.
 */

var $ = require('jquery');
var Comment = require('annotations/models/comment');
var QueueButton = require('annotations/thread/ui/queuebutton');
var textEnumeration = require('annotations/i18n/enumeration');
var ThreadEvents = require('annotations/events').thread;

/** @type {Object} */
var QueueDecorator = {};

/** @enum {string} */
var CLASSES = {
    GRADIENT: 'lf-thread-gradient'
};

/**
 * Decorate a BaseThreadContainer class with queue comment functionality.
 * @param {BaseThreadContainer} threadContainer
 */
QueueDecorator.decorate = function(threadContainer) {
    var KEYS = textEnumeration.KEYS;
    var queueBtn = new QueueButton({
        plural: textEnumeration.get(KEYS.QUEUED_COMMENTS_PLURAL),
        singular: textEnumeration.get(KEYS.QUEUED_COMMENTS_SINGULAR)
    });
    queueBtn.render();

    threadContainer._queueBtn = queueBtn;
    threadContainer._queuedComments = [];
    decorateDestroy(threadContainer);
    decorateProcessComment(threadContainer);
    threadContainer.queueComment = queueComment;
    threadContainer.showQueuedComments = showQueuedComments;

    threadContainer._queueBtn.$el.on(ThreadEvents.SHOW_QUEUED_CONTENT,
        $.proxy(threadContainer.showQueuedComments, threadContainer));
};

/**
 * Decorate the destroy function. This should unlisten to the show queue content
 * function in addition to it's normal duties.
 * @param {BaseThreadContainer} threadContainer
 */
function decorateDestroy(threadContainer) {
    var existing = threadContainer.destroy;
    threadContainer.destroy = function() {
        existing.call(this);
        this._queueBtn.$el.off(ThreadEvents.SHOW_QUEUED_CONTENT,
            $.proxy(this.showQueuedComments, this));
    };
}

/**
 * Decorate the processComment function. This should determine whether or not
 * a comment should be processed or not depending on the origin.
 * @param {BaseThreadContainer} threadContainer
 */
function decorateProcessComment(threadContainer) {
    var existing = threadContainer.processComment;
    threadContainer.processComment = function(prepend, el, i, comment, opt_force) {
        var haveSeen = comment.hasBeenRendered;
        var isAuthor = comment.isUserAuthor();
        var isReply = !!comment.parentId;
        var isStream = comment.origin === Comment.ORIGIN.STREAM;

        // Streamed comments should be added to the queue.
        if (!opt_force && !isReply && !haveSeen && !isAuthor && isStream) {
            this.queueComment(comment);
            return;
        }
        existing.call(this, prepend, el, i, comment);
    };
}

/**
 * Queue a comment. Show the queue button.
 * @param {Comment} comment The comment to queue.
 */
function queueComment(comment) {
    this._queuedComments.push(comment);

    // If the parent node doesn't exist yet, that means it hasn't been added,
    // so add it now before showing it.
    if (!this._queueBtn.el.parentNode) {
        this._queueBtn.$el.insertBefore(this.$el.siblings('.' + CLASSES.GRADIENT));
    }
    this._queueBtn.setCount(this._queuedComments.length);
    this._queueBtn.show();
}

/**
 * Show all queued comments. Hide the queue button. Doesn't have to be a handler
 * of an event, but if it is, it should stop the event in it's tracks.
 * @param {jquery.Event=} opt_ev
 */
function showQueuedComments(opt_ev) {
    opt_ev && opt_ev.stopPropagation();
    var elem = this.getContainerElement();

    $.each(this._queuedComments, $.proxy(function(i, comment) {
        this.processComment(true, elem, null, comment, true);
    }, this));

    this._queuedComments = [];
    this._queueBtn.hide();
}

module.exports = QueueDecorator;
