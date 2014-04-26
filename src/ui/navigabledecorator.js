var Navigable = require('annotations/thread/ui/navigable');

// TODO(jj): what makes more sense is simply a back button component.
function withNavigable (target) {
    target.prototype._handleBackClick = Navigable.prototype._handleBackClick;
    target.prototype.events = Navigable.prototype.events;
}

module.exports = {
    withNavigable: withNavigable
};
