/**
 * @fileOverview Etc menu view. This is the main view someone sees when they
 * click on the `...` button on a comment. This has all of the options for the
 * comment.
 */
var BaseMenu = require('annotations/thread/ui/menu/base');
var EditorView = require('annotations/thread/ui/editorview');
var inherits = require('inherits');
var textEnumeration = require('annotations/i18n/enumeration');
var WriteEvents = require('annotations/events').write;

/**
 * Etc menu.
 * @constructor
 * @extends {BaseMenu}
 * @param {Object} opts Config options.
 */
function EditMenu(opts) {
    BaseMenu.call(this, opts);

    /** @override */
    this.postEvent = WriteEvents.POST_EDIT;
}
inherits(EditMenu, BaseMenu);

/** @override */
EditMenu.prototype.getTemplateContext = function () {
    var data = BaseMenu.prototype.getTemplateContext.call(this);
    var KEYS = textEnumeration.KEYS;
    data.strings.title = this._model.parentId ?
        textEnumeration.get(KEYS.EDITOR_EDIT_REPLY_TITLE) :
        textEnumeration.get(KEYS.EDITOR_EDIT_TITLE);
    return data;
};

/** @override */
EditMenu.prototype.render = function () {
    BaseMenu.prototype.render.call(this);
    this._editorView = new EditorView({
        hideOnBlur: false,
        model: this._model,
        postEvent: this.postEvent,
        type: EditorView.TYPES.EDIT
    });
    this._editorView.render();
    this.$('.' + BaseMenu.CLASSES.BODY).append(this._editorView.$el);
};

/**
 * Implement the initialize so that the editor can initialze when actually in the DOM.
 */
EditMenu.prototype.initialize = function () {
    this._editorView.initialize();
};

module.exports = EditMenu;
