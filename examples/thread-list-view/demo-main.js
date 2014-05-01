var Collection = require('streamhub-sdk/collection');
var LivefyreContent = require('streamhub-sdk/content/types/livefyre-content');
//var Thread = require('thread');
var ThreadView = require('thread/ui/thread/view');

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

var reply1 = new LivefyreContent();
reply1.body = 'Reply 1';
reply1.author = {
    displayName: 'gobengo',
    avatar: 'http://www.gravatar.com/avatar/710b26b2330f4a1b310c244ae917bf0b.png'
};
reply1.id = 'b';
reply1.parentId = content.id;
content.addReply(reply1);

var reply2 = new LivefyreContent();
reply2.body = 'Reply 2';
reply2.author = {
    displayName: 'gobengo',
    avatar: 'http://www.gravatar.com/avatar/710b26b2330f4a1b310c244ae917bf0b.png'
};
reply2.id = 'c';
reply2.parentId = content.id;
content.addReply(reply2);

var reply3 = new LivefyreContent();
reply3.body = 'Reply 3';
reply3.author = {
    displayName: 'gobengo',
    avatar: 'http://www.gravatar.com/avatar/710b26b2330f4a1b310c244ae917bf0b.png'
};
reply3.id = 'd';
reply3.parentId = reply2.id;
reply2.addReply(reply3);

var reply4 = new LivefyreContent();
reply4.body = 'Reply 4';
reply4.author = {
    displayName: 'gobengo',
    avatar: 'http://www.gravatar.com/avatar/710b26b2330f4a1b310c244ae917bf0b.png'
};
reply4.id = '3';
reply4.parentId = content.id;
content.addReply(reply4);

// Create ThreadView
function createThreadView () {
    return new ThreadView({
        el: document.getElementById('thread-view'),
        content: content
    });
};
var threadView = window.threadView = createThreadView();
threadView.render();

// Stream some replies
var count = 0;
var intervalId = setInterval(function () {
    if (!count) {
        clearInterval(intervalId);
        return;
    }
    var reply = new LivefyreContent();
    reply.body = count;
    reply.id = count;
    reply.parentId = reply3.id;
    reply3.addReply(reply)
    count--;
}, 1000);

