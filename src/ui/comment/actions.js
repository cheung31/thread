/**
 * @fileOverview The comment actions class. This contains all of the comment
 * actions such as votes, reply, and more. This is what gets added to top-level
 * comments.
 */

var inherits = require('inherits');
var textEnumeration = require('annotations/i18n/enumeration');
var View = require('view');
var VoteContainer = require('annotations/thread/ui/comment/votecontainer');

/**
 * Comment actions component.
 * @constructor
 * @extends {View}
 * @param {Object} opts Config options.
 */
var CommentActions = function(opts) {
    View.call(this, opts);

    /**
     * The model that is backing this view.
     * @type {Comment}
     */
    this._model = opts.model;

    /**
     * The vote container view.
     * @type {VoteContainer}
     * @private
     */
    this._voteContainer = this.createVoteContainer();
};
inherits(CommentActions, View);

/** @enum {string} */
CommentActions.CLASSES = {
    ACTIONS: 'lf-comment-actions',
    REPLY_BTN: 'lf-reply-btn',
    SEPARATOR: 'lf-separator',
    VOTES: 'lf-votes'
};

CommentActions.prototype.createVoteContainer = function() {
    return new VoteContainer(this.opts);
};

/** @override */
CommentActions.prototype.template = require('hgn!templates/thread/comment/actions');

/** @override */
CommentActions.prototype.getTemplateContext = function() {
    return {
        strings: {
            replyBtn: textEnumeration.get(textEnumeration.KEYS.REPLY_BTN)
        }
    };
};

/**
 * @return {VoteContainer}
 */
CommentActions.prototype.getVoteContainer = function () {
    return this._voteContainer;
};

/**
 * Hide the reply button.
 */
CommentActions.prototype.hideReplyBtn = function() {
    this.$_replyBtn.hide();
    this.$_separator.hide();
};

/** @override */
CommentActions.prototype.render = function() {
    View.prototype.render.call(this);

    var CLASSES = CommentActions.CLASSES;
    this._voteContainer.setElement(this.$('.' + CLASSES.VOTES)[0]);
    this._voteContainer.render();
    this.$_replyBtn = this.$('.' + CLASSES.REPLY_BTN);
    this.$_separator = this.$('.' + CLASSES.SEPARATOR);
};

module.exports = CommentActions;
