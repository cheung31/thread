'use strict';

var inherits = require('inherits');
var BaseThreadContainer = require('thread/ui/base-thread-container');
var TopCommentView = require('thread/ui/comment/topview');

var ThreadContainer = function (opts) {
    opts = opts || {};
    opts.contentConstructor = TopCommentView;
    BaseThreadContainer.apply(this, arguments);
};
inherits(ThreadContainer, BaseThreadContainer);

/** @enum {string} */
ThreadContainer.CLASSES = {
    BASE: 'lf-thread-container',
    GRADIENT: 'lf-thread-gradient'
};

/** @override */
ThreadContainer.prototype.elClass = ThreadContainer.CLASSES.BASE;

/** @override */
ThreadContainer.prototype.elTag = 'section';

ThreadContainer.prototype.add = function (content, forcedIndex) {
    BaseThreadContainer.prototype.add.apply(this, arguments);

    if (this._comments[content.id]) {
        var parent = this._comments[content.id].getThreadContainer();
        for (var i=0; i < content.replies.length; i++) {
            parent.add(content.replies[i]);
        }
    }
};

module.exports = ThreadContainer;
