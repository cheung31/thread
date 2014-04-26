/**
 * @fileOverview The comment view class. This is what renders a single comment
 * on the page.
 */

var $ = require('jquery');
var BlockEvents = require('annotations/events').block;
var CommentActions = require('annotations/thread/ui/comment/actions');
var inherits = require('inherits');
var textEnumeration = require('annotations/i18n/enumeration');
var ThreadEvents = require('annotations/events').thread;
var UserEvents = require('annotations/events').user;
var View = require('view');
var visEnums = require('annotations/enums').commentVisibility;

/**
 * Comment view.
 * @constructor
 * @extends {View}
 * @param {Object} opts Config options.
 */
var BaseCommentView = function(opts) {
    View.call(this, opts);

    /**
     * The model that is backing this view.
     * @type {Comment}
     */
    this._model = opts.model;

    // Listen for the visibiilty change event and handle accordingly.
    this._model.on('change:visibility', $.proxy(this._handleVisChange, this));

    // Listen for body updates (edits) and rerender.
    this._model.on('change:body', $.proxy(this.render, this));

    /**
     * The comment actions for this comment.
     * @type {?CommentActions}
     * @private
     */
    this._actions = this.createActions();
};
inherits(BaseCommentView, View);

/** @enum {string} */
BaseCommentView.CLASSES = {
    ACTIONS: 'lf-comment-actions',
    AVATAR: 'lf-comment-author-avatar',
    BODY: 'lf-comment-body',
    COMMENT: 'lf-comment',
    CONTAINER: 'lf-comment-container',
    DISPLAY_NAME: 'lf-comment-author-name',
    HEADER: 'lf-comment-header',
    REPLY: 'lf-reply',
    MORE_BTN: 'lf-etc-btn',
    PENDING_TAG: 'lf-comment-pending-tag',
    FOOTER: 'lf-comment-footer'
};

/** @override */
BaseCommentView.prototype.elClass = BaseCommentView.CLASSES.COMMENT;

/** @override */
BaseCommentView.prototype.elTag = 'article';

/** @override */
BaseCommentView.prototype.events = (function() {
    var CLASSES = BaseCommentView.CLASSES;
    var events = {};
    events['click .' + CLASSES.AVATAR] = '_handleViewProfile';
    events['click .' + CLASSES.DISPLAY_NAME] = '_handleViewProfile';
    events['click .' + CLASSES.MORE_BTN] = '_handleMoreClick';
    return events;
})();

/** @override */
BaseCommentView.prototype.template = require('hgn!templates/thread/comment/comment');

/**
 * Handle the more click event.
 * @private
 */
BaseCommentView.prototype._handleMoreClick = function () {
    this.$el.trigger(ThreadEvents.CHANGE_VIEW, {
        model: this._model,
        value: 'etc'
    });
};

/**
 * Handle the view profile event. This should trigger an event that will use
 * the auth delegate to view profile.
 * @param {jQuery.Event} ev
 * @private
 */
BaseCommentView.prototype._handleViewProfile = function (ev) {
    // Necessary so that it doesn't bubble to the parent comment and trigger
    // another view profile event.
    ev.stopPropagation();
    this.$el.trigger(UserEvents.VIEW_PROFILE, {
        author: this._model.author
    });
};

/**
 * Handle the visibility change event.
 * @private
 */
BaseCommentView.prototype._handleVisChange = function () {
    this._triggerVisEvent();
    switch (this._model.visibility) {
        case visEnums.NONE:
            return this.handleVisNone();
        case visEnums.EVERYONE:
            return this.handleVisEveryone();
        case visEnums.OWNER:
            return this.handleVisOwner();
        case visEnums.GROUP:
            return this.handleVisGroup();
        default:
            throw 'Not supported visibility type: ' + this._model.visibility;
    }
};

/**
 * Hide the comment view. Doing this instead of destroying so that it's possible
 * to change the visibility and have the view show itself.
 * @private
 */
