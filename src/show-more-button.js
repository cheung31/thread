'use strict';

var inherits = require('inherits');
var BaseShowMoreButton = require('streamhub-sdk/views/show-more-button');
var template = require('hgn!thread/templates/show-more-button');

var ShowMoreButton = function (opts) {
    BaseShowMoreButton.call(this, opts);

    this._count = 0;
};
inherits(ShowMoreButton, BaseShowMoreButton);

ShowMoreButton.prototype.template = template;

ShowMoreButton.prototype.getTemplateContext = function () {
    return {
        count: this._count
    };
};

ShowMoreButton.prototype.getCount = function () {
    return this._count;
};

ShowMoreButton.prototype.setCount = function (count) {
    this._count = count;
    this.$el.html(this.template(this.getTemplateContext()));
};

ShowMoreButton.prototype.render = function () {
    BaseShowMoreButton.prototype.render.apply(this, arguments);
    this.$el
        .addClass('lf-btn')
        .addClass('lf-btn-link')
        .addClass('lf-btn-xs');
};

module.exports = ShowMoreButton;
