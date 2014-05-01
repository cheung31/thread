'use strict';

var inherits = require('inherits');
var ListView = require('streamhub-sdk/views/list-view');
var ContentViewFactory = require('streamhub-sdk/content/content-view-factory');

var BaseThreadContainer = function (opts) {
    opts = opts || {};

    this._contentViewFactory = opts.contentViewFactory || new ContentViewFactory();

    /**
     * Comment constructor.
     * @type {function()}
     * @private
     */
    this._contentConstructor = opts.contentConstructor;

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

    opts.autoRender = false;
    ListView.call(this, opts);

    if (opts.content) {
        this.add(opts.content);
    }
};
inherits(BaseThreadContainer, ListView);

BaseThreadContainer.prototype._getContentOptions = function (content) {
    return {
        model: content,
        contentView: this._contentViewFactory.createContentView(content)
    };
};

/**
 * 
 */
BaseThreadContainer.prototype.add = function (content, forcedIndex) {
    if (!!this._comments[content.id]) {
        return;
    }

    //TODO(ryanc): TopCommentView?
    var view = new this._contentConstructor(
        this._getContentOptions(content)
    );

    ListView.prototype.add.call(this, view, forcedIndex);

    this._commentIds.push(content.id);
    this._comments[content.id] = view;
};

module.exports = BaseThreadContainer;
