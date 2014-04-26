/**
 * @fileOverview Flag menu view. This provides all of the flagging options to
 * the user so that they can flag a piece of content.
 */

var BaseMenu = require('annotations/thread/ui/menu/base');
var inherits = require('inherits');
var textEnumeration = require('annotations/i18n/enumeration');
var WriteEvents = require('annotations/events').write;

/**
 * Flag menu.
 * @constructor
 * @extends {BaseMenu}
 * @param {Object} opts Config options.
 */
var FlagMenu = function(opts) {
    BaseMenu.call(this, opts);

    /** @override */
    this.postEvent = WriteEvents.POST_FLAG;
};
inherits(FlagMenu, BaseMenu);

/** @override */
FlagMenu.prototype.getLinkConfig = function() {
    var KEYS = textEnumeration.KEYS;
    return [
        {
            key: 'spam',
            str: textEnumeration.get(KEYS.MENU_FLAG_OPTION_SPAM)
        }, {
            key: 'offensive',
            str: textEnumeration.get(KEYS.MENU_FLAG_OPTION_OFFENSIVE)
        }, {
            key: 'disagree',
            str: textEnumeration.get(KEYS.MENU_FLAG_OPTION_DISAGREE)
        }, {
            key: 'off-topic',
            str: textEnumeration.get(KEYS.MENU_FLAG_OPTION_OFF_TOPIC)
        }
    ];
};

/** @override */
FlagMenu.prototype.getTemplateContext = function() {
    var data = BaseMenu.prototype.getTemplateContext.call(this);
    data.strings.title = textEnumeration.get(textEnumeration.KEYS.MENU_FLAG_TITLE);
    return data;
};

module.exports = FlagMenu;
