/**
 * @fileOverview The thread view class. This is the base view that loads the
 * editor and stream views. This is what gets loaded when the popover shows.
 */

var $ = require('jquery');
var abstractMethod = require('annotations/util/internals').abstractMethod;
var inherits = require('inherits');
var View = require('view');

/**
 * Stream view.
 * @constructor
 * @extends {View}
 * @param {Object} opts Config options.
 */
var ThreadView = function(opts) {
    View.call(this, opts);

    /**
     * Stream view.
     * @type {StreamView}
     * @private
     */
    this._streamView = this.createStreamView();

    // Bind login and logout events.
    Livefyre.user.on('login', $.proxy(this._handleUserLogin, this));
    Livefyre.user.on('logout', $.proxy(this._handleUserLogout, this));
};
inherits(ThreadView, View);

/** @enum {string} */
ThreadView.CLASSES = {
    LOADER: 'lf-loader',
    THREAD: 'lf-thread'
};

/** @override */
ThreadView.prototype.elClass = ThreadView.CLASSES.THREAD;

/** @override */
ThreadView.prototype.elTag = 'section';

/**
 * Handle the user login event.
 * @abstract
 * @private
 */
ThreadView.prototype._handleUserLogin = abstractMethod;

/**
 * Handle the user logout event.
 * @abstract
 * @private
 */
ThreadView.prototype._handleUserLogout = abstractMethod;


/** @override */
ThreadView.prototype.destroy = function() {
    View.prototype.destroy.call(this);
    Livefyre.user.removeListener('login', $.proxy(this._handleUserLogin, this));
    Livefyre.user.removeListener('logout', $.proxy(this._handleUserLogout, this));
};

/**
 * Handle the thread retrieval failure response.
 * @abstract
 * @param {string} err Err info.
 */
ThreadView.prototype.handleFetchThreadFailure = abstractMethod;

/**
 * Handle the thread retrieval success response, or the case of a new thread
 * with no content yet. Load the thread view the way FSM intended, with an
 * editor and content.
 * @abstract
 * @param {?Array.<Comment>} opt_comments Thread data.
 */
ThreadView.prototype.handleFetchThreadSuccess = abstractMethod;

/**
 * @return {StreamView}
 */
ThreadView.prototype.getStreamView = function () {
    return this._streamView;
};

/**
 * @abstract
 * @return {StreamView}
 */
ThreadView.prototype.createStreamView = abstractMethod;

module.exports = ThreadView;
