var ContentThreadView = require('thread');
var LivefyreContent = require('streamhub-sdk/content/types/livefyre-content');
var ContentViewFactory = require('streamhub-sdk/content/content-view-factory');
var ContentRepliesView = require('thread/content-replies-view');
var ListView = require('streamhub-sdk/views/list-view');

'use strict';

describe('ContentThreadView', function () {
    var now = new Date();
    var content = new LivefyreContent();
    content.id = 'a';
    content.body = 'hi';
    content.author = { id: 'jimmy' };

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
            expect(threadView._repliesView._nestLevel).toBe(threadView._nestLevel+1);
        });

        it('max nest level is same as root', function () {
            expect(threadView._repliesView._maxNestLevel).toBe(threadView._maxNestLevel);
        });

        it('has a default order of newest to oldest', function () {
            expect(threadView._repliesView._order).toBe(ContentRepliesView.ORDERS.CREATEDAT_DESCENDING);
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
        var parentContent = new LivefyreContent({ body: 'parent' });
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
    describe('opts.maxVisibleItems (The number of visible items in a thread not hidden by more button', function () {
        var reply1,
            reply2,
            threadView;

        beforeEach(function () {
            var reply1 = new LivefyreContent();
            reply1.id = 'b';
            reply1.body = 'Reply 1';
            reply1.createdAt = new Date(now - (60000 * 4));
            reply1.author = { id: 'jimmy' };
            reply1.parentId = content.id;

            var reply2 = new LivefyreContent();
            reply2.body = 'Reply 2';
            reply2.id = 'c';
            reply2.createdAt = new Date(now - (60000 * 3));
            reply2.author = { id: 'jimmy' };
            reply2.parentId = content.id;

            content.addReply(reply1);
            content.addReply(reply2);
            expect(content.replies.length).toBe(2);

            threadView = new ContentThreadView({
                content: content,
                maxVisibleItems: 1
            });
            threadView.render();
        });

        afterEach(function () {
            content.parentId = undefined;
            content.replies = [];
        });

        it('should only have one visible reply view', function () {
            waitsFor(function () {
                return threadView.$el.find('.lf-thread-replies [data-thread-nest-level="1"]').length === 1;
            });

            runs(function () {
                expect(threadView.$el.find('.lf-thread-replies [data-thread-nest-level="1"]').length).toBe(1);
            });
        });

        it('should have a more button displayed', function () {
            waitsFor(function () {
                return threadView.$el.find('.lf-thread-replies [data-thread-nest-level="1"]').length === 1;
            });

            runs(function () {
                var moreButtonEl = threadView.$el
                    .find('.lf-thread-replies > .hub-list-more')
                    .filter(function (idx, el) {
                       return $(el).parent().prev().attr('data-content-id') !== 'c';
                    });

                expect(moreButtonEl.css('display')).not.toBe('none');
                expect(moreButtonEl.text().trim()).toBe('View 1 more replies');
            });
        });
    });
});
