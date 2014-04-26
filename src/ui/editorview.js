/**
 * @fileOverview The editor view class. This contains the editor box and any
 * buttons that go along with it.
 */

var $ = require('jquery');
var BaseEditorView = require('annotations/thread/ui/baseeditorview');
var EditorEvents = require('annotations/events').editor;
var editorUtil = require('annotations/util/editor');
var errorTemplate = require('hgn!templates/thread/editorerror');
var inherits = require('inherits');
var textEnumeration = require('annotations/i18n/enumeration');
var ThreadEvents = require('annotations/events').thread;

/**
 * Editor view.
 * @constructor
 * @extends {BaseEditorView}
 * @param {Object} opts Config options.
 */
function EditorView(opts) {
    BaseEditorView.call(this, opts);

    /**
     * Hide the editor when it blurs and there is no content.
     * @type {boolean}
     */
    this._hideOnBlur = !!opts.hideOnBlur;

    /**
     * Whether the post button is visible or not.
     * @type {boolean}
     * @private
     */
    this._isPostBtnVisible = true;

    /**
     * Currently posting a comment.
     * @type {boolean}
     * @private
     */
    this._isPosting = false;

    /**
     * The original height of the editor. This is set in the render function
     * so that we know how big to reset the height to. We could use a constant
     * here but customers can modify the height of the field, so that would be
     * a bad idea.
     * @type {?number}
     * @private
     */
    this._originalHeight = null;

    /**
     * Whether placeholders are supported or not.
     * @type {boolean}
     * @private
     */
    this._placeholderSupported = true;

    /**
     * The mode of the editor (edit, reply, etc)
     * @type {string}
     * @private
     */
    this._type = this.opts.type;
}
inherits(EditorView, BaseEditorView);

/** @enum {string} */
EditorView.TYPES = BaseEditorView.TYPES;

/** @enum {string} */
EditorView.prototype.classes = {
    EDITOR: 'lf-editor',
    FIELD: 'lf-editor-field',
    FOCUS: 'lf-editor-focus',
    POST_BTN: 'lf-editor-post-btn',
    RESIZE: 'lf-editor-resize'
};

/** @override */
EditorView.prototype.elClass = EditorView.prototype.classes.EDITOR;

/** @override */
EditorView.prototype.events = (function() {
    var classes = EditorView.prototype.classes;
    var events = {};
    events['blur .' + classes.FIELD] = '_handleEditorBlur';
    events['click .' + classes.POST_BTN] = 'handlePostBtnClick';
    events['focus .' + classes.FIELD] = '_handleEditorFocus';
    events['keydown .' + classes.FIELD] = '_handleEditorKeydown';
    events['keyup .' + classes.FIELD] = '_handleEditorKeyup';
    return events;
})();

/** @override */
EditorView.prototype.template = require('hgn!templates/thread/editor');

/**
 * Get the display text for the post button.
 * @private
 * @return {string}
 */
EditorView.prototype._getPostBtnText = function () {
    var KEYS = textEnumeration.KEYS;
    var str;
    if (this._isPosting && this._type === BaseEditorView.TYPES.EDIT) {
        str = textEnumeration.get(KEYS.EDITOR_EDIT_POSTING);
    } else if (this._isPosting) {
        str = textEnumeration.get(KEYS.EDITOR_POSTING);
    } else if (this._type === BaseEditorView.TYPES.REPLY) {
        str = textEnumeration.get(KEYS.EDITOR_REPLY_BTN);
    } else if (this._type === BaseEditorView.TYPES.EDIT) {
        str = textEnumeration.get(KEYS.EDITOR_EDIT_BTN);
    } else {
        str = textEnumeration.get(KEYS.EDITOR_POST_BTN);
    }
    return str;
};

/**
 * Handle the blur event in the textarea.
 * @private
 */
EditorView.prototype._handleEditorBlur = function () {
    if (this._hideOnBlur && !this.$textareaEl.val()) {
        this.$el.hide();
        this.$el.trigger(EditorEvents.HIDE);
        return;
    }
    this.$el.toggleClass(this.classes.FOCUS, false);

    if (this._placeholderSupported || this.$textareaEl.val() !== '') {
        return;
    }
    var KEYS = textEnumeration.KEYS;
    var placeholderText = textEnumeration.get(KEYS.EDITOR_PLACEHOLDER);
    this.$textareaEl.val(placeholderText);
};

/**
 * Handle the focus event in the textarea.
 * @private
 */
EditorView.prototype._handleEditorFocus = function () {
    this.$el.toggleClass(this.classes.FOCUS, true);

    if (this._placeholderSupported) {
        return;
    }

    var KEYS = textEnumeration.KEYS;
    var placeholderText = textEnumeration.get(KEYS.EDITOR_PLACEHOLDER);
    if (this.$textareaEl.val() !== placeholderText) {
        return;
    }
    this.$textareaEl.val('');
};

/**
 * Handle the keydown event in the textarea.
 * @param {jQuery.Event} ev
 * @private
 */
EditorView.prototype._handleEditorKeydown = function (ev) {
    ev.stopPropagation();
    this._resize();
    var isEnter = ev.keyCode === 13;
    if (!isEnter || ev.shiftKey) {
        return;
    }
    ev.preventDefault();
    this.handlePostBtnClick();
};

