var ContentRepliesView = require('thread/content-replies-view');
var ContentThreadView = require('thread');
var LivefyreContent = require('streamhub-sdk/content/types/livefyre-content');
var ContentViewFactory = require('streamhub-sdk/content/content-view-factory');
var ListView = require('streamhub-sdk/views/list-view');

'use strict';

describe('ContentRepliesView', function () {
    var now = new Date();
    var content;

    describe('can be constructed with just opts.content', function () {

        var repliesView;

        beforeEach(function () {
            content = new LivefyreContent();
            content.id = 'a';
            content.body = 'hi';
            content.author = { id: 'jimmy' };

            repliesView = new ContentRepliesView({
                content: content
            });
        });

        it("observes the content's reply event", function () {
            expect(repliesView.content._listeners).hasOwnProperty('reply');
        });

        it('has a default Content View factory', function () {
            expect(repliesView._contentViewFactory instanceof ContentViewFactory).toBe(true);
        });

        it('has a list view', function () {
            expect(repliesView._listView instanceof ListView).toBe(true);
        });
    });

    describe('when a reply streams in', function () {

        var repliesView,
            reply;

        beforeEach(function () {
            content = new LivefyreContent();
            content.id = 'a';
            content.body = 'hi';
            content.author = { id: 'jimmy' };

            repliesView = new ContentRepliesView({
                content: content,
                createReplyView: function (opts) {
                    return new ContentThreadView(opts);
                }
            });

            reply = new LivefyreContent();
            reply.id = 'b';
            reply.body = 'bye';
            reply.author = { id: 'joe' };
            reply.parentId = content.id;
        });

        it('calls _onReply', function () {
            spyOn(repliesView, '_onReply');
            content.addReply(reply);
            expect(repliesView._onReply).toHaveBeenCalled();
        });

        describe('when reply content is already posted', function () {

            it("does not add to list view. Sets the posted content's id", function () {
                repliesView._contentPosted = reply;
                reply.id = undefined;
                repliesView._onReply(reply);
                expect(repliesView._contentPosted.id).toBe(reply.id);
            });
        });

        describe('when reply content has not yet been posted', function () {

            describe("reply content is by the authenticated user", function () {
            });

            it("when sort order is CREATEDAT_DESCENDING, is pushed into the queue stream", function () {
                expect(repliesView.comparator).toBe(ListView.prototype.comparators.CREATEDAT_DESCENDING);
                spyOn(repliesView, 'pushQueue');
                repliesView._onReply(reply);
                expect(repliesView.pushQueue).toHaveBeenCalled();
            });

            it("when sort order is CREATEDAT_ASCENDING, is pushed into the more stream", function () {
                repliesView.comparator = ListView.prototype.comparators.CREATEDAT_ASCENDING;
                spyOn(repliesView, 'pushMore');
                repliesView._onReply(reply)
                expect(repliesView.pushMore).toHaveBeenCalled();
            });

        });
    });
});
