var ContentThreadView = require('thread');
var Content = require('streamhub-sdk/content');
var ContentViewFactory = require('streamhub-sdk/content/content-view-factory');
var ListView = require('streamhub-sdk/views/list-view');

'use strict';

describe('ContentThreadView', function () {
    var content = new Content({ body: 'hi' });
    content.id = 'content1';

    afterEach(function () {
        content.parentId = undefined;
        content.replies = [];
    });

    describe('can be constructed with just opts.content', function () {
        var threadView;

        beforeEach(function () {
            threadView = new ContentThreadView({
                content: content
            });
        });

        it('has a default theme class', function () {
            expect(threadView.$el.hasClass('lf-thread-default')).toBe(true);
        });

        it('has a default max nest level', function () {
            expect(threadView._maxNestLevel).toBe(4);
        });

        it('has a default max visible items', function () {
            expect(threadView._maxVisibleItems).toBe(2);
        });

        it('has a default content view factory', function () {
            expect(threadView._contentViewFactory instanceof ContentViewFactory).toBe(true);
        });
    });

    it ('can be constructed with opts.themeClass', function () {
        var threadView = new ContentThreadView({
            content: content,
            themeClass: 'myTheme'
        });

        expect(threadView.$el.hasClass('myTheme')).toBe(true);
    });

    it('can be constructed with opts.maxNestLevel', function () {
        var threadView = new ContentThreadView({
            content: content,
            maxNestLevel: 2
        });

        expect(threadView._maxNestLevel).toBe(2);
    });

    describe('_repliesView', function () {
        var threadView;

        beforeEach(function () {
            threadView = new ContentThreadView({
                content: content
            });
        });

        it('nest level is one greater than root', function () {
            expect(threadView._repliesView._nestLevel).toBe(threadView._nestLevel+1)
        });

        it('max nest level is same as root', function () {
            expect(threadView._repliesView._maxNestLevel).toBe(threadView._maxNestLevel);
        });

        it('has a default order of newest to oldest', function () {
            expect(threadView._repliesView._order).toBe(threadView.order.NEWEST);
        });
    });

    describe('A content item with no replies and no parents', function () {
        var threadView = new ContentThreadView({
            content: content
        });

        it('is a root and leaf ContentThreadView', function () {
            expect(threadView._isRoot).toBe(true);
            expect(threadView._isLeaf).toBe(true);
        });
    });

    describe('A content item with parents (a reply)', function () {
        var parentContent = new Content({ body: 'parent' });
        parentContent.id = 'content2';

        content.parentId = parentContent.id;
        var threadView = new ContentThreadView({
            content: content
        });

        it('is not a root ContentThreadView', function () {
            expect(threadView._isRoot).toBe(false);
        });
    });

    //isLeaf test

    //maxVisibleItems test

    //order test
});
