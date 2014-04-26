/**
 * @fileOverview User menu view. This provides all of the user options.
 */

var $ = require('jquery');
var BaseMenu = require('annotations/thread/ui/menu/base');
var inherits = require('inherits');
var textEnumeration = require('annotations/i18n/enumeration');
var ThreadEvents = require('annotations/events').thread;
var UserEvents = require('annotations/events').user;
var userMenuTemplate = require('hgn!templates/thread/menu/user');

/**
 * User menu.
 * @constructor
 * @extends {BaseMenu}
 * @param {Object} opts Config options.
 */
function UserMenu(opts) {
    BaseMenu.call(this, opts);
}
inherits(UserMenu, BaseMenu);

/** @enum {string} */
var OPTIONS = {
    ADMIN: 'admin',
    EDIT_PROFILE: 'editProfile',
    LOGOUT: 'logout'
};

/** @type {Object.<string, string>} */
var OPTION_EVENT_MAP = (function () {
    var map = {};
    map[OPTIONS.ADMIN] = UserEvents.ADMIN;
    map[OPTIONS.EDIT_PROFILE] = UserEvents.EDIT_PROFILE;
    map[OPTIONS.LOGOUT] = UserEvents.LOGOUT;
    return map;
})();

/** @enum {string} */
var CLASSES = {
    USER: 'lf-user'
};

/** @override */
UserMenu.prototype.elClass = [
    BaseMenu.CLASSES.MENU,
    CLASSES.USER
].join(' ');

/** @override */
UserMenu.prototype.getLinkConfig = function () {
    var KEYS = textEnumeration.KEYS;
    var cfg = [
        {
            key: OPTIONS.EDIT_PROFILE,
            str: textEnumeration.get(KEYS.MENU_USER_EDIT_PROFILE)
        }, {
            key: OPTIONS.LOGOUT,
            str: textEnumeration.get(KEYS.MENU_USER_LOGOUT)
        }
    ];

    // Only add the admin link if the user is a moderator.
    if (Livefyre.user.isMod(this.opts.collection.id)) {
        cfg.splice(1, 0, {
            key: OPTIONS.ADMIN,
            str: textEnumeration.get(KEYS.MENU_USER_ADMIN)
        });
    }
    return cfg;
};

/** @override */
UserMenu.prototype.getTemplateContext = function () {
    var data = BaseMenu.prototype.getTemplateContext.call(this);
    var KEYS = textEnumeration.KEYS;
    data.strings.backBtn = textEnumeration.get(KEYS.MENU_USER_BACK_BTN);
    data.strings.title = userMenuTemplate({
        avatar: Livefyre.user.get('avatar'),
        displayName: Livefyre.user.get('displayName')
    });
    return data;
};

/** @override */
UserMenu.prototype.handleOptionClick = function (ev) {
    ev.stopPropagation();
    var selected = $(ev.target).attr('data-value');
    this.$el.trigger(OPTION_EVENT_MAP[selected]);
    this.$el.trigger(ThreadEvents.NAVIGATE_BACK);
};

module.exports = UserMenu;
