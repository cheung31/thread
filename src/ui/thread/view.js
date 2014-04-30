/**
 * @fileOverview The thread view class. This is the base view that loads the
 * editor and stream views. This is what gets loaded when the popover shows.
 */

var $ = require('jquery');
var debug = require('streamhub-sdk/debug');
var inherits = require('inherits');
var loader = require('livefyre-bootstrap/loader');
var QueueDecorator = require('annotations/thread/ui/queuedecorator');
var textEnumeration = require('annotations/i18n/enumeration');
var ThreadContainer = require('thread/ui/thread-container');
var ThreadEvents = require('annotations/events').thread;
var View = require('view');
var viewEnum = require('annotations/enums').navigableViews;
var WriteEvents = require('annotations/events').write;
var gradientTemplate = require('hgn!templates/thread/thread/gradient');

var log = debug('annotations/thread/ui/thread/view');

/**
 * Thread view.
 * @constructor
 * @extends {View}
 * @param {Object} opts Config options.
 */
var ThreadView = function(opts) {
    View.call(this, opts);

    /**
     * Editor view.
     * @type {?EditorView}
     * @private
     */
    this._editorView = null;

    /**
     * Stream view.
     * @type {ThreadContainer}
     * @private
     */
    this._streamView = this.createStreamView({
        content: opts.content
    });

    //QueueDecorator.decorate(this._streamView);

    this._content = opts.content;
    if (this._content) {
        this._content.on('reply', function (content) {
            // Comments should only be prepended if they're from the current user
            // and if they are top level comments.
            //prepend = content.isUserAuthor() && !comment.parentId;
            var prepend = !content.parentId;
            this._streamView.add(content);
        }.bind(this));
        //var comments = [this._content].concat(this._content.replies);
        //this._streamView.initialize(comments, this._content.id);
    }
};
inherits(ThreadView, View);

/** @enum {string} */
ThreadView.CLASSES = {
    LOADER: 'lf-loader-container',
    POWERED_BY: 'lf-powered-by',
    THREAD: 'lf-thread'
};

/** @override */
ThreadView.prototype.elClass = ThreadView.CLASSES.THREAD;

/** @override */
ThreadView.prototype.elTag = 'section';

/** @override */
ThreadView.prototype.events = (function () {
    var events = {};
    events['click .' + ThreadView.CLASSES.POWERED_BY] = '_handlePoweredByClick';
    return events;
})();

/** @override */
ThreadView.prototype.template = require('hgn!templates/thread/thread/view');

/**
 * Handle the powered by click event. Open the info menu.
 * @param {jQuery.Event} ev
 * @private
 */
ThreadView.prototype._handlePoweredByClick = function (ev) {
    if (this.opts.isCustomNetwork) {
        return;
    }
    ev.preventDefault();
    this.$el.trigger(ThreadEvents.NAVIGATE, {
        value: viewEnum.INFO
    });
};


/**
 * Load the thread view the way FSM intended, with an editor and content.
 * @private
 */
ThreadView.prototype._renderChildren = function () {
    this.$el.prepend($(gradientTemplate()));
    //this._streamView.render();
    this.$('.' + ThreadView.CLASSES.LOADER).remove();
    this.$el.children().first().after(this._streamView.$el);
};

/**
 * @param {Object} opts
 * @return {ThreadContainer} comment
 */
ThreadView.prototype.createStreamView = function (opts) {
    return new ThreadContainer(opts);
};

/** @override */
ThreadView.prototype.destroy = function () {
    View.prototype.destroy.call(this);

    this._authorView && this._authorView.destroy();
    this._authorView = null;
    this._editorView && this._editorView.destroy();
    this._editorView = null;
};

/** @override */
ThreadView.prototype.getTemplateContext = function () {
    return {
        strings: {
            appName: textEnumeration.get(textEnumeration.KEYS.APP_NAME)
        }
    };
};

/**
 * @return {ThreadContainer} comment
 */
ThreadView.prototype.getThreadContainer = function () {
    return this._streamView;
};

/**
 * Handle the thread retrieval failure response.
 * @param {string} err Err info.
 */
ThreadView.prototype.handleFetchThreadFailure = function (err) {
    err && log(err);
    this._renderChildren();
};

/**
 * Handle the thread retrieval success response, or the case of a new thread
 * with no content yet. Load the thread view the way FSM intended, with an
 * editor and content.
 * @param {?Array.<Comment>} opt_comments Thread data.
 */
ThreadView.prototype.handleFetchThreadSuccess = function (opt_comments) {
    this._renderChildren();

    if (!opt_comments || !opt_comments.length) {
        return;
    }

    // Need to sort the comments so that we have the top level comments come
    // before the replies.
    opt_comments.sort(function(a, b) {
        return !a.parentId ? -1 : 1;
    });
    this._streamView.initialize(opt_comments);
};

/** @override */
ThreadView.prototype.render = function () {
    this.$el.html(this.template(this.getTemplateContext(), {
        loader: require('hgn!templates/thread/loader').template
    }));
    loader.decorate(this.$('.' + ThreadView.CLASSES.LOADER), 60);
    this.handleFetchThreadSuccess();
};

module.exports = ThreadView;
