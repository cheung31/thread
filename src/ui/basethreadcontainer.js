/**
 * @fileOverview Thread container view. This provides functionality to add,
 * remove, and sort comments.
 */

var $ = require('jquery');
var ArrayUtil = require('annotations/util/array');
var inherits = require('inherits');
var SortingUtil = require('annotations/util/sorting');
var View = require('view');
var ContentViewFactory = require('streamhub-sdk/content/content-view-factory');

/**
 * Thread container view.
 * @constructor
 * @extends {View}
 * @param {Object} opts Config options.
 */
var BaseThreadContainer = function(opts) {
    View.call(this, opts);

    /**
     * Comment constructor.
     * @type {function()}
     * @private
     */
    this._commentConstructor = this.opts.commentConstructor;

    this._contentViewFactory = opts.contentViewFactory || new ContentViewFactory()

    /**
     * Sorted set of all comment ids.
     * @type {Array.<string>}
     * @private
     */
    this._commentIds = [];

    /**
     * Set of all comments.
     * @type {Object.<string, CommentView>}
     * @private
     */
    this._comments = {};
};
inherits(BaseThreadContainer, View);

/**
 * Get the comment options that get passed into the view.
 * @param {Comment} comment The comment model for the view.
 * @return {Object}
 * @private
 */
BaseThreadContainer.prototype._getCommentOptions = function (comment) {
    return {
        assetServer: this.opts.assetServer,
        defaultAvatar: this.opts.defaultAvatar,
        model: comment,
        contentView: this._contentViewFactory.createContentView(comment)
    };
};

/**
 * Adds a comment to the thread container. This will add the comment to the
 * internal list of comments that are here, create a comment view and render it.
 * @param {Comment|Array.<Comment>} comments The comment model(s) to add.
 * @param {boolean=} opt_prepend Optional prepend the comment instead of append.
 * @param {Element=} opt_el Optional element to render onto.
 */
BaseThreadContainer.prototype.addComment = function(comments, opt_prepend, opt_el) {
    var el = opt_el || this.getContainerElement();
    if (!$.isArray(comments)) {
        comments = [comments];
    }
    $.each(comments, $.proxy(this.processComment, this, !!opt_prepend, $(el)));
};

/** @override */
BaseThreadContainer.prototype.comparator = SortingUtil.createdAtComparator;

/**
 * Get the container element that the comments should be added to.
 * @return {Element}
 */
BaseThreadContainer.prototype.getContainerElement = function() {
    return this.$el;
};

/**
 * Initialize the thread container with a set of comments. These should all be
 * rendered prior to adding to the DOM so there is only 1 DOM write.
 * @param {Array.<Comment>} comments The set of comments to load.
 */
BaseThreadContainer.prototype.initialize = function(comments) {
    var currentEl = this.getContainerElement();
    var fragment = document.createDocumentFragment();
    this.addComment(comments, false, fragment);
    currentEl.append(fragment);
};

/**
 * Process a comment. Create a new view, find the index where it needs to go in
 * the sorted list, and insert it into the DOM.
 * @param {boolean} prepend To prepend or not to prepend, that is the question...
 * @param {jQuery.Element} el The containing element to add the comment view to.
 * @param {number} i The index of the array that this comment exists.
 * @param {Comment} comment The comment to process.
 */
BaseThreadContainer.prototype.processComment = function(prepend, el, i, comment) {
    if (!!this._comments[comment.id]) {
        return;
    }
    var view = new this._commentConstructor(this._getCommentOptions(comment));
    //view.renderComment();
    view.render();
    //TODO(ryanc): TopCommentView?
    //var view = new this._commentConstructor({ content: comment });
    //view.render();
    this._comments[comment.id] = view;

    if (prepend) {
        this._commentIds.splice(0, 0, comment.id);
        el.prepend(view.$el);
        return;
    }

    var comparatorFn = $.proxy(this.comparator, this);
    var idx = ArrayUtil.findIndex(this._commentIds, comment.id, comparatorFn);

    if (idx >= this._commentIds.length) {
        this._commentIds.push(comment.id);
        el.append(view.$el);
        return;
    }
    this._commentIds.splice(idx, 0, comment.id);
    view.$el.insertBefore(el[0].childNodes[idx]);
};

/**
 * Reinitialize with the current set of comments + some new friends
 * @param {?Array.<Comment>} opt_comments The set of new comments to add.
 */
BaseThreadContainer.prototype.reinitialize = function(opt_comments) {
    opt_comments = opt_comments || [];
    var comments = [];
    var comment;
    var commentView;
    for (var i=0, len=this._commentIds.length; i < len; i++) {
        commentView = this._comments[this._commentIds[i]];
        comment = commentView.getModel();
        comments.push(comment);
        commentView.destroy();
    }
    this._commentIds = [];
    this._comments = {};

    comments.push.apply(comments, opt_comments);
    this.getContainerElement().empty();
    this.initialize(comments);
};

module.exports = BaseThreadContainer;
