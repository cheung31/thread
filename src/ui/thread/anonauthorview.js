/**
 * @fileOverview The anonymous author view class.
 */

var inherits = require('inherits');
var textEnumeration = require('annotations/i18n/enumeration');
var View = require('view');
var UserEvents = require('annotations/events').user;

/**
 * Author view.
 * @constructor
 * @extends {View}
 * @param {Object} opts Config options.
 */
var AnonAuthorView = function(opts) {
    View.call(this, opts);
};
inherits(AnonAuthorView, View);

/** @enum {string} */
AnonAuthorView.CLASSES = {
    ANON_AUTHOR: 'lf-anon-author'
};

/** @override */
AnonAuthorView.prototype.elClass = AnonAuthorView.CLASSES.ANON_AUTHOR;

/** @override */
AnonAuthorView.prototype.events = {
    'click': '_handleLogin'
};

/** @override */
AnonAuthorView.prototype.template = require('hgn!templates/thread/thread/anonauthor');

/**
 * Handle the log in button click.
 * @private
 */
AnonAuthorView.prototype._handleLogin = function(ev) {
    this.$el.trigger(UserEvents.LOGIN);
};

/** @override */
AnonAuthorView.prototype.getTemplateContext = function() {
    return {
        assetServer: this.opts.assetServer,
        strings: {
            signInToPost: textEnumeration.get(textEnumeration.KEYS.SIGN_IN_TO_POST)
        }
    };
};

module.exports = AnonAuthorView;
