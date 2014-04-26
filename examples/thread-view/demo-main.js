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

var reply = new LivefyreContent();
reply.body = 'Reply 1';
reply.author = {
    displayName: 'gobengo',
    avatar: 'http://www.gravatar.com/avatar/710b26b2330f4a1b310c244ae917bf0b.png'
};
reply.id = 'b';
reply.parentId = content.id;
content.addReply(reply);

var reply = new LivefyreContent();
reply.body = 'Reply 2';
reply.author = {
    displayName: 'gobengo',
    avatar: 'http://www.gravatar.com/avatar/710b26b2330f4a1b310c244ae917bf0b.png'
};
reply.id = 'c';
reply.parentId = content.id;
content.addReply(reply);


// Create ThreadView
function createThreadView () {
    return new ThreadView({
        el: document.getElementById('thread-view'),
        content: content
        //assetServer: this._config.assetServer,
        //blockId: this._getActiveBlock().id,
        //defaultAvatar: this._config.defaultAvatar,
        //isCustomNetwork: this._collection.isCustomNetwork()
    });
};
var threadView = window.threadView = createThreadView();
threadView.render();

// Stream a reply
var count = 5;
setInterval(function () {
    if (!count) {
        return;
    }
    var reply = new LivefyreContent();
    reply.body = count;
    reply.id = count;
    reply.parentId = content.id;
    content.addReply(reply)
    count--;
}, 1000);