BaseCommentView.prototype._hide = function () {
    this.$el.hide();
};

/**
 * Show the comment view.
 * @private
 */
BaseCommentView.prototype._show = function () {
    this.$el.show();
};

/**
 * Trigger a vis event with the comment that was updated and the increment
 * amount for it.
 * @param {number} inc The increment amount.
 * @private
 */
BaseCommentView.prototype._triggerVisEvent = function () {
    this.$el.trigger(BlockEvents.UPDATE_COUNT, {
        blockId: this._model.blockId,
        inc: this._model.calculateCountIncrement()
    });
};

/**
 * @returns {CommentActions}
 */
BaseCommentView.prototype.createActions = function () {
    return new CommentActions({
        model: this._model
    });
};

/** @override */
BaseCommentView.prototype.destroy = function () {
    View.prototype.destroy.call(this);
    this._actions && this._actions.destroy();
    this._actions = null;
};

/**
 * Provide access to the view's model.
 * @return {Comment}
 */
BaseCommentView.prototype.getModel = function () {
    return this._model;
};

/** @override */
BaseCommentView.prototype.getTemplateContext = function () {
    var KEYS = textEnumeration.KEYS;

    return {
        author: this._model.author,
        body: this._model.body,
        defaultAvatar: this.opts.defaultAvatar,
        moderator: this._model.moderator,
        pending: this._model.isPending(),
        strings: {
            commentModeratorTag: textEnumeration.get(KEYS.COMMENT_MODERATOR_TAG),
            commentPendingTag: textEnumeration.get(KEYS.COMMENT_PENDING_TAG)
        }
    };
};

/**
 * Handle the visible state.
 */
BaseCommentView.prototype.handleVisEveryone = function () {
    this.render();
    this._show();
};

/**
 * Handle the pending state.
 */
BaseCommentView.prototype.handleVisGroup = function () {
    if (this._model.isUserAuthor() || Livefyre.user.isMod(this._model.collectionId)) {
        this.render();
        this._show();
        return;
    }
    this._hide();
};

/**
 * Handle the deleted state.
 */
BaseCommentView.prototype.handleVisNone = function () {
    this._hide();
};

/**
 * Handle the bozo state.
 */
BaseCommentView.prototype.handleVisOwner = function () {
    if (this._model.isUserAuthor()) {
        this.render();
        this._show();
        return;
    }
    this._hide();
};

/** @override */
BaseCommentView.prototype.render = function () {
    this.$el.html(this.template(this.getTemplateContext(), {
        base: require('hgn!templates/thread/comment/base').template,
        etc: require('hgn!templates/thread/comment/etc').template,
        footer: require('hgn!templates/thread/comment/footer').template,
        tags: require('hgn!templates/thread/comment/tags').template
    }));
    this.$footerEl = this.$('.'+ BaseCommentView.CLASSES.FOOTER);
    this._actions.setElement(this.$footerEl.find('.' + BaseCommentView.CLASSES.ACTIONS));
    this._actions.render();
    this.$el.attr('id', this._model.id);
    this._model.hasBeenRendered = true;
};

/**
 * Render a comment. This renders the comment and changes it's visibility.
 */
BaseCommentView.prototype.renderComment = function () {
    this.render();
    this._handleVisChange();
};

/**
 * Determines if this view should be rendered. If the comment has made it this
 * far, that means that it has either been decoded (if eref) or is a non-eref
 * type which we will decide what to do with here.
 * @return {boolean}
 */
BaseCommentView.prototype.shouldRender = function () {
    var isOwner = this._model.isUserAuthor();
    var isMod = Livefyre.user.isMod(this._model.collectionId);

    switch (this._model.visibility) {
        case visEnums.NONE:
            return false;
        case visEnums.EVERYONE:
            return true;
        case visEnums.OWNER:
            return isOwner;
        case visEnums.GROUP:
            return isMod || isOwner;
        default:
            return false;
    }
};

module.exports = BaseCommentView;
