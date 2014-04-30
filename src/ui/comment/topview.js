/**
 * @fileOverview Top level comment view. These are the main annotation comments
 * that have footers and aren't indented.
 */

var $ = require('jquery');
var View = require('streamhub-sdk/view');
var CommentActions = require('annotations/thread/ui/comment/actions');
var EditorEvents = require('annotations/events').editor;
var EditorView = require('annotations/thread/ui/editorview');
var QueuedExpandableThreadContainer =
        require('thread/ui/queued-expandable-thread-container');
var inherits = require('inherits');
var internals = require('annotations/util/internals');
var QueueButton = require('annotations/thread/ui/queuebutton');
var ReplyCommentView =require('thread/ui/comment/replyview');
var textEnumeration = require('annotations/i18n/enumeration');
var ThreadEvents = require('annotations/events').thread;
var viewEnum = require('annotations/enums').navigableViews;
var WriteEvents = require('annotations/events').write;

/**
 * Top level comment view.
 * @constructor
 * @extends {View}
 * @param {Object} opts Config options.
 */
var TopCommentView = function(opts) {
    View.call(this, opts);

    this._contentView = opts.contentView;

    /**
     * Whether the mouse enter and leave events are disabled for this view.
     * @type {boolean}
     * @private
     */
    this._mouseEventsDisabled = false;

    /**
     * Reply container view.
     * @type {?QueuedExpandableThreadContainer}
     * @private
     */
    this._replyContainer = null;

    /**
     * Reply editor.
     * @type {?EditorView}
     * @private
     */
    this._replyEditor = null;
};
inherits(TopCommentView, View);

/** @enum {string} */
TopCommentView.CLASSES = {
    ROOT_CONTAINER: 'lf-comment-container',
    EDITOR_CONTAINER: 'lf-editor-container',
    REPLY_CONTAINER: 'lf-reply-container'
};
//$.extend(TopCommentView.CLASSES, BaseCommentView.CLASSES);

/** @override */
TopCommentView.prototype.events = (function() {
    var events = {};
    var THREAD_EVENTS = QueuedExpandableThreadContainer.EVENTS;
    events['click .' + CommentActions.CLASSES.REPLY_BTN] = '_toggleReplyEditor';
    events['click .' + QueuedExpandableThreadContainer.CLASSES.REPLY_BTN] = '_toggleReplyEditor';
    events[WriteEvents.POST_REPLY] = '_interceptReply';
    events[ThreadEvents.SHOW_QUEUED_CONTENT] = '_handleShowQueuedContent';
    return events;
})();
//$.extend(TopCommentView.prototype.events, BaseCommentView.prototype.events);

/** @override */
TopCommentView.prototype.template = require('hgn!templates/thread/comment/topcomment');

/**
 * Handle the show queued content event.
 * @param {jQuery.Event} ev
 * @private
 */
TopCommentView.prototype._handleShowQueuedContent = function(ev) {
    ev.stopPropagation();
    this._replyContainer.$el.trigger(ThreadEvents.SHOW_QUEUED_CONTENT);
};

/**
 * Intercept the reply event and add a success callback to it.
 * @param {jQuery.Event} ev
 * @param {Object} opts
 * @private
 */
TopCommentView.prototype._interceptReply = function(ev, opts) {
    var self = this;
    var callbackFn = opts.callback || function() {};
    opts.callback = function(err, comment) {
        callbackFn(err, comment);
        if (err) {
            return;
        }
        self.$_editorContainerEl.hide();
        self.getThreadContainer().addComment(comment);
    };
    opts.parentId = this._model.id;
};

/**
 * Toggle the display of the reply editor.
 * @param {Event} ev
 * @private
 */
