'use strict';

var inherits = require('inherits');
var ContentListView = require('streamhub-sdk/content/views/content-list-view');

var ContentAncestorsView = function (opts) {
    opts = opts || {};

    if (! opts.content) {
        throw 'Expected opts.content when constructing ContentAncestorsView';
    }

    opts.autoRender = false;
    opts.maxVisibleItems = 2;
    ContentListView.call(this, opts);

    this.content = opts.content;
};
inherits(ContentAncestorsView, ContentListView);

ContentAncestorsView.prototype._addAncestors = function (ancestors) {
    ancestors = ancestors || [];
    for (var i=0; i < ancestors.length; i++) {
        var ancestor = ancestors[i];
        this.add(ancestor);
    }
};

ContentAncestorsView.prototype.createContentView = function (content) {
    var ContentThreadView = require('thread');
    return new ContentThreadView({
        content: content
    });
};

ContentAncestorsView.prototype.render = function () {
    ContentListView.prototype.render.call(this);
    this._addAncestors();
};

module.exports = ContentAncestorsView;
