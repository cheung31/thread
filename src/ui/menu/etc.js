/**
 * @fileOverview Etc menu view. This is the main view someone sees when they
 * click on the `...` button on a comment. This has all of the options for the
 * comment.
 */

var $ = require('jquery');
var BaseMenu = require('annotations/thread/ui/menu/base');
var dateUtil = require('annotations/util/date');
var editLinkTemplate = require('hgn!templates/thread/menu/editlink');
var inherits = require('inherits');
var textEnumeration = require('annotations/i18n/enumeration');
var ThreadEvents = require('annotations/events').thread;
var viewEnum = require('annotations/enums').navigableViews;
var visEnums = require('annotations/enums').commentVisibility;
var WriteEvents = require('annotations/events').write;

/**
 * Etc menu.
 * @constructor
 * @extends {BaseMenu}
 * @param {Object} opts Config options.
 */
function EtcMenu(opts) {
    BaseMenu.call(this, opts);

    /** @override */
    this.postEvent = ThreadEvents.NAVIGATE;
}
inherits(EtcMenu, BaseMenu);

/** @enum {string} */
var EVENT_MAP = {
    'approve': WriteEvents.POST_APPROVE,
    'edit': ThreadEvents.NAVIGATE,
    'flag': ThreadEvents.NAVIGATE,
    'share': ThreadEvents.NAVIGATE
};

/** @enum {string} */
EtcMenu.CLASSES = {
    EDIT_COUNTDOWN: 'lf-edit-countdown'
};

/** @override */
EtcMenu.prototype._buildMenuLinks = function () {
    var frag = BaseMenu.prototype._buildMenuLinks.call(this);
    if (!this._isEditable()) {
        return frag;
    }
    var showTimeRemaining = !Livefyre.user.isMod(this._model.meta.collectionId);
    this.$editLink = $(editLinkTemplate({
        key: 'edit',
        str: textEnumeration.get(textEnumeration.KEYS.MENU_ETC_OPTION_EDIT),
        showTimeRemaining: showTimeRemaining,
        timeRemaining: this._getEditTimeRemaining()
    }));
    if (showTimeRemaining) {
        this.$editCountdownEl = this.$editLink.find('.' + EtcMenu.CLASSES.EDIT_COUNTDOWN);
        this._editCountDown = setInterval($.proxy(this._updateEditTimeRemaining, this), 1000);
    }
    frag.appendChild(this.$editLink[0]);
    return frag;
};

/**
 * Build the posted at string.
 * @return {string}
 * @private
 */
EtcMenu.prototype._buildPostedAt = function () {
    var dateStr = dateUtil.getPrettyDate(this._model.createdAt);
    var i18nStr = textEnumeration.get(textEnumeration.KEYS.MENU_ETC_POSTED_AT);
    return i18nStr.replace('{date}', dateStr);
};

/**
 * @return {string} A formatted date object of the time remaining for edit.
 * @private
 */
EtcMenu.prototype._getEditTimeRemaining = function () {
    var editWindow = this._getEditWindow();
    var now = new Date();
    var minDiff = new Date(editWindow - now).getMinutes();
    return minDiff + textEnumeration.get(textEnumeration.KEYS.DATETIME_MINUTE_ABBREVIATION);
};

/**
 * @return {Date}
 * @private
 */
EtcMenu.prototype._getEditWindow = function () {
    var editWindow = new Date(this._model.createdAt);
    var minutesToEdit = this.opts.collection.settings.editCommentInterval;
    return new Date(editWindow.setMinutes(editWindow.getMinutes() + minutesToEdit));
};

/**
 * Handle the delete click event. Determine if the comment should be hidden or
 * deleted depending on whether the current user is the owner of the comment.
 */
EtcMenu.prototype._handleDeleteClick = function () {
    var KEYS = textEnumeration.KEYS;
    var postEvent = WriteEvents.POST_HIDE;

    if (this._isAuthor()) {
        postEvent = WriteEvents.POST_DELETE;
    }

    var model = this._model;
    function cb () {
        model.set({
            lastVisibility: model.visibility,
            visibility: visEnums.NONE
        });
    }
    this.$el.trigger(this.postEvent, {
        actionStr: textEnumeration.get(KEYS.MENU_ETC_OPTION_DELETE),
        model: model,
        postEvent: postEvent,
        value: viewEnum.CONFIRM,
        callback: cb
    });
};

