/**
 * @fileOverview Expandable thread container view. This provides functionality
 * to show more and show less comments in a single thread.
 */

var $ = require('jquery');
var inherits = require('inherits');
var BaseThreadContainer = require('thread/ui/basethreadcontainer');
var QueueButton = require('annotations/thread/ui/queuebutton');
var textEnumeration = require('annotations/i18n/enumeration');
var ThreadEvents = require('annotations/events').thread;

/**
 * Expandable thread container view.
 * @constructor
 * @extends {BaseThreadContainer}
 * @param {Object} opts Config options.
 */
var ExpandableThreadContainer = function(opts) {
    BaseThreadContainer.call(this, opts);

    /**
     * State of the thread container. Initially it's expanded since all empty
     * thread containers are technically expanded.
     * @type {boolean}
     * @private
     */
    this._expanded = true;

    /**
     * Index of the oldest collapsed visible comment. This is used to keep track
     * of which comments need to be displayed at any given time.
     * @type {number}
     * @private
     */
    this._oldestCollapsedVisibleIdx = 0;

    var KEYS = textEnumeration.KEYS;

    /**
     * Queue toggle button.
     * @type {QueueButton}
     * @private
     */
    this._toggleBtn = new QueueButton({
        plural: textEnumeration.get(KEYS.THREAD_EXPAND_BTN_PLURAL),
        singular: textEnumeration.get(KEYS.THREAD_EXPAND_BTN_SINGULAR)
    });
};
inherits(ExpandableThreadContainer, BaseThreadContainer);

/**
 * The number of comments that show when collapsed.
 * @const {number}
 */
ExpandableThreadContainer.NUM_COLLAPSED_COMMENTS = 2;

/** @enum {string} */
ExpandableThreadContainer.CLASSES = {
    CONTAINER: 'lf-expandable-container',
    MAIN: 'lf-expandable-thread-container',
    REPLY_BTN: 'lf-expand-reply-btn',
    TOGGLE_BTN: 'lf-expand-toggle-btn',
    TOGGLE_BTN_TEXT: 'lf-expand-toggle-text'
};

/** @enum {string} */
ExpandableThreadContainer.EVENTS = {
    HIDE_REPLY_BTN: 'hideReplyBtn'
};

/** @override */
ExpandableThreadContainer.prototype.elClass = ExpandableThreadContainer.CLASSES.MAIN;

/** @override */
ExpandableThreadContainer.prototype.events = (function() {
    var CLASSES = ExpandableThreadContainer.CLASSES;
    var events = {};
    events['click .' + CLASSES.REPLY_BTN] = '_handleReplyClick';
    events[ThreadEvents.SHOW_QUEUED_CONTENT] = '_handleToggleClick';
    return events;
})();

/** @override */
ExpandableThreadContainer.prototype.template =
    require('hgn!templates/thread/expandablethreadcontainer');

/**
 * Handle the reply button click. Should hide the reply button.
 * @private
 */
ExpandableThreadContainer.prototype._handleReplyClick = function() {
    this._$replyBtnEl.hide();
};

/**
 * Handle the toggle expand/collapse button cilck.
 * @private
 */
ExpandableThreadContainer.prototype._handleToggleClick = function() {
    if (this._expanded) {
        return;
    }
    this._expanded = true;
    this.expand();
    this._updateButtonText();
};

/**
 * Update the comment count in the expand button.
 * @private
 */
ExpandableThreadContainer.prototype._updateButtonText = function() {
    if (this._expanded) {
        return;
    }
    this._toggleBtn.setCount(this.getNumQueued());
};

/** @override */
ExpandableThreadContainer.prototype.addComment = function(comments, opt_prepend, opt_el) {
    BaseThreadContainer.prototype.addComment.apply(this, arguments);
    this.updateButtonVisibility();
};

/**
 * Expand the thread of comments.
 */
