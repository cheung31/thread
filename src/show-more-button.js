'use strict';

var inherits = require('inherits');
var BaseShowMoreButton = require('streamhub-sdk/views/show-more-button');
var template = require('hgn!thread/templates/show-more-button');
var showMoreButtonStyles = require('less!thread/css/show-more-button.less');

var ShowMoreButton = function (opts) {
    BaseShowMoreButton.call(this, opts);
    this._count = 0;
};
inherits(ShowMoreButton, BaseShowMoreButton);

ShowMoreButton.prototype.template = template;
ShowMoreButton.prototype.newNotificationClass = 'hub-more-button-holding';

ShowMoreButton.prototype.getTemplateContext = function () {
    return {
        count: this._count
    };
};

ShowMoreButton.prototype.getCount = function () {
    return this._count;
};

ShowMoreButton.prototype.setCount = function (count) {
    if (count > this._count) {
        this.$el.addClass(this.newNotificationClass);
    }
    this._count = count;
    this.$el.html(this.template(this.getTemplateContext()));
};

ShowMoreButton.prototype.render = function () {
    BaseShowMoreButton.prototype.render.apply(this, arguments);
    this.$el
        .addClass('hub-btn')
        .addClass('hub-btn-link')
        .addClass('hub-btn-xs');
};

module.exports = ShowMoreButton;
