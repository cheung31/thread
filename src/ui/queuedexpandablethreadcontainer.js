/**
 * @fileOverview ExpandableThreadContainer-ish object that supports queueing.
 */

var $ = require('jquery');
var Comment = require('annotations/models/comment');
var ExpandableThreadContainer = require('thread/ui/expandablethreadcontainer');
var inherits = require('inherits');
var QueueButton = require('annotations/thread/ui/queuebutton');
var textEnumeration = require('annotations/i18n/enumeration');
var ThreadEvents = require('annotations/events').thread;

/**
 * Queued Expandable Thread Container.
 * @constructor
 * @extends {ExpandableThreadContainer}
 * @param {Object} opts Config options.
 */
var QueuedExpandableThreadContainer = function(opts) {
    ExpandableThreadContainer.call(this, opts);
    var KEYS = textEnumeration.KEYS;

    /**
     * Queue button that shows in the footer of a top level comment. This shows
     * up only when there are no replies.
     * @type {QueueButton}
     * @private
     */
    this._commentQueueBtn = opts.commentQueueBtn;
    this._commentQueueBtn.setReplyBtn();

    /**
     * Footer queue button. This shows up when all replies are expanded and new
     * content streams in.
     * @type {QueueButton}
     * @private
     */
    this._footerQueueBtn = new QueueButton({
        plural: textEnumeration.get(KEYS.QUEUED_REPLIES_PLURAL),
        singular: textEnumeration.get(KEYS.QUEUED_REPLIES_SINGULAR)
    });
    this._footerQueueBtn.setReplyBtn();

    /**
     * Array for the non-expand queue buttons. This includes the one underneath
     * the thread container (next to the reply button) and the one in the
     * comment footer.
     * @type {Array.<QueueButton>}
     * @private
     */
    this._queueBtns = [opts.commentQueueBtn];

    /**
     * List of queued comments. These are all comments that were streamed in
     * and can't be displayed yet.
     * @type {Array.<Comment>}
     * @private
     */
    this._queuedComments = [];
};
inherits(QueuedExpandableThreadContainer, ExpandableThreadContainer);

/** @enum {string} */
QueuedExpandableThreadContainer.CLASSES = {
    FOOTER: 'lf-expandable-footer',
    NEW: 'lf-toggle-btn-new'
};
$.extend(QueuedExpandableThreadContainer.CLASSES, ExpandableThreadContainer.CLASSES);

/** @enum {string} */
QueuedExpandableThreadContainer.EVENTS = ExpandableThreadContainer.EVENTS;

/**
 * Add a queue notifier icon to each queue button. This needs to be inserted
 * after the first child element for the expand toggle button since it has the
 * extra DOM node for the down arrow fycon.
 * @param {QueueButton} btn
 */
function addQueueNotifier(btn) {
    var CLASSES = QueuedExpandableThreadContainer.CLASSES;
    if (btn.$el.has('.' + CLASSES.NEW).length) {
        return;
    }
    var elem = document.createElement('span');
    elem.className = CLASSES.NEW;
    btn.$el.find(':first-child').after(elem);
}

/**
 * Queue a comment. Show the queue button.
 * @param {Comment} comment The comment to queue.
 * @private
 */
QueuedExpandableThreadContainer.prototype._queueComment = function(comment) {
    this._queuedComments.push(comment);
    var self = this;

    var callback = function(i, btn, opt_count) {
        btn.setCount(opt_count || self._queuedComments.length);
        addQueueNotifier(btn);
    };

    callback(null, this._toggleBtn, this.getNumQueued());
    $.each(this._queueBtns, callback);
    this.updateButtonVisibility();
};

/**
 * Show all queued comments. Hide the queue button. Doesn't have to be a handler
 * of an event, but if it is, it should stop the event in it's tracks.
 * @param {jquery.Event=} opt_ev
 * @private
 */
QueuedExpandableThreadContainer.prototype._showQueuedComments = function(opt_ev) {
    opt_ev && opt_ev.stopPropagation();
    var elem = this.getContainerElement();

    $.each(this._queuedComments, $.proxy(function(i, comment) {
        this.processComment(false, elem, null, comment, true);
    }, this));

    this._queuedComments = [];
    this.updateButtonVisibility();
};

/** @override */
QueuedExpandableThreadContainer.prototype.destroy = function() {
    ExpandableThreadContainer.prototype.destroy.call(this);
    var callback = $.proxy(this._showQueuedComments, this);
    this.$el.off(ThreadEvents.SHOW_QUEUED_CONTENT, callback);
};

/** @override */
QueuedExpandableThreadContainer.prototype.expand = function() {
    ExpandableThreadContainer.prototype.expand.call(this);
    this._showQueuedComments();
};

/** @override */
QueuedExpandableThreadContainer.prototype.getNumQueued = function() {
    var count = ExpandableThreadContainer.prototype.getNumQueued.call(this);
    return count + this._queuedComments.length;
};

/** @override */
QueuedExpandableThreadContainer.prototype.processComment =
        function(prepend, el, i, comment, opt_force) {
    // If the current author posted, don't queue their comment.
    //opt_force = comment.isUserAuthor() || opt_force;
    // Streamed comments should be added to the queue.
    if (!opt_force && comment.origin === Comment.ORIGIN.STREAM) {
        this._queueComment(comment);
        return;
    }
    ExpandableThreadContainer.prototype.processComment.call(this, prepend, el, i, comment);
};

/** @override */
QueuedExpandableThreadContainer.prototype.render = function() {
    ExpandableThreadContainer.prototype.render.call(this);

    this._footerQueueBtn.render().hide();
    this._queueBtns.push(this._footerQueueBtn);
    this.$('.' + QueuedExpandableThreadContainer.CLASSES.FOOTER).append(this._footerQueueBtn.$el);

    var callback = $.proxy(this._showQueuedComments, this);
    this.$el.on(ThreadEvents.SHOW_QUEUED_CONTENT, callback);
};

/** @override */
QueuedExpandableThreadContainer.prototype.updateButtonVisibility = function() {
    var expandLen = this._commentIds.length;
    var hasQueued = this._queuedComments.length > 0;

    this._toggleBtn.hide();
    this._$replyBtnEl.hide();
    this._footerQueueBtn.hide();
    this._commentQueueBtn.hide();

    // There are no comments, so none of the thread container buttons should
    // show. If there are queued comments, however, the comment queue button
    // should show.
    if (!expandLen) {
        hasQueued && this._commentQueueBtn.show();
        return;
    }

    // There are comments, so none of the comment view buttons should show.
    this.$el.trigger(ExpandableThreadContainer.EVENTS.HIDE_REPLY_BTN);

    // There are comments, but not enough to show the expand button. We still
    // want to show the thread container reply button and possibly the queue
    // button in the footer if there are queued comments.
    if (expandLen <= ExpandableThreadContainer.NUM_COLLAPSED_COMMENTS) {
        this._$replyBtnEl.show();
        hasQueued && this._footerQueueBtn.show();
        return;
    }

    // There are some comments, but if we've already expanded the replies, the
    // toggle button shouldn't be shown again.
    !this._expanded && this._toggleBtn.show();
    this._$replyBtnEl.show();

    // If the replies have been expanded and there are queued comments, the
    // footer queue button should show.
    if (this._expanded && hasQueued) {
        this._footerQueueBtn.show();
    }
};

module.exports = QueuedExpandableThreadContainer;
