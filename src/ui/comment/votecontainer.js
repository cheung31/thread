/**
 * @fileOverview The vote container class. This provides upvote and downvote
 * functionality as well as an overall helpfulness count.
 */

var $ = require('jquery');
var debug = require('streamhub-sdk/debug');
var inherits = require('inherits');
var View = require('view');
var voteEnums = require('streamhub-sdk/content/annotator-extensions').voteEnums;
var WriteEvents = require('annotations/events').write;

var log = debug('annotations/thread/ui/comment/votecontainer');
var voteEnum = voteEnums.vote;
var voteToCount = voteEnums.voteToCount;

/**
 * Vote container component.
 * @constructor
 * @extends {View}
 * @param {Object} opts Config options.
 */
var VoteContainer = function(opts) {
    View.call(this, opts);

    /**
     * The model that is backing this view.
     * @type {Comment}
     * @private
     */
    this._model = this.opts.model;

    var vote = this._hasVoted();

    /**
     * The current vote by this user.
     * @type {enumsEnum.vote}
     * @private
     */
    this._currentVote = !vote ? voteEnum.UNSET : vote.value;

    /**
     * Whether the buttons are disabled or not. This allows or disallows a
     * user from being able to vote.
     * @type {boolean}
     * @private
     */
    this._disabled = false;

    /**
     * Whether the vote is being processed or not. This is set to true when
     * there is a click and set back to false after the click has been
     * processed. This guards against people clicking in fast succession.
     * @type {boolean}
     * @private
     */
    this._processing = false;

    this._model.on('change:votes', $.proxy(this._handleVotesUpdated, this));

    Livefyre.user.on('login', $.proxy(this._handleUserLogin, this));
    Livefyre.user.on('logout', $.proxy(this._handleUserLogout, this));
};
inherits(VoteContainer, View);

/** @enum {string} */
VoteContainer.CLASSES = {
    COUNT: 'lf-count',
    DISABLED: 'lf-disabled',
    DOWNVOTE: 'lf-downvote',
    MAIN: 'lf-votes',
    UPVOTE: 'lf-upvote',
    VOTED: 'lf-voted'
};

/** @override */
VoteContainer.prototype.events = {
    'click a': '_handleVoteClick'
};

/** @override */
VoteContainer.prototype.template = require('hgn!templates/thread/comment/votecontainer');

/**
 * Handle the user login event.
 * @private
 */
VoteContainer.prototype._handleUserLogin = function() {
    var vote = this._hasVoted();
    this._currentVote = !vote ? voteEnum.UNSET : vote.value;
    this._updateVoteStatus();
    this._updateButtonState();
};

/**
 * Handle the user logout event.
 * @private
 */
VoteContainer.prototype._handleUserLogout = function() {
    this._currentVote = voteEnum.UNSET;
    this._updateVoteStatus();
    this._updateButtonState();
};

/**
 * Handle the vote click event.
 * @param {jQuery.Event} ev
 * @private
 */
VoteContainer.prototype._handleVoteClick = function(ev) {
    if (this._disabled || this._processing) {
        return;
    }
    this._processing = true;
    var CLASSES = VoteContainer.CLASSES;
    var $target = $(ev.target);
    var isDownvote = $target.hasClass(CLASSES.DOWNVOTE);
    var typeEnum = isDownvote ? voteEnum.DOWNVOTE : voteEnum.UPVOTE;
    var value = this._currentVote === typeEnum ? voteEnum.UNSET : typeEnum;
    $target.toggleClass(CLASSES.VOTED, value !== voteEnum.UNSET);

    this.$el.trigger(WriteEvents.POST_VOTE, {
        authorId: this._model.author.id,
        callback: $.proxy(this._handleVoteComplete, this),
        messageId: this._model.id,
        value: value
    });

    this._instantFeedbackRender(value);
    this._processing = false;
};

/**
 * Handle the vote complete callback.
 * @param {Object} err
 * @param {Object} data
 * @private
 */
VoteContainer.prototype._handleVoteComplete = function(err, data) {
    if (err) {
        log(err);
        // Clear the instant feedback render.
        // TODO: What about the updated counts?
        this.render();
        return;
    }
    this._setCurrentVote(data);
};

