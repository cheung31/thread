/**
 * @fileOverview Permalink thread container.
 */

var $ = require('jquery');
var inherits = require('inherits');
var NavBar = require('annotations/mobile/thread/ui/navbar');
var permalinkMissingTemplate = require('hgn!templates/thread/permalinkmissing');
var textEnumeration = require('annotations/i18n/enumeration');
var ThreadContainer = require('annotations/thread/ui/threadcontainer');
var ThreadEvents = require('annotations/events').thread;

/**
 * Permalink thread container.
 * @extends {ThreadContainer}
 * @param {Object} opts
 */
function PermalinkThreadContainer(opts) {
    ThreadContainer.call(this, opts);

    /**
     * The navbar component.
     * @type {?NavBar}
     * @private
     */
    this._navbar = null;
}
inherits(PermalinkThreadContainer, ThreadContainer);

/** @enum {string} */
var CLASSES = {
    MAIN: 'lf-permalink',
    STREAM: 'lf-thread-container'
};

/** @override */
PermalinkThreadContainer.prototype.elClass = CLASSES.MAIN;

/** @override */
PermalinkThreadContainer.prototype.elTag = 'section';

/** @override */
PermalinkThreadContainer.prototype.template = require('hgn!templates/thread/threadcontainer');

/** @override */
PermalinkThreadContainer.prototype.destroy = function () {
    ThreadContainer.prototype.destroy.call(this);
    this._navbar && this._navbar.destroy();
};

/** @override */
PermalinkThreadContainer.prototype.getContainerElement = function () {
    return this.$('.' + CLASSES.STREAM);
};

/** @override */
PermalinkThreadContainer.prototype.initialize = function (comments) {
    // It's possible that there are no comments. In this case we should show
    // a 404 screen.
    if (!comments || !comments.length) {
        var KEYS = textEnumeration.KEYS;
        this.getContainerElement().append($(permalinkMissingTemplate({
            doesNotExist: textEnumeration.get(KEYS.PERMALINK_MISSING)
        })));
        return;
    }

    ThreadContainer.prototype.initialize.call(this, comments);

    var comment;
    // Grab the only top level comment in the array of comments. Don't need to
    // iterate over all of them since there will only ever be 1.
    for (var i=0, len=comments.length; i<len; i++) {
        comment = comments[i];
        if (!comment.parentId) {
            break;
        }
    }

    // Get the TopCommentView for this top level comment, highlight it's
    // selected text if it has some and then disable mouse events on the comment
    // so that it won't unhighlight.
    var commentView = this._comments[comment.id];
    commentView.handleMouseEnter();
    commentView.disableMouseEvents(true);
};

/** @override */
PermalinkThreadContainer.prototype.render = function () {
    ThreadContainer.prototype.render.call(this);

    var KEYS = textEnumeration.KEYS;
    this._navbar = new NavBar({
        backEvent: ThreadEvents.PERMALINK_BACK,
        backStr: textEnumeration.get(KEYS.PERMALINK_BACK_BTN),
        title: textEnumeration.get(KEYS.PERMALINK_TITLE)
    });

    this._navbar.render();
    this.$el.prepend(this._navbar.$el);
};

module.exports = PermalinkThreadContainer;