TopCommentView.prototype._toggleReplyEditor = function(ev) {
    var self = this;
    function showReplyBtn() {
        self.getThreadContainer().getReplyButton().show();
    }

    if (!Livefyre.user.isAuthenticated()) {
        showReplyBtn();
        this.$el.trigger(ThreadEvents.NAVIGATE, {
            event: WriteEvents.POST_REPLY,
            value: viewEnum.AUTH
        });
        return;
    }

    if (this._replyEditor && this.$_editorContainerEl.is(':visible')) {
        this.$_editorContainerEl.hide();
        return;
    }

    if (!this._replyEditor) {
        this._replyEditor = new EditorView({
            editorId: this._model.id,
            el: this.$_editorContainerEl,
            hideOnBlur: true,
            postEvent: WriteEvents.POST_REPLY,
            type: EditorView.TYPES.REPLY
        });
        this._replyEditor.render();
    } else {
        this._replyEditor.reset();
    }

    this.$_editorContainerEl.show();
    this._replyEditor.initialize();

    if (!$(ev.target).hasClass(QueuedExpandableThreadContainer.CLASSES.REPLY_BTN)) {
        return;
    }

    this._replyEditor.$el.one(EditorEvents.HIDE, showReplyBtn);
};

/** @override */
TopCommentView.prototype.destroy = function() {
    View.prototype.destroy.call(this);
    this._replyEditor && this._replyEditor.destroy();
    this._replyEditor = null;
};

/**
 * Disable mouse events.
 * @param {boolean} disable To disable or not to disable ...
 */
TopCommentView.prototype.disableMouseEvents = function (disable) {
    this._mouseEventsDisabled = disable;
};

/**
 * Returns the reply thread container.
 * @return {?ThreadContainer}
 */
TopCommentView.prototype.getThreadContainer = function() {
    return this._replyContainer;
};

/**
 * Handle a hover (possibly highlight selected text).
 * @param {jQuery.Event} ev
 */
TopCommentView.prototype.handleMouseEnter = function (ev) {
    if (this._mouseEventsDisabled) {
        return;
    }
    var selectedText = this._model.selectedText;
    if (!selectedText) {
        return;
    }
    var self = this;
    // Using a setTimeout here to make this fire after the thread container's
    // mouseenter, which hides the user's selected text. If this doesn't have
    // a setTimeout, it's possible that this fires first and gets deactivated
    // by the thread container's event.
    setTimeout(function () {
        self.$el.trigger(ThreadEvents.ACTIVATE_HIGHLIGHTED_TEXT, {
            selectedText: selectedText,
            blockId: self._model.blockId
        });
    }, 1);
};

/**
 * Handle a hover (possibly unhighlight selected text).
 * @param {jQuery.Event} ev
 */
TopCommentView.prototype.handleMouseLeave = function (ev) {
    if (!this._model.selectedText || this._mouseEventsDisabled) {
        return;
    }
    this.$el.trigger(ThreadEvents.DEACTIVATE_HIGHLIGHTED_TEXT);
};

/** @override */
TopCommentView.prototype.render = function() {
    var CLASSES = TopCommentView.CLASSES;
    var KEYS = textEnumeration.KEYS;
    View.prototype.render.call(this);

    this._contentView.setElement(this.$('.' + CLASSES.ROOT_CONTAINER));
    this._contentView.render();

    this.$_editorContainerEl = this.$('.' + CLASSES.EDITOR_CONTAINER);

    var btn = new QueueButton({
        plural: textEnumeration.get(KEYS.QUEUED_REPLIES_PLURAL),
        singular: textEnumeration.get(KEYS.QUEUED_REPLIES_SINGULAR)
    });
    btn.render().hide();
    if (this.$footerEl) {
        this.$footerEl.append(btn.$el);
    }

    this._replyContainer = new QueuedExpandableThreadContainer({
        contentConstructor: ReplyCommentView,
        commentQueueBtn: btn,
        el: this.$('.'+ CLASSES.REPLY_CONTAINER)
    });
    this._replyContainer.render();
};

/** @override */
TopCommentView.prototype.renderEtc = internals.nullFunction;

module.exports = TopCommentView;