/**
 * Handle the vote complete callback.
 * @param {Object} newVotes
 * @param {Object} oldVotes
 * @private
 */
VoteContainer.prototype._handleVotesUpdated = function(newVotes, oldVotes) {
    var vote = this._hasVoted();
    this._setCurrentVote(vote);
    this.render();
};

/**
 * Checks if the current signed in user has voted on this comment.
 * @return {?Vote} Vote if user has voted, null otherwise.
 * @private
 */
VoteContainer.prototype._hasVoted = function() {
    var userId = Livefyre.user.get('id');
    if (!userId) {
        return null;
    }
    var vote;
    var votes = this._model.votes.list;
    for (var i=0, len=votes.length; i<len; i++) {
        vote = votes[i];
        if (userId === vote.author) {
            return vote;
        }
    }
    return null;
};

/**
 * After a user has clicked, show the the effects of their action
 * before it is acknowlegded by the BE.
 * @param {voteEnums.vote} value
 * @private
 */
VoteContainer.prototype._instantFeedbackRender = function (value) {
    if (!Livefyre.user.isAuthenticated()) {
        return;
    }
    var diff = this._getDiff(value);
    this._model.votes.helpfulness += diff;

    this._updateVoteCount();
    this._updateVoteStatus(value);
};

/**
 * param {voteEnums.vote} value
 * @return {number}
 */
VoteContainer.prototype._getDiff = function (value) {
    var diff = voteToCount[this._currentVote] * -1;
    if (value !== voteEnum.UNSET) {
        diff += voteToCount[value];
    }
    return diff;
};

/**
 * Sets the current vote value.
 * param {voteEnums.vote} vote
 * @private
 */
VoteContainer.prototype._setCurrentVote = function(vote) {
    this._currentVote = !vote ? voteEnum.UNSET : vote.value;
};

/**
 * Update the disabled state of the button depending on the authentication
 * status of the current user.
 * @private
 */
VoteContainer.prototype._updateButtonState = function() {
    this._disabled = this._model.isUserAuthor();
    this.$el.toggleClass(VoteContainer.CLASSES.DISABLED, this._disabled);
};

/**
 * Update the vote count with the helpfulness score.
 * @param {number} opt_helpfullness Fake the count for instant feedback
 * @private
 */
VoteContainer.prototype._updateVoteCount = function(opt_helpfullness) {
    var count = this._model.votes.helpfulness;
    if (opt_helpfullness !== undefined) {  // Because O is falsey
        count = opt_helpfullness;
    }
    this.$('.' + VoteContainer.CLASSES.COUNT).html(count);
};

/**
 * Update the vote status of the comment. Highlight either the upvote or
 * downvote buttons based on whether the current user has upvoted or downvoted
 * this comment already.
 * @param {enumsEnum.vote} opt_currentVote
 * @private
 */
VoteContainer.prototype._updateVoteStatus = function(opt_currentVote) {
    var CLASSES = VoteContainer.CLASSES;
    var currentVote;

    if (opt_currentVote !== undefined) {  // because 0 (UNSET) is falsey
        currentVote = opt_currentVote;
    } else {
        currentVote = this._currentVote;
    }

    this.$el.attr('class', CLASSES.MAIN);
    if (currentVote === voteEnum.UNSET || this._model.isUserAuthor()) {
        return;
    }
    var cls = currentVote === voteEnum.UPVOTE ?
        CLASSES.UPVOTE :
        CLASSES.DOWNVOTE;
    this.$el.addClass(cls);
};

/** @override */
VoteContainer.prototype.destroy = function() {
    View.prototype.destroy.call(this);
    Livefyre.user.removeListener('login', $.proxy(this._handleUserLogin, this));
    Livefyre.user.removeListener('logout', $.proxy(this._handleUserLogout, this));
};

/** @override */
VoteContainer.prototype.getTemplateContext = function() {
    return {
        count: this._model.votes.helpfulness
    };
};

/** @override */
VoteContainer.prototype.render = function() {
    View.prototype.render.call(this);
    this._updateVoteStatus();
    this._updateButtonState();
};

module.exports = VoteContainer;
