/**
 * @fileoverview
 * The tooltip for sharing a selection or adding an annotation.
 */

var $ = require('jquery');
var debounce = require('annotations/util/internals').debounce;
var inherits = require('inherits');
var Popover = require('annotations/ui/popover');

/**
 * @constructor
 * @param {Object} opts View config opts
 * @param {View} opts.content
 * @extends {Popover}
 */
function ThreadPopover(opts) {
    Popover.call(this, $.extend({
        /**
         * Amount of pixels to pad the right of the popover.
         * @type {number}
         */
        leftPadding: 30,

        /**
         * Max width of the popover.
         * @type {number}
         */
        maxWidth: opts.maxWidth || 600,

        /**
         * Minimum amount of pixels that the popover should be in view. This
         * relates to when the popover is displayed at the bottom of the
         * viewport and is outside of the bottom fold. This amount of pixels
         * must be above the fold.
         * @type {number}
         */
        minPopoverInView: 200,

        /**
         * Min width of the popover.
         * @type {number}
         */
        minWidth: 320,

        /**
         * The amount of time the scroll animation should take to bring the
         * popover into view at the top or bottom of the viewport.
         * @type {number}
         */
        scrollDuration: 500,

        /**
         * Amount of pixels to pad the popover with.
         * @type {number}
         */
        sidePadding: 10,

        /**
         * Amount of pixels that should be above the popover at the top of
         * the viewport.
         * @type {number}
         */
        topSpacing: 20
    }, opts));

    /**
     * The position of the popover. It defaults to smart positioning.
     * @type {string}
     */
    this._position = this.opts.position || Popover.POSITIONS.SMART;
}
inherits(ThreadPopover, Popover);

/** @enum {string} */
ThreadPopover.CLASSES = {
    MAIN: 'lf-thread-popover',
    MEDIA_WRAPPER: 'lf-media-wrapper',
    POSITION_PREFIX: 'lf-pos-'
};
$.extend(ThreadPopover.CLASSES, Popover.CLASSES);

/** @override */
ThreadPopover.prototype.elClass = [
    Popover.prototype.elClass,
    ThreadPopover.CLASSES.MAIN
].join(' ');

/**
 * The amount of time to wait for the popover to resize after the window has
 * been resized. Don't want to do it too soon in case the user isn't satisfied.
 * @const {number}
 */
var WINDOW_RESIZE_DELAY = 500;

/**
 * Resize timeout var.
 * @type {number}
 */
var resizeTimeout;

/**
 * Handle the resize event. Trigger a timeout for a certain amount of time until
 * the popover should reposition itself.
 * @private
 */
ThreadPopover.prototype._handleResize = debounce(function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout($.proxy(function () {
        this.resizeAndReposition(this._blockEl);
    }, this), WINDOW_RESIZE_DELAY);
}, 200);

/** @override */
ThreadPopover.prototype.hide = function (opt_callback) {
    Popover.prototype.hide.call(this, opt_callback);
    $(window).off('resize', $.proxy(this._handleResize, this));
};

/** @override */
ThreadPopover.prototype.show = function (el, opt_callback) {
    this._blockEl = el;
    Popover.prototype.show.call(this, el, opt_callback);
    $(window).on('resize', $.proxy(this._handleResize, this));
};

module.exports = ThreadPopover;
