/**
 * @fileOverview The editor view class. This contains the editor box and any
 * buttons that go along with it.
 */

var $ = require('jquery');
var Editor = require('streamhub-editor/editor');
var inherits = require('inherits');
var normalizeNewlines = require('annotations/util/editor').normalizeNewlines;
var textEnumeration = require('annotations/i18n/enumeration');

/**
 * Editor view.
 * @constructor
 * @extends {Editor}
 * @param {Object} opts Config options.
 */
function BaseEditorView(opts) {
    Editor.call(this, opts);
}
inherits(BaseEditorView, Editor);

/** @enum {string} */
BaseEditorView.TYPES = {
    EDIT: 'edit',
    REPLY: 'reply',
    WRITE: 'write'
};

/** @type {string} */
var DRAFT_PREFIX = 'draft-';

/** @type {Object} */
var DRAFTS = {};

/** @enum {string} */
BaseEditorView.ERRORS = {
    BODY: 'Please enter a body',
    GENERIC: 'There was an error'
};

/**
 * Get the contents of the editor and do any processing required.
 * @return {string}
 * @private
 */
BaseEditorView.prototype._getContents = function () {
    var content = this.$textareaEl.val();
    return normalizeNewlines(content);
};

/**
 * Build the post event object that will be dispatched from the editor.
 * @return {Object} The post event object.
 * @override
 */
BaseEditorView.prototype.buildPostEventObj = function () {
    return {
        body: this._getContents(),
        callback: $.proxy(this._handlePostComplete, this),
        model: this.opts.model,
        parentId: this.opts.parentId,
        shareTypes: []
    };
};

/**
 * Get the draft (if there is one) for a block.
 * @param {string} editorId The ID of the block/comment to retrieve the draft for.
 * @private
 * @return {?string}
 */
BaseEditorView.prototype._getDraft = function (editorId) {
    return DRAFTS[DRAFT_PREFIX + editorId];
};

/**
 * Set the draft for a block.
 * @param {string} editorId The ID of the block/comment to add a draft for.
 * @param {string} draft The text to save in memory.
 * @private
 */
BaseEditorView.prototype._setDraft = function (editorId, draft) {
    return DRAFTS[DRAFT_PREFIX + editorId] = draft;
};

/**
 * Validate the post data.
 * @param {Object} data The post data to be validated.
 * @return {boolean} Whether the post data is valid or not.
 * @override
 */
BaseEditorView.prototype.validate = function (data) {
    var body = data.body;
    if (!body) {
        this.showError(BaseEditorView.ERRORS.BODY);
        return false;
    }
    var KEYS = textEnumeration.KEYS;
    if (body === textEnumeration.get(KEYS.EDITOR_PLACEHOLDER)) {
        this.showError(BaseEditorView.ERRORS.BODY);
        return false;
    }
    return true;
};

module.exports = BaseEditorView;
