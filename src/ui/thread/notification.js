/**
 * @fileOverview Notification view that shows over the thread view once an
 * action has been performed.
 */

var $ = require('jquery');
var inherits = require('inherits');
var textEnumeration = require('annotations/i18n/enumeration');
var View = require('view');
var WriteEvents = require('annotations/events').write;

/**
 * Notification view.
 * @constructor
 * @extends {View}
 * @param {Object} opts
 */
function NotificationView(opts) {
    View.call(this, opts);

    /**
     * Event name that this is notifying of it's success.
     * @type {string}
     * @private
     */
    this._event = opts.event;
}
inherits(NotificationView, View);

/** @enum {string} */
var CLASSES = {
    APPROVE: 'fycon-check-funky',
    DELETE: 'fycon-admin-delete',
    FLAG: 'fycon-admin-flag',
    ICON: 'lf-notification-icon',
    MAIN: 'lf-thread-notification',
    POPOVER: 'lf-thread-popover'
};

/** @enum {string} */
var EVENT_TO_CLASS_MAP = (function () {
    var map = {};
    map[WriteEvents.POST_APPROVE] = CLASSES.APPROVE;
    map[WriteEvents.POST_DELETE] = CLASSES.DELETE;
    map[WriteEvents.POST_FLAG] = CLASSES.FLAG;
    map[WriteEvents.POST_HIDE] = CLASSES.DELETE;
    return map;
})();

/** @enum {string} */
var EVENT_TO_ENUMERATION_MAP = (function () {
    var KEYS = textEnumeration.KEYS;
    var map = {};
    map[WriteEvents.POST_APPROVE] = KEYS.NOTIFICATION_APPROVED;
    map[WriteEvents.POST_DELETE] = KEYS.NOTIFICATION_DELETED;
    map[WriteEvents.POST_FLAG] = KEYS.NOTIFICATION_FLAGGED;
    map[WriteEvents.POST_HIDE] = KEYS.NOTIFICATION_DELETED;
    return map;
})();

/**
 * The amount of time, in ms that this component will live.
 * @type {number}
 */
var TTL = 1500;

/** @override */
NotificationView.prototype.elClass = CLASSES.MAIN;

/** @override */
NotificationView.prototype.template = require('hgn!templates/thread/notification');

/**
 * Decorate a provided DOM element by adding itself to it. Positions itself
 * within the provided element.
 * @param {jQuery.Element} elem
 */
NotificationView.prototype.decorate = function (elem) {
    this.render();
    elem.append(this.$el);
    this.position();
};

/** @override */
NotificationView.prototype.getTemplateContext = function () {
    return {
        strings: {
            title: textEnumeration.get(EVENT_TO_ENUMERATION_MAP[this._event])
        }
    };
};

/**
 * Position the notification.
 */
NotificationView.prototype.position = function () {
    var $popoverEl = this.$el.closest('.' + CLASSES.POPOVER);
    var left = ($popoverEl.width() - this.$el.outerWidth()) / 2;
    var top = ($popoverEl.height() - this.$el.outerHeight()) / 2;
    this.$el.css({'left': left + 'px', 'top': top + 'px'});
};

/** @override */
NotificationView.prototype.render = function () {
    View.prototype.render.call(this);
    this.$('.' + CLASSES.ICON).addClass(EVENT_TO_CLASS_MAP[this._event]);
    setTimeout($.proxy(this.destroy, this), TTL);
};

module.exports = NotificationView;
