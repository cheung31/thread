/**
 * @fileOverview The comment reply view class.
 */

var $ = require('jquery');
var BaseCommentView = require('annotations/thread/ui/comment/baseview');
var View = require('streamhub-sdk/view');
var etcTemplate = require('hgn!templates/thread/comment/etc');
var inherits = require('inherits');

/**
 * Reply view.
 * @constructor
 * @extends {View}
 * @param {Object} opts Config options.
 */
var ReplyView = function(opts) {
    View.call(this, opts);
    this._contentView = opts.contentView;

};
inherits(ReplyView, View);

/** @enum {string} */
ReplyView.CLASSES = {
    ROOT_CONTAINER: 'lf-comment-container'
};

/** @override */
ReplyView.prototype.template = require('hgn!templates/thread/comment/comment');

ReplyView.prototype.getModel = function () {
    return this._contentView.content;
};

/** @override */
ReplyView.prototype.render = function() {
    View.prototype.render.call(this);

    this._contentView.setElement(this.$('.' + ReplyView.CLASSES.ROOT_CONTAINER));
    this._contentView.render();

    var $body = this.$('.' + BaseCommentView.CLASSES.BODY);
    if (! $body) {
        $body = this.$('.content-body');
    }
    var lastChild = $body.children().last();
    lastChild.append($(etcTemplate()));
};

module.exports = ReplyView;
