/**
 * @fileOverview The queue button class.
 */

var inherits = require('inherits');
var ThreadEvents = require('annotations/events').thread;
var View = require('view');

/**
 * Queue button.
 * @constructor
 * @extends {View}
 * @param {Object} opts
 */
var QueueButton = function(opts) {
    View.call(this, opts);

    /**
     * The number of queued comments.
     * @type {number}
     * @private
     */
    this._count = opts.count || 0;

    /**
     * @type {string}
     * @private
     */
    this._plural = opts.plural;

    /**
     * @type {string}
     * @private
     */
    this._singular = opts.singular;
};
inherits(QueueButton, View);

/** @enum {string} */
QueueButton.CLASSES = {
    DOWN_ARROW: 'fycon-arrow-down',
    MAIN: 'lf-queue-btn',
    REPLY: 'lf-reply-queue-btn',
    TEXT: 'lf-btn-text'
};

/** @override */
QueueButton.prototype.elClass = QueueButton.CLASSES.MAIN;

/** @override */
QueueButton.prototype.events = {
    'click': '_handleClick'
};

QueueButton.prototype.delegateEvents = function () {
    View.prototype.delegateEvents.call(this);
}

/** @override */
QueueButton.prototype.template = require('hgn!templates/thread/queuebutton');

/**
 * Handle the button click event.
 * @private
 */
QueueButton.prototype._handleClick = function() {
    this.$el.trigger(ThreadEvents.SHOW_QUEUED_CONTENT);
};

/**
 * Hide the queue button.
 */
QueueButton.prototype.hide = function() {
    this.$el.hide();
};

/** @override */
QueueButton.prototype.render = function() {
    View.prototype.render.call(this);
    this._btnTextEl = this.$('.' + QueueButton.CLASSES.TEXT);
    this.setCount();
    return this;
};

/**
 * Update the count of the queue. Also, ensures that it can't go negative.
 * @param {number=} opt_count
 */
QueueButton.prototype.setCount = function(opt_count) {
    this._count = opt_count || 0;
    var str = this._count === 1 ? this._singular : this._plural;
    this._btnTextEl.html(str.replace('{number}', this._count));
};

/**
 * Sets this button as a reply button. This adds the reply class.
 */
QueueButton.prototype.setReplyBtn = function() {
    this.$el.addClass(QueueButton.CLASSES.REPLY);
};

/**
 * Show the queue button.
 */
QueueButton.prototype.show = function() {
    this.$el.show();
};

module.exports = QueueButton;
