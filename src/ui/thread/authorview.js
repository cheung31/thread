/**
 * @fileOverview The author view class.
 */

var inherits = require('inherits');
var ThreadEvents = require('annotations/events').thread;
var View = require('view');

/**
 * Author view.
 * @constructor
 * @extends {View}
 * @param {Object} opts Config options.
 */
var AuthorView = function(opts) {
    View.call(this, opts);
};
inherits(AuthorView, View);

/** @enum {string} */
AuthorView.CLASSES = {
    AUTHOR: 'lf-author-view'
};

/** @override */
AuthorView.prototype.elClass = AuthorView.CLASSES.AUTHOR;

/** @override */
AuthorView.prototype.events = {
    'click': '_handleClick'
};

/** @override */
AuthorView.prototype.template = require('hgn!templates/thread/thread/author');

/**
 * Handle the click event on the author's avatar.
 * @param {jQuery.Event} ev
 * @private
 */
AuthorView.prototype._handleClick = function (ev) {
    ev.stopPropagation();
    this.$el.trigger(ThreadEvents.NAVIGATE, {
        value: 'user'
    });
};

/** @override */
AuthorView.prototype.getTemplateContext = function () {
    return {
        avatar: Livefyre.user.get('avatar'),
        defaultAvatar: this.opts.defaultAvatar
    };
};

module.exports = AuthorView;