/**
 * Determines if the current user can approve this comment.
 * @return {boolean}
 * @private
 */
EtcMenu.prototype._isApprovable = function () {
    var collectionId = this._model.meta.collectionId;
    return this._model.isPending() && Livefyre.user.isMod(collectionId);
};

/**
 * Determines if the current user is the owner of the current comment.
 * @return {boolean}
 * @private
 */
EtcMenu.prototype._isAuthor = function () {
    return Livefyre.user.get('id') === this._model.author.id;
};

/**
 * Determine if the current user can delete this comment.
 * @return {boolean}
 * @private
 */
EtcMenu.prototype._isDeletable = function () {
    var collectionId = this._model.meta.collectionId;
    return Livefyre.user.isMod(collectionId) || this._isAuthor();
};

/**
 * Determine if the current user can edit this comment.
 * @return {boolean}
 * @private
 */
EtcMenu.prototype._isEditable = function () {
    var enabled = this.opts.collection.settings.allowEditComments;
    var collectionId = this._model.meta.collectionId;
    var approved = this._model.visibility === visEnums.EVERYONE &&
        this._model.lastVisibility === visEnums.GROUP;
    return !approved && enabled && (Livefyre.user.isMod(collectionId) || this._isInEditWindow());
};

/**
 * Determine if the current user can flag this comment.
 * @return {boolean}
 * @private
 */
EtcMenu.prototype._isFlaggable = function () {
    return !this._model.isUserAuthor();
};

/**
 * Determine if the comment is still editable.
 * @return {boolean}
 * @private
 */
EtcMenu.prototype._isInEditWindow = function () {
    if (!this._isAuthor()) {
        return false;
    }
    return new Date() < this._getEditWindow();
};

/**
 * Update the time remaining until the edit window is closed.
 * @private
 */
EtcMenu.prototype._updateEditTimeRemaining = function () {
    if (!this._isEditable()) {
        this.$editLink.remove();
        clearInterval(this._editCountDown);
        return;
    }
    if (Livefyre.user.isMod(this._model.meta.collectionId)) {
        this.$editCountdownEl.remove();
        clearInterval(this._editCountDown);
        return;
    }
    this.$editCountdownEl.html(this._getEditTimeRemaining());
};

/** @override */
EtcMenu.prototype.destroy = function () {
    BaseMenu.prototype.destroy.call(this);
    this.$editCountdownEl = null;
    this.$editLink = null;
    clearInterval(this._editCountDown);
};

/** @override */
EtcMenu.prototype.getLinkConfig = function () {
    var KEYS = textEnumeration.KEYS;
    var cfg = [{
        key: 'share',
        str: textEnumeration.get(KEYS.MENU_ETC_OPTION_SHARE)
    }];
    if (this._isFlaggable()) {
        cfg.push({
            key: 'flag',
            str: textEnumeration.get(KEYS.MENU_ETC_OPTION_FLAG)
        });
    }
    if (this._isDeletable()) {
        cfg.push({
            key: 'delete',
            str: textEnumeration.get(KEYS.MENU_ETC_OPTION_DELETE)
        });
    }
    if (this._isApprovable()) {
        cfg.push({
            key: 'approve',
            str: textEnumeration.get(KEYS.MENU_ETC_OPTION_APPROVE)
        });
    }
    return cfg;
};

/** @override */
EtcMenu.prototype.getTemplateContext = function () {
    var data = BaseMenu.prototype.getTemplateContext.call(this);
    var KEYS = textEnumeration.KEYS;
    $.extend(data.strings, {
        postedAt: this._buildPostedAt(),
        title: textEnumeration.get(KEYS.MENU_ETC_TITLE)
    });
    return data;
};

/** @override */
EtcMenu.prototype.handleOptionClick = function (ev) {
    var $target = $(ev.currentTarget);
    var value = $target.attr('data-value');

    if (value === 'delete') {
        return this._handleDeleteClick();
    }

    this.postEvent = EVENT_MAP[value];
    BaseMenu.prototype.handleOptionClick.call(this, ev);
};

/** @override */
EtcMenu.prototype.subTemplate = require('hgn!templates/thread/menu/etc');

module.exports = EtcMenu;
