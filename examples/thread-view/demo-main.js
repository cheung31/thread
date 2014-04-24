var Collection = require('streamhub-sdk/collection');
var LivefyreContent = require('streamhub-sdk/content/types/livefyre-content');
var ThreadViewFactory = require('thread/thread-view-factory');

/**
 * Insantiate a single ContentView
 * to test out the styling of individual items
 */
// Sample content body from mlive.com/lions
var content = new LivefyreContent();
content.body = '<p>Greenwood can play now, he is no bum.</p>'+
    '<p>Delmas isn\'t getting paid that much at all, he hit a lot of incentives last year.</p>'+
    '<p>J. Byrd will be far too expensive for us to afford.</p>'+
    '<p>Houston may be gone, for what he is making he was quite pedestrian last year.</p>'+
    '<p>We have to get Dennard, our defensive rank goes up by at least 7 positions this year if we do.</p>';
content.title = "I am such title";
content.author = {
    displayName: 'gobengo',
    avatar: 'http://www.gravatar.com/avatar/710b26b2330f4a1b310c244ae917bf0b.png'
};
content.id = 'a';

var reply = new LivefyreContent();
reply.body = 'You speak the truth.';
reply.author = {
    displayName: 'gobengo',
    avatar: 'http://www.gravatar.com/avatar/710b26b2330f4a1b310c244ae917bf0b.png'
};
reply.id = 'b';
reply.parentId = content.id;
content.addReply(reply);

var threadViewFactory = new ThreadViewFactory({
    maxNestLevel: 2,
    initialReplyVisibility: true
});

var threadView = threadViewFactory.createThreadView(content);
threadView.setElement(document.getElementById('thread-view'));

threadView.render();

// Stream in a reply
var replyCount = 5;
setInterval(function () {
    if (! replyCount) {
        return;
    }

    var reply = new LivefyreContent();
    reply.body = 'Reply ' + replyCount;
    reply.author = {
        displayName: 'gobengo',
        avatar: 'http://www.gravatar.com/avatar/710b26b2330f4a1b310c244ae917bf0b.png'
    };
    reply.id = replyCount;
    reply.parentId = content.id;
debugger;
    content.addReply(reply);
    replyCount--;
}, 1000);
