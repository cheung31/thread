/**
 * @fileOverview Flag menu view. This provides all of the flagging options to
 * the user so that they can flag a piece of content.
 */

var BaseMenu = require('annotations/thread/ui/menu/base');
var inherits = require('inherits');
var textEnumeration = require('annotations/i18n/enumeration');

/**
 * Flag menu.
 * @constructor
 * @extends {BaseMenu}
 * @param {Object} opts Config options.
 */
var ConfirmMenu = function (opts) {
    BaseMenu.call(this, opts);

    /** @override */
    this.postEvent = opts.postEvent;

    /**
     * A callback defined by the action being confirmed.
     * @type {?function()}
     */
    this.callback = opts.callback;
};
inherits(ConfirmMenu, BaseMenu);

/** @override */
ConfirmMenu.prototype.getLinkConfig = function () {
    var KEYS = textEnumeration.KEYS;
    var msg = textEnumeration.get(KEYS.MENU_CONFIRM_ACCEPT);
    return [
        {
            key: 'confirm',
            str: msg.replace('{action}', this.opts.actionStr)
        }, {
            key: 'cancel',
            str: textEnumeration.get(KEYS.MENU_CONFIRM_CANCEL)
        }
    ];
};

/** @override */
ConfirmMenu.prototype.getTemplateContext = function () {
    var data = BaseMenu.prototype.getTemplateContext.call(this);
    var KEYS = textEnumeration.KEYS;
    data.strings.title = textEnumeration.get(KEYS.MENU_CONFIRM_TITLE);
    return data;
};

/** @override */
ConfirmMenu.prototype.handleOptionClick = function (ev) {
    var data = this.buildEventData(ev);
    data.callback = this.callback;
    if (data.value === 'cancel') {
        this._handleBackClick(ev);
        return;
    }
    this.$el.trigger(this.postEvent, data);
};

module.exports = ConfirmMenu;