/**
 * Handle the keyup event in the textarea.
 * @param {jQuery.Event} ev
 * @private
 */
EditorView.prototype._handleEditorKeyup = function (ev) {
    ev.preventDefault();
    ev.stopPropagation();
    var textVal = this.$textareaEl.val();
    this._setDraft(this.opts.editorId, textVal);
    this._resize();
    if (textVal.length === 0) {
        this._hidePostBtn();
        return;
    }
    this._showPostBtn();
};

/**
 * Callback for post completion. This handles both the success and error cases.
 * @param {Object} err
 * @param {Object} data
 * @private
 */
EditorView.prototype._handlePostComplete = function (err, data) {
    this._isPosting = false;
    this._updatePostBtnText();

    if (err) {
        this.showError(err);
        return;
    }

    if (this._type === BaseEditorView.TYPES.EDIT) {
        this.opts.model.set({
            body: this._getContents()
        });
        this.$el.trigger(ThreadEvents.NAVIGATE_TO_THREAD);
    }
    this.reset();
};

/**
 * Hide the post button and set a flag.
 * @private
 */
EditorView.prototype._hidePostBtn = function () {
    this._isPostBtnVisible && this.$postBtnEl.hide();
    this._isPostBtnVisible = false;
};

/**
 * Process the placeholder shenanigans that need to happen because IE 9- doesn't
 * support placeholders on textareas.
 * @private
 */
EditorView.prototype._processPlaceholders = function () {
    var KEYS = textEnumeration.KEYS;
    var placeholderText = textEnumeration.get(KEYS.EDITOR_PLACEHOLDER);
    if (this.$textareaEl[0].placeholder !== undefined) {
        this.$textareaEl.attr('placeholder', placeholderText);
        return;
    }
    this._placeholderSupported = false;
    this.$textareaEl.val(placeholderText);
};

/**
 * Resize the editor.
 * @private
 */
EditorView.prototype._resize = function () {
    var content = this.$textareaEl.val();
    var height = 0;
    this.$resizeEl.html(editorUtil.normalizeNewlines(content));
    $.each(this.$resizeEl.children(), function (i, child) {
        height += $(child).height();
    });
    this.$textareaEl.height(height);
};

/**
 * Show the post button and set a flag.
 * @private
 */
EditorView.prototype._showPostBtn = function () {
    this._isPostBtnVisible || this.$postBtnEl.show();
    this._isPostBtnVisible = true;
};

/**
 * Update the post button's text.
 * @private
 */
EditorView.prototype._updatePostBtnText = function () {
    this.$postBtnEl.html(this._getPostBtnText());
};

/**
 * Focus on the textarea.
 */
EditorView.prototype.focus = function () {
    editorUtil.focusAndPlaceCursorAtEnd(this.$textareaEl);
};

/** @override */
EditorView.prototype.getTemplateContext = function () {
    return {
        strings: {
            postBtn: this._getPostBtnText()
        }
    };
};

/**
 * Initialize the editor view. This keeps track of the original height of the
 * field and focuses on the textarea.
 */
EditorView.prototype.initialize = function () {
    this._originalHeight = this.$textareaEl.height();
    if (this._type !== BaseEditorView.TYPES.EDIT) {
        this._hidePostBtn();
    }
    this.focus();
};

/** @override */
EditorView.prototype.render = function () {
    BaseEditorView.prototype.render.call(this);
    this.$postBtnEl = this.$('.' + this.classes.POST_BTN);
    this.$resizeEl = this.$('.' + this.classes.RESIZE);

    var editModel = this.opts.model;
    if (editModel) {
        this.$textareaEl.val(editorUtil.normalizeParagraphTags(editModel.body));
        return;
    }
    var draft = this._getDraft(this.opts.editorId);
    if (draft) {
        this.$textareaEl.val(draft);
        return;
    }
    this._processPlaceholders();
};

/**
 * Reset the editor back to it's original state.
 */
EditorView.prototype.reset = function () {
    this.$resizeEl.html('');
    this.$textareaEl.val('');
    this._hidePostBtn();
    this.$textareaEl.height(this._originalHeight);
    this._setDraft(this.opts.editorId, null);
};

/**
 * Send the post event.
 * @param {Object} data The post data to send.
 * @override
 */
EditorView.prototype.sendPostEvent = function (data) {
    if (this._isPosting) {
        return;
    }
    this._isPosting = true;
    this._updatePostBtnText();
    this.$el.trigger(this.opts.postEvent, data);
};

/**
 * Show an error message to the user.
 * @param {string} msg The error message to display.
 * @override
 */
EditorView.prototype.showError = function (msg) {
    if (this.$errorEl) {
        return;
    }

    // TODO (mark): Eventually we'll want to have a map for error event types
    // but the SDK only returns error message strings which are useless to us.
    this.$errorEl = $(errorTemplate({msg: BaseEditorView.ERRORS.GENERIC}));
    this.$el.append(this.$errorEl);
    this.$errorEl.fadeTo(500, 0.98);
    this.$textareaEl.blur();

    this.$errorEl.one('click', $.proxy(function (ev) {
        ev.stopPropagation();
        this.$errorEl.remove();
        this.$errorEl = null;
        this.focus();
    }, this));
};

module.exports = EditorView;
