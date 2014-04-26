/**
 * @fileOverview Annotations/Livefyre info menu.
 */

var $ = require('jquery');
var BaseMenu = require('annotations/thread/ui/menu/base');
var inherits = require('inherits');
var textEnumeration = require('annotations/i18n/enumeration');

/**
 * Info menu.
 * @constructor
 * @extends {BaseMenu}
 * @param {Object} opts Config options.
 */
var InfoMenu = function(opts) {
    BaseMenu.call(this, opts);
};
inherits(InfoMenu, BaseMenu);

/** @enum {string} */
InfoMenu.CLASSES = {
    INFO: 'lf-info'
};

/** @override */
InfoMenu.prototype.elClass = [
    BaseMenu.CLASSES.MENU,
    InfoMenu.CLASSES.INFO
].join(' ');

/** @override */
InfoMenu.prototype.getLinkConfig = function() {
    return [];
};

/** @override */
InfoMenu.prototype.getTemplateContext = function() {
    var data = BaseMenu.prototype.getTemplateContext.call(this);
    var KEYS = textEnumeration.KEYS;
    $.extend(data.strings, {
        appName: textEnumeration.get(KEYS.APP_NAME),
        copyright: textEnumeration.get(KEYS.MENU_INFO_COPYRIGHT),
        helpLink: textEnumeration.get(KEYS.MENU_INFO_HELP),
        livefyreLink: textEnumeration.get(KEYS.MENU_INFO_LF_LINK)
    });
    return data;
};

/** @override */
InfoMenu.prototype.handleOptionClick = function(ev) {
    ev.stopPropagation();
};

/** @override */
InfoMenu.prototype.subTemplate = require('hgn!templates/thread/menu/info');

module.exports = InfoMenu;
