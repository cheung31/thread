/**
 * @fileOverview Auth menu view. This shows when a user tries to do something
 * that requires authentication.
 */

var $ = require('jquery');
var BaseMenu = require('annotations/thread/ui/menu/base');
var inherits = require('inherits');
var Navigable = require('annotations/thread/ui/navigable');
var textEnumeration = require('annotations/i18n/enumeration');
var ThreadEvents = require('annotations/events').thread;
var UserAgentUtil = require('annotations/util/useragent');
var UserEvents = require('annotations/events').user;
var WriteEvents = require('annotations/events').write;

/**
 * Auth menu.
 * @constructor
 * @extends {BaseMenu}
 * @param {Object} opts Config options.
 */
var AuthMenu = function(opts) {
    BaseMenu.call(this, opts);
};
inherits(AuthMenu, BaseMenu);

/** @enum {string} */
AuthMenu.CLASSES = {
    AUTH: 'lf-auth',
    SIGNED_IN: 'lf-signed-in',
    SIGNIN_BTN: 'lf-signin-btn'
};

/** @enum {string} */
var EVENT_TO_ACTION_MAP = (function() {
    var map = {};
    map[WriteEvents.POST_ANNOTATION] = 'Post';
    map[WriteEvents.POST_APPROVE] = 'Approve';
    map[WriteEvents.POST_DELETE] = 'Delete';
    map[WriteEvents.POST_HIDE] = 'Hide';
    map[WriteEvents.POST_REPLY] = 'Reply';
    map[WriteEvents.POST_VOTE] = 'Vote';
    return map;
})();

/** @override */
AuthMenu.prototype.elClass = [
    BaseMenu.CLASSES.MENU,
    AuthMenu.CLASSES.AUTH
].join(' ');

/** @override */
AuthMenu.prototype.events = (function() {
    var events = {};
    var event = UserAgentUtil.isMobile() ? 'tap' : 'click';
    events[event + ' .' + AuthMenu.CLASSES.SIGNIN_BTN] = '_handleLoginClick';
    return events;
})();
$.extend(AuthMenu.prototype.events, Navigable.prototype.events);

/**
 * Handle the login click event. Go back to the previous screen.
 * @private
 */
AuthMenu.prototype._handleLoginClick = function() {
    this.$el.trigger(UserEvents.LOGIN);
    this.$el.trigger(ThreadEvents.NAVIGATE_BACK);
};

/** @override */
AuthMenu.prototype.getTemplateContext = function() {
    var data = BaseMenu.prototype.getTemplateContext.call(this);
    var KEYS = textEnumeration.KEYS;
    var msg = textEnumeration.get(KEYS.MENU_AUTH_SIGNED_IN_MSG);
    $.extend(data.strings, {
        signedInMsg: msg.replace('{action}', EVENT_TO_ACTION_MAP[this.opts.event]),
        signInBtn: textEnumeration.get(KEYS.MENU_AUTH_SIGN_IN_BTN)
    });
    return data;
};

/** @override */
AuthMenu.prototype.subTemplate = require('hgn!templates/thread/menu/auth');

module.exports = AuthMenu;