ExpandableThreadContainer.prototype.expand = function() {
    var el = document.createDocumentFragment();
    var ids = this._commentIds.slice(0, this._oldestCollapsedVisibleIdx);
    var self = this;
    var view;

    $.each(ids, function(i, id) {
        view = self._comments[id];
        view.render();
        el.appendChild(view.el);
    });

    this.getContainerElement().prepend(el.childNodes);
    this._toggleBtn.hide();
};

/** @override */
ExpandableThreadContainer.prototype.getContainerElement = function() {
    return this._$containerEl;
};

/**
 * Get the total number of queued comments.
 * @return {number} The number of queued comments.
 */
ExpandableThreadContainer.prototype.getNumQueued = function() {
    return this._commentIds.length - ExpandableThreadContainer.NUM_COLLAPSED_COMMENTS;
};

/**
 * Get the reply button element.
 * @return {Element}
 */
ExpandableThreadContainer.prototype.getReplyButton = function() {
    return this._$replyBtnEl;
};

/** @override */
ExpandableThreadContainer.prototype.getTemplateContext = function() {
    var KEYS = textEnumeration.KEYS;
    return {
        strings: {
            replyBtnText: textEnumeration.get(KEYS.THREAD_REPLY_BTN),
            toggleBtnText: textEnumeration.get(KEYS.THREAD_EXPAND_BTN_SINGULAR)
        }
    };
};

/** @override */
ExpandableThreadContainer.prototype.initialize = function(comments) {
    comments.sort(function(c1, c2) {
        var created1 = c1.createdAt;
        var created2 = c2.createdAt;
        return created1 < created2 ? -1 : created1 > created2 ? 1 : 0;
    });

    var containerEl = this.getContainerElement();
    var len = comments.length;
    var view;
    var visCount = 0;

    $.each(comments.reverse(), $.proxy(function(i, comment) {
        if (!!this._comments[comment.id]) {
            return;
        }
        view = new this._commentConstructor(this._getCommentOptions(comment));
        this._comments[comment.id] = view;

        // Prepending the id since the list was reversed to make it easier to
        // process in this function.
        this._commentIds.splice(0, 0, comment.id);

        if (visCount === ExpandableThreadContainer.NUM_COLLAPSED_COMMENTS) {
            return;
        }

        if (visCount === 1) {
            this._oldestCollapsedVisibleIdx = len - i - 1;
        }

        view.render();
        containerEl.prepend(view.$el);
        visCount++;
    }, this));

    // Update the expanded variable based on the number of comments loaded
    // initially to determine whether the replies will be collapsed or not.
    var num = this._commentIds.length;
    this._expanded = num <= ExpandableThreadContainer.NUM_COLLAPSED_COMMENTS;

    this._updateButtonText();
    this.updateButtonVisibility();
};

/** @override */
ExpandableThreadContainer.prototype.render = function() {
    BaseThreadContainer.prototype.render.call(this);

    this._toggleBtn.render();
    this.$el.prepend(this._toggleBtn.$el);

    var CLASSES = ExpandableThreadContainer.CLASSES;
    this._$containerEl = this.$('.' + CLASSES.CONTAINER);
    // HACK: Needs to be inline-block and this._$replyBtnEl.show() sets it
    // to inline.
    this._$replyBtnEl = this.$('.' + CLASSES.REPLY_BTN).css('display', 'inline-block');
    this.updateButtonVisibility();
};

/**
 * Toggle the visibility of the buttons.
 */
ExpandableThreadContainer.prototype.updateButtonVisibility = function() {
    var len = this._commentIds.length;
    if (!len) {
        this._toggleBtn.hide();
        this._$replyBtnEl.hide();
        return;
    }
    this.$el.trigger(ExpandableThreadContainer.EVENTS.HIDE_REPLY_BTN);
    if (len <= ExpandableThreadContainer.NUM_COLLAPSED_COMMENTS) {
        this._toggleBtn.hide();
        this._$replyBtnEl.show();
        return;
    }
    this._toggleBtn.show();
    this._$replyBtnEl.show();
};

module.exports = ExpandableThreadContainer;
